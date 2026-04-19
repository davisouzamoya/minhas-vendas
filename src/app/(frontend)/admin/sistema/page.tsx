"use client";

import { useEffect, useState } from "react";
import { Users, ArrowLeftRight, Activity, Image, UserCheck, CheckCircle2, Mail, Loader2 } from "lucide-react";

interface SistemaData {
  totalUsuarios: number;
  totalTransacoes: number;
  transacoesHoje: number;
  usuariosAtivos30d: number;
  totalClientes: number;
  fotosArmazenadas: number;
  ultimasTransacoes: {
    id: number;
    userId: string;
    nomeNegocio: string;
    tipo: string;
    valorTotal: number;
    createdAt: string;
    descricao: string;
  }[];
}

const tipoCor: Record<string, string> = {
  venda: "text-green-400",
  despesa: "text-red-400",
  entrada: "text-blue-400",
  saida: "text-orange-400",
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const EMAILS_TESTE = [
  { tipo: "boas-vindas", label: "Boas-vindas (trial)" },
  { tipo: "assinatura", label: "Assinatura ativada" },
  { tipo: "trial", label: "Trial expirando (3 dias)" },
  { tipo: "cancelamento", label: "Assinatura cancelada" },
];

export default function AdminSistema() {
  const [data, setData] = useState<SistemaData | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/sistema").then((r) => r.ok ? r.json() : null).then(setData);
  }, []);

  async function testarEmail(tipo: string) {
    setEnviando(tipo);
    setResultado(null);
    const res = await fetch("/api/admin/testar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo }),
    });
    const json = await res.json();
    setResultado(res.ok
      ? { msg: `Enviado para ${json.enviado_para}`, ok: true }
      : { msg: json.error ?? "Erro ao enviar", ok: false }
    );
    setEnviando(null);
  }

  if (!data) return <p className="text-sm text-gray-500">Carregando...</p>;

  const cards = [
    { label: "Usuários cadastrados", value: data.totalUsuarios, icon: Users, color: "text-green-400", bg: "bg-green-900/20" },
    { label: "Ativos últimos 30 dias", value: data.usuariosAtivos30d, icon: UserCheck, color: "text-blue-400", bg: "bg-blue-900/20" },
    { label: "Total de transações", value: data.totalTransacoes, icon: ArrowLeftRight, color: "text-purple-400", bg: "bg-purple-900/20" },
    { label: "Transações hoje", value: data.transacoesHoje, icon: Activity, color: "text-yellow-400", bg: "bg-yellow-900/20" },
    { label: "Total de clientes", value: data.totalClientes, icon: Users, color: "text-pink-400", bg: "bg-pink-900/20" },
    { label: "Fotos armazenadas", value: data.fotosArmazenadas, icon: Image, color: "text-orange-400", bg: "bg-orange-900/20" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Saúde do Sistema</h1>
        <p className="text-sm text-gray-400">Visão geral do uso da plataforma em tempo real.</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-green-900/20 border border-green-800/50 rounded-lg w-fit">
        <CheckCircle2 size={14} className="text-green-500" />
        <span className="text-xs text-green-400 font-medium">Banco de dados: Operacional</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Últimas transações globais */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Últimas transações (todos os usuários)</h2>
        <div className="divide-y divide-gray-800">
          {data.ultimasTransacoes.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium truncate">{t.descricao}</p>
                <p className="text-xs text-gray-500">{t.nomeNegocio} · {formatDate(t.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium capitalize ${tipoCor[t.tipo] ?? "text-gray-400"}`}>{t.tipo}</span>
                <span className="text-sm font-bold text-gray-100">{formatCurrency(t.valorTotal)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teste de e-mail */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-300">Testar envio de e-mail</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {EMAILS_TESTE.map(({ tipo, label }) => (
            <button
              key={tipo}
              onClick={() => testarEmail(tipo)}
              disabled={enviando !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-medium transition-colors disabled:opacity-50"
            >
              {enviando === tipo
                ? <Loader2 size={12} className="animate-spin" />
                : <Mail size={12} />
              }
              {label}
            </button>
          ))}
        </div>
        {resultado && (
          <p className={`mt-3 text-xs font-medium ${resultado.ok ? "text-green-400" : "text-red-400"}`}>
            {resultado.ok ? "✓" : "✗"} {resultado.msg}
          </p>
        )}
      </div>
    </div>
  );
}
