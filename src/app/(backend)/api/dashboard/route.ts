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

  const [transactions, totals, totaisMesAtual, totaisMesAnterior] = await Promise.all([
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

  return NextResponse.json({ summary, saldo, recentes: transactions, chartData, comparativo });
}
