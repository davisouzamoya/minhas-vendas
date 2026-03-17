"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
}

function FornecedorModal({ fornecedor, onSave, onCancel }: {
  fornecedor?: Fornecedor;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ nome: fornecedor?.nome ?? "", telefone: fornecedor?.telefone ?? "", email: fornecedor?.email ?? "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [selected, setSelected] = useState<Fornecedor | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/fornecedores");
    setFornecedores(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/fornecedores/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  return (
    <div>
      {(modal === "new" || modal === "edit") && (
        <FornecedorModal
          fornecedor={modal === "edit" ? selected ?? undefined : undefined}
          onSave={() => { setModal(null); load(); }}
          onCancel={() => setModal(null)}
        />
      )}
      {deleteId && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fornecedores</h1>
        <button onClick={() => setModal("new")} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Novo fornecedor
        </button>
      </div>

      {fornecedores.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center py-16 gap-3">
          <Building2 size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum fornecedor cadastrado ainda.</p>
          <button onClick={() => setModal("new")} className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            Adicionar primeiro fornecedor
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {fornecedores.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{f.nome}</p>
                <div className="flex items-center gap-3 mt-1">
                  {f.telefone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={11} />{f.telefone}</span>}
                  {f.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={11} />{f.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setSelected(f); setModal("edit"); }}
                  className="p-1.5 text-gray-400 hover:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteId(f.id)}
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
