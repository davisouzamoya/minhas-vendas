"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { createClient } from "@/app/(backend)/lib/supabase/client";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetar-senha`,
    });

    setLoading(false);
    if (error) { setErro("Não foi possível enviar o e-mail. Verifique o endereço."); return; }
    setSent(true);
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
          <TrendingUp size={22} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Vendas</span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        {sent ? (
          <div className="text-center space-y-3">
            <p className="text-base font-semibold text-gray-900 dark:text-white">E-mail enviado!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
            <Link href="/login" className="inline-block mt-4 text-sm text-green-600 hover:underline">Voltar ao login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Esqueci minha senha</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Informe seu e-mail e enviaremos um link para redefinir.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white" />
              </div>

              {erro && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{erro}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
