"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { usePlano } from "@/app/(frontend)/hooks/usePlano";
import { FEATURE_PLANOS, PLANO_INFO } from "@/app/(backend)/lib/plano";
import type { Plano } from "@/app/(backend)/lib/plano";

interface PlanoGuardProps {
  feature: string;
  children: React.ReactNode;
}

export function PlanoGuard({ feature, children }: PlanoGuardProps) {
  const { temAcesso, carregando } = usePlano();

  if (carregando) return null;

  if (!temAcesso(feature)) {
    const planoMinimo = FEATURE_PLANOS[feature]?.[0] as Plano | undefined;
    const planoLabel = planoMinimo ? PLANO_INFO[planoMinimo].label : "superior";

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Lock size={28} className="text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Recurso indisponível no plano atual
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Esta funcionalidade requer o plano <strong>{planoLabel}</strong> ou superior.
            Faça upgrade para desbloquear.
          </p>
        </div>
        <Link
          href="/planos"
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm transition-colors"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
