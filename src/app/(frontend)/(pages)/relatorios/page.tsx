"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Printer, AlertTriangle } from "lucide-react";

interface ReportData {
  porCategoria: { categoria: string; total: number }[];
  porTipo: { tipo: string; total: number; count: number }[];
  porMes: { mes: string; vendas: number; despesas: number; entradas: number }[];
  lucroPorProduto: { produto: string; receita: number; custo: number; lucro: number; transacoes: number }[];
  inadimplencia: { clienteId: number | null; nome: string; total: number; count: number }[];
  totalInadimplencia: number;
}

const COLORS = ["#16a34a", "#dc2626", "#2563eb", "#d97706", "#7c3aed", "#0891b2"];

const tipoLabel: Record<string, string> = {
  venda: "Vendas", despesa: "Despesas", entrada: "Entradas", saida: "Saídas",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Relatorios() {
  const [data, setData] = useState<ReportData | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    const res = await fetch(`/api/relatorios?${params}`);
    if (res.ok) setData(await res.json());
  }, [dataInicio, dataFim]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <p className="text-gray-400 text-sm">Carregando...</p>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Printer size={15} /> Exportar PDF
        </button>
      </div>
      <h1 className="hidden print:block text-2xl font-bold text-gray-900 mb-6">Relatórios</h1>

      {/* Filtro de período */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 flex flex-col sm:flex-row gap-3 items-end print:hidden">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data início</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data fim</label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        {(dataInicio || dataFim) && (
          <button onClick={() => { setDataInicio(""); setDataFim(""); }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 transition-colors whitespace-nowrap">
            Limpar filtro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Por categoria */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Gastos por Categoria</h2>
          {data.porCategoria.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.porCategoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={90} label={({ name }) => String(name)}>
                  {data.porCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por tipo */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Totais por Tipo</h2>
          <div className="space-y-3">
            {data.porTipo.map(({ tipo, total, count }) => (
              <div key={tipo} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{tipoLabel[tipo] ?? tipo}</p>
                  <p className="text-xs text-gray-400">{count} transações</p>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(total)}</p>
              </div>
            ))}
            {data.porTipo.length === 0 && <p className="text-sm text-gray-400">Sem dados.</p>}
          </div>
        </div>
      </div>

      {/* Evolução mensal */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Evolução Mensal</h2>
        {data.porMes.length === 0 ? (
          <p className="text-sm text-gray-400">Sem dados suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="vendas" name="Vendas" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="entradas" name="Entradas" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Inadimplência */}
      {data.inadimplencia.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-orange-200 dark:border-orange-900/40 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Inadimplência</h2>
            </div>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatCurrency(data.totalInadimplencia)}</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.inadimplencia.map((i) => (
              <div key={i.nome} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{i.nome}</p>
                  <p className="text-xs text-gray-400">{i.count} venda{i.count !== 1 ? "s" : ""} pendente{i.count !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatCurrency(i.total)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Vendas com status "pendente". Marque como pagas na tela de Transações.</p>
        </div>
      )}

      {/* Lucro por produto */}
      {data.lucroPorProduto.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Lucro Líquido por Produto</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produto</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receita</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Custo</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lucro</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.lucroPorProduto.map(({ produto, receita, custo, lucro, transacoes }) => (
                  <tr key={produto} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 font-medium text-gray-800 dark:text-gray-100">{produto}</td>
                    <td className="py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(receita)}</td>
                    <td className="py-3 text-right text-red-600 dark:text-red-400">{formatCurrency(custo)}</td>
                    <td className={`py-3 text-right font-bold ${lucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(lucro)}
                    </td>
                    <td className="py-3 text-right text-gray-500 dark:text-gray-400">{transacoes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
