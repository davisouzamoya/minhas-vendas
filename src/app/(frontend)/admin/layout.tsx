"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Users, HeartPulse, ChevronLeft, MessageSquarePlus } from "lucide-react";

const adminNav = [
  { href: "/admin/suporte", label: "Suporte", icon: Users },
  { href: "/admin/sistema", label: "Saúde do Sistema", icon: HeartPulse },
  { href: "/admin/feedbacks", label: "Feedbacks", icon: MessageSquarePlus },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6 sticky top-0 z-10">
        <div className="flex items-center gap-2 shrink-0">
          <ShieldCheck size={18} className="text-green-500" />
          <span className="font-bold text-white">Admin</span>
          <span className="text-gray-600 text-xs">· VendaPro</span>
        </div>

        <nav className="flex items-center gap-1">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith(href)
                  ? "bg-green-900/40 text-green-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ChevronLeft size={14} /> Voltar ao app
          </Link>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
