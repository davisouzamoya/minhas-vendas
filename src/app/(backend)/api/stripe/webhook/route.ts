import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { getStripe } from "@/app/(backend)/lib/stripe";
import { enviarEmailAssinaturaAtivada, enviarEmailAssinaturaCancelada } from "@/app/(backend)/lib/email";
import Stripe from "stripe";

// Mapeamento de price ID → plano
async function planFromPriceId(priceId: string): Promise<string | null> {
  const { STRIPE_PRICE_BASICO, STRIPE_PRICE_PRO, STRIPE_PRICE_FULL } = process.env;
  if (priceId === STRIPE_PRICE_BASICO) return "basico";
  if (priceId === STRIPE_PRICE_PRO) return "pro";
  if (priceId === STRIPE_PRICE_FULL) return "full";
  return null;
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? await planFromPriceId(priceId) : null;
  const ativo = subscription.status === "active" || subscription.status === "trialing";

  await prisma.perfil.update({
    where: { userId },
    data: {
      stripeSubscriptionId: subscription.id,
      plan: ativo && plan ? plan : "gratuito",
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
        await handleSubscriptionChange(subscription);
        // E-mail de confirmação
        if (session.customer_email && subscription.metadata?.plan) {
          await enviarEmailAssinaturaAtivada(session.customer_email, subscription.metadata.plan).catch(() => {});
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await prisma.perfil.update({
          where: { userId },
          data: { plan: "gratuito", stripeSubscriptionId: null },
        });
        // E-mail de cancelamento
        const customer = await getStripe().customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted && customer.email) {
          await enviarEmailAssinaturaCancelada(customer.email).catch(() => {});
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
