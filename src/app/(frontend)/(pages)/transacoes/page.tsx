"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Search, Trash2, ReceiptText } from "lucide-react";

interface Transaction {
  id: number;
  tipo: string;
  descricao: string;
  produto: string | null;
  categoria: string | null;
  quantidade: number | null;
  valorUnitario: number | null;
  valorTotal: number;
  formaPagamento: string | null;
  data: string;
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

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <ReceiptText size={48} className="text-gray-300 dark:text-gray-600" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">
        {hasFilters ? "Nenhuma transação encontrada para os filtros aplicados." : "Nenhuma transação ainda."}
      </p>
      {!hasFilters && (
        <Link
          href="/nova"
          className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Adicionar primeira transação
        </Link>
      )}
    </div>
  );
}

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Excluir transação</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (p: number) => void }) {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
      <p className="text-xs text-gray-400">{total} registro{total !== 1 ? "s" : ""}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                p === page
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default function Transacoes() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [busca, setBusca] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const limit = 15;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tipo) params.set("tipo", tipo);
    if (categoria) params.set("categoria", categoria);
    const res = await fetch(`/api/transactions?${params}`);
    const json = await res.json();
    setTransactions(json.transactions);
    setTotal(json.total);
  }, [page, tipo, categoria]);

  useEffect(() => { load(); }, [load]);

  const filtered = busca
    ? transactions.filter((t) =>
        t.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        t.produto?.toLowerCase().includes(busca.toLowerCase())
      )
    : transactions;

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(tipo || categoria || busca);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  return (
    <div>
      {deleteId && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
        <Link
          href="/nova"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          Nova
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={tipo}
          onChange={(e) => { setTipo(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos os tipos</option>
          <option value="venda">Venda</option>
          <option value="despesa">Despesa</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <select
          value={categoria}
          onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas as categorias</option>
          {["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <EmptyState hasFilters={hasFilters} />
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{t.descricao}</p>
                  {t.produto && <p className="text-xs text-gray-400">{t.produto}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>
                    {tipoLabel[t.tipo]}
                  </span>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {formatDate(t.data)}
                  {t.categoria && ` • ${t.categoria}`}
                  {t.formaPagamento && ` • ${t.formaPagamento}`}
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {formatCurrency(t.valorTotal)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagamento</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-100">{t.descricao}</p>
                    {t.produto && <p className="text-xs text-gray-400">{t.produto}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>
                      {tipoLabel[t.tipo]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.categoria ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.formaPagamento ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{formatDate(t.data)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(t.valorTotal)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && filtered.length > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        )}
      </div>

      {/* Paginação mobile */}
      {totalPages > 1 && filtered.length > 0 && (
        <div className="flex md:hidden items-center justify-between mt-4">
          <p className="text-xs text-gray-400">{total} registro{total !== 1 ? "s" : ""}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">‹</button>
            <span className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">›</button>
          </div>
        </div>
      )}
    </div>
  );
}
