import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: perfil } = await supabase.from("Perfil").select("role").eq("userId", user.id).single();
  if (perfil?.role !== "admin") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const trinta = new Date();
  trinta.setDate(trinta.getDate() - 30);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [
    totalUsuarios,
    totalTransacoes,
    transacoesHoje,
    usuariosAtivos30d,
    fotosComUrl,
    totalClientes,
    ultimasTransacoes,
  ] = await Promise.all([
    prisma.perfil.count(),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { createdAt: { gte: hoje } } }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: trinta } },
    }).then((r) => r.length),
    prisma.transaction.count({ where: { fotoUrl: { not: null } } }),
    prisma.cliente.count(),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, userId: true, tipo: true, valorTotal: true, createdAt: true, descricao: true },
    }),
  ]);

  // Busca nomeNegocio para as últimas transações
  const userIds = [...new Set(ultimasTransacoes.map((t) => t.userId))];
  const perfisMap = await prisma.perfil.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, nomeNegocio: true },
  });
  const nomeMap = Object.fromEntries(perfisMap.map((p) => [p.userId, p.nomeNegocio]));

  return NextResponse.json({
    totalUsuarios,
    totalTransacoes,
    transacoesHoje,
    usuariosAtivos30d,
    totalClientes,
    fotosArmazenadas: fotosComUrl,
    ultimasTransacoes: ultimasTransacoes.map((t) => ({
      ...t,
      nomeNegocio: nomeMap[t.userId] ?? "—",
    })),
  });
}
