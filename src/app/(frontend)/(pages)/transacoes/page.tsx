"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  PlusCircle, Search, Trash2, ReceiptText, Pencil, Download, Copy,
  CheckCircle2, Paperclip, Repeat, Square, CheckSquare, ArrowUpDown,
  ArrowUp, ArrowDown, Layers,
} from "lucide-react";

// --- Interfaces ---
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
  statusPagamento: string | null;
  observacoes: string | null;
  comprovanteUrl: string | null;
  fotoUrl: string | null;
  recorrente: boolean;
  data: string;
  createdAt: string;
  updatedAt: string | null;
  clienteId: number | null;
  fornecedorId: number | null;
  cliente: { id: number; nome: string } | null;
  fornecedor: { id: number; nome: string } | null;
}

interface Pessoa { id: number; nome: string; }
interface Totais { vendas: number; despesas: number; entradas: number; saldo: number; }

// --- Constants ---
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
  venda: "Venda", despesa: "Despesa", entrada: "Entrada", saida: "Saída",
};

// --- Helpers ---
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

// --- Toast Undo ---
function ToastUndo({ message, onUndo, onDismiss }: { message: string; onUndo: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-xl shadow-2xl text-sm whitespace-nowrap">
      <span>{message}</span>
      <button onClick={onUndo} className="font-semibold text-green-400 dark:text-green-700 hover:underline">Desfazer</button>
      <button onClick={onDismiss} className="ml-1 text-gray-400 hover:text-white dark:hover:text-gray-900 text-lg leading-none">×</button>
    </div>
  );
}

// --- Sort Icon ---
function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy: string; sortDir: string }) {
  if (sortBy !== col) return <ArrowUpDown size={12} className="ml-1 text-gray-300 dark:text-gray-600" />;
  return sortDir === "asc"
    ? <ArrowUp size={12} className="ml-1 text-green-500" />
    : <ArrowDown size={12} className="ml-1 text-green-500" />;
}

// --- Status Badge ---
function StatusBadge({ status, onClick }: { status: string | null; onClick?: () => void }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const cls = status === "pago"
    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
    : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
  return (
    <button onClick={onClick} title={onClick ? "Clique para alternar" : undefined}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-opacity ${cls} ${onClick ? "hover:opacity-70" : "cursor-default"}`}>
      {status === "pago" ? "Pago" : "Pendente"}
    </button>
  );
}

// --- Edit Modal ---
type EditForm = {
  tipo: string; descricao: string; produto: string; categoria: string;
  quantidade: string; valor_unitario: string; valor_total: string;
  forma_pagamento: string; statusPagamento: string;
  observacoes: string; comprovanteUrl: string; fotoUrl: string; data: string;
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
    statusPagamento: transaction.statusPagamento ?? "",
    observacoes: transaction.observacoes ?? "",
    comprovanteUrl: transaction.comprovanteUrl ?? "",
    fotoUrl: transaction.fotoUrl ?? "",
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
        statusPagamento: form.statusPagamento || null,
        observacoes: form.observacoes || null,
        comprovanteUrl: form.comprovanteUrl || null,
        fotoUrl: form.fotoUrl || null,
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <p className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium border ${tipoCor[form.tipo] ?? "border-gray-200 text-gray-600"}`}>
              {form.tipo === "saida" ? "Saída" : form.tipo.charAt(0).toUpperCase() + form.tipo.slice(1)}
            </p>
          </div>

          {form.tipo === "venda" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status do Pagamento</label>
              <select value={form.statusPagamento} onChange={(e) => set("statusPagamento", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Não informado</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={2}
              placeholder="Notas adicionais..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprovante (URL)</label>
            <input type="url" value={form.comprovanteUrl} onChange={(e) => set("comprovanteUrl", e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {transaction.fotoUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Foto do Produto</label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={transaction.fotoUrl} alt="Foto do produto" className="w-28 h-28 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
              <p className="text-xs text-gray-400 mt-1">Para alterar a foto, crie uma nova transação.</p>
            </div>
          )}

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
            <button key={p} onClick={() => onChange(p as number)}
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
  const header = ["ID", "Tipo", "Descrição", "Produto", "Categoria", "Quantidade", "Valor Unitário", "Valor Total", "Pagamento", "Status", "Data", "Observações"];
  const rows = transactions.map((t) => [
    t.id, tipoLabel[t.tipo] ?? t.tipo,
    `"${t.descricao.replace(/"/g, '""')}"`,
    t.produto ?? "", t.categoria ?? "",
    t.quantidade ?? "", t.valorUnitario ?? "", t.valorTotal,
    t.formaPagamento ?? "", t.statusPagamento ?? "",
    formatDate(t.data),
    t.observacoes ? `"${t.observacoes.replace(/"/g, '""')}"` : "",
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
  const [totais, setTotais] = useState<Totais | null>(null);
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [sortBy, setSortBy] = useState("data");
  const [sortDir, setSortDir] = useState("desc");
  const [agrupar, setAgrupar] = useState<"" | "dia" | "mes">("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [clientes, setClientes] = useState<Pessoa[]>([]);
  const [fornecedores, setFornecedores] = useState<Pessoa[]>([]);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limit = 15;

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.ok ? r.json() : []).then(setClientes);
    fetch("/api/fornecedores").then((r) => r.ok ? r.json() : []).then(setFornecedores);
  }, []);

  const buildParams = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortDir });
    if (tipo) params.set("tipo", tipo);
    if (categoria) params.set("categoria", categoria);
    if (statusFilter) params.set("statusPagamento", statusFilter);
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    if (clienteId) params.set("clienteId", clienteId);
    if (fornecedorId) params.set("fornecedorId", fornecedorId);
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v));
    return params;
  }, [page, tipo, categoria, statusFilter, dataInicio, dataFim, clienteId, fornecedorId, sortBy, sortDir]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/transactions?${buildParams()}`);
    const json = await res.json();
    setTransactions(json.transactions);
    setTotal(json.total);
    setTotais(json.totais ?? null);
    setSelected(new Set());
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
  }

  const filtered = busca
    ? transactions.filter((t) =>
        t.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        t.produto?.toLowerCase().includes(busca.toLowerCase()) ||
        t.observacoes?.toLowerCase().includes(busca.toLowerCase())
      )
    : transactions;

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(tipo || categoria || busca || dataInicio || dataFim || clienteId || fornecedorId || statusFilter);

  function showToastWithUndo(message: string, undoFn: () => void) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setToast({ message, onUndo: () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); setToast(null); undoFn(); } });
  }

  function dismissToast() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setToast(null);
  }

  function handleDeleteWithUndo(id: number) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setTotal((prev) => prev - 1);
    showToastWithUndo("Transação excluída.", load);
    undoTimerRef.current = setTimeout(async () => {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      setToast(null);
    }, 5000);
  }

  function handleBulkDeleteWithUndo() {
    const ids = Array.from(selected);
    setTransactions((prev) => prev.filter((t) => !selected.has(t.id)));
    setTotal((prev) => prev - ids.length);
    setSelected(new Set());
    showToastWithUndo(`${ids.length} transaç${ids.length > 1 ? "ões excluídas" : "ão excluída"}.`, load);
    undoTimerRef.current = setTimeout(async () => {
      await fetch("/api/transactions/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setToast(null);
    }, 5000);
  }

  async function handleBulkPago() {
    const ids = Array.from(selected);
    await fetch("/api/transactions/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, statusPagamento: "pago" }),
    });
    setSelected(new Set());
    load();
    window.dispatchEvent(new Event("vendas-pendentes-updated"));
  }

  async function handleTogglePago(t: Transaction) {
    const next = t.statusPagamento === "pago" ? "pendente" : "pago";
    await fetch(`/api/transactions/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: t.tipo, descricao: t.descricao, produto: t.produto,
        categoria: t.categoria, quantidade: t.quantidade,
        valor_unitario: t.valorUnitario, valor_total: t.valorTotal,
        forma_pagamento: t.formaPagamento, statusPagamento: next,
        observacoes: t.observacoes, comprovanteUrl: t.comprovanteUrl,
        fotoUrl: t.fotoUrl, data: toInputDate(t.data),
      }),
    });
    load();
    window.dispatchEvent(new Event("vendas-pendentes-updated"));
  }

  async function handleDuplicate(t: Transaction) {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: t.tipo, descricao: t.descricao, produto: t.produto,
        categoria: t.categoria, quantidade: t.quantidade,
        valor_unitario: t.valorUnitario, valor_total: t.valorTotal,
        forma_pagamento: t.formaPagamento, observacoes: t.observacoes,
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

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(selected.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map((t) => t.id)));
  }

  function resetFilters() {
    setTipo(""); setCategoria(""); setBusca(""); setDataInicio(""); setDataFim("");
    setClienteId(""); setFornecedorId(""); setStatusFilter(""); setPage(1);
  }

  // Group rows by day or month
  type Group = { key: string; items: Transaction[] };
  function groupRows(rows: Transaction[]): Group[] {
    const groups: Group[] = [];
    for (const t of rows) {
      const key = agrupar === "dia"
        ? formatDate(t.data)
        : new Date(t.data).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(t);
      else groups.push({ key, items: [t] });
    }
    return groups;
  }

  function renderRow(t: Transaction) {
    const isSelected = selected.has(t.id);
    return (
      <tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? "bg-green-50 dark:bg-green-900/10" : ""}`}>
        <td className="px-4 py-3 w-8">
          <button onClick={() => toggleSelect(t.id)} className="text-gray-400 hover:text-green-500 transition-colors">
            {isSelected ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} />}
          </button>
        </td>
        <td className="px-4 py-3 max-w-xs">
          <p className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
            {t.descricao}
            {t.recorrente && <span title="Recorrente"><Repeat size={12} className="text-blue-400 shrink-0" /></span>}
            {t.comprovanteUrl && (
              <a href={t.comprovanteUrl} target="_blank" rel="noreferrer" title="Ver comprovante" onClick={(e) => e.stopPropagation()}>
                <Paperclip size={12} className="text-gray-400 hover:text-green-500 shrink-0" />
              </a>
            )}
          </p>
          <div className="flex items-start gap-2">
            {t.fotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.fotoUrl} alt={t.produto ?? "foto"} className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0 mt-0.5" />
            )}
            <div>
              {t.produto && <p className="text-xs text-gray-400">{t.produto}</p>}
              {t.observacoes && <p className="text-xs text-gray-400 italic truncate">{t.observacoes}</p>}
            </div>
          </div>
          {t.updatedAt && t.createdAt && new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime() > 10000 && (
            <p className="text-xs text-gray-400 italic">Editado {new Date(t.updatedAt).toLocaleDateString("pt-BR")}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>{tipoLabel[t.tipo]}</span>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.categoria ?? "—"}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.formaPagamento ?? "—"}</td>
        <td className="px-4 py-3">
          <StatusBadge status={t.statusPagamento} onClick={t.statusPagamento ? () => handleTogglePago(t) : undefined} />
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          <p>{formatDate(t.data)}</p>
          {t.cliente && <p className="text-xs text-gray-400">{t.cliente.nome}</p>}
          {t.fornecedor && <p className="text-xs text-gray-400">{t.fornecedor.nome}</p>}
        </td>
        <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(t.valorTotal)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setEditTransaction(t)} className="p-1.5 text-gray-400 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"><Pencil size={14} /></button>
            <button onClick={() => handleDuplicate(t)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Duplicar"><Copy size={14} /></button>
            <button onClick={() => handleDeleteWithUndo(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div>
      {editTransaction && <EditModal transaction={editTransaction} onSave={() => { setEditTransaction(null); load(); }} onCancel={() => setEditTransaction(null)} />}
      {toast && <ToastUndo message={toast.message} onUndo={toast.onUndo} onDismiss={dismissToast} />}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-xl shadow-2xl text-sm whitespace-nowrap">
          <span className="font-medium">{selected.size} selecionada{selected.size > 1 ? "s" : ""}</span>
          <button onClick={handleBulkPago} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
            <CheckCircle2 size={13} /> Marcar pagas
          </button>
          <button onClick={handleBulkDeleteWithUndo} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">
            <Trash2 size={13} /> Excluir
          </button>
          <button onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-white dark:hover:text-gray-900 text-lg leading-none">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAgrupar((v) => v === "" ? "dia" : v === "dia" ? "mes" : "")}
            title={agrupar === "" ? "Agrupar por dia" : agrupar === "dia" ? "Agrupar por mês" : "Sem agrupamento"}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${agrupar ? "border-green-500 text-green-600 dark:text-green-400" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            <Layers size={15} />
            <span className="hidden sm:inline">{agrupar === "dia" ? "Por dia" : agrupar === "mes" ? "Por mês" : "Agrupar"}</span>
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Download size={15} />
            <span className="hidden sm:inline">{exporting ? "Exportando..." : "CSV"}</span>
          </button>
          <Link href="/nova" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <PlusCircle size={16} /> Nova
          </Link>
        </div>
      </div>

      {/* Cards de totais */}
      {totais && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Vendas</p>
            <p className="text-base font-bold text-green-600 dark:text-green-400">{formatCurrency(totais.vendas)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Entradas</p>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totais.entradas)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Despesas</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400">{formatCurrency(totais.despesas)}</p>
          </div>
          <div className={`rounded-xl border p-4 ${totais.saldo >= 0 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/40" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40"}`}>
            <p className="text-xs text-gray-400 mb-1">Saldo</p>
            <p className={`text-base font-bold ${totais.saldo >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(totais.saldo)}</p>
          </div>
        </div>
      )}

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
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data início</label>
            <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data fim</label>
            <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {clientes.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente</label>
              <select value={clienteId} onChange={(e) => { setClienteId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todos</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}
          {fornecedores.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fornecedor</label>
              <select value={fornecedorId} onChange={(e) => { setFornecedorId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todos</option>
                {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          )}
          {hasFilters && (
            <div className="col-span-2 sm:col-span-1 flex sm:block">
              <button onClick={resetFilters} className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap sm:mt-5">
                Limpar filtros
              </button>
            </div>
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
            <div key={t.id} onClick={() => toggleSelect(t.id)}
              className={`bg-white dark:bg-gray-900 rounded-xl border p-4 cursor-pointer transition-colors ${selected.has(t.id) ? "border-green-500 dark:border-green-600" : "border-gray-200 dark:border-gray-800"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{t.descricao}</p>
                    {t.recorrente && <Repeat size={12} className="text-blue-400 shrink-0" />}
                    {t.comprovanteUrl && (
                      <a href={t.comprovanteUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Paperclip size={12} className="text-gray-400 hover:text-green-500 shrink-0" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-start gap-2 mt-0.5">
                    {t.fotoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.fotoUrl} alt={t.produto ?? "foto"} className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0" />
                    )}
                    <div>
                      {t.produto && <p className="text-xs text-gray-400">{t.produto}</p>}
                      {t.observacoes && <p className="text-xs text-gray-400 italic truncate">{t.observacoes}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>{tipoLabel[t.tipo]}</span>
                  <button onClick={() => setEditTransaction(t)} className="p-1 text-gray-400 hover:text-green-500 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDuplicate(t)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Copy size={14} /></button>
                  <button onClick={() => handleDeleteWithUndo(t.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-400">
                  {formatDate(t.data)}
                  {t.categoria && ` • ${t.categoria}`}
                  {t.formaPagamento && ` • ${t.formaPagamento}`}
                  {t.cliente && ` • ${t.cliente.nome}`}
                  {t.fornecedor && ` • ${t.fornecedor.nome}`}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {t.statusPagamento && <StatusBadge status={t.statusPagamento} onClick={() => handleTogglePago(t)} />}
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(t.valorTotal)}</p>
                </div>
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
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-green-500 transition-colors">
                    {selected.size === filtered.length && filtered.length > 0
                      ? <CheckSquare size={16} className="text-green-500" />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("descricao")} className="flex items-center hover:text-gray-700 dark:hover:text-gray-200">
                    Descrição <SortIcon col="descricao" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("tipo")} className="flex items-center hover:text-gray-700 dark:hover:text-gray-200">
                    Tipo <SortIcon col="tipo" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("data")} className="flex items-center hover:text-gray-700 dark:hover:text-gray-200">
                    Data <SortIcon col="data" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("valorTotal")} className="flex items-center ml-auto hover:text-gray-700 dark:hover:text-gray-200">
                    Valor <SortIcon col="valorTotal" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {agrupar ? (
                groupRows(filtered).flatMap(({ key, items }) => [
                  <tr key={`group-${key}`} className="bg-gray-50 dark:bg-gray-800/60">
                    <td colSpan={9} className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 capitalize">
                      {key}
                    </td>
                  </tr>,
                  ...items.map(renderRow),
                ])
              ) : (
                filtered.map(renderRow)
              )}
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
