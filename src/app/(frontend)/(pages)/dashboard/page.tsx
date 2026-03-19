"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import OnboardingChecklist from "@/app/(frontend)/components/OnboardingChecklist";
import { TrendingUp, TrendingDown, Wallet, ArrowDownCircle, Cake, Phone, UserX, MessageCircle } from "lucide-react";
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

interface Comparativo {
  vendas: { atual: number; anterior: number; variacao: number };
  despesas: { atual: number; anterior: number; variacao: number };
  entradas: { atual: number; anterior: number; variacao: number };
  saidas: { atual: number; anterior: number; variacao: number };
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

interface Aniversariante {
  id: number;
  nome: string;
  telefone: string | null;
  diasRestantes: number;
}

interface ClienteChurn {
  id: number;
  nome: string;
  telefone: string | null;
  ultimaCompra: string;
  diasSemComprar: number;
}

interface Onboarding {
  completo: boolean;
  passos: { perfil: boolean; primeiraVenda: boolean; primeiroCliente: boolean };
}

interface DashboardData {
  summary: Summary;
  saldo: number;
  recentes: Transaction[];
  chartData: { mes: string; vendas: number; despesas: number }[];
  comparativo: Comparativo;
  aniversariantes: Aniversariante[];
  clientesChurn: ClienteChurn[];
  onboarding: Onboarding;
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

function Variacao({ variacao, invertido = false }: { variacao: number; invertido?: boolean }) {
  if (variacao === 0) return null;
  const positivo = invertido ? variacao < 0 : variacao > 0;
  return (
    <span className={`text-xs font-medium ${positivo ? "text-green-500" : "text-red-500"}`}>
      {variacao > 0 ? "+" : ""}{variacao}% vs mês anterior
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);
  const [onboardingCompleto, setOnboardingCompleto] = useState(false);
  const handleOnboardingComplete = useCallback(() => setOnboardingCompleto(true), []);

  const loadDashboard = useCallback(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => {
      setData(d);
      setOnboardingCompleto(d?.onboarding?.completo ?? false);
    });
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const cards = data
    ? [
        {
          label: "Vendas do mês",
          value: data.comparativo.vendas.atual,
          icon: TrendingUp,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20",
          variacao: data.comparativo.vendas.variacao,
          invertido: false,
          tipoKey: "venda",
        },
        {
          label: "Despesas do mês",
          value: data.comparativo.despesas.atual,
          icon: TrendingDown,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          variacao: data.comparativo.despesas.variacao,
          invertido: true,
          tipoKey: "despesa",
        },
        {
          label: "Entradas do mês",
          value: data.comparativo.entradas.atual,
          icon: ArrowDownCircle,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          variacao: data.comparativo.entradas.variacao,
          invertido: false,
          tipoKey: "entrada",
        },
        {
          label: "Saldo total",
          value: data.saldo,
          icon: Wallet,
          color: data.saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
          bg: data.saldo >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20",
          variacao: 0,
          invertido: false,
          tipoKey: null,
        },
      ]
    : [];

  const recentesFiltradas = tipoFiltro
    ? (data?.recentes ?? []).filter((t) => t.tipo === tipoFiltro)
    : (data?.recentes ?? []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Onboarding */}
      {data && !onboardingCompleto && !data.onboarding.completo && (
        <OnboardingChecklist
          passos={data.onboarding.passos}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg, variacao, invertido, tipoKey }) => {
          const ativo = tipoFiltro === tipoKey && tipoKey !== null;
          return (
            <div
              key={label}
              onClick={() => setTipoFiltro(tipoKey && tipoFiltro !== tipoKey ? tipoKey : null)}
              className={`bg-white dark:bg-gray-900 rounded-xl border p-5 transition-all ${tipoKey ? "cursor-pointer hover:shadow-md" : ""} ${ativo ? "border-green-500 dark:border-green-500 ring-2 ring-green-500/20" : "border-gray-200 dark:border-gray-800"}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color} mb-1`}>{formatCurrency(value)}</p>
              <Variacao variacao={variacao} invertido={invertido} />
            </div>
          );
        })}
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

      {/* Aniversariantes */}
      {data?.aniversariantes && data.aniversariantes.length > 0 && (
        <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800 rounded-xl p-5 mb-8">
          <h2 className="text-base font-semibold text-pink-700 dark:text-pink-400 mb-3 flex items-center gap-2">
            <Cake size={16} /> Aniversários nos próximos 7 dias
          </h2>
          <div className="flex flex-col gap-2">
            {data.aniversariantes.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.nome}</span>
                  {a.telefone && (
                    <a href={`https://wa.me/55${a.telefone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                      <Phone size={11} /> {a.telefone}
                    </a>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${a.diasRestantes === 0 ? "bg-pink-500 text-white" : "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300"}`}>
                  {a.diasRestantes === 0 ? "Hoje!" : a.diasRestantes === 1 ? "Amanhã" : `em ${a.diasRestantes} dias`}
                </span>
              </div>
            ))}
          </div>
          <Link href="/clientes" className="text-xs text-pink-600 hover:underline mt-3 inline-block">
            Ver todos os clientes →
          </Link>
        </div>
      )}

      {/* Clientes em risco de churn */}
      {data?.clientesChurn && data.clientesChurn.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-8">
          <h2 className="text-base font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
            <UserX size={16} /> Clientes que sumiram
          </h2>
          <div className="flex flex-col gap-2">
            {data.clientesChurn.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.nome}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">· {c.diasSemComprar} dias sem comprar</span>
                  <p className="text-xs text-gray-400">Última compra: {new Date(c.ultimaCompra).toLocaleDateString("pt-BR")}</p>
                </div>
                {c.telefone && (
                  <a
                    href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Oi ${c.nome}, faz um tempo que não te vejo! Tem novidades, vem dar uma olhada 😊`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg transition-colors shrink-0"
                  >
                    <MessageCircle size={12} /> Reconquistar
                  </a>
                )}
              </div>
            ))}
          </div>
          <Link href="/clientes" className="text-xs text-amber-600 hover:underline mt-3 inline-block">
            Ver todos os clientes →
          </Link>
        </div>
      )}

      {/* Recentes */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Últimas Transações</h2>
          {tipoFiltro && (
            <button onClick={() => setTipoFiltro(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1">
              {tipoFiltro} × limpar
            </button>
          )}
        </div>
        {!data || recentesFiltradas.length === 0 ? (
          <p className="text-sm text-gray-400">{tipoFiltro ? `Nenhuma transação do tipo "${tipoFiltro}" este mês.` : "Nenhuma transação ainda."}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentesFiltradas.map((t) => (
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
