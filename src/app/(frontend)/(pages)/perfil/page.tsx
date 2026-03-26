"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Settings, Target, Store, Image } from "lucide-react";

function parseBRLInput(value: string): number {
  // Remove pontos de milhar, troca vírgula decimal por ponto
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatBRL(value: number): string {
  if (!value) return "";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";
  const [form, setForm] = useState({ nomeNegocio: "", logoUrl: "", metaMensal: "" });
  const [metaDisplay, setMetaDisplay] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) {
        const meta = d.metaMensal ? String(d.metaMensal) : "";
        setForm({ nomeNegocio: d.nomeNegocio ?? "", logoUrl: d.logoUrl ?? "", metaMensal: meta });
        if (d.metaMensal) {
          setMetaDisplay(formatBRL(parseFloat(meta)));
        }
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeNegocio: form.nomeNegocio, logoUrl: form.logoUrl || null, metaMensal: form.metaMensal || null }),
    });
    setLoading(false);
    window.dispatchEvent(new Event("perfilUpdated"));
    if (onboarding) {
      router.push("/nova?onboarding=1");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  const meta = parseFloat(form.metaMensal) || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Configuração</h1>
          <p className="text-base text-gray-400 mt-1.5">Personalize o seu negócio e defina suas metas.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle size={16} /> Salvo com sucesso!
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full transition-colors shadow-sm shadow-green-600/20 disabled:opacity-50"
          >
            <Settings size={15} />
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Seção: Negócio */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-full">
            <Store size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Dados do Negócio</p>
            <p className="text-xs text-gray-400">Informações exibidas no menu lateral</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-cover ring-2 ring-green-500/20" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                <Store size={24} className="text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{form.nomeNegocio || "Seu negócio"}</p>
              <p className="text-xs text-gray-400 mt-0.5">Gestão Digital</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome do Negócio *</label>
            <input
              type="text"
              value={form.nomeNegocio}
              onChange={(e) => setForm({ ...form, nomeNegocio: e.target.value })}
              placeholder="Ex: Loja da Maria"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5"><Image size={13} /> URL da Logo</span>
            </label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1.5">Cole a URL de uma imagem (ex: Imgur, Google Drive público, etc.)</p>
          </div>
        </div>
      </div>

      {/* Seção: Meta Mensal */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-full">
            <Target size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Meta Mensal de Vendas</p>
            <p className="text-xs text-gray-400">Aparece no dashboard como barra de progresso</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Valor da meta</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={metaDisplay}
                onChange={(e) => setMetaDisplay(e.target.value)}
                onBlur={() => {
                  const num = parseBRLInput(metaDisplay);
                  setMetaDisplay(num ? formatBRL(num) : "");
                  setForm({ ...form, metaMensal: num ? String(num) : "" });
                }}
                onFocus={() => {
                  // Mostra o número limpo para edição
                  const num = parseBRLInput(metaDisplay);
                  setMetaDisplay(num ? String(num) : "");
                }}
                placeholder="Ex: 27000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
              />
            </div>
          </div>

          {/* Preview da meta */}
          {meta > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progresso do mês</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {meta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full w-0 transition-all" />
              </div>
              <p className="text-xs text-gray-400">Meta definida — aparecerá no dashboard com o progresso real.</p>
            </div>
          )}
        </div>
      </div>

    </form>
  );
}

export default function Perfil() {
  return (
    <Suspense fallback={null}>
      <PerfilContent />
    </Suspense>
  );
}
