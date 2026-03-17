"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowDownCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Summary {
  vendas: number;
  despesas: number;
  entradas: number;
  saidas: number;
}

interface Transaction {
  id: number;
  tipo: string;
  descricao: string;
  categoria: string | null;
  valorTotal: number;
  formaPagamento: string | null;
  data: string;
}

interface DashboardData {
  summary: Summary;
  saldo: number;
  recentes: Transaction[];
  chartData: { mes: string; vendas: number; despesas: number }[];
}

const tipoCor: Record<string, string> = {
  venda: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  despesa: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  entrada: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  saida: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

const tipoLabel: Record<string, string> = {
  venda: "Venda",
  despesa: "Despesa",
  entrada: "Entrada",
  saida: "Saída",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const cards = data
    ? [
        {
          label: "Total em Vendas",
          value: data.summary.vendas,
          icon: TrendingUp,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20",
        },
        {
          label: "Total de Despesas",
          value: data.summary.despesas,
          icon: TrendingDown,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
        },
        {
          label: "Entradas",
          value: data.summary.entradas,
          icon: ArrowDownCircle,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
          label: "Saldo",
          value: data.saldo,
          icon: Wallet,
          color: data.saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
          bg: data.saldo >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20",
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      {data?.chartData && data.chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-8">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Vendas vs Despesas (últimos meses)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="vendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="despesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Area type="monotone" dataKey="vendas" stroke="#16a34a" fill="url(#vendas)" name="Vendas" />
              <Area type="monotone" dataKey="despesas" stroke="#dc2626" fill="url(#despesas)" name="Despesas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recentes */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Últimas Transações</h2>
        {!data || data.recentes.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma transação ainda.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.recentes.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.descricao}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(t.data)}
                    {t.categoria && ` • ${t.categoria}`}
                    {t.formaPagamento && ` • ${t.formaPagamento}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>
                    {tipoLabel[t.tipo]}
                  </span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    {formatCurrency(t.valorTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
