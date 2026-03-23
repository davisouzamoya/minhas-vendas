"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, AlertTriangle, CheckCircle2, MessageCircle, TrendingUp, TrendingDown, ArrowDownCircle, CreditCard } from "lucide-react";

interface ReportData {
  porCategoria: { categoria: string; total: number }[];
  porTipo: { tipo: string; total: number; count: number }[];
  porMes: { mes: string; vendas: number; despesas: number; entradas: number }[];
  lucroPorProduto: { produto: string; receita: number; custo: number; lucro: number; transacoes: number }[];
  inadimplencia: { clienteId: number | null; nome: string; telefone: string | null; total: number; count: number; ids: number[]; diasEmAtraso: number }[];
  totalInadimplencia: number;
  rankingClientes: { clienteId: number | null; nome: string; total: number; transacoes: number; ticketMedio: number }[];
  porFormaPagamento: { forma: string; total: number; count: number }[];
}

interface Perfil { nomeNegocio: string; logoUrl: string | null; }

const COLORS = ["#16a34a", "#dc2626", "#2563eb", "#d97706", "#7c3aed", "#0891b2"];

const tipoLabel: Record<string, string> = {
  venda: "Vendas", despesa: "Despesas", entrada: "Entradas", saida: "Saídas",
};

const tipoIcon: Record<string, React.ReactNode> = {
  venda: <TrendingUp size={16} />,
  despesa: <TrendingDown size={16} />,
  entrada: <ArrowDownCircle size={16} />,
  saida: <TrendingDown size={16} />,
};

const tipoColor: Record<string, string> = {
  venda: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30",
  despesa: "text-red-500 bg-red-50 dark:bg-red-900/30",
  entrada: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
  saida: "text-orange-500 bg-orange-50 dark:bg-orange-900/30",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getInitials(nome: string) {
  const parts = nome.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// SVG Donut chart
function DonutChart({ data, colors, label }: { data: { name: string; value: number }[]; colors: string[]; label?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-gray-400">Sem dados.</p>;
  const cx = 100, cy = 100, r = 62, sw = 28;
  let angle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { path: `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`, color: colors[i % colors.length] };
  });
  return (
    <svg viewBox="0 0 200 200" className="w-36 shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} className="dark:stroke-gray-800" />
      {arcs.map((a, i) => (
        <path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor">{data.length}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#9ca3af">{label ?? "itens"}</text>
    </svg>
  );
}

// SVG Evolução mensal (barras agrupadas)
function EvolucaoChart({ data }: { data: { mes: string; vendas: number; despesas: number; entradas: number }[] }) {
  if (data.length === 0) return null;
  const W = 800, H = 200;
  const PAD = { top: 20, right: 20, bottom: 10, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.flatMap((d) => [d.vendas, d.despesas, d.entradas]), 1);
  const slotW = chartW / data.length;
  const barW = Math.min(slotW * 0.22, 30);
  const gap = 3;
  const yScale = (v: number) => PAD.top + (1 - v / maxVal) * chartH;
  const barH = (v: number) => Math.max((v / maxVal) * chartH, 2);
  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => yScale(f * maxVal));

  return (
    <div className="flex flex-col flex-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }} overflow="visible">
        {gridYs.map((y, i) => (
          <line key={i} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#9ca3af" strokeWidth="1" opacity="0.2" strokeDasharray="4" />
        ))}
        {data.map((d, i) => {
          const centerX = PAD.left + i * slotW + slotW / 2;
          const totalW = 3 * barW + 2 * gap;
          const startX = centerX - totalW / 2;
          return (
            <g key={i}>
              <rect x={startX} y={yScale(d.vendas)} width={barW} height={barH(d.vendas)} rx="3" fill="#16a34a" opacity="0.85" />
              <rect x={startX + barW + gap} y={yScale(d.despesas)} width={barW} height={barH(d.despesas)} rx="3" fill="#dc2626" opacity="0.85" />
              <rect x={startX + 2 * (barW + gap)} y={yScale(d.entradas)} width={barW} height={barH(d.entradas)} rx="3" fill="#2563eb" opacity="0.85" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-around mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2">
        {data.map((d, i) => <span key={i} className="text-center truncate max-w-[70px]">{d.mes}</span>)}
      </div>
    </div>
  );
}

function cobrarWhatsApp(nome: string, total: number, count: number, telefone: string | null) {
  const mensagem = `Oi ${nome}, tudo bem? 😊 Passando pra lembrar que temos ${count} venda${count !== 1 ? "s" : ""} pendente${count !== 1 ? "s" : ""} no valor de ${formatCurrency(total)}. Quando puder, me avisa! Obrigado.`;
  const numero = telefone ? telefone.replace(/\D/g, "") : "";
  const url = numero
    ? `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

function RelatoriosContent() {
  const [data, setData] = useState<ReportData | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pagando, setPagando] = useState<number[] | null>(null);
  const searchParams = useSearchParams();
  const busca = searchParams.get("q") ?? "";
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
  useEffect(() => { fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then(setPerfil); }, []);

  if (!data) return <p className="text-gray-400 text-sm">Carregando...</p>;

  const q = busca.toLowerCase();
  const inadimplenciaFiltrada = q ? data.inadimplencia.filter((i) => i.nome.toLowerCase().includes(q)) : data.inadimplencia;
  const rankingFiltrado = q ? data.rankingClientes.filter((c) => c.nome.toLowerCase().includes(q)) : data.rankingClientes;
  const produtosFiltrados = q ? data.lucroPorProduto.filter((p) => p.produto.toLowerCase().includes(q)) : data.lucroPorProduto;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between print:hidden">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Relatórios</h1>
          <p className="text-base text-gray-400 mt-1.5">Análise financeira detalhada do seu negócio.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-full shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02]"
        >
          <Printer size={16} /> Exportar PDF
        </button>
      </div>

      {/* Cabeçalho de impressão */}
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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {(dataInicio || dataFim) && (
            <button onClick={() => { setDataInicio(""); setDataFim(""); }}
              className="px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Totais por Tipo */}
      {data.porTipo.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.porTipo.map(({ tipo, total, count }) => (
            <div key={tipo} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipoColor[tipo] ?? "bg-gray-100 text-gray-500"}`}>
                {tipoIcon[tipo] ?? <TrendingUp size={16} />}
              </div>
              <div>
                <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-0.5">{tipoLabel[tipo] ?? tipo}</p>
                <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{formatCurrency(total)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{count} {count === 1 ? "transação" : "transações"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inadimplência */}
      {inadimplenciaFiltrada.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-orange-200 dark:border-orange-900/40 p-7">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Inadimplência</h2>
                <p className="text-xs text-gray-400">Vendas com pagamento pendente</p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-orange-600 dark:text-orange-400">{formatCurrency(data.totalInadimplencia)}</span>
          </div>
          <div className="space-y-1">
            {inadimplenciaFiltrada.map((i) => (
              <div key={i.nome} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
                    {getInitials(i.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{i.nome}</p>
                    <p className="text-xs text-gray-400">
                      {i.count} pendente{i.count !== 1 ? "s" : ""}
                      {i.diasEmAtraso > 0 && (
                        <span className={`ml-1.5 font-semibold ${i.diasEmAtraso > 30 ? "text-red-500" : "text-orange-500"}`}>
                          · {i.diasEmAtraso} dia{i.diasEmAtraso !== 1 ? "s" : ""} em atraso
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-orange-600 dark:text-orange-400 shrink-0">{formatCurrency(i.total)}</p>
                <div className="print:hidden flex items-center gap-2 shrink-0">
                  <button onClick={() => cobrarWhatsApp(i.nome, i.total, i.count, i.telefone)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full transition-colors">
                    <MessageCircle size={12} /> Cobrar
                  </button>
                  <button onClick={() => marcarPago(i.ids)} disabled={pagando !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors disabled:opacity-50">
                    <CheckCircle2 size={12} />
                    {pagando?.toString() === i.ids.toString() ? "Salvando..." : "Marcar pago"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolução Mensal */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Evolução Mensal</h2>
          <div className="flex items-center gap-4">
            {[{ color: "#16a34a", label: "Vendas" }, { color: "#dc2626", label: "Despesas" }, { color: "#2563eb", label: "Entradas" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
        {data.porMes.length === 0
          ? <p className="text-sm text-gray-400">Sem dados suficientes.</p>
          : <EvolucaoChart data={data.porMes} />
        }
      </div>

      {/* Gastos por categoria + Formas de pagamento */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Por categoria */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-7">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Gastos por Categoria</h2>
          {data.porCategoria.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados.</p>
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart data={data.porCategoria.map((d) => ({ name: d.categoria, value: d.total }))} colors={COLORS} label="categorias" />
              <div className="flex-1 space-y-2 min-w-0">
                {data.porCategoria.slice(0, 6).map((d, i) => (
                  <div key={d.categoria} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate capitalize">{d.categoria}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 shrink-0">{formatCurrency(d.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formas de pagamento */}
        {data.porFormaPagamento.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-7">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Formas de Pagamento</h2>
            <div className="flex items-center gap-6">
              <DonutChart data={data.porFormaPagamento.map((d) => ({ name: d.forma, value: d.total }))} colors={COLORS} label="formas" />
              <div className="flex-1 space-y-2 min-w-0">
                {data.porFormaPagamento.map((f, i) => (
                  <div key={f.forma} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize truncate">{f.forma}</span>
                      <span className="text-xs text-gray-400 shrink-0">({f.count}x)</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 shrink-0">{formatCurrency(f.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-7 flex items-center justify-center">
            <div className="text-center">
              <CreditCard size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sem dados de formas de pagamento.</p>
            </div>
          </div>
        )}
      </div>

      {/* Ranking de clientes */}
      {rankingFiltrado.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-7 py-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ranking de Clientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                  <th className="px-7 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-right">Total comprado</th>
                  <th className="px-4 py-3 text-right">Pedidos</th>
                  <th className="px-4 py-3 text-right">Ticket médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rankingFiltrado.map((c, idx) => (
                  <tr key={c.clienteId ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-7 py-4 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 text-[11px] font-bold shrink-0">
                          {getInitials(c.nome)}
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(c.total)}</td>
                    <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400">{c.transacoes}</td>
                    <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(c.ticketMedio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lucro por produto */}
      {produtosFiltrados.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-7 py-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Lucro Líquido por Produto</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                  <th className="px-7 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-right">Receita</th>
                  <th className="px-4 py-3 text-right">Custo</th>
                  <th className="px-4 py-3 text-right">Lucro</th>
                  <th className="px-4 py-3 text-right">Vendas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {produtosFiltrados.map(({ produto, receita, custo, lucro, transacoes }) => (
                  <tr key={produto} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-7 py-4 font-semibold text-gray-800 dark:text-gray-100">{produto}</td>
                    <td className="px-4 py-4 text-right text-green-600 dark:text-green-400 font-semibold">{formatCurrency(receita)}</td>
                    <td className="px-4 py-4 text-right text-red-500 font-semibold">{formatCurrency(custo)}</td>
                    <td className={`px-4 py-4 text-right font-extrabold ${lucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                      {formatCurrency(lucro)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400">{transacoes}</td>
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

export default function Relatorios() {
  return (
    <Suspense>
      <RelatoriosContent />
    </Suspense>
  );
}
