import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";
import { getPlanoEfetivo, getTrialDiasRestantes, temAcesso, FEATURE_PLANOS } from "@/app/(backend)/lib/plano";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const perfil = await prisma.perfil.findUnique({ where: { userId } });
  const plan = perfil?.plan ?? "gratuito";
  const trialEndsAt = perfil?.trialEndsAt ?? null;

  const planoEfetivo = getPlanoEfetivo(plan, trialEndsAt);
  const trialAtivo = planoEfetivo === "trial";
  const trialDiasRestantes = getTrialDiasRestantes(trialEndsAt);

  const acessos = Object.fromEntries(
    Object.keys(FEATURE_PLANOS).map((f) => [f, temAcesso(planoEfetivo, f)])
  );

  return NextResponse.json({
    plan,
    trialEndsAt,
    trialAtivo,
    trialDiasRestantes,
    planoEfetivo,
    acessos,
  });
}
