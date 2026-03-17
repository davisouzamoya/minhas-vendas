"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Search, Trash2, ReceiptText, Pencil, Download, Copy } from "lucide-react";

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
  clienteId: number | null;
  fornecedorId: number | null;
  cliente: { id: number; nome: string } | null;
  fornecedor: { id: number; nome: string } | null;
}

interface Pessoa { id: number; nome: string; }

const TIPOS = ["venda", "despesa", "entrada", "saida"] as const;
const CATEGORIAS = ["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"];
const PAGAMENTOS = ["pix", "dinheiro", "cartao", "boleto", "transferencia"];

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

function toInputDate(dateStr: string) {
  return new Date(dateStr).toISOString().split("T")[0];
}

// --- Empty State ---
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <ReceiptText size={48} className="text-gray-300 dark:text-gray-600" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">
        {hasFilters ? "Nenhuma transação encontrada para os filtros aplicados." : "Nenhuma transação ainda."}
      </p>
      {!hasFilters && (
        <Link href="/nova" className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          Adicionar primeira transação
        </Link>
      )}
    </div>
  );
}

// --- Confirm Delete Modal ---
function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Excluir transação</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Edit Modal ---
type EditForm = {
  tipo: string;
  descricao: string;
  produto: string;
  categoria: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  forma_pagamento: string;
  data: string;
};

function EditModal({ transaction, onSave, onCancel }: { transaction: Transaction; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<EditForm>({
    tipo: transaction.tipo,
    descricao: transaction.descricao,
    produto: transaction.produto ?? "",
    categoria: transaction.categoria ?? "",
    quantidade: transaction.quantidade?.toString() ?? "",
    valor_unitario: transaction.valorUnitario?.toString() ?? "",
    valor_total: transaction.valorTotal.toString(),
    forma_pagamento: transaction.formaPagamento ?? "",
    data: toInputDate(transaction.data),
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantidade" || field === "valor_unitario") {
        const qty = parseFloat(field === "quantidade" ? value : prev.quantidade) || 0;
        const unit = parseFloat(field === "valor_unitario" ? value : prev.valor_unitario) || 0;
        if (qty > 0 && unit > 0) next.valor_total = (qty * unit).toFixed(2);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/transactions/${transaction.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantidade: form.quantidade ? parseFloat(form.quantidade) : null,
        valor_unitario: form.valor_unitario ? parseFloat(form.valor_unitario) : null,
        valor_total: parseFloat(form.valor_total),
        produto: form.produto || null,
        categoria: form.categoria || null,
        forma_pagamento: form.forma_pagamento || null,
      }),
    });
    setSaving(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Editar transação</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente/Fornecedor readonly */}
          {(transaction.cliente || transaction.fornecedor) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {transaction.cliente ? "Cliente" : "Fornecedor"}
              </label>
              <p className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                {transaction.cliente?.nome ?? transaction.fornecedor?.nome}
              </p>
            </div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button key={t} type="button" onClick={() => set("tipo", t)}
                  className={`py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${form.tipo === t ? "bg-green-600 border-green-600 text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400"}`}>
                  {t === "saida" ? "Saída" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
            <input type="text" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {/* Produto + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
              <input type="text" value={form.produto} onChange={(e) => set("produto", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Sem categoria</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Qtd + Valor unit + Total */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
              <input type="number" value={form.quantidade} onChange={(e) => set("quantidade", e.target.value)} min="0" step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vlr Unitário</label>
              <input type="number" value={form.valor_unitario} onChange={(e) => set("valor_unitario", e.target.value)} min="0" step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vlr Total *</label>
              <input type="number" value={form.valor_total} onChange={(e) => set("valor_total", e.target.value)} min="0" step="0.01" required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Pagamento + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pagamento</label>
              <select value={form.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Não informado</option>
                {PAGAMENTOS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
              <input type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Pagination ---
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
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">‹</button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-2 py-1 text-xs text-gray-400">...</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`px-3 py-1 text-xs rounded-lg border transition-colors ${p === page ? "bg-green-600 border-green-600 text-white" : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">›</button>
      </div>
    </div>
  );
}

// --- CSV Export ---
function exportToCsv(transactions: Transaction[]) {
  const header = ["ID", "Tipo", "Descrição", "Produto", "Categoria", "Quantidade", "Valor Unitário", "Valor Total", "Forma de Pagamento", "Data"];
  const rows = transactions.map((t) => [
    t.id,
    tipoLabel[t.tipo] ?? t.tipo,
    `"${t.descricao.replace(/"/g, '""')}"`,
    t.produto ?? "",
    t.categoria ?? "",
    t.quantidade ?? "",
    t.valorUnitario ?? "",
    t.valorTotal,
    t.formaPagamento ?? "",
    formatDate(t.data),
  ]);
  const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Main Page ---
export default function Transacoes() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [clientes, setClientes] = useState<Pessoa[]>([]);
  const [fornecedores, setFornecedores] = useState<Pessoa[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);
  const limit = 15;

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.ok ? r.json() : []).then(setClientes);
    fetch("/api/fornecedores").then((r) => r.ok ? r.json() : []).then(setFornecedores);
  }, []);

  const buildParams = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tipo) params.set("tipo", tipo);
    if (categoria) params.set("categoria", categoria);
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    if (clienteId) params.set("clienteId", clienteId);
    if (fornecedorId) params.set("fornecedorId", fornecedorId);
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v));
    return params;
  }, [page, tipo, categoria, dataInicio, dataFim, clienteId, fornecedorId]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/transactions?${buildParams()}`);
    const json = await res.json();
    setTransactions(json.transactions);
    setTotal(json.total);
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);

  const filtered = busca
    ? transactions.filter((t) =>
        t.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        t.produto?.toLowerCase().includes(busca.toLowerCase())
      )
    : transactions;

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(tipo || categoria || busca || dataInicio || dataFim || clienteId || fornecedorId);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  async function handleDuplicate(t: Transaction) {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: t.tipo,
        descricao: t.descricao,
        produto: t.produto,
        categoria: t.categoria,
        quantidade: t.quantidade,
        valor_unitario: t.valorUnitario,
        valor_total: t.valorTotal,
        forma_pagamento: t.formaPagamento,
        data: new Date().toISOString().split("T")[0],
      }),
    });
    load();
  }

  async function handleExport() {
    setExporting(true);
    const params = buildParams({ export: "csv", page: "1", limit: "99999" });
    const res = await fetch(`/api/transactions?${params}`);
    const json = await res.json();
    exportToCsv(json.transactions);
    setExporting(false);
  }

  function resetFilters() {
    setTipo(""); setCategoria(""); setBusca(""); setDataInicio(""); setDataFim(""); setClienteId(""); setFornecedorId(""); setPage(1);
  }

  return (
    <div>
      {deleteId && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {editTransaction && <EditModal transaction={editTransaction} onSave={() => { setEditTransaction(null); load(); }} onCancel={() => setEditTransaction(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Download size={15} />
            <span className="hidden sm:inline">{exporting ? "Exportando..." : "CSV"}</span>
          </button>
          <Link href="/nova" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <PlusCircle size={16} />
            Nova
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Todos os tipos</option>
            <option value="venda">Venda</option>
            <option value="despesa">Despesa</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <select value={categoria} onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        {/* Filtro de período */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data início</label>
            <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data fim</label>
            <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {clientes.length > 0 && (
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente</label>
              <select value={clienteId} onChange={(e) => { setClienteId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todos</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}
          {fornecedores.length > 0 && (
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fornecedor</label>
              <select value={fornecedorId} onChange={(e) => { setFornecedorId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todos</option>
                {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          )}
          {hasFilters && (
            <button onClick={resetFilters} className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap">
              Limpar filtros
            </button>
          )}
        </div>
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
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>{tipoLabel[t.tipo]}</span>
                  <button onClick={() => setEditTransaction(t)} className="p-1 text-gray-400 hover:text-green-500 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDuplicate(t)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Duplicar"><Copy size={14} /></button>
                  <button onClick={() => setDeleteId(t.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {formatDate(t.data)}
                  {t.categoria && ` • ${t.categoria}`}
                  {t.formaPagamento && ` • ${t.formaPagamento}`}
                  {t.cliente && ` • ${t.cliente.nome}`}
                  {t.fornecedor && ` • ${t.fornecedor.nome}`}
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(t.valorTotal)}</p>
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
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>{tipoLabel[t.tipo]}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.categoria ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.formaPagamento ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    <p>{formatDate(t.data)}</p>
                    {t.cliente && <p className="text-xs text-gray-400">{t.cliente.nome}</p>}
                    {t.fornecedor && <p className="text-xs text-gray-400">{t.fornecedor.nome}</p>}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(t.valorTotal)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditTransaction(t)} className="p-1.5 text-gray-400 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDuplicate(t)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Duplicar">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
