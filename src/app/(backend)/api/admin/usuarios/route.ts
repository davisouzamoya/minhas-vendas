import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("Perfil").select("role").eq("userId", user.id).single();
  return perfil?.role === "admin" ? user : null;
}

type PerfilRow = { userId: string; nomeNegocio: string; role: string; plan: string; trialEndsAt: Date | null; updatedAt: Date };

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const q = new URL(request.url).searchParams.get("q") ?? "";

  const perfis: PerfilRow[] = q
    ? await prisma.$queryRaw`SELECT "userId", "nomeNegocio", "role", "plan", "trialEndsAt", "updatedAt" FROM "Perfil" WHERE "nomeNegocio" ILIKE ${'%' + q + '%'} ORDER BY "updatedAt" DESC LIMIT 50`
    : await prisma.$queryRaw`SELECT "userId", "nomeNegocio", "role", "plan", "trialEndsAt", "updatedAt" FROM "Perfil" ORDER BY "updatedAt" DESC LIMIT 50`;

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
    plan: p.plan,
    trialEndsAt: p.trialEndsAt,
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

  const body = await request.json();
  const { userId } = body;
  if (!userId) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  if (body.role !== undefined) {
    if (!["user", "admin"].includes(body.role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 });
    }
    await prisma.$executeRaw`UPDATE "Perfil" SET "role" = ${body.role} WHERE "userId" = ${userId}`;
  }

  if (body.plan !== undefined) {
    const planosValidos = ["gratuito", "basico", "pro", "full"];
    if (!planosValidos.includes(body.plan)) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }
    await prisma.$executeRaw`UPDATE "Perfil" SET "plan" = ${body.plan} WHERE "userId" = ${userId}`;
  }

  if (body.trialEndsAt !== undefined) {
    const dt = body.trialEndsAt ? new Date(body.trialEndsAt) : null;
    if (dt) {
      await prisma.$executeRaw`UPDATE "Perfil" SET "trialEndsAt" = ${dt} WHERE "userId" = ${userId}`;
    } else {
      await prisma.$executeRaw`UPDATE "Perfil" SET "trialEndsAt" = NULL WHERE "userId" = ${userId}`;
    }
  }

  return NextResponse.json({ ok: true });
}
