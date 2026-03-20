"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PlusCircle,
  BarChart3,
  Sun,
  Moon,
  TrendingUp,
  Activity,
  X,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Users,
  Building2,
  Settings,
  Plus,
  Search,
  Bell,
  History,
} from "lucide-react";
import { createClient } from "@/app/(backend)/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nova", label: "Nova Transação", icon: PlusCircle },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/fluxo-de-caixa", label: "Fluxo de Caixa", icon: Activity },
  { href: "/perfil", label: "Perfil", icon: Settings },
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
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  function fetchPerfil() {
    fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then((d) => {
      setNomeNegocio(d?.nomeNegocio ?? "");
      setLogoUrl(d?.logoUrl ?? "");
    });
  }

  function fetchPendentes() {
    fetch("/api/vendas-pendentes").then((r) => r.ok ? r.json() : null).then((d) => {
      setPendentes(d?.count ?? 0);
    });
  }

  useEffect(() => { fetchPerfil(); fetchPendentes(); }, [pathname]);

  useEffect(() => {
    window.addEventListener("perfilUpdated", fetchPerfil);
    window.addEventListener("vendas-pendentes-updated", fetchPendentes);
    return () => {
      window.removeEventListener("perfilUpdated", fetchPerfil);
      window.removeEventListener("vendas-pendentes-updated", fetchPendentes);
    };
  }, []);

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
              {nomeNegocio || "Minhas Vendas"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-green-700 dark:text-green-400 font-medium opacity-70">
              Gestão Digital
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-green-800 dark:text-gray-400 hover:text-green-950 dark:hover:text-gray-200 p-1">
              <X size={18} />
            </button>
          )}
          {onDesktopClose && (
            <button
              onClick={onDesktopClose}
              className="hidden lg:flex text-green-800 dark:text-gray-400 hover:text-green-950 dark:hover:text-gray-200 transition-colors p-1"
              title="Fechar menu"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-white dark:bg-white/10 text-green-700 dark:text-green-400 font-bold shadow-sm"
                  : "text-green-900 dark:text-gray-400 hover:bg-green-200/60 dark:hover:bg-white/5"
              }`}
              style={active ? { borderRadius: "1.5rem 0.5rem 1.5rem 0.5rem" } : { borderRadius: "0.5rem" }}
            >
              <Icon size={18} className={active ? "text-green-600 dark:text-green-400" : ""} />
              <span className="flex-1">{label}</span>
              {href === "/relatorios" && pendentes > 0 && (
                <span className="ml-auto text-xs font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {pendentes}
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

function AppHeader({ onMobileMenuOpen, desktopOpen, onDesktopOpen }: {
  onMobileMenuOpen: () => void;
  desktopOpen: boolean;
  onDesktopOpen: () => void;
}) {
  const router = useRouter();
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [userLabel, setUserLabel] = useState("");
  const [pendentes, setPendentes] = useState(0);
  const pathname = usePathname();
  const [busca, setBusca] = useState("");

  const searchBase = pathname.startsWith("/fornecedores")
    ? "/fornecedores"
    : pathname.startsWith("/clientes")
    ? "/clientes"
    : null;

  const searchPlaceholder = pathname.startsWith("/fornecedores")
    ? "Buscar fornecedor..."
    : "Buscar cliente...";

  // Limpa busca ao trocar de página pesquisável
  useEffect(() => {
    setBusca("");
  }, [searchBase]);

  // Debounce: navega com ?q= 300ms após parar de digitar
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
    fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then((d) => {
      setNomeNegocio(d?.nomeNegocio ?? "");
      setLogoUrl(d?.logoUrl ?? "");
    });
    fetch("/api/vendas-pendentes").then((r) => r.ok ? r.json() : null).then((d) => {
      setPendentes(d?.count ?? 0);
    });
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const meta = data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name ?? "";
      setUserLabel(meta || email.split("@")[0]);
    });

    window.addEventListener("perfilUpdated", () => {
      fetch("/api/perfil").then((r) => r.ok ? r.json() : null).then((d) => {
        setNomeNegocio(d?.nomeNegocio ?? "");
        setLogoUrl(d?.logoUrl ?? "");
      });
    });
    window.addEventListener("vendas-pendentes-updated", () => {
      fetch("/api/vendas-pendentes").then((r) => r.ok ? r.json() : null).then((d) => setPendentes(d?.count ?? 0));
    });
  }, []);

  return (
    <header className="sticky top-0 w-full z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between h-16 px-4 lg:px-8 gap-4">
      {/* Mobile: hamburger */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 shrink-0"
      >
        <Menu size={22} />
      </button>

      {/* Desktop: abrir sidebar quando fechada */}
      {!desktopOpen && (
        <button
          onClick={onDesktopOpen}
          className="hidden lg:flex text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors shrink-0"
          title="Abrir menu"
        >
          <PanelLeftOpen size={22} />
        </button>
      )}

      {/* Mobile: logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
          <TrendingUp size={13} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-base">Minhas Vendas</span>
      </div>

      {/* Search — desktop only, visível em clientes e fornecedores */}
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
      <div className="flex items-center gap-2 lg:gap-4 ml-auto lg:ml-0">
        {/* Notificações */}
        <Link
          href="/relatorios"
          className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Notificações"
        >
          <Bell size={20} />
          {pendentes > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Link>

        {/* Histórico */}
        <Link
          href="/transacoes"
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Histórico de transações"
        >
          <History size={20} />
        </Link>

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
  const [desktopOpen, setDesktopOpen] = useState(true);
  const router = useRouter();

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
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#c6fdd9] dark:bg-gray-900 flex-col z-30 transition-transform duration-300 ${
          desktopOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onDesktopClose={() => setDesktopOpen(false)} />
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
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${desktopOpen ? "lg:ml-64" : "lg:ml-0"}`}>
        <AppHeader
          onMobileMenuOpen={() => setMobileOpen(true)}
          desktopOpen={desktopOpen}
          onDesktopOpen={() => setDesktopOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
