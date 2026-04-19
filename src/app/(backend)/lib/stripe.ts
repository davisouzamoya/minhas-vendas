import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY não definida");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export const STRIPE_PRICES: Record<string, string> = {
  basico: process.env.STRIPE_PRICE_BASICO ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  full: process.env.STRIPE_PRICE_FULL ?? "",
};
