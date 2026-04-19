"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Loader2, PartyPopper, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import confetti from "canvas-confetti";
import { usePlano } from "@/app/(frontend)/hooks/usePlano";
import { PLANO_INFO } from "@/app/(backend)/lib/plano";
import type { Plano } from "@/app/(backend)/lib/plano";

const FEATURES: Record<Plano, string[]> = {
  gratuito: [
    "Dashboard básico",
    "Registrar vendas e despesas",
    "Histórico de 30 dias",
  ],
  basico: [
    "Tudo do Gratuito",
    "Clientes e fornecedores",
    "Relatórios básicos",
    "Histórico de 90 dias",
  ],
  pro: [
    "Tudo do Básico",
    "Estoque completo",
    "Fluxo de caixa",
    "Relatórios avançados",
    "Histórico de 1 ano",
  ],
  full: [
    "Tudo do Pro",
    "Integração WhatsApp",
    "Histórico ilimitado",
    "Suporte prioritário",
  ],
};

const DESTAQUE: Plano = "pro";
const PLANOS_PAGOS: Plano[] = ["basico", "pro", "full"];

function PlanosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plan, trialAtivo, trialDiasRestantes, planoEfetivo } = usePlano();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "erro" } | null>(null);
  const [showSucesso, setShowSucesso] = useState(false);

  const planos: Plano[] = ["gratuito", "basico", "pro", "full"];
  const temAssinatura = plan && plan !== "gratuito" && !trialAtivo;

  useEffect(() => {
    if (searchParams.get("sucesso")) {
      setShowSucesso(true);
      router.replace("/planos");
      // Confete em duas rajadas
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 } }), 400);
    } else if (searchParams.get("cancelado")) {
      setToast({ msg: "Pagamento cancelado. Seu plano não foi alterado.", tipo: "erro" });
      router.replace("/planos");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function assinar(p: Plano) {
    setLoadingPlan(p);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: p }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setToast({ msg: "Erro ao iniciar pagamento. Tente novamente.", tipo: "erro" });
      setLoadingPlan(null);
    }
  }

  async function abrirPortal() {
    setLoadingPortal(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setToast({ msg: "Erro ao abrir portal. Tente novamente.", tipo: "erro" });
      setLoadingPortal(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Modal de sucesso */}
      {showSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <button
              onClick={() => setShowSucesso(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <PartyPopper size={30} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Assinatura ativada!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Bem-vindo ao plano{" "}
              <span className="font-semibold text-green-600 dark:text-green-400 capitalize">
                {PLANO_INFO[(plan as Plano) ?? "gratuito"]?.label}
              </span>
              . Todos os recursos já estão disponíveis.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              Você receberá um e-mail de confirmação em breve.
            </p>
            <Link
              href="/dashboard"
              onClick={() => setShowSucesso(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm transition-colors"
            >
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Toast de erro */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium bg-red-500 text-white">
          {toast.msg}
        </div>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Escolha seu plano</h1>
        {trialAtivo ? (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Trial ativo — {trialDiasRestantes} dia{trialDiasRestantes !== 1 ? "s" : ""} restante{trialDiasRestantes !== 1 ? "s" : ""}. Assine antes de expirar para não perder o acesso.
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Plano atual: <span className="font-semibold capitalize">{PLANO_INFO[(plan as Plano) ?? "gratuito"]?.label ?? plan}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {planos.map((p) => {
          const info = PLANO_INFO[p];
          const isAtual = planoEfetivo === p || (planoEfetivo === "trial" && p === "full");
          const destaque = p === DESTAQUE;
          const pago = PLANOS_PAGOS.includes(p);

          return (
            <div
              key={p}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                destaque
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg shadow-green-500/10"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              }`}
            >
              {destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    <Zap size={10} /> Mais popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{info.label}</h2>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{info.preco}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {info.historicoDias
                    ? `Histórico de ${info.historicoDias >= 365 ? "1 ano" : `${info.historicoDias} dias`}`
                    : "Histórico ilimitado"}
                </p>
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {FEATURES[p].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isAtual ? (
                <div className="w-full py-2 text-center rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Plano atual
                </div>
              ) : p === "gratuito" ? (
                <div className="w-full py-2 text-center rounded-full text-sm font-medium text-gray-400 bg-gray-50 dark:bg-gray-800">
                  Incluído grátis
                </div>
              ) : pago ? (
                <button
                  onClick={() => assinar(p)}
                  disabled={loadingPlan !== null}
                  className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    destaque
                      ? "bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                      : "bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-gray-900 disabled:opacity-60"
                  }`}
                >
                  {loadingPlan === p ? <Loader2 size={15} className="animate-spin" /> : null}
                  {loadingPlan === p ? "Aguarde..." : "Assinar"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Portal de gerenciamento */}
      {temAssinatura && (
        <div className="mt-8 text-center">
          <button
            onClick={abrirPortal}
            disabled={loadingPortal}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline flex items-center gap-1.5 mx-auto transition-colors"
          >
            {loadingPortal && <Loader2 size={13} className="animate-spin" />}
            Gerenciar assinatura (cancelar, trocar cartão)
          </button>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-6">
        Pagamentos via PIX, boleto ou cartão. Cancele a qualquer momento.{" "}
        <Link href="/dashboard" className="underline hover:text-gray-600">Voltar ao início</Link>
      </p>
    </div>
  );
}

export default function PlanosPage() {
  return (
    <Suspense>
      <PlanosContent />
    </Suspense>
  );
}
