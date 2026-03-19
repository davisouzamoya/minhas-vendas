import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = user.id;

  const now = new Date();
  const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const mesAnteriorFim = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const quarentaCincoDiasAtras = new Date();
  quarentaCincoDiasAtras.setDate(quarentaCincoDiasAtras.getDate() - 45);

  const [transactions, totals, totaisMesAtual, totaisMesAnterior, vendasCount, clientesCount] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { data: "desc" },
      take: 10,
    }),
    prisma.transaction.groupBy({
      by: ["tipo"],
      where: { userId },
      _sum: { valorTotal: true },
    }),
    prisma.transaction.groupBy({
      by: ["tipo"],
      where: { userId, data: { gte: mesAtualInicio } },
      _sum: { valorTotal: true },
    }),
    prisma.transaction.groupBy({
      by: ["tipo"],
      where: { userId, data: { gte: mesAnteriorInicio, lte: mesAnteriorFim } },
      _sum: { valorTotal: true },
    }),
    prisma.transaction.count({ where: { userId, tipo: "venda" } }),
    prisma.cliente.count({ where: { userId } }),
  ]);

  function buildSummary(rows: { tipo: string; _sum: { valorTotal: number | null } }[]) {
    const s = { vendas: 0, despesas: 0, entradas: 0, saidas: 0 };
    for (const t of rows) {
      const val = t._sum.valorTotal ?? 0;
      if (t.tipo === "venda") s.vendas = val;
      if (t.tipo === "despesa") s.despesas = val;
      if (t.tipo === "entrada") s.entradas = val;
      if (t.tipo === "saida") s.saidas = val;
    }
    return s;
  }

  const summary = buildSummary(totals);
  const mesAtual = buildSummary(totaisMesAtual);
  const mesAnterior = buildSummary(totaisMesAnterior);

  function variacao(atual: number, anterior: number) {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Math.round(((atual - anterior) / anterior) * 100);
  }

  const comparativo = {
    vendas: { atual: mesAtual.vendas, anterior: mesAnterior.vendas, variacao: variacao(mesAtual.vendas, mesAnterior.vendas) },
    despesas: { atual: mesAtual.despesas, anterior: mesAnterior.despesas, variacao: variacao(mesAtual.despesas, mesAnterior.despesas) },
    entradas: { atual: mesAtual.entradas, anterior: mesAnterior.entradas, variacao: variacao(mesAtual.entradas, mesAnterior.entradas) },
    saidas: { atual: mesAtual.saidas, anterior: mesAnterior.saidas, variacao: variacao(mesAtual.saidas, mesAnterior.saidas) },
  };

  const saldo = summary.vendas + summary.entradas - summary.despesas - summary.saidas;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const chartTransactions = await prisma.transaction.findMany({
    where: { userId, data: { gte: sixMonthsAgo } },
    select: { tipo: true, valorTotal: true, data: true },
  });

  const chartMap: Record<string, { vendas: number; despesas: number }> = {};
  for (const t of chartTransactions) {
    const mes = new Date(t.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (!chartMap[mes]) chartMap[mes] = { vendas: 0, despesas: 0 };
    if (t.tipo === "venda") chartMap[mes].vendas += t.valorTotal;
    if (t.tipo === "despesa") chartMap[mes].despesas += t.valorTotal;
  }

  const chartData = Object.entries(chartMap).map(([mes, vals]) => ({ mes, ...vals }));

  // Aniversários nos próximos 7 dias
  const todosClientes = await prisma.cliente.findMany({
    where: { userId, aniversario: { not: null } },
    select: { id: true, nome: true, aniversario: true, telefone: true },
  });

  const hoje = new Date();
  const aniversariantes = todosClientes.filter((c) => {
    if (!c.aniversario) return false;
    const aniv = new Date(c.aniversario);
    // Compara mês e dia nos próximos 7 dias
    for (let i = 0; i <= 7; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + i);
      if (aniv.getMonth() === d.getMonth() && aniv.getDate() === d.getDate()) return true;
    }
    return false;
  }).map((c) => {
    const aniv = new Date(c.aniversario!);
    const proxAniv = new Date(hoje.getFullYear(), aniv.getMonth(), aniv.getDate());
    if (proxAniv < hoje) proxAniv.setFullYear(proxAniv.getFullYear() + 1);
    const diasRestantes = Math.round((proxAniv.getTime() - hoje.getTime()) / 86400000);
    return { id: c.id, nome: c.nome, telefone: c.telefone, diasRestantes };
  }).sort((a, b) => a.diasRestantes - b.diasRestantes);

  // Clientes em risco de churn: 2+ compras, sem comprar há 45+ dias
  const churnRaw = await prisma.transaction.groupBy({
    by: ["clienteId"],
    where: { userId, clienteId: { not: null }, tipo: { in: ["venda", "entrada"] } },
    _count: { clienteId: true },
    _max: { data: true },
  });

  const churnCandidatos = churnRaw.filter(
    (r) => (r._count as { clienteId: number }).clienteId >= 2 &&
      r._max.data && new Date(r._max.data) < quarentaCincoDiasAtras
  );

  const churnClienteIds = churnCandidatos.map((r) => r.clienteId as number);
  const churnClientesNomes = churnClienteIds.length > 0
    ? await prisma.cliente.findMany({ where: { id: { in: churnClienteIds } }, select: { id: true, nome: true, telefone: true } })
    : [];
  const churnClienteMap = Object.fromEntries(churnClientesNomes.map((c) => [c.id, c]));

  const clientesChurn = churnCandidatos.map((r) => {
    const cliente = churnClienteMap[r.clienteId as number];
    const ultimaCompra = r._max.data!;
    const diasSemComprar = Math.floor((now.getTime() - new Date(ultimaCompra).getTime()) / 86400000);
    return {
      id: r.clienteId as number,
      nome: cliente?.nome ?? "Desconhecido",
      telefone: cliente?.telefone ?? null,
      ultimaCompra: ultimaCompra.toISOString(),
      diasSemComprar,
    };
  }).sort((a, b) => b.diasSemComprar - a.diasSemComprar);

  type PerfilOnboarding = { nomeNegocio: string | null; onboardingCompleto: boolean };
  const [perfilOnboarding] = await prisma.$queryRaw<PerfilOnboarding[]>`
    SELECT "nomeNegocio", "onboardingCompleto" FROM "Perfil" WHERE "userId" = ${userId}
  `;

  const onboarding = {
    completo: perfilOnboarding?.onboardingCompleto ?? false,
    passos: {
      perfil: !!perfilOnboarding?.nomeNegocio,
      primeiraVenda: vendasCount > 0,
      primeiroCliente: clientesCount > 0,
    },
  };

  return NextResponse.json({ summary, saldo, recentes: transactions, chartData, comparativo, aniversariantes, clientesChurn, onboarding });
}
