"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface Passos {
  perfil: boolean;
  primeiraVenda: boolean;
  primeiroCliente: boolean;
}

interface Props {
  passos: Passos;
  onComplete: () => void;
}

const steps = [
  {
    key: "perfil" as keyof Passos,
    label: "Coloque o nome do seu negócio",
    descricao: "Personalize o sistema com o nome da sua loja ou empresa.",
    href: "/perfil",
    obrigatorio: true,
  },
  {
    key: "primeiraVenda" as keyof Passos,
    label: "Registre sua primeira venda",
    descricao: "Anote uma venda e veja o dashboard ganhar vida.",
    href: "/nova",
    obrigatorio: true,
  },
  {
    key: "primeiroCliente" as keyof Passos,
    label: "Adicione um cliente",
    descricao: "Saiba quem compra mais e nunca perca o contato.",
    href: "/clientes",
    obrigatorio: false,
  },
];

export default function OnboardingChecklist({ passos, onComplete }: Props) {
  const concluidos = steps.filter((s) => passos[s.key]).length;
  const obrigatoriosConcluidos = steps.filter((s) => s.obrigatorio && passos[s.key]).length;
  const totalObrigatorios = steps.filter((s) => s.obrigatorio).length;
  const progresso = Math.round((concluidos / steps.length) * 100);

  // Auto-completa apenas quando o usuário conclui um passo durante a sessão (não no mount)
  const prevConcluidos = useRef(-1); // -1 = primeira renderização
  useEffect(() => {
    const anterior = prevConcluidos.current;
    prevConcluidos.current = obrigatoriosConcluidos;
    if (anterior === obrigatoriosConcluidos) return; // sem mudança após mount, ignora
    if (obrigatoriosConcluidos === totalObrigatorios) {
      // Confetti em duas rajadas
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#16a34a", "#22c55e", "#4ade80", "#bbf7d0", "#ffffff"] });
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.5, x: 0.3 }, colors: ["#16a34a", "#facc15", "#f97316", "#ffffff"] });
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.5, x: 0.7 }, colors: ["#16a34a", "#facc15", "#f97316", "#ffffff"] });
      }, 300);

      const t = setTimeout(() => {
        fetch("/api/perfil", { method: "PATCH" }).then((r) => {
          if (r.ok) onComplete();
        });
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [obrigatoriosConcluidos, totalObrigatorios, onComplete]);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-xl p-5 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Boas-vindas ao Minhas Vendas! 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {concluidos === 0
              ? "Siga os passos abaixo para começar."
              : concluidos === steps.length
              ? "Tudo pronto! Seu negócio está configurado."
              : `${concluidos} de ${steps.length} passos concluídos — continue!`}
          </p>
        </div>
        <button
          onClick={onComplete}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          title="Dispensar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1.5 bg-green-100 dark:bg-green-900/40 rounded-full mb-5">
        <div
          className="h-1.5 bg-green-600 rounded-full transition-all duration-500"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* Passos */}
      <div className="space-y-2">
        {steps.map((step) => {
          const feito = passos[step.key];
          return (
            <Link
              key={step.key}
              href={feito ? "#" : step.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                feito
                  ? "opacity-60 cursor-default"
                  : "hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer"
              }`}
            >
              {feito ? (
                <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <Circle size={20} className="text-gray-300 dark:text-gray-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${feito ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}>
                  {step.label}
                  {!step.obrigatorio && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(opcional)</span>
                  )}
                </p>
                {!feito && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{step.descricao}</p>
                )}
              </div>
              {!feito && <ChevronRight size={16} className="text-gray-400 shrink-0" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
