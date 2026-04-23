"use client";

import { createContext } from "react";

export interface PlanoStatus {
  plan: string;
  trialEndsAt: string | null;
  trialAtivo: boolean;
  trialDiasRestantes: number;
  planoEfetivo: string;
  acessos: Record<string, boolean>;
}

export interface AppSharedData {
  nomeNegocio: string;
  logoUrl: string;
  metaMensal: number | null;
  userLabel: string;
  pendentes: number;
  estoqueBaixo: number;
  aniversariantes: number;
  plano: PlanoStatus | null;
  planoCarregando: boolean;
  perfilCarregando: boolean;
  refetchPerfil: () => void;
  refetchNotifCounts: () => void;
}

export const AppContext = createContext<AppSharedData>({
  nomeNegocio: "", logoUrl: "", metaMensal: null, userLabel: "",
  pendentes: 0, estoqueBaixo: 0, aniversariantes: 0,
  plano: null, planoCarregando: true, perfilCarregando: true,
  refetchPerfil: () => {}, refetchNotifCounts: () => {},
});
