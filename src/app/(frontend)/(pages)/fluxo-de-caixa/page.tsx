"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface FluxoRow {
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const hoje = new Date();
const defaultInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1).toISOString().split("T")[0];
const defaultFim = hoje.toISOString().split("T")[0];

export default function FluxoDeCaixa() {
  const [rows, setRows] = useState<FluxoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"mes" | "semana">("mes");
  const [dataInicio, setDataInicio] = useState(defaultInicio);
  const [dataFim, setDataFim] = useState(defaultFim);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ periodo, dataInicio, dataFim });
    fetch(`/api/fluxo-de-caixa?${params}`)
      .then((r) => r.ok ? r.json() : { rows: [] })
      .then((d) => { setRows(d.rows ?? []); setLoading(false); });
  }, [periodo, dataInicio, dataFim]);

  const totalEntradas = rows.reduce((s, r) => s + r.entradas, 0);
  const totalSaidas = rows.reduce((s, r) => s + r.saidas, 0);
  const saldoFinal = rows.length > 0 ? rows[rows.length - 1].saldoAcumulado : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Fluxo de Caixa</h1>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 space-y-3">
        {/* Toggle período */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-full sm:w-auto self-start">
          {(["mes", "semana"] as const).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-colors ${periodo === p ? "bg-green-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
              {p === "mes" ? "Por mês" : "Por semana"}
            </button>
          ))}
        </div>
        {/* Datas */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total entradas</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total saídas</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSaidas)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${saldoFinal >= 0 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo acumulado</p>
          <p className={`text-xl font-bold ${saldoFinal >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{formatCurrency(saldoFinal)}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-400">
          Carregando...
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-400">
          Nenhuma transação no período selecionado.
        </div>
      ) : (
        <>
          {/* Gráfico */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6 overflow-hidden">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Entradas vs Saídas</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rows} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} width={52} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <ReferenceLine y={0} stroke="#9ca3af" />
                <Bar dataKey="entradas" name="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Período</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Entradas</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Saídas</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saldo</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Saldo acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100 capitalize">{r.label}</td>
                      <td className="px-5 py-3 text-right text-green-600 dark:text-green-400 font-medium">{formatCurrency(r.entradas)}</td>
                      <td className="px-5 py-3 text-right text-red-600 dark:text-red-400 font-medium">{formatCurrency(r.saidas)}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${r.saldo >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                        {r.saldo >= 0 ? "+" : ""}{formatCurrency(r.saldo)}
                      </td>
                      <td className={`px-5 py-3 text-right font-bold ${r.saldoAcumulado >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
                        {formatCurrency(r.saldoAcumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <td className="px-5 py-3 font-bold text-gray-700 dark:text-gray-300">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-green-700 dark:text-green-400">{formatCurrency(totalEntradas)}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-700 dark:text-red-400">{formatCurrency(totalSaidas)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${saldoFinal >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                      {saldoFinal >= 0 ? "+" : ""}{formatCurrency(totalEntradas - totalSaidas)}
                    </td>
                    <td className={`px-5 py-3 text-right font-bold ${saldoFinal >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
                      {formatCurrency(saldoFinal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
