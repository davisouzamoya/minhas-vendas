"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/app/(backend)/lib/supabase/client";

export default function ResetarSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);

    if (error) { setErro("Não foi possível redefinir a senha. Tente novamente."); return; }
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
          <TrendingUp size={22} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">VendaPro</span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Nova senha</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Digite sua nova senha abaixo.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
            <div className="relative">
              <input type={mostrar ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white" />
              <button type="button" onClick={() => setMostrar(!mostrar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar senha</label>
            <input type={mostrar ? "text" : "password"} value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••" required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white" />
          </div>

          {erro && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{erro}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
