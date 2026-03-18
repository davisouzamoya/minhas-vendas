"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Printer, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ReportData {
  porCategoria: { categoria: string; total: number }[];
  porTipo: { tipo: string; total: number; count: number }[];
  porMes: { mes: string; vendas: number; despesas: number; entradas: number }[];
  lucroPorProduto: { produto: string; receita: number; custo: number; lucro: number; transacoes: number }[];
  inadimplencia: { clienteId: number | null; nome: string; total: number; count: number; ids: number[]; diasEmAtraso: number }[];
  totalInadimplencia: number;
  rankingClientes: { clienteId: number | null; nome: string; total: number; transacoes: number; ticketMedio: number }[];
  porFormaPagamento: { forma: string; total: number; count: number }[];
}

interface Perfil { nomeNegocio: string; logoUrl: string | null; }

const COLORS = ["#16a34a", "#dc2626", "#2563eb", "#d97706", "#7c3aed", "#0891b2"];

const tipoLabel: Record<string, string> = {
  venda: "Vendas", despesa: "Despesas", entrada: "Entradas", saida: "Saídas",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Relatorios() {
  const [data, setData] = useState<ReportData | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pagando, setPagando] = useState<number[] | null>(null);
  const printDateRef = useRef(new Date().toLocaleDateString("pt-BR"));

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    const res = await fetch(`/api/relatorios?${params}`);
    if (res.ok) setData(await res.json());
  }, [dataInicio, dataFim]);

  async function marcarPago(ids: number[]) {
    setPagando(ids);
    await fetch("/api/transactions/bulk-pagar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setPagando(null);
    load();
    window.dispatchEvent(new Event("vendas-pendentes-updated"));
  }

  
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then(setPerfil);
  }, []);

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
      {/* Cabeçalho visível apenas na impressão */}
      <div className="hidden print:flex items-center gap-4 mb-8 pb-4 border-b border-gray-300">
        {perfil?.logoUrl ? (
          <img src={perfil.logoUrl} alt="Logo" className="w-14 h-14 rounded-lg object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">R</span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{perfil?.nomeNegocio || "Relatório Financeiro"}</h1>
          <p className="text-sm text-gray-500">Gerado em {printDateRef.current}{dataInicio || dataFim ? ` · Período: ${dataInicio || "início"} a ${dataFim || "hoje"}` : ""}</p>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 print:hidden">
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
          {(dataInicio || dataFim) && (
            <div className="col-span-2 sm:col-span-1">
              <button onClick={() => { setDataInicio(""); setDataFim(""); }}
                className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 transition-colors whitespace-nowrap">
                Limpar filtro
              </button>
            </div>
          )}
        </div>
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
              <div key={i.nome} className="flex items-center justify-between py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{i.nome}</p>
                  <p className="text-xs text-gray-400">
                    {i.count} venda{i.count !== 1 ? "s" : ""} pendente{i.count !== 1 ? "s" : ""}
                    {i.diasEmAtraso > 0 && (
                      <span className={`ml-1 font-medium ${i.diasEmAtraso > 30 ? "text-red-500" : "text-orange-500"}`}>
                        · {i.diasEmAtraso} dia{i.diasEmAtraso !== 1 ? "s" : ""} em atraso
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400 shrink-0">{formatCurrency(i.total)}</p>
                <button
                  onClick={() => marcarPago(i.ids)}
                  disabled={pagando !== null}
                  className="print:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  <CheckCircle2 size={13} />
                  {pagando?.toString() === i.ids.toString() ? "Salvando..." : "Marcar pago"}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Vendas com status "pendente". Marque como pagas na tela de Transações.</p>
        </div>
      )}

      {/* Forma de Pagamento */}
      {data.porFormaPagamento.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Formas de Pagamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.porFormaPagamento} dataKey="total" nameKey="forma" cx="50%" cy="50%" outerRadius={85}
                  label={({ name }) => String(name).charAt(0).toUpperCase() + String(name).slice(1)}>
                  {data.porFormaPagamento.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {data.porFormaPagamento.map((f, i) => (
                <div key={f.forma} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{f.forma}</span>
                    <span className="text-xs text-gray-400">({f.count}x)</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(f.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ranking de clientes */}
      {data.rankingClientes.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Ranking de Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">#</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total comprado</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pedidos</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.rankingClientes.map((c, idx) => (
                  <tr key={c.clienteId ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-3 font-medium text-gray-800 dark:text-gray-100">{c.nome}</td>
                    <td className="py-3 text-right text-green-600 dark:text-green-400 font-semibold">{formatCurrency(c.total)}</td>
                    <td className="py-3 text-right text-gray-500 dark:text-gray-400">{c.transacoes}</td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(c.ticketMedio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
