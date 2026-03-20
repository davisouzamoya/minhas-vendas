"use client";

import { useEffect, useState } from "react";
import { Users, Pencil, Trash2, Phone, Mail, History, Cake, TrendingUp, ShoppingBag, Calendar, UserPlus, MessageCircle } from "lucide-react";

interface Transaction {
  id: number;
  tipo: string;
  descricao: string;
  produto: string | null;
  categoria: string | null;
  valorTotal: number;
  statusPagamento: string | null;
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
function formatDateBr(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getInitials(nome: string) {
  const parts = nome.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function aniversarioProximo(aniversario: string | null): { label: string; dias: number } | null {
  if (!aniversario) return null;
  const hoje = new Date();
  const aniv = new Date(aniversario);
  const proxAniv = new Date(hoje.getFullYear(), aniv.getMonth(), aniv.getDate());
  if (proxAniv < hoje) proxAniv.setFullYear(proxAniv.getFullYear() + 1);
  const dias = Math.round((proxAniv.getTime() - hoje.getTime()) / 86400000);
  if (dias > 30) return null;
  if (dias === 0) return { label: "Hoje!", dias: 0 };
  if (dias === 1) return { label: "Amanhã", dias: 1 };
  return { label: `em ${dias} dias`, dias };
}

function HistoricoModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transactions?clienteId=${cliente.id}&limit=200`)
      .then((r) => r.ok ? r.json() : { transactions: [] })
      .then((d) => { setTransacoes(d.transactions ?? []); setLoading(false); });
  }, [cliente.id]);

  const vendas = transacoes.filter((t) => t.tipo === "venda" || t.tipo === "entrada");
  const totalGasto = vendas.reduce((s, t) => s + t.valorTotal, 0);
  const ticketMedio = vendas.length > 0 ? totalGasto / vendas.length : 0;
  const ultimaCompra = vendas.length > 0 ? vendas[0].data : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Histórico — {cliente.nome}</h2>
            {cliente.aniversario && (
              <p className="text-xs text-pink-500 flex items-center gap-1 mt-0.5">
                <Cake size={11} /> Aniversário: {formatDateBr(cliente.aniversario)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
        </div>
        {!loading && (
          <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <div className="flex justify-center mb-1"><TrendingUp size={16} className="text-green-500" /></div>
              <p className="text-xs text-gray-400">Total comprado</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(totalGasto)}</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1"><ShoppingBag size={16} className="text-blue-500" /></div>
              <p className="text-xs text-gray-400">Pedidos</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{vendas.length}</p>
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
            <p className="text-sm text-gray-400 p-5">Nenhuma transação vinculada a este cliente.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {transacoes.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.produto ?? t.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(t.data)}
                      {t.categoria && ` • ${t.categoria}`}
                      {t.statusPagamento && ` • ${t.statusPagamento}`}
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

interface Cliente {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  aniversario: string | null;
}

function ClienteModal({ cliente, onSave, onCancel }: {
  cliente?: Cliente;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    nome: cliente?.nome ?? "",
    telefone: cliente?.telefone ?? "",
    email: cliente?.email ?? "",
    aniversario: cliente?.aniversario ? cliente.aniversario.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = cliente ? `/api/clientes/${cliente.id}` : "/api/clientes";
    await fetch(url, {
      method: cliente ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome,
        telefone: form.telefone || null,
        email: form.email || null,
        aniversario: form.aniversario || null,
      }),
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1.5"><Cake size={13} /> Aniversário</span>
            </label>
            <input type="date" value={form.aniversario} onChange={(e) => setForm({ ...form, aniversario: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p className="text-xs text-gray-400 mt-1">Você receberá um aviso no dashboard 7 dias antes</p>
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

function ClienteCard({ c, onEdit, onHistorico }: { c: Cliente; onEdit: () => void; onHistorico: () => void }) {
  const anivInfo = aniversarioProximo(c.aniversario);
  const isAnivHoje = anivInfo?.dias === 0;
  const isAnivProximo = anivInfo !== null;

  return (
    <div
      className={`bg-white dark:bg-gray-900 p-5 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300 border ${
        isAnivHoje
          ? "border-l-4 border-cyan-400 dark:border-cyan-500 border-t border-r border-b border-gray-200 dark:border-gray-800"
          : "border-gray-200 dark:border-gray-800"
      }`}
      style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-base">
          {getInitials(c.nome)}
        </div>
        {isAnivProximo && (
          <span className="absolute -top-1 -right-1 bg-cyan-500 text-white w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            <Cake size={11} />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{c.nome}</h3>
          {isAnivHoje && (
            <span className="text-[10px] bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full font-bold uppercase">
              Aniversário Hoje
            </span>
          )}
          {isAnivProximo && !isAnivHoje && (
            <span className="text-[10px] bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full font-medium">
              {anivInfo.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {c.telefone && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Phone size={11} /> {c.telefone}
            </span>
          )}
          {c.email && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Mail size={11} /> {c.email}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        {c.telefone && (
          <a
            href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 bg-[#25D366]/10 text-[#075E54] dark:text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        )}
        <button
          onClick={onHistorico}
          className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Ver histórico"
        >
          <History size={16} />
        </button>
        <button
          onClick={onEdit}
          className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Editar"
        >
          <Pencil size={16} />
        </button>
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
  const [busca, setBusca] = useState("");

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

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? "").includes(busca)
  );

  // Clientes com aniversário próximo aparecem primeiro nos cards
  const comAniv = filtrados.filter((c) => aniversarioProximo(c.aniversario) !== null);
  const semAniv = filtrados.filter((c) => aniversarioProximo(c.aniversario) === null);
  const cardClientes = [...comAniv, ...semAniv].slice(0, 4);
  const tabelaClientes = filtrados;

  return (
    <div className="pb-24">
      {(modal === "new" || modal === "edit") && (
        <ClienteModal
          cliente={modal === "edit" ? selected ?? undefined : undefined}
          onSave={() => { setModal(null); load(); }}
          onCancel={() => setModal(null)}
        />
      )}
      {deleteId && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {historicoCliente && <HistoricoModal cliente={historicoCliente} onClose={() => setHistoricoCliente(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Clientes</h1>
          {clientes.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Você possui <span className="text-green-600 dark:text-green-400 font-semibold">{clientes.length} clientes</span> na sua base.
            </p>
          )}
        </div>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full transition-colors shadow-sm shadow-green-600/20"
        >
          <UserPlus size={16} /> Novo Cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center py-16 gap-3">
          <Users size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum cliente cadastrado ainda.</p>
          <button onClick={() => setModal("new")} className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            Adicionar primeiro cliente
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mt-4 mb-6">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full sm:w-80 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>

          {/* Cards grid — top 4 (priorizando aniversariantes) */}
          {cardClientes.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
              {cardClientes.map((c) => (
                <ClienteCard
                  key={c.id}
                  c={c}
                  onEdit={() => { setSelected(c); setModal("edit"); }}
                  onHistorico={() => setHistoricoCliente(c)}
                />
              ))}
            </div>
          )}

          {/* Tabela completa */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Lista completa</h2>
              <span className="text-xs text-gray-400">{filtrados.length} clientes</span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Contato</th>
                    <th className="px-4 py-3 hidden md:table-cell">Aniversário</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-800">
                  {tabelaClientes.map((c) => {
                    const anivInfo = aniversarioProximo(c.aniversario);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 text-[11px] font-bold shrink-0">
                              {getInitials(c.nome)}
                            </div>
                            {c.nome}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-400 hidden sm:table-cell">
                          {c.telefone ?? c.email ?? "—"}
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          {c.aniversario ? (
                            <span className={`inline-flex items-center gap-1 text-xs ${anivInfo ? "text-cyan-600 dark:text-cyan-400 font-semibold" : "text-gray-400"}`}>
                              <Cake size={11} />
                              {formatDateBr(c.aniversario)}
                              {anivInfo && ` — ${anivInfo.label}`}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {c.telefone && (
                              <a
                                href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-[#075E54] dark:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </a>
                            )}
                            <button onClick={() => setHistoricoCliente(c)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Histórico">
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
                        </td>
                      </tr>
                    );
                  })}
                  {tabelaClientes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-sm text-gray-400 text-center">Nenhum cliente encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setModal("new")}
          className="group w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95"
          title="Adicionar cliente"
        >
          <UserPlus size={22} />
          <span className="absolute right-full mr-3 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Adicionar Cliente
          </span>
        </button>
      </div>
    </div>
  );
}
