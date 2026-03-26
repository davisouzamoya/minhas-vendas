"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import OnboardingChecklist from "@/app/(frontend)/components/OnboardingChecklist";
import {
  TrendingUp, TrendingDown, Wallet, ArrowDownCircle,
  Cake, Phone, UserX, MessageCircle, ShoppingCart,
  Receipt, Target, Sparkles,
} from "lucide-react";
function LineChart({ data }: { data: { mes: string; vendas: number; despesas: number }[] }) {
  if (data.length < 2) return null;
  const W = 800, H = 200;
  const PAD = { top: 20, right: 20, bottom: 10, left: 10 };
  const maxVal = Math.max(...data.flatMap((d) => [d.vendas, d.despesas]), 1);
  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const yScale = (v: number) => PAD.top + (1 - v / maxVal) * (H - PAD.top - PAD.bottom);
  function smoothPath(pts: [number, number][]) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ` C${cpx},${pts[i - 1][1]} ${cpx},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`;
    }
    return d;
  }
  const vendasPts = data.map((d, i) => [xScale(i), yScale(d.vendas)] as [number, number]);
  const despesasPts = data.map((d, i) => [xScale(i), yScale(d.despesas)] as [number, number]);
  const gridYs = [0.25, 0.5, 0.75].map((f) => yScale(f * maxVal));
  return (
    <div className="flex-1 flex flex-col">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }} overflow="visible">
        {gridYs.map((y, i) => (
          <line key={i} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#9ca3af" strokeDasharray="4" strokeWidth="1" opacity="0.3" />
        ))}
        <path d={smoothPath(despesasPts)} fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="8 4" strokeLinecap="round" />
        <path d={smoothPath(vendasPts)} fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
        {vendasPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="#16a34a" />
        ))}
      </svg>
      <div className="flex justify-between mt-3 px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {data.map((d) => <span key={d.mes}>{d.mes}</span>)}
      </div>
    </div>
  );
}

interface Summary { vendas: number; despesas: number; entradas: number; saidas: number; }

interface Comparativo {
  vendas: { atual: number; anterior: number; variacao: number };
  despesas: { atual: number; anterior: number; variacao: number };
  entradas: { atual: number; anterior: number; variacao: number };
  saidas: { atual: number; anterior: number; variacao: number };
}

interface Transaction {
  id: number; tipo: string; descricao: string;
  categoria: string | null; valorTotal: number;
  formaPagamento: string | null; data: string;
}

interface Aniversariante { id: number; nome: string; telefone: string | null; diasRestantes: number; }
interface ClienteChurn { id: number; nome: string; telefone: string | null; ultimaCompra: string; diasSemComprar: number; }
interface Onboarding { completo: boolean; passos: { perfil: boolean; primeiraVenda: boolean; primeiroCliente: boolean }; }

interface DashboardData {
  summary: Summary; saldo: number; recentes: Transaction[];
  chartData: { mes: string; vendas: number; despesas: number }[];
  comparativo: Comparativo; aniversariantes: Aniversariante[];
  clientesChurn: ClienteChurn[]; onboarding: Onboarding;
  metaMensal: number | null; nomeNegocio: string | null;
}

const tipoIcon: Record<string, React.ReactNode> = {
  venda:   <ShoppingCart size={16} />,
  despesa: <Receipt size={16} />,
  entrada: <TrendingUp size={16} />,
  saida:   <TrendingDown size={16} />,
};

const tipoIconBg: Record<string, string> = {
  venda:   "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
  despesa: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  entrada: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  saida:   "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
};

const tipoLabel: Record<string, string> = {
  venda: "Venda", despesa: "Despesa", entrada: "Entrada", saida: "Saída",
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
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${positivo ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"}`}>
      {variacao > 0 ? "+" : ""}{variacao}%
    </span>
  );
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const busca = searchParams.get("q")?.toLowerCase() ?? "";
  const [onboardingCompleto, setOnboardingCompleto] = useState(false);
  const handleOnboardingComplete = useCallback(() => setOnboardingCompleto(true), []);

  const loadDashboard = useCallback(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => {
      setData(d);
      setOnboardingCompleto(d?.onboarding?.completo ?? false);
      setLoading(false);
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

  const recentesFiltradas = (data?.recentes ?? []).filter((t) => {
    if (tipoFiltro && t.tipo !== tipoFiltro) return false;
    if (busca && !t.descricao.toLowerCase().includes(busca) && !(t.categoria ?? "").toLowerCase().includes(busca)) return false;
    return true;
  });

  // Meta mensal
  const meta = data?.metaMensal ?? null;
  const vendasMes = data?.comparativo.vendas.atual ?? 0;
  const progressoPct = meta && meta > 0 ? Math.min(100, Math.round((vendasMes / meta) * 100)) : 0;
  const faltaMeta = meta ? Math.max(0, meta - vendasMes) : 0;

  const primeiroNome = data?.nomeNegocio?.split(" ")[0] ?? "empreendedor";

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      {/* Greeting */}
      <div className="space-y-2">
        <div className="h-9 w-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
      {/* Recent sales */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Onboarding */}
      {data && !onboardingCompleto && !data.onboarding.completo && (
        <OnboardingChecklist passos={data.onboarding.passos} onComplete={handleOnboardingComplete} />
      )}

      {/* Greeting */}
      <div className="hidden sm:block">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Boas-vindas, {primeiroNome}!
        </h1>
        <p className="text-sm text-gray-400 mt-1">Aqui está o resumo financeiro do seu negócio hoje.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ label, value, icon: Icon, color, bg, variacao, invertido, tipoKey }) => {
          const ativo = tipoFiltro === tipoKey && tipoKey !== null;
          return (
            <div
              key={label}
              onClick={() => setTipoFiltro(tipoKey && tipoFiltro !== tipoKey ? tipoKey : null)}
              className={`bg-white dark:bg-gray-900 border p-6 flex flex-col justify-between group transition-all duration-300 ${tipoKey ? "cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600" : ""} ${ativo ? "border-green-500 ring-2 ring-green-500/20" : "border-gray-200 dark:border-gray-800"}`}
              style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={20} className={color} />
                </div>
                <Variacao variacao={variacao} invertido={invertido} />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">{label}</p>
                <p className={`text-2xl font-extrabold tracking-tight ${color}`}>{formatCurrency(value)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bento: Gráfico + Meta */}
      {data?.chartData && data.chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Gráfico (2/3) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Vendas vs Despesas</h2>
                <p className="text-xs text-gray-400 mt-0.5">Desempenho financeiro dos últimos meses</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Vendas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Despesas</span>
                </div>
              </div>
            </div>
            <LineChart data={data.chartData} />
          </div>

          {/* Meta mensal (1/3) */}
          <div className="bg-green-600 rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <Sparkles size={32} className="text-white/80 mb-4" />
              {meta ? (
                <>
                  <h3 className="text-2xl font-extrabold text-white leading-tight">
                    {progressoPct >= 100
                      ? "Meta atingida! 🎉"
                      : `Você atingiu ${progressoPct}% da sua meta!`}
                  </h3>
                  <p className="mt-3 text-white/70 text-sm leading-relaxed">
                    {progressoPct >= 100
                      ? "Parabéns! Você bateu sua meta mensal de " + formatCurrency(meta) + "."
                      : `Faltam ${formatCurrency(faltaMeta)} para atingir sua meta de ${formatCurrency(meta)}.`}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-extrabold text-white leading-tight">Defina sua meta mensal</h3>
                  <p className="mt-3 text-white/70 text-sm leading-relaxed">
                    Configure uma meta de vendas nas configurações e acompanhe seu progresso aqui.
                  </p>
                </>
              )}
            </div>
            <div className="relative z-10 mt-6">
              {meta ? (
                <>
                  <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                    <div
                      className="bg-white h-3 rounded-full transition-all duration-700"
                      style={{ width: `${progressoPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase tracking-widest">
                    <span>{formatCurrency(vendasMes)}</span>
                    <span>{formatCurrency(meta)}</span>
                  </div>
                </>
              ) : null}
              <Link
                href="/perfil"
                className="mt-5 w-full py-3 bg-white text-green-700 font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
              >
                <Target size={15} />
                {meta ? "Ajustar meta" : "Definir meta"}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Se não tiver gráfico, mostra só o card de meta */}
      {(!data?.chartData || data.chartData.length === 0) && (
        <div className="bg-green-600 rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden max-w-sm">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <Sparkles size={32} className="text-white/80 mb-4" />
            <h3 className="text-xl font-extrabold text-white leading-tight">
              {meta ? `Meta: ${progressoPct}% atingida` : "Defina sua meta mensal"}
            </h3>
          </div>
          <div className="relative z-10 mt-6">
            {meta && (
              <div className="w-full bg-white/20 rounded-full h-3 mb-4">
                <div className="bg-white h-3 rounded-full" style={{ width: `${progressoPct}%` }} />
              </div>
            )}
            <Link href="/perfil" className="w-full py-3 bg-white text-green-700 font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-green-50 transition-colors">
              <Target size={15} /> {meta ? "Ajustar meta" : "Definir meta"}
            </Link>
          </div>
        </div>
      )}

      {/* Aniversariantes */}
      {data?.aniversariantes && data.aniversariantes.length > 0 && (
        <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800 rounded-2xl p-5">
          <h2 className="text-base font-bold text-pink-700 dark:text-pink-400 mb-3 flex items-center gap-2">
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
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <h2 className="text-base font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
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

      {/* Últimas vendas */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Últimas Vendas</h2>
          <div className="flex items-center gap-3">
            {tipoFiltro && (
              <button onClick={() => setTipoFiltro(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {tipoFiltro} × limpar
              </button>
            )}
            <Link href="/transacoes" className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1">
              Ver tudo →
            </Link>
          </div>
        </div>

        {!data || recentesFiltradas.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {tipoFiltro ? `Nenhuma transação do tipo "${tipoFiltro}" este mês.` : "Nenhuma venda ainda."}
          </p>
        ) : (
          <div className="space-y-1">
            {recentesFiltradas.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tipoIconBg[t.tipo]}`}>
                    {tipoIcon[t.tipo]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t.descricao}</p>
                    <p className="text-[11px] text-gray-400">
                      {formatDate(t.data)}
                      {t.categoria && ` • ${t.categoria}`}
                      {t.formaPagamento && ` • ${t.formaPagamento}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-extrabold text-sm ${t.tipo === "despesa" || t.tipo === "saida" ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                    {t.tipo === "despesa" || t.tipo === "saida" ? "−" : "+"} {formatCurrency(t.valorTotal)}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tipoIconBg[t.tipo]}`}>
                    {tipoLabel[t.tipo]}
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

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
