"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown, Wallet, Download, Star, AlertTriangle, ShoppingBag, Receipt } from "lucide-react";

interface FluxoRow {
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

interface TopItem {
  descricao: string;
  valorTotal: number;
  data: string;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const hoje = new Date();
const defaultInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1).toISOString().split("T")[0];
const defaultFim = hoje.toISOString().split("T")[0];

function PerformanceChart({ data }: { data: FluxoRow[] }) {
  if (data.length === 0) return null;
  const W = 800, H = 220;
  const PAD = { top: 20, right: 20, bottom: 10, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.flatMap((r) => [r.entradas, r.saidas]), 1);
  const slotW = chartW / data.length;
  const barW = Math.min(slotW * 0.32, 44);
  const gap = barW * 0.25;
  const yScale = (v: number) => PAD.top + (1 - v / maxVal) * chartH;
  const barH = (v: number) => Math.max((v / maxVal) * chartH, 2);
  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => yScale(f * maxVal));

  return (
    <div className="flex flex-col flex-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }} overflow="visible">
        {gridYs.map((y, i) => (
          <line key={i} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#9ca3af" strokeWidth="1" opacity="0.2" strokeDasharray="4" />
        ))}
        {data.map((r, i) => {
          const centerX = PAD.left + i * slotW + slotW / 2;
          const entX = centerX - gap / 2 - barW;
          const saiX = centerX + gap / 2;
          return (
            <g key={i}>
              <rect x={entX} y={yScale(r.entradas)} width={barW} height={barH(r.entradas)} rx="5" fill="#16a34a" opacity="0.85" />
              <rect x={saiX} y={yScale(r.saidas)} width={barW} height={barH(r.saidas)} rx="5" fill="#dc2626" opacity="0.85" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-around mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2">
        {data.map((r, i) => (
          <span key={i} className="text-center truncate max-w-[80px]">{r.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function FluxoDeCaixa() {
  const [rows, setRows] = useState<FluxoRow[]>([]);
  const [maioresVendas, setMaioresVendas] = useState<TopItem[]>([]);
  const [maioresGastos, setMaioresGastos] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"mes" | "semana">("mes");
  const [dataInicio, setDataInicio] = useState(defaultInicio);
  const [dataFim, setDataFim] = useState(defaultFim);

  const searchParams = useSearchParams();
  const busca = searchParams.get("q")?.toLowerCase() ?? "";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ periodo, dataInicio, dataFim });
    fetch(`/api/fluxo-de-caixa?${params}`)
      .then((r) => r.ok ? r.json() : { rows: [] })
      .then((d) => {
        setRows(d.rows ?? []);
        setMaioresVendas(d.maioresVendas ?? []);
        setMaioresGastos(d.maioresGastos ?? []);
        setLoading(false);
      });
  }, [periodo, dataInicio, dataFim]);

  const totalEntradas = rows.reduce((s, r) => s + r.entradas, 0);
  const totalSaidas = rows.reduce((s, r) => s + r.saidas, 0);
  const saldoFinal = rows.length > 0 ? rows[rows.length - 1].saldoAcumulado : 0;

  const vendasFiltradas = busca
    ? maioresVendas.filter((i) => i.descricao.toLowerCase().includes(busca))
    : maioresVendas;
  const gastosFiltrados = busca
    ? maioresGastos.filter((i) => i.descricao.toLowerCase().includes(busca))
    : maioresGastos;

  function exportCSV() {
    const header = "Período,Entradas,Saídas,Saldo,Acumulado";
    const lines = rows.map((r) =>
      `"${r.label}",${r.entradas},${r.saidas},${r.saldo},${r.saldoAcumulado}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fluxo-de-caixa.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Fluxo de Caixa</h1>
          <p className="text-base text-gray-400 mt-1.5">Visão geral do seu desempenho financeiro.</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-full font-bold text-sm shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] shrink-0"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Entradas */}
        <div
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-t-4 border-t-green-600 p-7 flex flex-col justify-between shadow-sm"
          style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
        >
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-5">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-1">Total de Entradas</p>
            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{formatCurrency(totalEntradas)}</p>
          </div>
        </div>

        {/* Saídas */}
        <div
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-t-4 border-t-red-500 p-7 flex flex-col justify-between shadow-sm"
          style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
        >
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl flex items-center justify-center mb-5">
            <TrendingDown size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-1">Total de Saídas</p>
            <p className="text-3xl font-extrabold text-red-500">{formatCurrency(totalSaidas)}</p>
          </div>
        </div>

        {/* Saldo */}
        <div
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-7 flex flex-col justify-between shadow-sm"
          style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${saldoFinal >= 0 ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-500"}`}>
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-1">Saldo Líquido Atual</p>
            <p className={`text-3xl font-extrabold ${saldoFinal >= 0 ? "text-gray-800 dark:text-gray-100" : "text-red-500"}`}>{formatCurrency(saldoFinal)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex gap-2">
          {(["mes", "semana"] as const).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${periodo === p ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              {p === "mes" ? "Por mês" : "Por semana"}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-12 text-center text-sm text-gray-400">
          Carregando...
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-12 text-center text-sm text-gray-400">
          Nenhuma transação no período selecionado.
        </div>
      ) : (
        <>
          {/* Gráfico de Performance */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gráfico de Performance</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Entradas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Saídas</span>
                </div>
              </div>
            </div>
            <PerformanceChart data={rows} />
          </div>

          {/* Maiores Vendas + Maiores Gastos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maiores Vendas */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
                  <Star size={16} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Maiores Vendas</h3>
              </div>
              {vendasFiltradas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhuma venda no período.</p>
              ) : (
                <div className="space-y-1">
                  {vendasFiltradas.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shrink-0">
                          <ShoppingBag size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-[180px]">{item.descricao}</p>
                          <p className="text-[11px] text-gray-400">{new Date(item.data).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <span className="text-green-600 dark:text-green-400 font-extrabold text-sm shrink-0">+ {formatCurrency(item.valorTotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maiores Gastos */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Maiores Gastos</h3>
              </div>
              {gastosFiltrados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhuma despesa no período.</p>
              ) : (
                <div className="space-y-1">
                  {gastosFiltrados.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center shrink-0">
                          <Receipt size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-[180px]">{item.descricao}</p>
                          <p className="text-[11px] text-gray-400">{new Date(item.data).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <span className="text-red-500 font-extrabold text-sm shrink-0">- {formatCurrency(item.valorTotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
