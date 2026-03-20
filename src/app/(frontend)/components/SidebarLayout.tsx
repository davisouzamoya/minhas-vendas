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
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-green-700 dark:bg-green-600 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-white" />
            </div>
          )}
          <div>
            <p className="font-bold text-green-950 dark:text-white text-base leading-tight tracking-tight truncate max-w-[140px]">
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
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
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
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          desktopOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        {/* Header mobile */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Menu size={22} />
          </button>

          {!desktopOpen && (
            <button
              onClick={() => setDesktopOpen(true)}
              className="hidden lg:flex text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title="Abrir menu"
            >
              <PanelLeftOpen size={22} />
            </button>
          )}

          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
              <TrendingUp size={13} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base">Minhas Vendas</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
