import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";
import { getStripe } from "@/app/(backend)/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const perfil = await prisma.perfil.findUnique({ where: { userId: user.id } });
  if (!perfil?.stripeCustomerId) {
    return NextResponse.json({ error: "Sem assinatura ativa" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await getStripe().billingPortal.sessions.create({
    customer: perfil.stripeCustomerId,
    return_url: `${appUrl}/planos`,
  });

  return NextResponse.json({ url: session.url });
}
