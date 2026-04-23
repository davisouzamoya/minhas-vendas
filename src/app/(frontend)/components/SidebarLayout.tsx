"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Sun,
  Moon,
  TrendingUp,
  Activity,
  X,
  Menu,
  LogOut,
  Users,
  Building2,
  Settings,
  Plus,
  Search,
  Bell,
  History,
  Package,
  Lock,
  Zap,
} from "lucide-react";
import { NotifDropdown } from "@/app/(frontend)/components/NotifDropdown";
import { HistoricoDropdown, invalidateHistoricoCache } from "@/app/(frontend)/components/HistoricoDropdown";
import { createClient } from "@/app/(backend)/lib/supabase/client";
import { PLANO_INFO } from "@/app/(backend)/lib/plano";
import type { Plano } from "@/app/(backend)/lib/plano";
import { AppContext, type PlanoStatus } from "@/app/(frontend)/components/AppContext";


const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null },
  { href: "/transacoes", label: "Vendas", icon: ArrowLeftRight, feature: null },
  { href: "/clientes", label: "Clientes", icon: Users, feature: "clientes" },
  { href: "/fornecedores", label: "Fornecedores", icon: Building2, feature: "fornecedores" },
  { href: "/estoque", label: "Estoque", icon: Package, feature: "estoque" },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, feature: "relatorios" },
  { href: "/fluxo-de-caixa", label: "Fluxo de Caixa", icon: Activity, feature: "fluxo-de-caixa" },
  { href: "/perfil", label: "Configuração", icon: Settings, feature: null },
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SidebarContent({
  onClose,
  onDesktopClose,
}: {
  onClose?: () => void;
  onDesktopClose?: () => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { nomeNegocio, pendentes, estoqueBaixo, aniversariantes, plano: planoStatus, planoCarregando } = useContext(AppContext);
  const plano = {
    carregando: planoCarregando,
    trialAtivo: planoStatus?.trialAtivo ?? false,
    trialDiasRestantes: planoStatus?.trialDiasRestantes ?? 0,
    plan: planoStatus?.plan ?? "gratuito",
    temAcesso: (feature: string) => planoStatus?.acessos[feature] ?? false,
  };

  useEffect(() => { setMounted(true); }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full py-6 px-3">
      {/* Logo */}
      <div className="flex items-start justify-between px-3 mb-8">
        <div className="flex items-center gap-2.5">
          <div>
            <p className="font-bold text-green-950 dark:text-white text-base leading-tight tracking-tight truncate max-w-[160px]">
              {nomeNegocio || "VendaPro"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-green-700 dark:text-green-400 font-medium opacity-70">
              Gestão Digital
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {onClose && (
            <button onClick={onClose} aria-label="Fechar menu" className="lg:hidden text-green-800 dark:text-gray-400 hover:text-green-950 dark:hover:text-gray-200 p-1">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, feature }) => {
          const bloqueado = feature ? !plano.temAcesso(feature) : false;
          const active = pathname === href && !bloqueado;
          const destino = bloqueado ? "/planos" : href;

          return (
            <Link
              key={href}
              href={destino}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                bloqueado
                  ? "text-gray-400 dark:text-gray-600 hover:bg-green-200/40 dark:hover:bg-white/5"
                  : active
                  ? "bg-white dark:bg-white/10 text-green-700 dark:text-green-400 font-bold shadow-sm"
                  : "text-green-900 dark:text-gray-400 hover:bg-green-200/60 dark:hover:bg-white/5"
              }`}
              style={active ? { borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" } : { borderRadius: "0.5rem" }}
            >
              <Icon size={18} className={active ? "text-green-600 dark:text-green-400" : bloqueado ? "text-gray-400 dark:text-gray-600" : ""} />
              <span className="flex-1">{label}</span>
              {bloqueado && <Lock size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />}
              {!bloqueado && href === "/relatorios" && pendentes > 0 && (
                <span className="ml-auto text-xs font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {pendentes}
                </span>
              )}
              {!bloqueado && href === "/estoque" && estoqueBaixo > 0 && (
                <span className="ml-auto text-xs font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {estoqueBaixo}
                </span>
              )}
              {!bloqueado && href === "/clientes" && aniversariantes > 0 && (
                <span className="ml-auto text-xs font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {aniversariantes}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Nova Venda CTA */}
      <div className="px-1 my-5">
        <Link
          href="/nova"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 text-white py-3.5 rounded-full font-bold text-sm shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform"
        >
          <Plus size={18} />
          Nova Venda
        </Link>
      </div>

      {/* Badge de plano */}
      {!plano.carregando && (
        <Link href="/planos" className="mx-1 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-green-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-colors">
          <Zap size={13} className={plano.trialAtivo ? "text-orange-500" : "text-green-600 dark:text-green-400"} />
          <div className="flex-1 min-w-0">
            {plano.trialAtivo ? (
              <>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 leading-none">Trial</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{plano.trialDiasRestantes}d restante{plano.trialDiasRestantes !== 1 ? "s" : ""}</p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-green-800 dark:text-green-400 leading-none capitalize">
                  {PLANO_INFO[(plano.plan as Plano) ?? "gratuito"]?.label ?? "Gratuito"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Ver planos</p>
              </>
            )}
          </div>
        </Link>
      )}

      {/* Theme + Logout */}
      <div className="space-y-0.5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-green-900 dark:text-gray-400 hover:bg-green-200/60 dark:hover:bg-white/5 transition-colors"
        >
          {mounted ? (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : <Moon size={18} />}
          {mounted ? (theme === "dark" ? "Modo Claro" : "Modo Escuro") : "Modo Escuro"}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  );
}


function AppHeader({ onMobileMenuOpen }: {
  onMobileMenuOpen: () => void;
}) {
  const router = useRouter();
  const { nomeNegocio, logoUrl, userLabel, pendentes, estoqueBaixo, aniversariantes } = useContext(AppContext);
  const [notifOpen, setNotifOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setNotifOpen(false);
    setHistOpen(false);
  }, [pathname]);
  const [busca, setBusca] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const histRef = useRef<HTMLDivElement>(null);

  const totalNotif = pendentes + estoqueBaixo + aniversariantes;

  const searchBase = pathname.startsWith("/fornecedores")
    ? "/fornecedores"
    : pathname.startsWith("/clientes")
    ? "/clientes"
    : pathname.startsWith("/transacoes")
    ? "/transacoes"
    : pathname.startsWith("/estoque")
    ? "/estoque"
    : pathname.startsWith("/dashboard") || pathname === "/"
    ? "/dashboard"
    : pathname.startsWith("/fluxo-de-caixa")
    ? "/fluxo-de-caixa"
    : pathname.startsWith("/relatorios")
    ? "/relatorios"
    : null;

  const searchPlaceholder = pathname.startsWith("/fornecedores")
    ? "Buscar fornecedor..."
    : pathname.startsWith("/clientes")
    ? "Buscar cliente..."
    : pathname.startsWith("/transacoes")
    ? "Buscar venda..."
    : pathname.startsWith("/estoque")
    ? "Buscar produto..."
    : pathname.startsWith("/dashboard") || pathname === "/"
    ? "Buscar em vendas..."
    : pathname.startsWith("/fluxo-de-caixa")
    ? "Buscar período..."
    : pathname.startsWith("/relatorios")
    ? "Buscar cliente ou produto..."
    : "Buscar...";

  useEffect(() => { setBusca(""); }, [searchBase]);

  useEffect(() => {
    if (!searchBase) return;
    const t = setTimeout(() => {
      if (busca.trim()) {
        router.replace(`${searchBase}?q=${encodeURIComponent(busca.trim())}`);
      } else {
        router.replace(searchBase);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [busca]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (histRef.current && !histRef.current.contains(e.target as Node)) setHistOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between h-16 px-4 lg:px-8 gap-4">
      {/* Mobile: hamburger */}
      <button
        onClick={onMobileMenuOpen}
        aria-label="Abrir menu"
        className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 shrink-0"
      >
        <Menu size={22} />
      </button>

      {/* Mobile: logo ou título da página */}
      <div className="flex items-center gap-2 lg:hidden">
        {(() => {
          const pageTitle =
            pathname.startsWith("/fluxo-de-caixa") ? "Fluxo de Caixa" :
            pathname.startsWith("/transacoes") ? "Vendas" :
            pathname.startsWith("/clientes") ? "Clientes" :
            pathname.startsWith("/fornecedores") ? "Fornecedores" :
            pathname.startsWith("/estoque") ? "Estoque" :
            pathname.startsWith("/relatorios") ? "Relatórios" :
            pathname.startsWith("/perfil") ? "Configuração" :
            pathname.startsWith("/dashboard") ? "Dashboard" :
            pathname.startsWith("/nova") ? "Nova Venda" :
            null;
          return pageTitle ? (
            <span className="font-bold text-gray-900 dark:text-white text-base">{pageTitle}</span>
          ) : (
            <>
              <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                <TrendingUp size={13} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-base">VendaPro</span>
            </>
          );
        })()}
      </div>

      {/* Search — desktop only */}
      <div className={`items-center flex-1 max-w-sm ${searchBase ? "hidden lg:flex" : "hidden"}`}>
        <div className="relative w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 lg:gap-4 ml-auto">
        {/* Notificações */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setHistOpen(false); }}
            aria-label="Notificações"
            aria-expanded={notifOpen}
            className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Bell size={20} />
            {totalNotif > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                {totalNotif}
              </span>
            )}
          </button>
          {notifOpen && <NotifDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Histórico */}
        <div className="relative" ref={histRef}>
          <button
            onClick={() => { setHistOpen((o) => !o); setNotifOpen(false); }}
            aria-label="Histórico de vendas"
            aria-expanded={histOpen}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <History size={20} />
          </button>
          {histOpen && <HistoricoDropdown onClose={() => setHistOpen(false)} />}
        </div>

        {/* Separador */}
        <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-gray-700" />

        {/* User */}
        <Link href="/perfil" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {userLabel || "Usuário"}
            </p>
            {nomeNegocio && (
              <p className="text-[11px] text-green-600 dark:text-green-400 font-medium leading-tight">
                {nomeNegocio}
              </p>
            )}
          </div>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-full object-cover ring-2 ring-green-500/20 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center ring-2 ring-green-500/20 shrink-0">
              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                {getInitials(userLabel || nomeNegocio || "MV")}
              </span>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [nomeNegocio, setNomeNegocio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [metaMensal, setMetaMensal] = useState<number | null>(null);
  const [perfilCarregando, setPerfilCarregando] = useState(true);
  const [userLabel, setUserLabel] = useState("");
  const [pendentes, setPendentes] = useState(0);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);
  const [aniversariantes, setAniversariantes] = useState(0);
  const [plano, setPlano] = useState<PlanoStatus | null>(null);
  const [planoCarregando, setPlanoCarregando] = useState(true);

  function refetchPerfil() {
    fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then((d) => {
      setNomeNegocio(d?.nomeNegocio ?? "");
      setLogoUrl(d?.logoUrl ?? "");
      setMetaMensal(d?.metaMensal ?? null);
      setPerfilCarregando(false);
    });
  }

  const estoqueCacheRef = useRef<{ value: number; at: number } | null>(null);
  const ESTOQUE_TTL = 30_000;

  function refetchNotifCounts(forceEstoque = false) {
    fetch("/api/vendas-pendentes").then((r) => r.ok ? r.json() : null).then((d) => setPendentes(d?.count ?? 0));
    fetch("/api/clientes/stats").then((r) => r.ok ? r.json() : null).then((d) => setAniversariantes(d?.aniversariantes ?? 0));

    const cacheValido = !forceEstoque && estoqueCacheRef.current && Date.now() - estoqueCacheRef.current.at < ESTOQUE_TTL;
    if (cacheValido) {
      setEstoqueBaixo(estoqueCacheRef.current!.value);
    } else {
      fetch("/api/produtos").then((r) => r.ok ? r.json() : []).then((produtos: { estoque: number; estoqueMinimo: number | null; ativo: boolean }[]) => {
        const count = produtos.filter((p) => p.ativo && p.estoqueMinimo != null && p.estoque <= p.estoqueMinimo).length;
        estoqueCacheRef.current = { value: count, at: Date.now() };
        setEstoqueBaixo(count);
      });
    }
  }

  // Carrega uma única vez na montagem: perfil, usuário e plano
  useEffect(() => {
    refetchPerfil();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const meta = data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name ?? "";
      setUserLabel(meta || email.split("@")[0]);
    });
    fetch("/api/plano")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setPlano(d); setPlanoCarregando(false); })
      .catch(() => setPlanoCarregando(false));
  }, []);

  // Recarrega contadores de notificação a cada troca de página
  useEffect(() => { refetchNotifCounts(); }, [pathname]);

  useEffect(() => {
    function onVendasUpdated() { refetchNotifCounts(true); invalidateHistoricoCache(); }
    window.addEventListener("perfilUpdated", refetchPerfil);
    window.addEventListener("vendas-pendentes-updated", onVendasUpdated);
    return () => {
      window.removeEventListener("perfilUpdated", refetchPerfil);
      window.removeEventListener("vendas-pendentes-updated", onVendasUpdated);
    };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "n" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        router.push("/nova");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  return (
    <AppContext.Provider value={{ nomeNegocio, logoUrl, metaMensal, perfilCarregando, userLabel, pendentes, estoqueBaixo, aniversariantes, plano, planoCarregando, refetchPerfil, refetchNotifCounts }}>
      <div className="flex min-h-screen overflow-x-hidden">
        {/* Sidebar desktop — sempre visível e fixo */}
        <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#c6fdd9] dark:bg-gray-900 flex-col z-30">
          <SidebarContent />
        </aside>

        {/* Sidebar mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar mobile drawer */}
        <aside
          className={`fixed left-0 top-0 h-full w-64 bg-[#c6fdd9] dark:bg-gray-900 z-50 transition-transform duration-300 lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
          <AppHeader onMobileMenuOpen={() => setMobileOpen(true)} />
          <main className="flex-1 p-5 sm:p-6 lg:p-8 pt-[calc(4rem+1.25rem)] sm:pt-[calc(4rem+1.5rem)] lg:pt-[calc(4rem+2rem)]">
            {children}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
