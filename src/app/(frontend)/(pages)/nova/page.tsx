"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  X,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  TrendingUp,
  TrendingDown,
  Camera,
  Link2,
} from "lucide-react";
import { createClient } from "@/app/(backend)/lib/supabase/client";

const TIPOS = ["venda", "despesa", "entrada", "saida"] as const;
const DEFAULT_CATEGORIAS = ["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"];
const PAGAMENTOS = ["pix", "dinheiro", "cartao", "boleto", "transferencia"];
const DRAFT_KEY = "nova_transacao_rascunho";

type Tipo = (typeof TIPOS)[number];

interface Cliente { id: number; nome: string; }
interface Fornecedor { id: number; nome: string; }

const TIPO_CONFIG = {
  venda:   { label: "Venda",   icon: ShoppingCart, filled: true },
  despesa: { label: "Despesa", icon: Receipt,       filled: false },
  entrada: { label: "Entrada", icon: TrendingUp,    filled: false },
  saida:   { label: "Saída",   icon: TrendingDown,  filled: false },
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
  fotoUrl: "",
  recorrente: false,
  meses: 3,
};

const inputCls =
  "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all";
const selectCls =
  "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none";

export default function NovaVenda() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [divida, setDivida] = useState<{ total: number; count: number } | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [categorias, setCategorias] = useState<string[]>(DEFAULT_CATEGORIAS);
  const [novaCat, setNovaCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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
    fetch("/api/clientes").then((r) => r.ok ? r.json() : []).then(setClientes);
    fetch("/api/fornecedores").then((r) => r.ok ? r.json() : []).then(setFornecedores);
    fetch("/api/categorias").then((r) => r.ok ? r.json() : DEFAULT_CATEGORIAS).then(setCategorias);
  }, []);

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
      if (form.categoria === nome) set("categoria", "");
    }
  }

  useEffect(() => {
    if (form.produto || form.valor_total || form.observacoes || form.fotoUrl) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }
  }, [form]);

  function restoreDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm({ ...defaultForm, ...parsed });
        if (parsed.fotoUrl) setFotoPreview(parsed.fotoUrl);
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
        const unit = parseFloat(field === "valor_unitario" ? value : prev.valor_unitario) || 0;
        if (qty > 0 && unit > 0) next.valor_total = (qty * unit).toFixed(2);
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

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setFotoPreview(localUrl);
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
      console.error("Erro ao fazer upload da foto:", err);
      setFotoPreview("");
      setForm((prev) => ({ ...prev, fotoUrl: "" }));
    } finally {
      setUploadingFoto(false);
    }
  }

  function removeFoto() {
    setFotoPreview("");
    setForm((prev) => ({ ...prev, fotoUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const usaCliente = form.tipo === "venda" || form.tipo === "entrada";
  const usaFornecedor = form.tipo === "despesa" || form.tipo === "saida";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.valor_total) return;
    setLoading(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        descricao: form.produto || form.tipo,
        quantidade: form.quantidade ? parseFloat(form.quantidade) : null,
        valor_unitario: form.valor_unitario ? parseFloat(form.valor_unitario) : null,
        valor_total: parseFloat(form.valor_total),
        produto: form.produto || null,
        categoria: form.categoria || null,
        forma_pagamento: form.forma_pagamento || null,
        clienteId: form.clienteId ? parseInt(form.clienteId) : null,
        fornecedorId: form.fornecedorId ? parseInt(form.fornecedorId) : null,
        statusPagamento: form.statusPagamento || null,
        observacoes: form.observacoes || null,
        comprovanteUrl: form.comprovanteUrl || null,
        fotoUrl: form.fotoUrl || null,
        recorrente: form.recorrente,
        meses: form.recorrente ? form.meses : 1,
      }),
    });
    setLoading(false);
    if (res.ok) {
      localStorage.removeItem(DRAFT_KEY);
      setSuccess(true);
      setTimeout(() => router.push("/transacoes"), 1500);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <CheckCircle size={56} className="text-green-500" />
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">Venda registrada!</p>
        <p className="text-sm text-gray-400">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">

      {/* Draft restore banner */}
      {hasDraft && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">
            Você tem um rascunho salvo. Deseja restaurar?
          </p>
          <div className="flex gap-2">
            <button onClick={restoreDraft}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
              Restaurar
            </button>
            <button onClick={discardDraft}
              className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:underline">
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Type Selector — Bento cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {TIPOS.map((t) => {
          const cfg = TIPO_CONFIG[t];
          const Icon = cfg.icon;
          const active = form.tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => set("tipo", t)}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                active
                  ? "border-green-600 bg-white dark:bg-gray-900 shadow-sm scale-105"
                  : "border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon
                size={28}
                className={active ? "text-green-600" : "text-gray-400"}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={`text-sm font-bold ${active ? "text-green-600" : "text-gray-500"}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section: Informações Gerais */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 space-y-5" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
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
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Produto / Serviço</label>
              <input
                type="text"
                value={form.produto}
                onChange={(e) => set("produto", e.target.value)}
                placeholder="O que você vendeu?"
                className={inputCls}
              />
            </div>
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
          </div>

          {showAddCat && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex gap-2">
                <input
                  value={novaCat}
                  onChange={(e) => setNovaCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategoria())}
                  placeholder="Nova categoria..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
                <button type="button" onClick={addCategoria}
                  className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {categorias.map((c) => (
                  <span key={c} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full">
                    {c}
                    <button type="button" onClick={() => removeCategoria(c)} className="text-gray-400 hover:text-red-500 transition-colors leading-none">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section: Valores + Foto (bento row) */}
        <div className="grid grid-cols-3 gap-6">

          {/* Valores e Quantidade (2/3) */}
          <div className="col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 space-y-5" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
            <h3 className="text-base font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
              <Receipt size={18} />
              Valores e Quantidade
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Quantidade</label>
                <input
                  type="number"
                  value={form.quantidade}
                  onChange={(e) => set("quantidade", e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className={inputCls + " text-center font-bold"}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Valor Unitário</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                  <input
                    type="number"
                    value={form.valor_unitario}
                    onChange={(e) => set("valor_unitario", e.target.value)}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    className={inputCls + " pl-9 font-bold"}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Valor Total *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 text-xs font-extrabold">R$</span>
                  <input
                    type="number"
                    value={form.valor_total}
                    onChange={(e) => set("valor_total", e.target.value)}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    required
                    className="w-full pl-9 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-extrabold text-green-700 dark:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Status (venda only) — toggle buttons */}
            {form.tipo === "venda" && (
              <div className="grid grid-cols-2 gap-4">
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

          {/* Foto do produto (1/3) */}
          <div
            className="bg-white dark:bg-gray-900 p-6 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center"
            style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}
          >
            {fotoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoPreview}
                  alt="Foto do produto"
                  className="w-28 h-28 object-cover rounded-2xl border border-gray-200"
                />
                {uploadingFoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!uploadingFoto && (
                  <button
                    type="button"
                    onClick={removeFoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="flex flex-col items-center gap-4 w-full group"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors">
                  <Camera size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">Foto do Produto</p>
                  <p className="text-xs text-gray-400 mt-1">Clique para selecionar</p>
                </div>
                <span className="text-xs text-green-600 font-bold underline">Selecionar arquivo</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
            {!fotoPreview && (
              <p className="text-[10px] text-gray-300">JPG, PNG, WEBP (máx. 5MB)</p>
            )}
          </div>
        </div>

        {/* Section: Detalhes Adicionais */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8" style={{ borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" }}>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Data da Venda *</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => set("data", e.target.value)}
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
                className={inputCls + " resize-none h-full min-h-[120px]"}
              />
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="flex items-center justify-end gap-6 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 font-bold hover:text-red-500 transition-colors px-6"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || uploadingFoto}
            className="bg-green-600 hover:bg-green-700 text-white py-4 px-12 rounded-full font-extrabold text-base flex items-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? "Salvando..." : uploadingFoto ? "Aguardando upload..." : "Salvar Venda"}
            {!loading && !uploadingFoto && <CheckCircle size={20} />}
          </button>
        </div>

      </form>
    </div>
  );
}
