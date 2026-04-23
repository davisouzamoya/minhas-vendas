"use client";

import { useContext } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, Cake } from "lucide-react";
import { AppContext } from "@/app/(frontend)/components/AppContext";

export function NotifDropdown({ onClose }: { onClose: () => void }) {
  const { pendentes, estoqueBaixo, aniversariantes } = useContext(AppContext);
  const total = pendentes + estoqueBaixo + aniversariantes;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">Notificações</span>
        {total > 0 && (
          <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2 py-0.5">{total}</span>
        )}
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {total === 0 ? (
          <div className="px-4 py-6 flex flex-col items-center gap-2 text-gray-400">
            <CheckCircle2 size={28} className="text-green-500" />
            <span className="text-sm">Tudo em ordem por aqui</span>
          </div>
        ) : (
          <>
            {pendentes > 0 && (
              <Link href="/relatorios" onClick={onClose} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                  <Clock size={15} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Vendas pendentes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {pendentes} venda{pendentes !== 1 ? "s" : ""} aguardando pagamento
                  </p>
                </div>
                <span className="ml-auto text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full px-2 py-0.5 shrink-0">{pendentes}</span>
              </Link>
            )}
            {estoqueBaixo > 0 && (
              <Link href="/estoque" onClick={onClose} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Estoque baixo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {estoqueBaixo} produto{estoqueBaixo !== 1 ? "s" : ""} abaixo do mínimo
                  </p>
                </div>
                <span className="ml-auto text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full px-2 py-0.5 shrink-0">{estoqueBaixo}</span>
              </Link>
            )}
            {aniversariantes > 0 && (
              <Link href="/clientes" onClick={onClose} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                  <Cake size={15} className="text-pink-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Aniversariantes hoje</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {aniversariantes} cliente{aniversariantes !== 1 ? "s" : ""} fazem aniversário hoje
                  </p>
                </div>
                <span className="ml-auto text-xs font-bold bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-full px-2 py-0.5 shrink-0">{aniversariantes}</span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
