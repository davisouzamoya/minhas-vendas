"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Settings } from "lucide-react";

export default function Perfil() {
  const router = useRouter();
  const [form, setForm] = useState({ nomeNegocio: "", logoUrl: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) setForm({ nomeNegocio: d.nomeNegocio ?? "", logoUrl: d.logoUrl ?? "" });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeNegocio: form.nomeNegocio, logoUrl: form.logoUrl || null }),
    });
    setLoading(false);
    setSaved(true);
    window.dispatchEvent(new Event("perfilUpdated"));
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Perfil do Negócio</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">

        {/* Preview logo */}
        <div className="flex items-center gap-4">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-green-600 flex items-center justify-center">
              <Settings size={28} className="text-white" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{form.nomeNegocio || "Seu negócio"}</p>
            <p className="text-xs text-gray-400">Aparece no menu lateral</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Negócio *</label>
          <input
            type="text"
            value={form.nomeNegocio}
            onChange={(e) => setForm({ ...form, nomeNegocio: e.target.value })}
            placeholder="Ex: Loja da Maria"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da Logo</label>
          <input
            type="url"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">Cole a URL de uma imagem (ex: do Google Drive, Imgur, etc.)</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
          {loading ? "Salvando..." : "Salvar"}
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} /> Salvo com sucesso!
          </div>
        )}
      </form>
    </div>
  );
}
