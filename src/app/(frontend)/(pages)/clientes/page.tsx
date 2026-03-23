"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Pencil, Trash2, Phone, Mail, History, Cake, TrendingUp, ShoppingBag, Calendar, UserPlus, MessageCircle, AlertCircle, UserX, ChevronLeft, ChevronRight } from "lucide-react";

interface Cliente {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  aniversario: string | null;
  createdAt: string;
  lastPurchaseDate: string | null;
  lastPurchaseAmount: number | null;
  daysSinceLastPurchase: number | null;
  pendingAmount: number;
  isNew: boolean;
}

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

interface Stats { totalClientes: number; emDebito: number; inativos: number; aniversariantes: number; }

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
function formatDateTime(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
    " às " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

function inativaLabel(days: number | null): { label: string; badge: string; badgeClass: string; subtext: string } {
  if (days === null) return { label: "Sem compras", badge: "Sem dados", badgeClass: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400", subtext: "Nenhuma compra ainda" };
  if (days < 30) return { label: "Ativo", badge: "Ativo", badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", subtext: days === 0 ? "Visitou hoje" : days === 1 ? "Visitou ontem" : `Visitou há ${days} dias` };
  if (days < 60) return { label: "Inativo", badge: "Inativo", badgeClass: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", subtext: `Visitou há ${days} dias` };
  return { label: "Ressaca", badge: "Ressaca", badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", subtext: `Sem compras há ${days} dias` };
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

const PER_PAGE = 10;
type Tab = "todos" | "devedores" | "novos" | "inativos";

function ClientesContent() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [stats, setStats] = useState<Stats>({ totalClientes: 0, emDebito: 0, inativos: 0, aniversariantes: 0 });
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(null);
  const [tab, setTab] = useState<Tab>("todos");
  const [ordenar, setOrdenar] = useState("recentes");
  const [pagina, setPagina] = useState(1);
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("q") ?? "");
  const onboarding = searchParams.get("onboarding") === "1";
  const router = useRouter();

  useEffect(() => { setBusca(searchParams.get("q") ?? ""); }, [searchParams]);

  async function load() {
    const res = await fetch("/api/clientes");
    if (!res.ok) return;
    setClientes(await res.json());
    fetch("/api/clientes/stats").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setStats(d); });
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { setPagina(1); }, [tab, busca, ordenar]);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/clientes/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  // Filtro por busca
  const porBusca = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? "").includes(busca)
  );

  // Filtro por tab
  const porTab = porBusca.filter((c) => {
    if (tab === "devedores") return c.pendingAmount > 0;
    if (tab === "novos") return c.isNew;
    if (tab === "inativos") return (c.daysSinceLastPurchase ?? 999) >= 60;
    return true;
  });

  // Ordenação
  const ordenados = [...porTab].sort((a, b) => {
    if (ordenar === "nome-az") return a.nome.localeCompare(b.nome, "pt-BR");
    if (ordenar === "nome-za") return b.nome.localeCompare(a.nome, "pt-BR");
    if (ordenar === "aniversario") {
      const da = aniversarioProximo(a.aniversario)?.dias ?? 999;
      const db = aniversarioProximo(b.aniversario)?.dias ?? 999;
      return da - db;
    }
    // recentes: last purchase date desc
    const dateA = a.lastPurchaseDate ? new Date(a.lastPurchaseDate).getTime() : 0;
    const dateB = b.lastPurchaseDate ? new Date(b.lastPurchaseDate).getTime() : 0;
    return dateB - dateA;
  });

  // Paginação
  const totalPages = Math.max(1, Math.ceil(ordenados.length / PER_PAGE));
  const paginaAtual = Math.min(pagina, totalPages);
  const inicio = (paginaAtual - 1) * PER_PAGE;
  const paginados = ordenados.slice(inicio, inicio + PER_PAGE);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "todos", label: "Todos", count: porBusca.length },
    { key: "devedores", label: "Devedores", count: stats.emDebito },
    { key: "novos", label: "Novos" },
    { key: "inativos", label: "Inativos", count: stats.inativos },
  ];

  return (
    <div className="pb-24">
      {(modal === "new" || modal === "edit") && (
        <ClienteModal
          cliente={modal === "edit" ? selected ?? undefined : undefined}
          onSave={() => {
            setModal(null);
            load();
            if (modal === "new" && onboarding) router.push("/dashboard");
          }}
          onCancel={() => setModal(null)}
        />
      )}
      {deleteId && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {historicoCliente && <HistoricoModal cliente={historicoCliente} onClose={() => setHistoricoCliente(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gestão de Clientes</h1>
          <p className="text-base text-gray-400 mt-1.5">Cadastre e acompanhe seus clientes aqui.</p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full transition-colors shadow-sm shadow-green-600/20"
        >
          <UserPlus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-0.5">Total de Clientes</p>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{stats.totalClientes}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <AlertCircle size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-0.5">Em Débito</p>
            <p className="text-2xl font-extrabold text-orange-500">{stats.emDebito}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
            <UserX size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-0.5">Inativos</p>
            <p className="text-2xl font-extrabold text-gray-500 dark:text-gray-400">{stats.inativos}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
          <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
            <Cake size={18} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest mb-0.5">Aniversariantes</p>
            <p className="text-2xl font-extrabold text-cyan-500">{stats.aniversariantes}</p>
          </div>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center py-16 gap-3">
          <Users size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum cliente cadastrado ainda.</p>
          <button onClick={() => setModal("new")} className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            Adicionar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Tabs + Ordenar por */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-1">
              {tabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                    tab === key
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {count}
                    </span>
                  )}
                  {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-t-full" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs text-gray-400 hidden sm:block">Ordenar por:</span>
              <select
                value={ordenar}
                onChange={(e) => setOrdenar(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="recentes">Mais recentes</option>
                <option value="nome-az">Nome (A–Z)</option>
                <option value="nome-za">Nome (Z–A)</option>
                <option value="aniversario">Aniversário próximo</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 700 }}>
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-4 py-3">Inatividade</th>
                  <th className="px-4 py-3">Status Financeiro</th>
                  <th className="px-4 py-3">Última Compra</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginados.map((c) => {
                  const anivInfo = aniversarioProximo(c.aniversario);
                  const inativ = inativaLabel(c.daysSinceLastPurchase);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 text-sm font-bold shrink-0">
                            {getInitials(c.nome)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{c.nome}</p>
                            {anivInfo?.dias === 0 ? (
                              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                                <Cake size={11} /> Faz aniversário hoje! 🎂
                              </p>
                            ) : c.aniversario ? (
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Cake size={11} /> Aniversário: {formatDateBr(c.aniversario)}
                                {anivInfo && <span className="text-cyan-500 font-medium"> ({anivInfo.label})</span>}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                {c.telefone && <><Phone size={11} /> {c.telefone}</>}
                                {!c.telefone && c.email && <><Mail size={11} /> {c.email}</>}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Inatividade */}
                      <td className="px-4 py-4">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg mb-1 ${inativ.badgeClass}`}>
                          {inativ.badge}
                        </span>
                        <p className="text-[11px] text-gray-400">{inativ.subtext}</p>
                      </td>

                      {/* Status Financeiro */}
                      <td className="px-4 py-4">
                        {c.pendingAmount > 0 ? (
                          <>
                            <p className="text-sm font-bold text-orange-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                              {formatCurrency(c.pendingAmount)} (Atrasado)
                            </p>
                            <p className="text-[11px] text-gray-400">Pagamento pendente</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                              Em dia
                            </p>
                            <p className="text-[11px] text-gray-400">Sem pendências</p>
                          </>
                        )}
                      </td>

                      {/* Última Compra */}
                      <td className="px-4 py-4">
                        {c.lastPurchaseDate ? (
                          <>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(c.lastPurchaseAmount ?? 0)}</p>
                            <p className="text-[11px] text-gray-400">{formatDateTime(c.lastPurchaseDate)}</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400">—</p>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {c.telefone && (
                            <a href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                              className="p-1.5 text-[#075E54] dark:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors" title="WhatsApp">
                              <MessageCircle size={15} />
                            </a>
                          )}
                          <button onClick={() => setHistoricoCliente(c)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Histórico">
                            <History size={15} />
                          </button>
                          <button onClick={() => { setSelected(c); setModal("edit"); }}
                            className="p-1.5 text-gray-400 hover:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteId(c.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-sm text-gray-400 text-center">Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400">
                Exibindo {inicio + 1}–{Math.min(inicio + PER_PAGE, ordenados.length)} de {ordenados.length} clientes
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPagina(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${paginaAtual === p ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-gray-400 px-1">...</span>}
                {totalPages > 5 && (
                  <button onClick={() => setPagina(totalPages)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${paginaAtual === totalPages ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                    {totalPages}
                  </button>
                )}
                <button onClick={() => setPagina((p) => Math.min(totalPages, p + 1))} disabled={paginaAtual === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={() => setModal("new")}
          className="group w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95"
          title="Adicionar cliente">
          <UserPlus size={22} />
          <span className="absolute right-full mr-3 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Adicionar Cliente
          </span>
        </button>
      </div>
    </div>
  );
}

export default function Clientes() {
  return (
    <Suspense fallback={null}>
      <ClientesContent />
    </Suspense>
  );
}
