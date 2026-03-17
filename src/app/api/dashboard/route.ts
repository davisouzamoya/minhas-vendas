import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [transactions, totals] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { data: "desc" },
      take: 10,
    }),
    prisma.transaction.groupBy({
      by: ["tipo"],
      _sum: { valorTotal: true },
      _count: true,
    }),
  ]);

  const summary = {
    vendas: 0,
    despesas: 0,
    entradas: 0,
    saidas: 0,
  };

  for (const t of totals) {
    const val = t._sum.valorTotal ?? 0;
    if (t.tipo === "venda") summary.vendas = val;
    if (t.tipo === "despesa") summary.despesas = val;
    if (t.tipo === "entrada") summary.entradas = val;
    if (t.tipo === "saida") summary.saidas = val;
  }

  const saldo = summary.vendas + summary.entradas - summary.despesas - summary.saidas;

  return NextResponse.json({ summary, saldo, recentes: transactions });
}
