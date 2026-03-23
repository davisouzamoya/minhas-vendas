import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = user.id;

  const [totalClientes, emDebito, todosIds, comTransacao, comAniversario] = await Promise.all([
    prisma.cliente.count({ where: { userId } }),
    prisma.cliente.count({
      where: { userId, transacoes: { some: { statusPagamento: "pendente" } } },
    }),
    prisma.cliente.findMany({ where: { userId }, select: { id: true } }),
    prisma.transaction.groupBy({
      by: ["clienteId"],
      where: { userId, clienteId: { not: null } },
      _max: { data: true },
    }),
    prisma.cliente.findMany({
      where: { userId, aniversario: { not: null } },
      select: { aniversario: true },
    }),
  ]);

  const sessenta = new Date();
  sessenta.setDate(sessenta.getDate() - 60);
  const ativosSet = new Set(
    comTransacao.filter((g) => g._max.data && g._max.data > sessenta).map((g) => g.clienteId)
  );
  const inativos = todosIds.filter((c) => !ativosSet.has(c.id)).length;

  const hoje = new Date();
  const aniversariantes = comAniversario.filter((c) => {
    if (!c.aniversario) return false;
    const aniv = new Date(c.aniversario);
    const prox = new Date(hoje.getFullYear(), aniv.getMonth(), aniv.getDate());
    if (prox < hoje) prox.setFullYear(prox.getFullYear() + 1);
    return Math.round((prox.getTime() - hoje.getTime()) / 86400000) <= 30;
  }).length;

  return NextResponse.json({ totalClientes, emDebito, inativos, aniversariantes });
}
