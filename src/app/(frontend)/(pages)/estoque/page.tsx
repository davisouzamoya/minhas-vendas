"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  PackagePlus,
  Pencil,
  Trash2,
  AlertTriangle,
  ShoppingCart,
  Camera,
  Search,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/app/(backend)/lib/supabase/client";
import { PlanoGuard } from "@/app/(frontend)/components/PlanoGuard";

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  preco: number | null;
  precoCusto: number | null;
  estoque: number;
  estoqueMinimo: number | null;
  unidade: string | null;
  ativo: boolean;
  fotoUrl: string | null;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Máscara: converte dígitos digitados em R$ 1.000,00
function maskBRL(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Converte "1.000,00" → 1000
function parseBRL(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0;
}

const inputCls =
  "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all";
const selectCls =
  "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none";

const UNIDADES = ["unidade", "kg", "g", "litro", "ml", "caixa", "pacote", "metro", "par"];

const emptyForm = {
  nome: "",
  descricao: "",
  categoria: "",
  preco: "",
  precoCusto: "",
  estoque: "",
  estoqueMinimo: "",
  unidade: "unidade",
  ativo: true,
  fotoUrl: "",
};

function EstoqueContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState(qParam);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [produtoStats, setProdutoStats] = useState<Record<number, { totalVendido: number; receitaTotal: number } | null>>({});
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [categorias, setCategorias] = useState<string[]>([]);
  const [novaCat, setNovaCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  async function fetchProdutos() {
    setLoading(true);
    const res = await fetch(`/api/produtos${busca ? `?q=${encodeURIComponent(busca)}` : ""}`);
    if (res.ok) setProdutos(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchProdutos();
  }, [busca]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.ok ? r.json() : []).then(setCategorias);
  }, []);

  async function addCategoria() {
    const nome = novaCat.trim().toLowerCase();
    if (!nome) return;
    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) { setCategorias(await res.json()); setNovaCat(""); }
  }

  async function removeCategoria(nome: string) {
    const res = await fetch("/api/categorias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategorias(updated);
      if (form.categoria === nome) setForm((prev) => ({ ...prev, categoria: "" }));
    }
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setFotoPreview("");
    setShowForm(true);
  }

  function openEdit(p: Produto) {
    setEditId(p.id);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      categoria: p.categoria ?? "",
      preco: p.preco != null ? p.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
      precoCusto: p.precoCusto != null ? p.precoCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
      estoque: String(p.estoque),
      estoqueMinimo: p.estoqueMinimo != null ? String(p.estoqueMinimo) : "",
      unidade: p.unidade ?? "unidade",
      ativo: p.ativo,
      fotoUrl: p.fotoUrl ?? "",
    });
    setFotoPreview(p.fotoUrl ?? "");
    setShowForm(true);
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoPreview(URL.createObjectURL(file));
    setUploadingFoto(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("fotos").upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, fotoUrl: urlData.publicUrl }));
      setFotoPreview(urlData.publicUrl);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setFotoPreview(form.fotoUrl);
    } finally {
      setUploadingFoto(false);
    }
  }

  function removeFoto() {
    setFotoPreview("");
    setForm((prev) => ({ ...prev, fotoUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  async function handleSave() {
    if (!form.nome.trim()) return;
    // Verifica duplicata apenas no cadastro (não na edição)
    if (!editId) {
      const nomeLower = form.nome.trim().toLowerCase();
      const duplicado = produtos.some((p) => p.nome.toLowerCase() === nomeLower);
      if (duplicado) {
        showToast(`Produto "${form.nome.trim()}" já está cadastrado.`);
        return;
      }
    }
    setSaving(true);
    const body = {
      nome: form.nome.trim(),
      descricao: form.descricao || null,
      categoria: form.categoria || null,
      preco: form.preco !== "" ? parseBRL(form.preco) : null,
      precoCusto: form.precoCusto !== "" ? parseBRL(form.precoCusto) : null,
      estoque: form.estoque !== "" ? Number(form.estoque) : 0,
      estoqueMinimo: form.estoqueMinimo !== "" ? Number(form.estoqueMinimo) : null,
      unidade: form.unidade || null,
      ativo: form.ativo,
      fotoUrl: form.fotoUrl || null,
    };

    const url = editId ? `/api/produtos/${editId}` : "/api/produtos";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setShowForm(false);
      fetchProdutos();
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteId(null);
      fetchProdutos();
    }
  }

  async function fetchProdutoStats(produto: Produto) {
    if (produtoStats[produto.id] !== undefined) return;
    const res = await fetch(`/api/transactions?tipo=venda&produto=${encodeURIComponent(produto.nome)}&export=csv`);
    if (!res.ok) { setProdutoStats((prev) => ({ ...prev, [produto.id]: null })); return; }
    const data = await res.json();
    const transactions: { quantidade: number | null; valorTotal: number }[] = data.transactions ?? [];
    const totalVendido = transactions.reduce((sum, t) => sum + (t.quantidade ?? 0), 0);
    const receitaTotal = transactions.reduce((sum, t) => sum + t.valorTotal, 0);
    setProdutoStats((prev) => ({ ...prev, [produto.id]: { totalVendido, receitaTotal } }));
  }

  const baixoEstoque = produtos.filter(
    (p) => p.ativo && p.estoqueMinimo != null && p.estoque <= p.estoqueMinimo
  );
  const semEstoque = produtos.filter((p) => p.ativo && p.estoque === 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-2xl shadow-lg">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""} cadastrado{produtos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow transition-colors"
        >
          <PackagePlus size={16} />
          Novo Produto
        </button>
      </div>

      {/* Alertas */}
      {(baixoEstoque.length > 0 || semEstoque.length > 0) && (
        <div className="space-y-2">
          {semEstoque.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <span className="font-semibold">Sem estoque:</span>{" "}
                {semEstoque.map((p) => p.nome).join(", ")}
              </div>
            </div>
          )}
          {baixoEstoque.filter((p) => p.estoque > 0).length > 0 && (
            <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
              <div className="text-sm text-orange-700 dark:text-orange-400">
                <span className="font-semibold">Estoque baixo:</span>{" "}
                {baixoEstoque.filter((p) => p.estoque > 0).map((p) => `${p.nome} (${p.estoque} ${p.unidade ?? "un"})`).join(", ")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
        />
        {busca && (
          <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum produto cadastrado</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Clique em "Novo Produto" para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {produtos.map((p) => {
            const alerta = p.estoqueMinimo != null && p.estoque <= p.estoqueMinimo;
            const zerado = p.estoque === 0;
            const expanded = expandedId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all ${
                  zerado
                    ? "border-red-200 dark:border-red-800"
                    : alerta
                    ? "border-orange-200 dark:border-orange-800"
                    : "border-gray-100 dark:border-gray-800"
                }`}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => { setExpandedId(expanded ? null : p.id); if (!expanded) fetchProdutoStats(p); }}
                >
                  {/* Ícone de status */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    zerado ? "bg-red-100 dark:bg-red-900/30" :
                    alerta ? "bg-orange-100 dark:bg-orange-900/30" :
                    "bg-green-100 dark:bg-green-900/30"
                  }`}>
                    <Package size={16} className={
                      zerado ? "text-red-500" :
                      alerta ? "text-orange-500" :
                      "text-green-600 dark:text-green-400"
                    } />
                  </div>

                  {/* Nome e categoria */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{p.nome}</span>
                      {!p.ativo && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Inativo</span>
                      )}
                      {p.categoria && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{p.categoria}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {p.preco != null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(p.preco)}</span>
                      )}
                    </div>
                  </div>

                  {/* Estoque */}
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-bold leading-tight ${
                      zerado ? "text-red-500" :
                      alerta ? "text-orange-500" :
                      "text-gray-900 dark:text-white"
                    }`}>
                      {p.estoque}
                    </div>
                    <div className="text-xs text-gray-400">{p.unidade ?? "un"}</div>
                  </div>

                  <div className="text-gray-400 shrink-0">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-3">
                    {p.descricao && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{p.descricao}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {p.precoCusto != null && <span>Custo: {formatCurrency(p.precoCusto)}</span>}
                      {p.preco != null && p.precoCusto != null && (
                        <span>Margem: {(((p.preco - p.precoCusto) / p.precoCusto) * 100).toFixed(1)}%</span>
                      )}
                      {p.estoqueMinimo != null && (
                        <span>Mínimo: {p.estoqueMinimo} {p.unidade ?? "un"}</span>
                      )}
                    </div>

                    {/* Stats de vendas */}
                    {(() => {
                      const stats = produtoStats[p.id];
                      if (stats === undefined) return <p className="text-xs text-gray-400">Carregando...</p>;
                      if (stats === null) return null;
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl px-3 py-2">
                            <ShoppingCart size={14} className="text-green-600 dark:text-green-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-green-700 dark:text-green-400 font-semibold uppercase tracking-wide">Vendido</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.totalVendido} {p.unidade ?? "un"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-3 py-2">
                            <Package size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wide">Receita</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(stats.receitaTotal)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                      {(produtoStats[p.id]?.totalVendido ?? 0) > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-not-allowed" title="Produto com vendas não pode ser excluído">
                          <Trash2 size={13} />
                          Excluir indisponível
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          <Trash2 size={13} />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar / Editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {editId ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Nome *</label>
                <input
                  className={inputCls}
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Descrição</label>
                <input
                  className={inputCls}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Categoria</label>
                    <button type="button" onClick={() => setShowAddCat((v) => !v)} className="text-xs text-green-600 hover:underline">
                      {showAddCat ? "Fechar" : "+ Gerenciar"}
                    </button>
                  </div>
                  <select
                    className={selectCls}
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Unidade</label>
                  <select
                    className={selectCls}
                    value={form.unidade}
                    onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  >
                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {showAddCat && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={novaCat}
                      onChange={(e) => setNovaCat(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategoria())}
                      placeholder="Nova categoria..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    />
                    <button type="button" onClick={addCategoria}
                      className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {categorias.map((c) => (
                      <span key={c} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full">
                        {c}
                        <button type="button" onClick={() => removeCategoria(c)} className="text-gray-400 hover:text-red-500 transition-colors leading-none">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Preço de Venda</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">R$</span>
                    <input
                      className={`${inputCls} pl-9`}
                      type="text"
                      inputMode="numeric"
                      value={form.preco}
                      onChange={(e) => setForm({ ...form, preco: maskBRL(e.target.value) })}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Preço de Custo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">R$</span>
                    <input
                      className={`${inputCls} pl-9`}
                      type="text"
                      inputMode="numeric"
                      value={form.precoCusto}
                      onChange={(e) => setForm({ ...form, precoCusto: maskBRL(e.target.value) })}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Estoque Atual</label>
                  <input
                    className={inputCls}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={form.estoque}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Estoque Mínimo</label>
                  <input
                    className={inputCls}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={form.estoqueMinimo}
                    onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
                    placeholder="Alerta abaixo de..."
                  />
                </div>
              </div>

              {/* Foto do produto */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Foto do Produto</label>
                <div className="flex items-center gap-4">
                  {fotoPreview ? (
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fotoPreview} alt="Foto" className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                      {uploadingFoto && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!uploadingFoto && (
                        <button type="button" onClick={removeFoto} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFoto}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-green-500 hover:text-green-600 transition-colors shrink-0"
                    >
                      <Camera size={20} />
                      <span className="text-[10px] font-medium">Foto</span>
                    </button>
                  )}
                  <p className="text-xs text-gray-400">JPG, PNG ou WEBP</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setForm({ ...form, ativo: !form.ativo })}
                className="flex items-center gap-3 w-full"
              >
                <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.ativo ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.ativo ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Produto ativo</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !form.nome.trim()}
                className="w-full bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {success ? (
                  <><CheckCircle size={16} /> Salvo!</>
                ) : saving ? "Salvando..." : editId ? "Salvar Alterações" : "Cadastrar Produto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar exclusão */}
      {deleteId != null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Excluir produto?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EstoquePage() {
  return (
    <PlanoGuard feature="estoque">
      <Suspense>
        <EstoqueContent />
      </Suspense>
    </PlanoGuard>
  );
}
