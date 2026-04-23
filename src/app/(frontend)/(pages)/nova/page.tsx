"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DateInput } from "@/app/(frontend)/components/DateInput";
import {
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Link2,
} from "lucide-react";

function maskBRL(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRL(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0;
}

const TIPOS = ["venda", "despesa"] as const;
const DEFAULT_CATEGORIAS = ["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"];
const PAGAMENTOS = ["pix", "dinheiro", "cartao", "boleto", "transferencia"];
const DRAFT_KEY = "nova_transacao_rascunho";

type Tipo = (typeof TIPOS)[number];

interface Cliente { id: number; nome: string; }
interface Fornecedor { id: number; nome: string; }

const TIPO_CONFIG = {
  venda:   { label: "Venda",   icon: ShoppingCart },
  despesa: { label: "Despesa", icon: Receipt },
};

const defaultForm = {
  tipo: "venda" as Tipo,
  produto: "",
  categoria: "",
  quantidade: "",
  valor_unitario: "",
  valor_total: "",
  forma_pagamento: "",
  data: new Date().toISOString().split("T")[0],
  clienteId: "",
  fornecedorId: "",
  statusPagamento: "",
  observacoes: "",
  comprovanteUrl: "",
  recorrente: false,
  meses: 3,
};

const inputCls =
  "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all";
const selectCls =
  "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none";

type ProdutoEstoque = { id: number; nome: string; preco: number | null; categoria: string | null; estoque: number | null };

const NOVA_TTL = 60_000;
const novaCache = {
  clientes:     null as { data: Cliente[]; at: number } | null,
  fornecedores: null as { data: Fornecedor[]; at: number } | null,
  categorias:   null as { data: string[]; at: number } | null,
  produtos:     null as { data: ProdutoEstoque[]; at: number } | null,
};

function NovaVendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [divida, setDivida] = useState<{ total: number; count: number } | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>(() => novaCache.clientes?.data ?? []);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() => novaCache.fornecedores?.data ?? []);
  const [hasDraft, setHasDraft] = useState(false);
  const [ultimaCompra, setUltimaCompra] = useState<null | { produto: string | null; categoria: string | null; valor_total: string; forma_pagamento: string; clienteId: string }>(null);
  const [categorias, setCategorias] = useState<string[]>(() => novaCache.categorias?.data ?? DEFAULT_CATEGORIAS);
  const [novaCat, setNovaCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [produtosEstoque, setProdutosEstoque] = useState<ProdutoEstoque[]>(() => novaCache.produtos?.data ?? []);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [form, setForm] = useState(defaultForm);

  // On mount: check for saved draft
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.produto || parsed.valor_total || parsed.observacoes) {
          setHasDraft(true);
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const now = Date.now();

    const onFetchError = (e: unknown) => {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(true);
    };

    if (!novaCache.clientes || now - novaCache.clientes.at >= NOVA_TTL)
      fetch("/api/clientes", { signal }).then((r) => r.ok ? r.json() : []).then((d) => { novaCache.clientes = { data: d, at: Date.now() }; setClientes(d); }).catch(onFetchError);
    if (!novaCache.fornecedores || now - novaCache.fornecedores.at >= NOVA_TTL)
      fetch("/api/fornecedores", { signal }).then((r) => r.ok ? r.json() : []).then((d) => { novaCache.fornecedores = { data: d, at: Date.now() }; setFornecedores(d); }).catch(onFetchError);
    if (!novaCache.categorias || now - novaCache.categorias.at >= NOVA_TTL)
      fetch("/api/categorias", { signal }).then((r) => r.ok ? r.json() : DEFAULT_CATEGORIAS).then((d) => { novaCache.categorias = { data: d, at: Date.now() }; setCategorias(d); }).catch(onFetchError);
    if (!novaCache.produtos || now - novaCache.produtos.at >= NOVA_TTL)
      fetch("/api/produtos?ativos=1", { signal }).then((r) => r.ok ? r.json() : []).then((d) => { novaCache.produtos = { data: d, at: Date.now() }; setProdutosEstoque(d); }).catch(onFetchError);

    const clienteIdParam = searchParams.get("clienteId");
    if (clienteIdParam) {
      setForm((prev) => ({ ...prev, clienteId: clienteIdParam }));
      fetch(`/api/transactions?clienteId=${clienteIdParam}&limit=1`, { signal })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          const t = d?.transactions?.[0];
          if (t && (t.produto || t.valorTotal) && String(t.clienteId) === clienteIdParam) {
            setUltimaCompra({
              produto: t.produto ?? null,
              categoria: t.categoria ?? null,
              valor_total: String(t.valorTotal),
              forma_pagamento: t.formaPagamento ?? "",
              clienteId: clienteIdParam,
            });
          }
        })
        .catch(onFetchError);
    }

    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    if (!form.clienteId || form.tipo !== "venda") { setDivida(null); return; }
    fetch(`/api/clientes/${form.clienteId}/divida`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setDivida(d?.count > 0 ? d : null));
  }, [form.clienteId, form.tipo]);

  async function addCategoria() {
    const nome = novaCat.trim().toLowerCase();
    if (!nome) return;
    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) { const updated = await res.json(); novaCache.categorias = { data: updated, at: Date.now() }; setCategorias(updated); setNovaCat(""); }
  }

  async function removeCategoria(nome: string) {
    const res = await fetch("/api/categorias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      const updated = await res.json();
      novaCache.categorias = { data: updated, at: Date.now() };
      setCategorias(updated);
      if (form.categoria === nome) set("categoria", "");
    }
  }

  useEffect(() => {
    if (form.produto || form.valor_total || form.observacoes) {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* storage indisponível */ }
    }
  }, [form]);

  function restoreDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm({ ...defaultForm, ...parsed });
      } catch { /* ignore */ }
    }
    setHasDraft(false);
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantidade" || field === "valor_unitario") {
        const qty = parseFloat(field === "quantidade" ? value : prev.quantidade) || 0;
        const unit = field === "valor_unitario" ? parseBRL(value) : parseBRL(prev.valor_unitario);
        if (qty > 0 && unit > 0) next.valor_total = maskBRL(String(Math.round(qty * unit * 100)));
      }
      if (field === "tipo") {
        next.clienteId = "";
        next.fornecedorId = "";
        next.statusPagamento = "";
        next.recorrente = false;
      }
      return next;
    });
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const usaCliente = form.tipo === "venda";
  const usaFornecedor = form.tipo === "despesa";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valorTotal = parseBRL(form.valor_total);
    if (!valorTotal || valorTotal <= 0) {
      showToast("Valor total inválido. Digite um valor maior que zero.");
      return;
    }
    const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(form.data) && !isNaN(Date.parse(form.data));
    if (!dataValida) {
      showToast("Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }
    setLoading(true);
    let res: Response;
    try {
      res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        descricao: form.produto || form.tipo,
        quantidade: form.quantidade ? parseFloat(form.quantidade) : null,
        valor_unitario: form.valor_unitario ? parseBRL(form.valor_unitario) : null,
        valor_total: valorTotal,
        produto: form.produto || null,
        categoria: form.categoria || null,
        forma_pagamento: form.forma_pagamento || null,
        clienteId: form.clienteId ? parseInt(form.clienteId) : null,
        fornecedorId: form.fornecedorId ? parseInt(form.fornecedorId) : null,
        statusPagamento: form.statusPagamento || null,
        observacoes: form.observacoes || null,
        comprovanteUrl: form.comprovanteUrl || null,
        fotoUrl: null,
        recorrente: form.recorrente,
        meses: form.recorrente ? form.meses : 1,
      }),
    });
    } catch {
      setLoading(false);
      showToast("Erro de conexão. Tente novamente.");
      return;
    }
    setLoading(false);
    if (res.ok) {
      novaCache.produtos = null;
      localStorage.removeItem(DRAFT_KEY);
      setSuccess(true);
      setTimeout(() => router.push(onboarding ? "/clientes?onboarding=1" : "/transacoes"), 1500);
    } else {
      showToast("Erro ao salvar. Tente novamente.");
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle size={40} className="text-red-400" />
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Erro ao carregar dados</p>
        <button
          onClick={() => { setError(false); setRetryKey((k) => k + 1); }}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-bounce">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle size={44} className="text-green-500" />
          </div>
        </div>
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{form.tipo === "despesa" ? "Despesa registrada!" : "Venda registrada!"}</p>
        <p className="text-sm text-gray-400">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-2xl shadow-lg animate-fade-in">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          {toastMsg}
        </div>
      )}

      {/* Última compra do cliente */}
      {ultimaCompra && !hasDraft && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            Restaurar dados da última compra deste cliente?
            {ultimaCompra.produto && <span className="ml-1 text-blue-600 dark:text-blue-400">({ultimaCompra.produto})</span>}
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  produto: ultimaCompra.produto ?? "",
                  categoria: ultimaCompra.categoria ?? "",
                  valor_total: ultimaCompra.valor_total,
                  forma_pagamento: ultimaCompra.forma_pagamento,
                }));
                setUltimaCompra(null);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Restaurar
            </button>
            <button onClick={() => setUltimaCompra(null)} className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">
              Ignorar
            </button>
          </div>
        </div>
      )}


      {/* Type Selector — Bento cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        {TIPOS.map((t) => {
          const cfg = TIPO_CONFIG[t];
          const Icon = cfg.icon;
          const active = form.tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => set("tipo", t)}
              className={`flex flex-col items-center gap-1.5 sm:gap-3 p-4 sm:p-8 rounded-xl border-2 transition-all ${
                active
                  ? "border-green-600 bg-white dark:bg-gray-900 shadow-sm scale-105"
                  : "border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon
                size={22}
                className={active ? "text-green-600" : "text-gray-400"}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={`text-xs sm:text-sm font-bold ${active ? "text-green-600" : "text-gray-500"}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section: Informações Gerais */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-8 space-y-5" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
          <h3 className="text-base font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
            <ShoppingCart size={18} />
            Informações Gerais
          </h3>

          {/* Cliente */}
          {usaCliente && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Cliente</label>
                {clientes.length === 0 && (
                  <Link href="/clientes" className="text-xs text-green-600 hover:underline">
                    + Cadastrar cliente
                  </Link>
                )}
              </div>
              {clientes.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  Nenhum cliente cadastrado.{" "}
                  <Link href="/clientes" className="text-green-600 hover:underline">Clique aqui para cadastrar.</Link>
                </p>
              ) : (
                <select value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)} className={selectCls}>
                  <option value="">Sem cliente</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              )}
              {divida && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl mt-2">
                  <AlertTriangle size={15} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-800">
                    Este cliente possui{" "}
                    <span className="font-semibold">{divida.count} venda{divida.count !== 1 ? "s" : ""} pendente{divida.count !== 1 ? "s" : ""}</span>{" "}
                    no valor de{" "}
                    <span className="font-semibold">{divida.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>.{" "}
                    <Link href="/relatorios" className="underline hover:text-orange-600">Ver inadimplência</Link>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fornecedor */}
          {usaFornecedor && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Fornecedor</label>
                {fornecedores.length === 0 && (
                  <Link href="/fornecedores" className="text-xs text-green-600 hover:underline">
                    + Cadastrar fornecedor
                  </Link>
                )}
              </div>
              {fornecedores.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  Nenhum fornecedor cadastrado.{" "}
                  <Link href="/fornecedores" className="text-green-600 hover:underline">Clique aqui para cadastrar.</Link>
                </p>
              ) : (
                <select value={form.fornecedorId} onChange={(e) => set("fornecedorId", e.target.value)} className={selectCls}>
                  <option value="">Sem fornecedor</option>
                  {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Categoria</label>
                <button type="button" onClick={() => setShowAddCat((v) => !v)} className="text-xs text-green-600 hover:underline">
                  {showAddCat ? "Fechar" : "+ Gerenciar"}
                </button>
              </div>
              <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className={selectCls}>
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Produto / Serviço</label>
              {(() => {
                const opcoes = produtosEstoque.filter(
                  (p) => form.categoria && p.categoria === form.categoria
                );
                if (!form.categoria) {
                  return (
                    <div className="flex items-center gap-2 px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-400">
                      Selecione uma categoria primeiro
                    </div>
                  );
                }
                if (opcoes.length === 0) {
                  return (
                    <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-400">
                      Nenhum produto nesta categoria.{" "}
                      <Link href="/estoque" className="text-green-600 hover:underline font-medium whitespace-nowrap ml-1">
                        Cadastrar produto
                      </Link>
                    </div>
                  );
                }
                const produtoSelecionado = opcoes.find((p) => p.nome === form.produto);
                return (
                  <>
                    <select
                      value={form.produto}
                      onChange={(e) => {
                        const selecionado = opcoes.find((p) => p.nome === e.target.value);
                        set("produto", e.target.value);
                        if (selecionado?.preco) set("valor_unitario", maskBRL(String(Math.round(selecionado.preco * 100))));
                      }}
                      className={selectCls}
                    >
                      <option value="">Selecione um produto</option>
                      {opcoes.map((p) => (
                        <option key={p.id} value={p.nome}>{p.nome}</option>
                      ))}
                    </select>
                  </>
                );
              })()}
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
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
                <button type="button" onClick={addCategoria}
                  className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {categorias.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-full">
                    {c}
                    <button type="button" onClick={() => removeCategoria(c)} className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors text-sm leading-none">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section: Valores e Quantidade */}
        <div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-8 space-y-5" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
            <h3 className="text-base font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
              <Receipt size={18} />
              Valores e Quantidade
            </h3>

            {(() => {
              const prodSel = produtosEstoque.find((p) => p.nome === form.produto);
              const estoqueMax = prodSel?.estoque ?? null;
              const qtdAtual = parseFloat(form.quantidade) || 0;
              const acimaDaEstoque = estoqueMax !== null && qtdAtual > estoqueMax;
              return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Quantidade</label>
                <input
                  type="number"
                  value={form.quantidade}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (estoqueMax !== null && parseFloat(val) > estoqueMax) {
                      showToast(`Quantidade indisponível. Em estoque: ${estoqueMax} unid.`);
                      set("quantidade", String(estoqueMax));
                    } else {
                      set("quantidade", val);
                    }
                  }}
                  placeholder="0"
                  min="0"
                  max={estoqueMax !== null ? estoqueMax : undefined}
                  step="0.01"
                  className={inputCls}
                />
                {estoqueMax !== null && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium ml-1 mt-1">
                    Em estoque: {estoqueMax} unid.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Valor Unitário</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.valor_unitario}
                    onChange={(e) => set("valor_unitario", maskBRL(e.target.value))}
                    placeholder="0,00"
                    className={inputCls + " pl-9 font-bold"}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Valor Total *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.valor_total}
                    onChange={(e) => set("valor_total", maskBRL(e.target.value))}
                    placeholder="0,00"
                    required
                    className={inputCls + " pl-9 font-bold"}
                  />
                </div>
              </div>
            </div>
              );
            })()}

            {/* Status (venda only) — toggle buttons */}
            {form.tipo === "venda" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Status do Pagamento</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => set("statusPagamento", "pago")}
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                        form.statusPagamento === "pago"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Recebido
                    </button>
                    <button
                      type="button"
                      onClick={() => set("statusPagamento", "pendente")}
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                        form.statusPagamento === "pendente"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Pendente
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Forma de Pagamento</label>
                  <select value={form.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)} className={selectCls}>
                    <option value="">Não informado</option>
                    {PAGAMENTOS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Forma de pagamento (non-venda types) */}
            {form.tipo !== "venda" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)} className={selectCls}>
                  <option value="">Não informado</option>
                  {PAGAMENTOS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Recorrência (despesa/saida) */}
            {usaFornecedor && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="recorrente"
                    checked={form.recorrente}
                    onChange={(e) => setForm((prev) => ({ ...prev, recorrente: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="recorrente" className="text-sm font-medium text-gray-600">
                    Despesa recorrente (repete mensalmente)
                  </label>
                </div>
                {form.recorrente && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1 block mb-1">Repetir por quantos meses?</label>
                    <input
                      type="number"
                      value={form.meses}
                      onChange={(e) => setForm((prev) => ({ ...prev, meses: Math.min(24, Math.max(2, parseInt(e.target.value) || 2)) }))}
                      min={2}
                      max={24}
                      className={inputCls + " w-28"}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Serão criadas {form.meses} vendas (hoje + próximos {form.meses - 1} meses)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Section: Detalhes Adicionais */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-8" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Data da Venda *</label>
                <DateInput
                  value={form.data}
                  onChange={(v) => set("data", v)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Comprovante (URL)</label>
                <div className="relative">
                  <Link2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={form.comprovanteUrl}
                    onChange={(e) => setForm({ ...form, comprovanteUrl: e.target.value })}
                    placeholder="https://..."
                    className={inputCls + " pl-10"}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={5}
                placeholder="Algum detalhe importante sobre essa venda?"
                className={inputCls + " resize-none min-h-[120px]"}
              />
            </div>
          </div>
        </div>

        {/* Resumo antes de enviar */}
        {parseBRL(form.valor_total) > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {form.tipo === "despesa" ? "Despesa" : "Venda"}{form.produto ? `: ${form.produto}` : ""}
            </span>
            <span className="font-bold text-green-700 dark:text-green-400 text-sm">
              {parseBRL(form.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            {form.forma_pagamento && <span>Pagamento: <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{form.forma_pagamento}</span></span>}
            {form.tipo === "venda" && form.statusPagamento && (
              <span className={`font-semibold ${form.statusPagamento === "pago" ? "text-green-600" : "text-amber-500"}`}>
                {form.statusPagamento === "pago" ? "Recebido" : "Pendente"}
              </span>
            )}
            {form.clienteId && clientes.find((c) => String(c.id) === form.clienteId) && (
              <span>Cliente: <span className="font-medium text-gray-800 dark:text-gray-200">{clientes.find((c) => String(c.id) === form.clienteId)!.nome}</span></span>
            )}
            {form.fornecedorId && fornecedores.find((f) => String(f.id) === form.fornecedorId) && (
              <span>Fornecedor: <span className="font-medium text-gray-800 dark:text-gray-200">{fornecedores.find((f) => String(f.id) === form.fornecedorId)!.nome}</span></span>
            )}
          </div>
        )}

        {/* Action footer */}
        <div className="flex items-center justify-end gap-3 sm:gap-6 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 font-bold hover:text-red-500 transition-colors px-4"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 sm:py-4 sm:px-12 rounded-full font-extrabold text-sm sm:text-base flex items-center gap-2 sm:gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? "Salvando..." : form.tipo === "despesa" ? "Salvar Despesa" : "Salvar Venda"}
            {!loading && <CheckCircle size={20} />}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function NovaVenda() {
  return (
    <Suspense fallback={null}>
      <NovaVendaContent />
    </Suspense>
  );
}
