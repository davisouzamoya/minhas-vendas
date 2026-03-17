import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/client";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = user.id;

  const [transactions, totals] = await Promise.all([
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
  ]);

  const summary = { vendas: 0, despesas: 0, entradas: 0, saidas: 0 };
  for (const t of totals) {
    const val = t._sum.valorTotal ?? 0;
    if (t.tipo === "venda") summary.vendas = val;
    if (t.tipo === "despesa") summary.despesas = val;
    if (t.tipo === "entrada") summary.entradas = val;
    if (t.tipo === "saida") summary.saidas = val;
  }

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

  return NextResponse.json({ summary, saldo, recentes: transactions, chartData });
}
