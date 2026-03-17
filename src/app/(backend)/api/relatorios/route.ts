import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const [porCategoriaRaw, porTipoRaw, todasTransacoes] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoria"],
      where: { categoria: { not: null } },
      _sum: { valorTotal: true },
      orderBy: { _sum: { valorTotal: "desc" } },
    }),
    prisma.transaction.groupBy({
      by: ["tipo"],
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.transaction.findMany({
      select: { tipo: true, valorTotal: true, data: true },
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

  // Agrupar por mês
  const mesMap: Record<string, { vendas: number; despesas: number; entradas: number }> = {};
  for (const t of todasTransacoes) {
    const mes = new Date(t.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (!mesMap[mes]) mesMap[mes] = { vendas: 0, despesas: 0, entradas: 0 };
    if (t.tipo === "venda") mesMap[mes].vendas += t.valorTotal;
    if (t.tipo === "despesa") mesMap[mes].despesas += t.valorTotal;
    if (t.tipo === "entrada") mesMap[mes].entradas += t.valorTotal;
  }

  const porMes = Object.entries(mesMap).map(([mes, vals]) => ({ mes, ...vals }));

  return NextResponse.json({ porCategoria, porTipo, porMes });
}
