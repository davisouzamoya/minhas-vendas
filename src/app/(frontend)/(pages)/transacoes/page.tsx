"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";

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

export default function Transacoes() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [busca, setBusca] = useState("");
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

  return (
    <div>
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
          <p className="text-center text-sm text-gray-400 py-10">Nenhuma transação encontrada.</p>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.descricao}</p>
                  {t.produto && <p className="text-xs text-gray-400">{t.produto}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${tipoCor[t.tipo]}`}>
                  {tipoLabel[t.tipo]}
                </span>
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagamento</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400">{total} registros</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">Anterior</button>
              <span className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">Próxima</button>
            </div>
          </div>
        )}
      </div>

      {/* Paginação mobile */}
      {totalPages > 1 && (
        <div className="flex md:hidden items-center justify-between mt-4">
          <p className="text-xs text-gray-400">{total} registros</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">Anterior</button>
            <span className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">Próxima</button>
          </div>
        </div>
      )}
    </div>
  );
}
