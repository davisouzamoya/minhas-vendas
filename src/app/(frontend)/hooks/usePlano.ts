"use client";

import { useEffect, useState } from "react";
import type { PlanoEfetivo } from "@/app/(backend)/lib/plano";

interface PlanoStatus {
  plan: string;
  trialEndsAt: string | null;
  trialAtivo: boolean;
  trialDiasRestantes: number;
  planoEfetivo: PlanoEfetivo;
  acessos: Record<string, boolean>;
}

export function usePlano() {
  const [status, setStatus] = useState<PlanoStatus | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/plano")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setStatus(d);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  function temAcesso(feature: string): boolean {
    if (!status) return false;
    return status.acessos[feature] ?? true;
  }

  return { ...status, carregando, temAcesso };
}
