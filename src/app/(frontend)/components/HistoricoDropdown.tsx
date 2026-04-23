"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, FileText } from "lucide-react";

type Transaction = {
  id: number;
  descricao: string;
  valorTotal: number;
  tipo: string;
  data: string;
  statusPagamento: string;
  cliente?: { nome: string } | null;
};

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const HISTORICO_TTL = 30_000;
let historicoCache: { data: Transaction[]; at: number } | null = null;

export function invalidateHistoricoCache() { historicoCache = null; }

export function HistoricoDropdown({ onClose }: { onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => historicoCache?.data ?? []);
  const [loading, setLoading] = useState(!historicoCache);

  useEffect(() => {
    if (historicoCache && Date.now() - historicoCache.at < HISTORICO_TTL) {
      setTransactions(historicoCache.data);
      setLoading(false);
      return;
    }
    fetch("/api/transactions?limit=5&sortBy=data&sortDir=desc")
      .then((r) => r.ok ? r.json() : { transactions: [] })
      .then((d) => {
        const list = d.transactions ?? [];
        historicoCache = { data: list, at: Date.now() };
        setTransactions(list);
        setLoading(false);
      });
  }, []);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">Últimas vendas</span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {loading ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="px-4 py-6 flex flex-col items-center gap-2 text-gray-400">
            <ShoppingCart size={28} />
            <span className="text-sm">Nenhuma venda registrada</span>
          </div>
        ) : (
          transactions.map((t) => (
            <Link key={t.id} href="/transacoes" onClick={onClose} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                t.tipo === "venda"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}>
                {t.tipo === "venda"
                  ? <ShoppingCart size={14} className="text-green-600 dark:text-green-400" />
                  : <FileText size={14} className="text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {t.descricao || t.cliente?.nome || "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <span>{formatDate(t.data)}</span>
                  {t.statusPagamento === "pendente" && (
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none">
                      Pendente
                    </span>
                  )}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${
                t.tipo === "venda" ? "text-green-600 dark:text-green-400" : "text-red-500"
              }`}>
                {t.tipo === "despesa" ? "−" : "+"}{formatCurrency(t.valorTotal)}
              </span>
            </Link>
          ))
        )}
      </div>
      <Link
        href="/transacoes"
        onClick={onClose}
        className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-white/5 border-t border-gray-100 dark:border-gray-800 transition-colors"
      >
        Ver todas as vendas
      </Link>
    </div>
  );
}
