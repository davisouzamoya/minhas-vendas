"use client";

import { useContext, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Settings, Target, Store, Image, MessageSquarePlus, Bug, Lightbulb, Heart, Send } from "lucide-react";
import { AppContext } from "@/app/(frontend)/components/AppContext";

const TIPOS_FEEDBACK = [
  { value: "melhoria", label: "Melhoria", icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", ring: "ring-blue-500/30" },
  { value: "bug", label: "Reportar bug", icon: Bug, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", ring: "ring-red-500/30" },
  { value: "elogio", label: "Elogio", icon: Heart, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20", ring: "ring-pink-500/30" },
] as const;

function FeedbackSection() {
  const [tipo, setTipo] = useState<"melhoria" | "bug" | "elogio">("melhoria");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, titulo, mensagem }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Não foi possível enviar. Tente novamente.");
      return;
    }
    setSent(true);
    setTitulo("");
    setMensagem("");
    setTipo("melhoria");
    setTimeout(() => setSent(false), 5000);
  }

  const header = (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
        <MessageSquarePlus size={16} className="text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Feedback</p>
        <p className="text-xs text-gray-400">Sugestões, bugs ou elogios — adoramos ouvir você</p>
      </div>
    </div>
  );

  if (sent) {
    return (
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {header}
        <div className="p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Obrigado pelo feedback!</p>
          <p className="text-xs text-gray-400">Sua mensagem foi enviada com sucesso. Adoramos ouvir você.</p>
        </div>
      </div>
    );
  }

  const tipoAtual = TIPOS_FEEDBACK.find((t) => t.value === tipo)!;

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {header}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Tipo */}
        <div className="flex gap-2">
          {TIPOS_FEEDBACK.map(({ value, label, icon: Icon, color, bg, ring }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipo(value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all text-xs font-medium ${
                tipo === value
                  ? `${bg} border-transparent ring-2 ${ring} ${color}`
                  : "border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={
              tipo === "melhoria" ? "Ex: Adicionar exportação em PDF" :
              tipo === "bug" ? "Ex: Botão de salvar não funciona" :
              "Ex: Interface muito intuitiva!"
            }
            required
            maxLength={120}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
          />
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Detalhes *</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder={
              tipo === "melhoria" ? "Descreva a funcionalidade que você gostaria de ver..." :
              tipo === "bug" ? "Como reproduzir o problema? O que aconteceu vs. o que esperava..." :
              "Conte o que você mais gosta ou o que te ajudou..."
            }
            required
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{mensagem.length}/1000</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-full transition-colors shadow-sm disabled:opacity-50 ${
              tipo === "bug" ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" :
              tipo === "elogio" ? "bg-pink-500 hover:bg-pink-600 shadow-pink-500/20" :
              "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
            }`}
          >
            <Send size={14} />
            {loading ? "Enviando..." : "Enviar feedback"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";

  const { nomeNegocio: ctxNome, logoUrl: ctxLogo, metaMensal: ctxMeta, perfilCarregando, refetchPerfil } = useContext(AppContext);

  const [form, setForm] = useState({
    nomeNegocio: ctxNome,
    logoUrl: ctxLogo,
    metaMensal: ctxMeta != null ? String(ctxMeta) : "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sincroniza form quando o contexto terminar de carregar (ex: hard refresh)
  const [synced, setSynced] = useState(!perfilCarregando);
  if (!synced && !perfilCarregando) {
    setSynced(true);
    setForm({
      nomeNegocio: ctxNome,
      logoUrl: ctxLogo,
      metaMensal: ctxMeta != null ? String(ctxMeta) : "",
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeNegocio: form.nomeNegocio, logoUrl: form.logoUrl || null, metaMensal: form.metaMensal || null }),
    });
    setLoading(false);
    refetchPerfil();
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

  if (perfilCarregando) return (
    <div className="space-y-8 pb-8 animate-pulse">
      <div className="hidden sm:block space-y-2">
        <div className="h-10 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-3/5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="h-16 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl" />
            <div className="space-y-1.5">
              <div className="h-3 w-2/5 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="hidden sm:block text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Configuração</h1>
        <p className="hidden sm:block text-base text-gray-400 mt-1.5">Personalize o seu negócio e defina suas metas.</p>
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
                type="number"
                min="0"
                step="0.01"
                value={form.metaMensal}
                onChange={(e) => setForm({ ...form, metaMensal: e.target.value })}
                placeholder="0,00"
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

      {/* Botão salvar */}
      <div className="flex items-center justify-end gap-3">
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

    </form>

    {/* Feedback — fora do form do perfil para evitar form aninhado */}
    <FeedbackSection />

    </div>
  );
}

export default function Perfil() {
  return (
    <Suspense fallback={null}>
      <PerfilContent />
    </Suspense>
  );
}
