export const PLANOS = ["gratuito", "basico", "pro", "full"] as const;
export type Plano = (typeof PLANOS)[number];

export const PLANO_INFO: Record<Plano, { label: string; preco: string; historicoDias: number | null }> = {
  gratuito: { label: "Gratuito", preco: "Grátis", historicoDias: 30 },
  basico: { label: "Básico", preco: "R$ 29/mês", historicoDias: 90 },
  pro: { label: "Pro", preco: "R$ 79/mês", historicoDias: 365 },
  full: { label: "Full", preco: "R$ 149/mês", historicoDias: null },
};

// Quais planos têm acesso a cada feature
export const FEATURE_PLANOS: Record<string, Plano[]> = {
  clientes: ["basico", "pro", "full"],
  fornecedores: ["basico", "pro", "full"],
  relatorios: ["basico", "pro", "full"],
  estoque: ["pro", "full"],
  "fluxo-de-caixa": ["pro", "full"],
};

export type PlanoEfetivo = Plano | "trial";

export function getPlanoEfetivo(plan: string, trialEndsAt: Date | null): PlanoEfetivo {
  if (trialEndsAt && new Date() <= new Date(trialEndsAt)) return "trial";
  return (PLANOS.includes(plan as Plano) ? plan : "gratuito") as Plano;
}

export function temAcesso(planoEfetivo: PlanoEfetivo, feature: string): boolean {
  if (planoEfetivo === "trial" || planoEfetivo === "full") return true;
  const requeridos = FEATURE_PLANOS[feature];
  if (!requeridos) return true;
  return requeridos.includes(planoEfetivo as Plano);
}

export function getTrialDiasRestantes(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
