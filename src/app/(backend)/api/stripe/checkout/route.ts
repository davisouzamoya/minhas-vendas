import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";
import { getStripe, STRIPE_PRICES } from "@/app/(backend)/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { plan } = await request.json();
    const priceId = STRIPE_PRICES[plan];
    if (!priceId) return NextResponse.json({ error: `Plano inválido ou price ID não configurado: ${plan}` }, { status: 400 });

    const perfil = await prisma.perfil.findUnique({ where: { userId: user.id } });

    let customerId = perfil?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.perfil.upsert({
        where: { userId: user.id },
        update: { stripeCustomerId: customerId },
        create: { userId: user.id, nomeNegocio: "", stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/planos?sucesso=1`,
      cancel_url: `${appUrl}/planos?cancelado=1`,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      locale: "pt-BR",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] erro:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
