"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const TIPOS = ["venda", "despesa", "entrada", "saida"] as const;
const CATEGORIAS = ["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"];
const PAGAMENTOS = ["pix", "dinheiro", "cartao", "boleto", "transferencia"];

type Tipo = (typeof TIPOS)[number];

interface Cliente { id: number; nome: string; }
interface Fornecedor { id: number; nome: string; }

export default function NovaTransacao() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const [form, setForm] = useState({
    tipo: "venda" as Tipo,
    descricao: "",
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
  });

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.ok ? r.json() : []).then(setClientes);
    fetch("/api/fornecedores").then((r) => r.ok ? r.json() : []).then(setFornecedores);
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantidade" || field === "valor_unitario") {
        const qty = parseFloat(field === "quantidade" ? value : prev.quantidade) || 0;
        const unit = parseFloat(field === "valor_unitario" ? value : prev.valor_unitario) || 0;
        if (qty > 0 && unit > 0) next.valor_total = (qty * unit).toFixed(2);
      }
      // Limpa campos ao trocar tipo
      if (field === "tipo") {
        next.clienteId = "";
        next.fornecedorId = "";
        next.statusPagamento = "";
        next.recorrente = false;
      }
      return next;
    });
  }

  const usaCliente = form.tipo === "venda" || form.tipo === "entrada";
  const usaFornecedor = form.tipo === "despesa" || form.tipo === "saida";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao || !form.valor_total) return;

    setLoading(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
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
        recorrente: form.recorrente,
        meses: form.recorrente ? form.meses : 1,
      }),
    });
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/transacoes"), 1500);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <CheckCircle size={56} className="text-green-500" />
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">Transação registrada!</p>
        <p className="text-sm text-gray-400">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nova Transação</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
          <div className="grid grid-cols-4 gap-2">
            {TIPOS.map((t) => (
              <button key={t} type="button" onClick={() => set("tipo", t)}
                className={`py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                  form.tipo === t ? "bg-green-600 border-green-600 text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400"
                }`}>
                {t === "saida" ? "Saída" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Cliente (venda/entrada) */}
        {usaCliente && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
              {clientes.length === 0 && (
                <Link href="/clientes" className="text-xs text-green-600 hover:underline">
                  + Cadastrar cliente
                </Link>
              )}
            </div>
            {clientes.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Nenhum cliente cadastrado. <Link href="/clientes" className="text-green-600 hover:underline">Clique aqui para cadastrar.</Link></p>
            ) : (
              <select value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Sem cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Fornecedor (despesa/saida) */}
        {usaFornecedor && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor</label>
              {fornecedores.length === 0 && (
                <Link href="/fornecedores" className="text-xs text-green-600 hover:underline">
                  + Cadastrar fornecedor
                </Link>
              )}
            </div>
            {fornecedores.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Nenhum fornecedor cadastrado. <Link href="/fornecedores" className="text-green-600 hover:underline">Clique aqui para cadastrar.</Link></p>
            ) : (
              <select value={form.fornecedorId} onChange={(e) => set("fornecedorId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Sem fornecedor</option>
                {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
          <input type="text" value={form.descricao} onChange={(e) => set("descricao", e.target.value)}
            placeholder="Ex: Venda de camisetas" required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        {/* Produto + Categoria */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
            <input type="text" value={form.produto} onChange={(e) => set("produto", e.target.value)}
              placeholder="Ex: Camiseta"
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

        {/* Quantidade + Valor unitário + Total */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
            <input type="number" value={form.quantidade} onChange={(e) => set("quantidade", e.target.value)}
              placeholder="0" min="0" step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário</label>
            <input type="number" value={form.valor_unitario} onChange={(e) => set("valor_unitario", e.target.value)}
              placeholder="0,00" min="0" step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total *</label>
            <input type="number" value={form.valor_total} onChange={(e) => set("valor_total", e.target.value)}
              placeholder="0,00" min="0" step="0.01" required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {/* Status de pagamento (só para vendas) */}
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
              <label htmlFor="recorrente" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Despesa recorrente (repete mensalmente)
              </label>
            </div>
            {form.recorrente && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repetir por quantos meses?</label>
                <input
                  type="number"
                  value={form.meses}
                  onChange={(e) => setForm((prev) => ({ ...prev, meses: Math.min(24, Math.max(2, parseInt(e.target.value) || 2)) }))}
                  min={2} max={24}
                  className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Serão criadas {form.meses} transações (hoje + próximos {form.meses - 1} meses)</p>
              </div>
            )}
          </div>
        )}

        {/* Pagamento + Data */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pagamento</label>
            <select value={form.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Não informado</option>
              {PAGAMENTOS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Pagamento *</label>
            <input type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2}
            placeholder="Notas adicionais..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        {/* Comprovante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprovante (URL)</label>
          <input type="url" value={form.comprovanteUrl} onChange={(e) => setForm({ ...form, comprovanteUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <p className="text-xs text-gray-400 mt-1">Cole a URL do comprovante (imagem, PDF, etc.)</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
          {loading ? "Salvando..." : "Salvar Transação"}
        </button>
      </form>
    </div>
  );
}
