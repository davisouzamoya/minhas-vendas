import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = user.id;
  const { searchParams } = new URL(request.url);
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const dateFilter = dataInicio || dataFim ? {
    data: {
      ...(dataInicio && { gte: new Date(dataInicio) }),
      ...(dataFim && { lte: new Date(dataFim + "T23:59:59") }),
    },
  } : {};

  const baseWhere = { userId, ...dateFilter };

  const [porCategoriaRaw, porTipoRaw, todasTransacoes, porProdutoRaw, inadimplenciaRaw] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoria"],
      where: { ...baseWhere, categoria: { not: null } },
      _sum: { valorTotal: true },
      orderBy: { _sum: { valorTotal: "desc" } },
    }),
    prisma.transaction.groupBy({
      by: ["tipo"],
      where: baseWhere,
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.transaction.findMany({
      where: baseWhere,
      select: { tipo: true, valorTotal: true, data: true },
      orderBy: { data: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["produto", "tipo"],
      where: { ...baseWhere, produto: { not: null } },
      _sum: { valorTotal: true },
      _count: true,
      orderBy: { _sum: { valorTotal: "desc" } },
    }),
    prisma.transaction.findMany({
      where: { userId, tipo: "venda", statusPagamento: "pendente", ...dateFilter },
      include: { cliente: { select: { id: true, nome: true } }, fornecedor: false },
      orderBy: { data: "asc" },
    }),
  ]);

  const porCategoria = porCategoriaRaw.map((r: { categoria: string | null; _sum: { valorTotal: number | null } }) => ({
    categoria: r.categoria ?? "outro",
    total: r._sum.valorTotal ?? 0,
  }));

  const porTipo = porTipoRaw.map((r: { tipo: string; _sum: { valorTotal: number | null }; _count: number }) => ({
    tipo: r.tipo,
    total: r._sum.valorTotal ?? 0,
    count: r._count,
  }));

  const mesMap: Record<string, { vendas: number; despesas: number; entradas: number }> = {};
  for (const t of todasTransacoes) {
    const mes = new Date(t.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (!mesMap[mes]) mesMap[mes] = { vendas: 0, despesas: 0, entradas: 0 };
    if (t.tipo === "venda") mesMap[mes].vendas += t.valorTotal;
    if (t.tipo === "despesa") mesMap[mes].despesas += t.valorTotal;
    if (t.tipo === "entrada") mesMap[mes].entradas += t.valorTotal;
  }
  const porMes = Object.entries(mesMap).map(([mes, vals]) => ({ mes, ...vals }));

  const produtoMap: Record<string, { receita: number; custo: number; transacoes: number }> = {};
  for (const r of porProdutoRaw) {
    const nome = r.produto ?? "Sem produto";
    if (!produtoMap[nome]) produtoMap[nome] = { receita: 0, custo: 0, transacoes: 0 };
    const val = (r._sum as { valorTotal: number | null }).valorTotal ?? 0;
    const count = (r as { _count: number })._count;
    if (r.tipo === "venda" || r.tipo === "entrada") produtoMap[nome].receita += val;
    if (r.tipo === "despesa" || r.tipo === "saida") produtoMap[nome].custo += val;
    produtoMap[nome].transacoes += count;
  }
  const lucroPorProduto = Object.entries(produtoMap)
    .map(([produto, v]) => ({ produto, receita: v.receita, custo: v.custo, lucro: v.receita - v.custo, transacoes: v.transacoes }))
    .sort((a, b) => b.lucro - a.lucro);

  // Inadimplência: agrupa por cliente
  const inadimplenciaMap: Record<string, { clienteId: number | null; nome: string; total: number; count: number }> = {};
  for (const t of inadimplenciaRaw) {
    const key = t.cliente ? String(t.cliente.id) : "sem_cliente";
    const nome = t.cliente?.nome ?? "Sem cliente";
    if (!inadimplenciaMap[key]) inadimplenciaMap[key] = { clienteId: t.cliente?.id ?? null, nome, total: 0, count: 0 };
    inadimplenciaMap[key].total += t.valorTotal;
    inadimplenciaMap[key].count += 1;
  }
  const inadimplencia = Object.values(inadimplenciaMap).sort((a, b) => b.total - a.total);
  const totalInadimplencia = inadimplenciaRaw.reduce((s, t) => s + t.valorTotal, 0);

  return NextResponse.json({ porCategoria, porTipo, porMes, lucroPorProduto, inadimplencia, totalInadimplencia });
}
