"use client";

import { useEffect, useState } from "react";

interface Summary {
  vendas: number;
  despesas: number;
  entradas: number;
  saidas: number;
}

interface Transaction {
  id: number;
  tipo: string;
  descricao: string;
  produto: string | null;
  categoria: string | null;
  valorTotal: number;
  formaPagamento: string | null;
  data: string;
}

interface DashboardData {
  summary: Summary;
  saldo: number;
  recentes: Transaction[];
}

const tipoLabel: Record<string, string> = {
  venda: "Venda",
  despesa: "Despesa",
  entrada: "Entrada",
  saida: "Saída",
};

const tipoCor: Record<string, string> = {
  venda: "bg-green-100 text-green-800",
  despesa: "bg-red-100 text-red-800",
  entrada: "bg-blue-100 text-blue-800",
  saida: "bg-orange-100 text-orange-800",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleEnviar() {
    if (!mensagem.trim()) return;
    setLoading(true);
    setFeedback("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem, salvar: true }),
      });
      const json = await res.json();
      if (res.ok) {
        setFeedback(`Registrado: ${json.parsed.descricao}`);
        setMensagem("");
        loadDashboard();
      } else {
        setFeedback("Erro ao processar mensagem.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Minhas Vendas</h1>

        {/* Cards de resumo */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Vendas</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.vendas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Despesas</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(data.summary.despesas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Entradas</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(data.summary.entradas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-xl font-bold ${data.saldo >= 0 ? "text-green-700" : "text-red-700"}`}>
                {formatCurrency(data.saldo)}
              </p>
            </div>
          </div>
        )}

        {/* Input de mensagem */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Registrar via mensagem</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
              placeholder='Ex: "vendi 3 camisetas por 40 no pix"'
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleEnviar}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "..." : "Enviar"}
            </button>
          </div>
          {feedback && <p className="text-sm text-gray-600 mt-2">{feedback}</p>}
        </div>

        {/* Transações recentes */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Transações Recentes</h2>
          {data?.recentes.length === 0 && (
            <p className="text-sm text-gray-400">Nenhuma transação ainda.</p>
          )}
          <div className="space-y-3">
            {data?.recentes.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.descricao}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(t.data)}
                    {t.categoria && ` • ${t.categoria}`}
                    {t.formaPagamento && ` • ${t.formaPagamento}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoCor[t.tipo]}`}>
                    {tipoLabel[t.tipo]}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{formatCurrency(t.valorTotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
