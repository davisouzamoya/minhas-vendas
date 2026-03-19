"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ShieldCheck, User, CheckCircle2 } from "lucide-react";

interface Usuario {
  userId: string;
  nomeNegocio: string;
  role: string;
  updatedAt: string;
  transacoes: number;
  ultimaAtividade: string | null;
  clientes: number;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function AdminSuporte() {
  const [q, setQ] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [alterando, setAlterando] = useState<string | null>(null);

  const load = useCallback(async (search = "") => {
    setLoading(true);
    const res = await fetch(`/api/admin/usuarios?q=${encodeURIComponent(search)}`);
    if (res.ok) setUsuarios(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(q), 400);
    return () => clearTimeout(t);
  }, [q, load]);

  async function alterarRole(userId: string, role: string) {
    setAlterando(userId);
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    await load(q);
    setAlterando(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Suporte</h1>
        <p className="text-sm text-gray-400">Busque e gerencie usuários da plataforma.</p>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome do negócio..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Lista */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-gray-500 p-6">Nenhum usuário encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Negócio</th>
                <th className="text-center px-4 py-3">Role</th>
                <th className="text-right px-4 py-3">Transações</th>
                <th className="text-right px-4 py-3">Clientes</th>
                <th className="text-right px-4 py-3">Última atividade</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {usuarios.map((u) => (
                <tr key={u.userId} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                        {u.role === "admin"
                          ? <ShieldCheck size={14} className="text-green-400" />
                          : <User size={14} className="text-gray-400" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-100">{u.nomeNegocio}</p>
                        <p className="text-xs text-gray-600">{u.userId.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === "admin"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-gray-800 text-gray-400"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{u.transacoes}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{u.clientes}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{formatDate(u.ultimaAtividade)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role === "admin" ? (
                      <button
                        onClick={() => alterarRole(u.userId, "user")}
                        disabled={alterando === u.userId}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {alterando === u.userId ? "…" : "Remover admin"}
                      </button>
                    ) : (
                      <button
                        onClick={() => alterarRole(u.userId, "admin")}
                        disabled={alterando === u.userId}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:bg-green-900/40 hover:text-green-400 transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle2 size={11} />
                        {alterando === u.userId ? "…" : "Tornar admin"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-600 mt-3">{usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""} encontrado{usuarios.length !== 1 ? "s" : ""}.</p>
    </div>
  );
}
