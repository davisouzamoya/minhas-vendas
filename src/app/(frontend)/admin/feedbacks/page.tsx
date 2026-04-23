"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Bug, Heart, MessageSquarePlus, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PER_PAGE = 10;

interface FeedbackItem {
  id: number;
  userId: string;
  nomeNegocio: string;
  tipo: "melhoria" | "bug" | "elogio";
  titulo: string;
  mensagem: string;
  createdAt: string;
}

const TIPO_CONFIG = {
  melhoria: { label: "Melhoria", icon: Lightbulb, color: "text-blue-400", bg: "bg-blue-900/20", border: "border-blue-800/50" },
  bug: { label: "Bug", icon: Bug, color: "text-red-400", bg: "bg-red-900/20", border: "border-red-800/50" },
  elogio: { label: "Elogio", icon: Heart, color: "text-pink-400", bg: "bg-pink-900/20", border: "border-pink-800/50" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "melhoria" | "bug" | "elogio">("todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    fetch("/api/admin/feedbacks")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setFeedbacks(d); setLoading(false); });
  }, []);

  // Reseta página ao mudar filtro ou busca
  useEffect(() => { setPagina(1); }, [filtro, busca]);

  const counts = {
    todos: feedbacks.length,
    melhoria: feedbacks.filter((f) => f.tipo === "melhoria").length,
    bug: feedbacks.filter((f) => f.tipo === "bug").length,
    elogio: feedbacks.filter((f) => f.tipo === "elogio").length,
  };

  const filtered = feedbacks.filter((f) => {
    if (filtro !== "todos" && f.tipo !== filtro) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      return f.titulo.toLowerCase().includes(q) || f.mensagem.toLowerCase().includes(q) || f.nomeNegocio.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginados = filtered.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Feedbacks</h1>
        <p className="text-sm text-gray-400">Sugestões, bugs e elogios enviados pelos usuários.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["todos", "melhoria", "bug", "elogio"] as const).map((tipo) => {
          const cfg = tipo === "todos" ? null : TIPO_CONFIG[tipo];
          return (
            <button
              key={tipo}
              onClick={() => setFiltro(tipo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filtro === tipo
                  ? cfg
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-gray-200"
              }`}
            >
              {cfg && <cfg.icon size={12} />}
              {tipo === "todos" ? "Todos" : cfg!.label}
              <span className="ml-0.5 opacity-60">{counts[tipo]}</span>
            </button>
          );
        })}

        {/* Busca */}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-600 w-48"
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
          <MessageSquarePlus size={32} />
          <p className="text-sm">Nenhum feedback encontrado</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginados.map((f) => {
              const cfg = TIPO_CONFIG[f.tipo];
              return (
                <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <cfg.icon size={15} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-500">{f.nomeNegocio}</span>
                        <span className="text-xs text-gray-600 ml-auto">{formatDate(f.createdAt)}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-100 mb-1">{f.titulo}</p>
                      <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{f.mensagem}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-gray-500">
                {(pagina - 1) * PER_PAGE + 1}–{Math.min(pagina * PER_PAGE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina((p) => p - 1)}
                  disabled={pagina === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      p === pagina
                        ? "bg-green-900/40 text-green-400"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina === totalPaginas}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
