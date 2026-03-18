import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get("periodo") ?? "mes"; // "mes" | "semana"
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const where = {
    userId: user.id,
    ...(dataInicio || dataFim ? {
      data: {
        ...(dataInicio && { gte: new Date(dataInicio) }),
        ...(dataFim && { lte: new Date(dataFim + "T23:59:59") }),
      },
    } : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    select: { tipo: true, valorTotal: true, data: true },
    orderBy: { data: "asc" },
  });

  // Agrupa por semana ISO ou mês
  const map: Record<string, { label: string; entradas: number; saidas: number; ordem: number }> = {};

  for (const t of transactions) {
    const d = new Date(t.data);
    let key: string;
    let label: string;
    let ordem: number;

    if (periodo === "semana") {
      // Semana ISO: segunda-feira da semana
      const dayOfWeek = d.getDay(); // 0=dom
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const segunda = new Date(d);
      segunda.setDate(diff);
      const domingo = new Date(segunda);
      domingo.setDate(segunda.getDate() + 6);
      key = segunda.toISOString().split("T")[0];
      label = `${segunda.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} – ${domingo.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
      ordem = segunda.getTime();
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      ordem = d.getFullYear() * 100 + d.getMonth() + 1;
    }

    if (!map[key]) map[key] = { label, entradas: 0, saidas: 0, ordem };

    const val = t.valorTotal;
    if (t.tipo === "venda" || t.tipo === "entrada") map[key].entradas += val;
    if (t.tipo === "despesa" || t.tipo === "saida") map[key].saidas += val;
  }

  // Constrói array ordenado com saldo acumulado
  let saldoAcumulado = 0;
  const rows = Object.values(map)
    .sort((a, b) => a.ordem - b.ordem)
    .map((r) => {
      const saldo = r.entradas - r.saidas;
      saldoAcumulado += saldo;
      return {
        label: r.label,
        entradas: r.entradas,
        saidas: r.saidas,
        saldo,
        saldoAcumulado,
      };
    });

  return NextResponse.json({ rows });
}
