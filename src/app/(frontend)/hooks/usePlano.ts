"use client";

import { useContext } from "react";
import { AppContext } from "@/app/(frontend)/components/AppContext";
import type { PlanoEfetivo } from "@/app/(backend)/lib/plano";

export function usePlano() {
  const { plano, planoCarregando } = useContext(AppContext);

  return {
    plan: plano?.plan ?? "gratuito",
    trialEndsAt: plano?.trialEndsAt ?? null,
    trialAtivo: plano?.trialAtivo ?? false,
    trialDiasRestantes: plano?.trialDiasRestantes ?? 0,
    planoEfetivo: (plano?.planoEfetivo ?? "gratuito") as PlanoEfetivo,
    acessos: plano?.acessos ?? {},
    carregando: planoCarregando,
    temAcesso: (feature: string) => plano?.acessos[feature] ?? false,
  };
}
