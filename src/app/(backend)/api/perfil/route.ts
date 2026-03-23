import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const perfil = await prisma.perfil.findUnique({ where: { userId } });
  return NextResponse.json(perfil ?? { nomeNegocio: "", logoUrl: null });
}

export async function PATCH() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const rows = await prisma.$executeRawUnsafe(
      `UPDATE "Perfil" SET "onboardingCompleto" = true WHERE "userId" = $1`,
      userId
    );
    console.log("[PATCH /api/perfil] rows updated:", rows, "userId:", userId);
    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    console.error("[PATCH /api/perfil] erro:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const perfil = await prisma.perfil.upsert({
      where: { userId },
      update: { nomeNegocio: body.nomeNegocio, logoUrl: body.logoUrl ?? null, metaMensal: body.metaMensal ? parseFloat(body.metaMensal) : null },
      create: { userId, nomeNegocio: body.nomeNegocio, logoUrl: body.logoUrl ?? null, metaMensal: body.metaMensal ? parseFloat(body.metaMensal) : null },
    });

    return NextResponse.json(perfil);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
