import Link from "next/link";
import {
  TrendingUp,
  Users,
  BarChart3,
  Bell,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Controle financeiro completo",
    desc: "Registre vendas, despesas, entradas e saídas. Veja seu saldo em tempo real.",
  },
  {
    icon: BarChart3,
    title: "Dashboard com gráficos",
    desc: "Acompanhe vendas vs despesas por mês e compare com o período anterior.",
  },
  {
    icon: Users,
    title: "Gestão de clientes",
    desc: "Cadastre clientes, veja quem compra mais e nunca perca um aniversário.",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    desc: "Saiba quais clientes estão sumindo e reconquiste-os com um clique no WhatsApp.",
  },
  {
    icon: MessageCircle,
    title: "Cobrador via WhatsApp",
    desc: "Veja clientes em atraso e envie cobranças com mensagem pronta direto no WhatsApp.",
  },
  {
    icon: Smartphone,
    title: "Funciona como app",
    desc: "Instale no celular direto pelo navegador, sem precisar de App Store.",
  },
];

const planos = [
  {
    nome: "Grátis",
    preco: "R$ 0",
    periodo: "para sempre",
    destaque: false,
    itens: [
      "Até 50 transações/mês",
      "Dashboard básico",
      "Até 20 clientes",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    href: "/cadastro",
  },
  {
    nome: "Pro",
    preco: "R$ 29",
    periodo: "/mês",
    destaque: true,
    itens: [
      "Transações ilimitadas",
      "Dashboard completo + gráficos",
      "Clientes ilimitados",
      "Alertas de churn e aniversário",
      "Cobrador via WhatsApp",
      "Relatórios e exportação CSV",
      "Suporte prioritário",
    ],
    cta: "Assinar agora",
    href: "/cadastro",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-green-700 text-lg tracking-tight">Minhas Vendas</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="text-sm font-medium bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-green-200">
          Para pequenos negócios brasileiros
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          O financeiro do seu negócio,{" "}
          <span className="text-green-600">simples e no bolso</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
          Controle vendas, despesas e clientes em um só lugar. Veja quem deve, quem sumiu e quem faz aniversário — tudo pelo celular.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-base"
          >
            Começar grátis <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-7 py-3 rounded-xl transition-colors text-base"
          >
            Já tenho conta
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Sem cartão de crédito. Cancele quando quiser.</p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            Tudo que você precisa para crescer
          </h2>
          <p className="text-center text-gray-500 mb-12">Feito para quem vende no dia a dia.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            Planos simples, sem surpresa
          </h2>
          <p className="text-center text-gray-500 mb-12">Comece grátis e faça upgrade quando precisar.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {planos.map((p) => (
              <div
                key={p.nome}
                className={`rounded-2xl border p-7 flex flex-col ${
                  p.destaque
                    ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                    : "border-gray-200 bg-white"
                }`}
              >
                {p.destaque && (
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full self-start mb-4">
                    Mais popular
                  </span>
                )}
                <h3 className="font-bold text-xl text-gray-900">{p.nome}</h3>
                <div className="flex items-end gap-1 mt-2 mb-6">
                  <span className="text-3xl font-extrabold text-gray-900">{p.preco}</span>
                  <span className="text-gray-400 text-sm pb-1">{p.periodo}</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {p.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    p.destaque
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border border-gray-300 hover:border-gray-400 text-gray-800"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-green-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <ShieldCheck size={36} className="text-green-200 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Seu negócio merece controle de verdade
          </h2>
          <p className="text-green-100 mb-8">
            Comece hoje, de graça, e veja a diferença em poucos dias.
          </p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors text-base"
          >
            Criar minha conta grátis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Minhas Vendas · Feito com carinho para pequenos negócios 🇧🇷
        </p>
      </footer>
    </div>
  );
}
