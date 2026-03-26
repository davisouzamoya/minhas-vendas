"use client";

import { useEffect, useState, Suspense } from "react";
import { Building2, Plus, Pencil, Trash2, Phone, Mail, History, TrendingDown, ShoppingBag, Calendar, Search } from "lucide-react";

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
}

interface Transaction {
  id: number;
  tipo: string;
  descricao: string;
  produto: string | null;
  categoria: string | null;
  valorTotal: number;
  data: string;
}

const tipoCor: Record<string, string> = {
  venda: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  despesa: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  entrada: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  saida: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};
const tipoLabel: Record<string, string> = { venda: "Venda", despesa: "Despesa", entrada: "Entrada", saida: "Saída" };

function formatCurrency(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("pt-BR"); }

function HistoricoModal({ fornecedor, onClose }: { fornecedor: Fornecedor; onClose: () => void }) {
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transactions?fornecedorId=${fornecedor.id}&limit=200`)
      .then((r) => r.ok ? r.json() : { transactions: [] })
      .then((d) => { setTransacoes(d.transactions ?? []); setLoading(false); });
  }, [fornecedor.id]);

  const totalGasto = transacoes.reduce((s, t) => s + t.valorTotal, 0);
  const ticketMedio = transacoes.length > 0 ? totalGasto / transacoes.length : 0;
  const ultimaCompra = transacoes.length > 0 ? transacoes[0].data : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Histórico — {fornecedor.nome}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
        </div>
        {!loading && (
          <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <div className="flex justify-center mb-1"><TrendingDown size={16} className="text-red-500" /></div>
              <p className="text-xs text-gray-400">Total gasto</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(totalGasto)}</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1"><ShoppingBag size={16} className="text-blue-500" /></div>
              <p className="text-xs text-gray-400">Pedidos</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{transacoes.length}</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1"><Calendar size={16} className="text-purple-500" /></div>
              <p className="text-xs text-gray-400">Ticket médio</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(ticketMedio)}</p>
            </div>
          </div>
        )}
        {ultimaCompra && (
          <p className="text-xs text-gray-400 px-5 pt-3">
            Última compra: <span className="text-gray-600 dark:text-gray-300 font-medium">{formatDate(ultimaCompra)}</span>
          </p>
        )}
        <div className="overflow-y-auto flex-1 mt-2">
          {loading ? (
            <p className="text-sm text-gray-400 p-5">Carregando...</p>
          ) : transacoes.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">Nenhuma transação vinculada a este fornecedor.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {transacoes.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.produto ?? t.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(t.data)}
                      {t.categoria && ` • ${t.categoria}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>{tipoLabel[t.tipo]}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">{formatCurrency(t.valorTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FornecedorModal({ fornecedor, onSave, onCancel }: {
  fornecedor?: Fornecedor;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ nome: fornecedor?.nome ?? "", telefone: fornecedor?.telefone ?? "", email: fornecedor?.email ?? "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const url = fornecedor ? `/api/fornecedores/${fornecedor.id}` : "/api/fornecedores";
    await fetch(url, {
      method: fornecedor ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: form.nome, telefone: form.telefone || null, email: form.email || null }),
    });
    setSaving(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fornecedor ? "Editar fornecedor" : "Novo fornecedor"}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular</label>
            <input type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })}
              placeholder="(11) 99999-9999" inputMode="numeric"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-3 justify-end pt-1">
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

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Excluir fornecedor</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">Excluir</button>
        </div>
      </div>
    </div>
  );
}

function FornecedoresContent() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [selected, setSelected] = useState<Fornecedor | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [historicoFornecedor, setHistoricoFornecedor] = useState<Fornecedor | null>(null);
  const [busca, setBusca] = useState("");

  async function load() {
    const res = await fetch("/api/fornecedores");
    if (!res.ok) return;
    setFornecedores(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/fornecedores/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  const q = busca.toLowerCase();
  const filtrados = q
    ? fornecedores.filter((f) =>
        f.nome.toLowerCase().includes(q) ||
        (f.telefone ?? "").includes(q) ||
        (f.email ?? "").toLowerCase().includes(q)
      )
    : fornecedores;

  if (loading) return (
    <div className="space-y-8 animate-pulse pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>
        <div className="flex gap-3 flex-1 sm:justify-end">
          <div className="h-11 w-full sm:w-48 bg-gray-100 dark:bg-gray-800 rounded-full" />
          <div className="h-11 w-40 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
        </div>
      </div>
      {/* Stat card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 w-full flex items-center gap-4" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
        <div className="space-y-2">
          <div className="h-3 w-10 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 space-y-4" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="flex gap-1">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            </div>
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pb-8">
      {(modal === "new" || modal === "edit") && (
        <FornecedorModal
          fornecedor={modal === "edit" ? selected ?? undefined : undefined}
          onSave={() => { setModal(null); load(); }}
          onCancel={() => setModal(null)}
        />
      )}
      {deleteId && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {historicoFornecedor && <HistoricoModal fornecedor={historicoFornecedor} onClose={() => setHistoricoFornecedor(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div className="shrink-0">
          <h1 className="font-extrabold text-gray-900 dark:text-white tracking-tight">Gestão de Fornecedores</h1>
          <p className="text-gray-400 mt-1.5">Gerencie quem ajuda o seu negócio a crescer.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 sm:justify-end">
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar fornecedor..."
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>
          <button
            onClick={() => setModal("new")}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full transition-colors shadow-sm shadow-green-600/20"
          >
            <div className="relative">
              <Building2 size={16} />
              <Plus size={9} className="absolute -top-1 -right-1.5 stroke-[3]" />
            </div>
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Stat */}
      {fornecedores.length > 0 && (
        <div className="mb-8">
          <div
            className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 w-full"
            style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
          >
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-full">
              <Building2 size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filtrados.length} {filtrados.length === 1 ? "ativo" : "ativos"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {fornecedores.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 gap-3 cursor-pointer hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors"
          style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
          onClick={() => setModal("new")}
        >
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
            <Plus size={28} />
          </div>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Nenhum fornecedor ainda</p>
          <p className="text-sm text-gray-400">Clique para cadastrar o primeiro</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrados.map((f) => (
            <div
              key={f.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:-translate-y-1 transition-all duration-300"
              style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
            >
              {/* Card top */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Building2 size={22} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setHistoricoFornecedor(f)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Histórico"
                  >
                    <History size={16} />
                  </button>
                  <button
                    onClick={() => { setSelected(f); setModal("edit"); }}
                    className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(f.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Nome */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{f.nome}</h3>

              {/* Contato */}
              <div className="space-y-2">
                {f.telefone && (
                  <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                    <Phone size={14} />
                    <span className="text-sm">{f.telefone}</span>
                  </div>
                )}
                {f.email && (
                  <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                    <Mail size={14} />
                    <span className="text-sm truncate">{f.email}</span>
                  </div>
                )}
                {!f.telefone && !f.email && (
                  <p className="text-sm text-gray-300 dark:text-gray-600 italic">Sem contato cadastrado</p>
                )}
              </div>
            </div>
          ))}

          {/* Card "Adicionar novo" */}
          <div
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all cursor-pointer"
            style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
            onClick={() => setModal("new")}
          >
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-110">
              <Plus size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">Adicionar Novo</p>
            <p className="text-sm text-gray-400 mt-1">Cadastre um fornecedor em segundos</p>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setModal("new")}
          className="group w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95"
          title="Adicionar fornecedor"
        >
          <div className="relative">
            <Building2 size={20} />
            <Plus size={11} className="absolute -top-1 -right-1.5 stroke-[3]" />
          </div>
          <span className="absolute right-full mr-3 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Adicionar Fornecedor
          </span>
        </button>
      </div>
    </div>
  );
}

export default function Fornecedores() {
  return (
    <Suspense>
      <FornecedoresContent />
    </Suspense>
  );
}
