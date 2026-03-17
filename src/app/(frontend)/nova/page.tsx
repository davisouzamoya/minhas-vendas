"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const TIPOS = ["venda", "despesa", "entrada", "saida"] as const;
const CATEGORIAS = ["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"];
const PAGAMENTOS = ["pix", "dinheiro", "cartao", "boleto", "transferencia"];

type Tipo = (typeof TIPOS)[number];

export default function NovaTransacao() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
  });

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Calcular valor total automaticamente
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
      }),
    });
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/transacoes");
      }, 1500);
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
              <button
                key={t}
                type="button"
                onClick={() => set("tipo", t)}
                className={`py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                  form.tipo === t
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400"
                }`}
              >
                {t === "saida" ? "Saída" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            placeholder="Ex: Venda de camisetas"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Produto + Categoria */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
            <input
              type="text"
              value={form.produto}
              onChange={(e) => set("produto", e.target.value)}
              placeholder="Ex: Camiseta"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => set("categoria", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sem categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantidade + Valor unitário + Total */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
            <input
              type="number"
              value={form.quantidade}
              onChange={(e) => set("quantidade", e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário</label>
            <input
              type="number"
              value={form.valor_unitario}
              onChange={(e) => set("valor_unitario", e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total *</label>
            <input
              type="number"
              value={form.valor_total}
              onChange={(e) => set("valor_total", e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Pagamento + Data */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pagamento</label>
            <select
              value={form.forma_pagamento}
              onChange={(e) => set("forma_pagamento", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Não informado</option>
              {PAGAMENTOS.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => set("data", e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Transação"}
        </button>
      </form>
    </div>
  );
}
