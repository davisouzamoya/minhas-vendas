import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  Users,
  MessageCircle,
  Smartphone,
  CheckCircle,
  PlayCircle,
  Quote,
  Globe,
  Mail,
  Pencil,
  Download,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen text-[#dee5ff]"
      style={{ backgroundColor: "#060e20", fontFamily: "'Manrope', sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Manrope:wght@400;500;600&display=swap');
        .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .benefit-card { border-bottom: 4px solid rgba(107,255,143,0.15); transition: border-color 0.2s; }
        .benefit-card:hover { border-bottom-color: #6bff8f; }
      `}</style>

      {/* Nav */}
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(6,14,32,0.85)", borderBottom: "1px solid rgba(107,255,143,0.08)" }}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">
          <span className="font-headline text-xl font-bold tracking-tighter" style={{ color: "#6bff8f" }}>
            VendaPro
          </span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="font-headline text-sm tracking-tight transition-colors" style={{ color: "#6bff8f", borderBottom: "2px solid #6bff8f", paddingBottom: "4px" }}>
              Funcionalidades
            </a>
            <a href="#precos" className="font-headline text-sm tracking-tight text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
              Preços
            </a>
            <a href="#depoimento" className="font-headline text-sm tracking-tight text-[#a3aac4] hover:text-[#dee5ff] transition-colors">
              Depoimentos
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#a3aac4] hover:text-[#dee5ff] transition-colors hidden md:block">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="font-bold text-sm px-6 py-2.5 rounded-full transition-all hover:scale-95"
              style={{ backgroundColor: "#0abc56", color: "#002c0f" }}
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 py-20 lg:py-32">
          {/* Glow background */}
          <div
            className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: "rgba(107,255,143,0.04)", filter: "blur(120px)" }}
          />
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                style={{ backgroundColor: "rgba(107,255,143,0.1)", color: "#6bff8f" }}
              >
                Para pequenos negócios brasileiros
              </span>
              <h1 className="font-headline text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]" style={{ color: "#dee5ff" }}>
                O controle do seu negócio,{" "}
                <span style={{ color: "#6bff8f" }}>simples</span> e no bolso
              </h1>
              <p className="text-lg lg:text-xl mb-10 max-w-xl leading-relaxed" style={{ color: "#a3aac4" }}>
                Pare de anotar no caderno ou no WhatsApp. Organize suas vendas de forma simples e profissional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center font-bold text-lg px-8 py-4 rounded-full transition-all hover:brightness-110 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #6bff8f, #0abc56)", color: "#002c0f", boxShadow: "0 8px 32px rgba(107,255,143,0.2)" }}
                >
                  Começar grátis
                </Link>
                <a
                  href="#funcionalidades"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full transition-all hover:bg-white/5"
                  style={{ color: "#dee5ff" }}
                >
                  <PlayCircle size={22} />
                  Ver como funciona
                </a>
              </div>
              <p className="text-xs mt-5" style={{ color: "#6d758c" }}>Sem cartão de crédito. Cancele quando quiser.</p>
            </div>

            {/* Dashboard mockup */}
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-full pointer-events-none"
                style={{ background: "rgba(107,255,143,0.06)", filter: "blur(60px)" }}
              />
              <div
                className="relative rounded-2xl p-4 shadow-2xl"
                style={{ backgroundColor: "#0f1930", border: "1px solid rgba(107,255,143,0.1)" }}
              >
                {/* Mock dashboard UI */}
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#091328" }}>
                  {/* Mock header */}
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="font-bold text-sm" style={{ color: "#dee5ff" }}>Dashboard</span>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6bff8f" }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#0abc56", opacity: 0.5 }} />
                    </div>
                  </div>
                  {/* Mock stat cards */}
                  <div className="grid grid-cols-3 gap-3 p-5">
                    {[
                      { label: "Vendas no mês", value: "R$ 4.820", color: "#6bff8f" },
                      { label: "Despesas", value: "R$ 1.340", color: "#ff7351" },
                      { label: "Saldo", value: "R$ 3.480", color: "#7beaff" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl p-3" style={{ backgroundColor: "#141f38" }}>
                        <p className="text-[10px] mb-1" style={{ color: "#6d758c" }}>{label}</p>
                        <p className="font-bold text-sm" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Mock chart bars */}
                  <div className="px-5 pb-5">
                    <div className="flex items-end gap-2 h-20">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === 5 ? "#6bff8f" : "rgba(107,255,143,0.2)" }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                        <span key={d} className="flex-1 text-center text-[9px]" style={{ color: "#6d758c" }}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section id="funcionalidades" className="py-24 px-6" style={{ backgroundColor: "#091328" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl lg:text-4xl font-bold mb-4" style={{ color: "#dee5ff" }}>
                Feito para quem não quer complicação
              </h2>
              <p style={{ color: "#a3aac4" }}>Tudo o que você precisa para crescer sem burocracia.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Pencil,
                  title: "Fim do caderninho",
                  desc: "Transforme sua gestão física em digital. Acesse seu histórico de vendas em qualquer lugar, a qualquer hora.",
                },
                {
                  icon: MessageCircle,
                  title: "Cobrança via WhatsApp",
                  desc: "Envie lembretes de pagamento profissionais com um clique. Melhore sua pontualidade de recebimento.",
                },
                {
                  icon: BarChart3,
                  title: "Dashboard Simples",
                  desc: "Entenda seu lucro real, despesas e volume de vendas em gráficos intuitivos e sem termos difíceis.",
                },
                {
                  icon: Users,
                  title: "Gestão de Clientes",
                  desc: "Saiba quem compra mais, quem está sumindo e nunca perca um aniversário importante.",
                },
                {
                  icon: TrendingUp,
                  title: "Fluxo de Caixa",
                  desc: "Visualize entradas e saídas mês a mês. Compare períodos e tome decisões com dados reais.",
                },
                {
                  icon: Download,
                  title: "Exportação de Relatórios",
                  desc: "Exporte seus dados em CSV para planilhas, contador ou para guardar seu histórico.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="benefit-card p-8 rounded-2xl cursor-default"
                  style={{ backgroundColor: "#0f1930" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: "rgba(107,255,143,0.1)" }}
                  >
                    <Icon size={20} style={{ color: "#6bff8f" }} />
                  </div>
                  <h3 className="font-headline text-xl font-bold mb-3" style={{ color: "#dee5ff" }}>{title}</h3>
                  <p className="leading-relaxed" style={{ color: "#a3aac4" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PWA Diferencial */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                style={{ backgroundColor: "rgba(107,255,143,0.1)", color: "#6bff8f" }}
              >
                <Smartphone size={13} />
                Tecnologia PWA
              </span>
              <h2 className="font-headline text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ color: "#dee5ff" }}>
                Funciona como App, mas sem ocupar espaço
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: "#a3aac4" }}>
                Nossa tecnologia permite que você instale o VendaPro direto da web. É leve, funciona offline para consultas básicas e é compatível com qualquer celular moderno.
              </p>
              <ul className="space-y-4">
                {["Instalação instantânea", "Não consome memória do aparelho", "Atualizações automáticas"].map((item) => (
                  <li key={item} className="flex items-center gap-3" style={{ color: "#dee5ff" }}>
                    <CheckCircle size={20} style={{ color: "#6bff8f" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 mt-10 font-bold px-8 py-4 rounded-full transition-all hover:brightness-110"
                style={{ backgroundColor: "#6bff8f", color: "#002c0f" }}
              >
                Instalar agora — é grátis
              </Link>
            </div>
            <div className="lg:w-1/2 relative flex justify-center">
              <div
                className="absolute -right-10 -top-10 w-80 h-80 rounded-full pointer-events-none"
                style={{ backgroundColor: "rgba(107,255,143,0.05)", filter: "blur(100px)" }}
              />
              {/* Phone mockup */}
              <div
                className="relative z-10 w-64 rounded-[3rem] p-3 shadow-2xl rotate-3"
                style={{ backgroundColor: "#141f38", border: "8px solid #0f1930" }}
              >
                <div className="rounded-[2.2rem] overflow-hidden" style={{ backgroundColor: "#091328" }}>
                  <div className="px-4 py-5 space-y-3">
                    <p className="text-xs font-bold" style={{ color: "#6bff8f" }}>Saldo do mês</p>
                    <p className="font-headline text-3xl font-extrabold" style={{ color: "#dee5ff" }}>R$ 3.480</p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#192540" }}>
                      <div className="h-full rounded-full w-3/4" style={{ backgroundColor: "#6bff8f" }} />
                    </div>
                    <p className="text-[10px]" style={{ color: "#6d758c" }}>75% da meta atingida</p>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: "Venda — João", value: "+R$ 180", color: "#6bff8f" },
                        { label: "Despesa", value: "−R$ 45", color: "#ff7351" },
                        { label: "Venda — Maria", value: "+R$ 230", color: "#6bff8f" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between items-center py-2 px-3 rounded-xl" style={{ backgroundColor: "#141f38" }}>
                          <span className="text-[11px]" style={{ color: "#a3aac4" }}>{label}</span>
                          <span className="text-[11px] font-bold" style={{ color }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Depoimento */}
        <section id="depoimento" className="py-24 px-6 relative" style={{ backgroundColor: "#141f38" }}>
          <div className="max-w-4xl mx-auto text-center">
            <Quote size={64} className="mx-auto mb-8 opacity-20" style={{ color: "#6bff8f" }} />
            <p className="font-headline text-2xl lg:text-3xl italic mb-12 leading-relaxed" style={{ color: "#dee5ff" }}>
              "Antes eu perdia horas tentando entender quanto tinha sobrado no fim do mês. Com o VendaPro, registro tudo na hora e o app faz o cálculo pra mim. Facilitou demais minha produção artesanal."
            </p>
            <div className="flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ring-4"
                style={{ backgroundColor: "#192540", color: "#6bff8f" }}
              >
                RA
              </div>
              <h4 className="font-bold" style={{ color: "#dee5ff" }}>Ricardo Alves</h4>
              <p className="text-sm uppercase tracking-widest font-semibold mt-1" style={{ color: "#5bf083" }}>Artesão de Couro</p>
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="precos" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline text-4xl font-bold mb-4" style={{ color: "#dee5ff" }}>O plano ideal para o seu momento</h2>
              <p style={{ color: "#a3aac4" }}>Comece grátis e evolua conforme seu negócio cresce.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Grátis */}
              <div
                className="p-10 rounded-3xl flex flex-col"
                style={{ backgroundColor: "#0f1930", border: "1px solid rgba(64,72,93,0.3)" }}
              >
                <h3 className="font-headline text-xl font-bold mb-2" style={{ color: "#dee5ff" }}>Plano Grátis</h3>
                <div className="text-4xl font-bold mb-6" style={{ color: "#dee5ff" }}>
                  R$ 0<span className="text-sm font-normal" style={{ color: "#a3aac4" }}>/mês</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {["Até 30 transações/mês", "Até 50 clientes ativos", "Dashboard financeiro básico"].map((item) => (
                    <li key={item} className="flex items-center gap-3" style={{ color: "#a3aac4" }}>
                      <CheckCircle size={16} style={{ color: "#6bff8f" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className="w-full text-center py-4 rounded-xl font-bold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(107,255,143,0.4)", color: "#6bff8f" }}
                >
                  Começar agora
                </Link>
              </div>

              {/* Pro */}
              <div
                className="p-10 rounded-3xl flex flex-col relative shadow-2xl"
                style={{
                  backgroundColor: "#192540",
                  border: "2px solid #6bff8f",
                  boxShadow: "0 0 60px rgba(107,255,143,0.08)",
                }}
              >
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: "#6bff8f", color: "#002c0f" }}
                >
                  Recomendado
                </div>
                <h3 className="font-headline text-xl font-bold mb-2" style={{ color: "#dee5ff" }}>Plano Pro</h3>
                <div className="text-4xl font-bold mb-6" style={{ color: "#6bff8f" }}>
                  R$ 29<span className="text-sm font-normal" style={{ color: "#a3aac4" }}>/mês</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {[
                    "Transações ilimitadas",
                    "Clientes ilimitados",
                    "Suporte prioritário via WhatsApp",
                    "Exportação para Excel/PDF",
                    "Alertas de churn e aniversário",
                    "Relatórios avançados",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3" style={{ color: "#dee5ff" }}>
                      <CheckCircle size={16} style={{ color: "#6bff8f" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className="w-full text-center py-4 rounded-xl font-bold transition-all hover:brightness-110 shadow-lg"
                  style={{ backgroundColor: "#6bff8f", color: "#002c0f", boxShadow: "0 4px 20px rgba(107,255,143,0.2)" }}
                >
                  Quero ser Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-24 px-6 mb-12">
          <div className="max-w-7xl mx-auto">
            <div
              className="p-12 lg:p-20 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(10,188,86,0.15) 0%, #0f1930 100%)",
                borderRadius: "3rem",
                border: "1px solid rgba(107,255,143,0.1)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none -mr-48 -mt-48"
                style={{ backgroundColor: "rgba(107,255,143,0.08)", filter: "blur(120px)" }}
              />
              <h2 className="font-headline text-4xl lg:text-5xl font-extrabold mb-6 max-w-2xl mx-auto relative z-10" style={{ color: "#dee5ff" }}>
                Seu negócio merece controle de verdade
              </h2>
              <p className="text-lg lg:text-xl mb-10 max-w-xl mx-auto relative z-10" style={{ color: "#a3aac4" }}>
                Junte-se a empreendedores que simplificaram sua rotina e aumentaram seus lucros.
              </p>
              <Link
                href="/cadastro"
                className="inline-block px-12 py-5 rounded-full font-bold text-xl transition-transform hover:scale-105 shadow-2xl relative z-10"
                style={{ backgroundColor: "#6bff8f", color: "#002c0f", boxShadow: "0 8px 40px rgba(107,255,143,0.25)" }}
              >
                Criar minha conta grátis
              </Link>
              <p className="mt-6 text-sm relative z-10" style={{ color: "#a3aac4" }}>Sem cartão de crédito necessário.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: "#091328", borderTop: "1px solid #192540" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto px-8 py-12">
          <div className="col-span-1">
            <div className="text-lg font-bold mb-4" style={{ color: "#dee5ff" }}>VendaPro</div>
            <p className="text-xs leading-relaxed" style={{ color: "#a3aac4" }}>
              Simplificando a vida do microempreendedor brasileiro com tecnologia de ponta e interface intuitiva.
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="font-bold text-sm" style={{ color: "#dee5ff" }}>Produto</h5>
            <ul className="space-y-2">
              <li><a href="#funcionalidades" className="text-xs transition-colors hover:text-emerald-400" style={{ color: "#a3aac4" }}>Funcionalidades</a></li>
              <li><a href="#precos" className="text-xs transition-colors hover:text-emerald-400" style={{ color: "#a3aac4" }}>Preços</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-bold text-sm" style={{ color: "#dee5ff" }}>Acesso</h5>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-xs transition-colors hover:text-emerald-400" style={{ color: "#a3aac4" }}>Entrar</Link></li>
              <li><Link href="/cadastro" className="text-xs transition-colors hover:text-emerald-400" style={{ color: "#a3aac4" }}>Criar conta</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-bold text-sm" style={{ color: "#dee5ff" }}>Legal</h5>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs transition-colors hover:text-emerald-400" style={{ color: "#a3aac4" }}>Termos de Uso</a></li>
              <li><a href="#" className="text-xs transition-colors hover:text-emerald-400" style={{ color: "#a3aac4" }}>Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 pb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs" style={{ color: "#a3aac4" }}>© 2025 VendaPro. Todos os direitos reservados.</p>
          <div className="flex gap-3">
            <a
              href="#"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-emerald-400"
              style={{ backgroundColor: "#192540", color: "#a3aac4" }}
            >
              <Globe size={15} />
            </a>
            <a
              href="#"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-emerald-400"
              style={{ backgroundColor: "#192540", color: "#a3aac4" }}
            >
              <Mail size={15} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
