"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2, Phone, Mail, History } from "lucide-react";

interface Transaction {
  id: number;
  tipo: string;
  descricao: string;
  valorTotal: number;
  data: string;
}

const tipoCor: Record<string, string> = {
  venda: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  despesa: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  entrada: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  saida: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

const tipoLabel: Record<string, string> = {
  venda: "Venda", despesa: "Despesa", entrada: "Entrada", saida: "Saída",
};

function formatCurrency(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("pt-BR"); }

function HistoricoModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transactions?clienteId=${cliente.id}&limit=100`)
      .then((r) => r.ok ? r.json() : { transactions: [] })
      .then((d) => { setTransacoes(d.transactions); setLoading(false); });
  }, [cliente.id]);

  const total = transacoes.reduce((s, t) => s + t.valorTotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Histórico — {cliente.nome}</h2>
            {!loading && <p className="text-xs text-gray-400 mt-0.5">{transacoes.length} transações • {formatCurrency(total)}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="text-sm text-gray-400 p-5">Carregando...</p>
          ) : transacoes.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">Nenhuma transação vinculada a este cliente.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {transacoes.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.descricao}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.data)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>{tipoLabel[t.tipo]}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(t.valorTotal)}</span>
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

interface Cliente {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
}

function ClienteModal({ cliente, onSave, onCancel }: {
  cliente?: Cliente;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ nome: cliente?.nome ?? "", telefone: cliente?.telefone ?? "", email: cliente?.email ?? "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = cliente ? `/api/clientes/${cliente.id}` : "/api/clientes";
    await fetch(url, {
      method: cliente ? "PUT" : "POST",
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
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{cliente ? "Editar cliente" : "Novo cliente"}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
            <input type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
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
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Excluir cliente</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">Excluir</button>
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(null);

  async function load() {
    const res = await fetch("/api/clientes");
    if (!res.ok) return;
    setClientes(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/clientes/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  return (
    <div>
      {(modal === "new" || modal === "edit") && (
        <ClienteModal
          cliente={modal === "edit" ? selected ?? undefined : undefined}
          onSave={() => { setModal(null); load(); }}
          onCancel={() => setModal(null)}
        />
      )}
      {deleteId && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {historicoCliente && <HistoricoModal cliente={historicoCliente} onClose={() => setHistoricoCliente(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <button onClick={() => setModal("new")} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center py-16 gap-3">
          <Users size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum cliente cadastrado ainda.</p>
          <button onClick={() => setModal("new")} className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            Adicionar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {clientes.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{c.nome}</p>
                <div className="flex items-center gap-3 mt-1">
                  {c.telefone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={11} />{c.telefone}</span>}
                  {c.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={11} />{c.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setHistoricoCliente(c)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Ver histórico">
                  <History size={14} />
                </button>
                <button onClick={() => { setSelected(c); setModal("edit"); }}
                  className="p-1.5 text-gray-400 hover:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteId(c.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
