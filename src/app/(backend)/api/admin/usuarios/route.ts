import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const perfil = await prisma.perfil.findUnique({ where: { userId: user.id }, select: { role: true } });
  return perfil?.role === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const q = new URL(request.url).searchParams.get("q") ?? "";

  const perfis = await prisma.perfil.findMany({
    where: q ? { nomeNegocio: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const userIds = perfis.map((p) => p.userId);

  const [transacoesPorUser, clientesPorUser] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: true,
      _max: { createdAt: true },
    }),
    prisma.cliente.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: true,
    }),
  ]);

  const txMap = Object.fromEntries(transacoesPorUser.map((t) => [t.userId, t]));
  const clienteMap = Object.fromEntries(clientesPorUser.map((c) => [c.userId, c]));

  const usuarios = perfis.map((p) => ({
    userId: p.userId,
    nomeNegocio: p.nomeNegocio,
    role: p.role,
    updatedAt: p.updatedAt,
    transacoes: (txMap[p.userId]?._count ?? 0),
    ultimaAtividade: txMap[p.userId]?._max?.createdAt ?? null,
    clientes: (clienteMap[p.userId]?._count ?? 0),
  }));

  return NextResponse.json(usuarios);
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { userId, role } = await request.json();
  if (!userId || !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await prisma.perfil.update({ where: { userId }, data: { role } });
  return NextResponse.json({ ok: true });
}
