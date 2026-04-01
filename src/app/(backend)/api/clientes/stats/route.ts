import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = user.id;

  const [totalClientes, emDebito, inativos, comAniversario] = await Promise.all([
    prisma.cliente.count({ where: { userId } }),
    prisma.cliente.count({
      where: { userId, transacoes: { some: { statusPagamento: "pendente" } } },
    }),
    prisma.cliente.count({ where: { userId, ativo: false } }),
    prisma.cliente.findMany({
      where: { userId, aniversario: { not: null } },
      select: { aniversario: true },
    }),
  ]);

  const hoje = new Date();
  const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const aniversariantes = comAniversario.filter((c) => {
    if (!c.aniversario) return false;
    const aniv = new Date(c.aniversario);
    const prox = new Date(hoje.getFullYear(), aniv.getUTCMonth(), aniv.getUTCDate());
    if (prox < hojeInicio) prox.setFullYear(prox.getFullYear() + 1);
    return Math.round((prox.getTime() - hojeInicio.getTime()) / 86400000) <= 30;
  }).length;

  return NextResponse.json({ totalClientes, emDebito, inativos, aniversariantes });
}
