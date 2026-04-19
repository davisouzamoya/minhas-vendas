import Link from "next/link";
import { TrendingUp } from "lucide-react";

export const metadata = {
  title: "Termos de Uso — VendaPro",
  description: "Termos e condições de uso da plataforma VendaPro.",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          VendaPro
        </Link>
        <Link href="/login" className="text-sm text-green-600 hover:underline font-medium">
          Entrar
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-400 mb-10">Última atualização: abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta ou utilizar a plataforma <strong>VendaPro</strong>, você concorda com estes Termos de Uso.
              Se não concordar com algum item, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Descrição do Serviço</h2>
            <p>
              O VendaPro é uma plataforma de gestão financeira para pequenos negócios, que permite registrar
              vendas, despesas, controlar estoque, clientes e fornecedores, e visualizar relatórios financeiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Conta e Responsabilidades</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Você é responsável por manter a confidencialidade da sua senha.</li>
              <li>Cada conta é pessoal e intransferível.</li>
              <li>Você deve fornecer informações verdadeiras no cadastro.</li>
              <li>É proibido usar a plataforma para atividades ilegais ou fraudulentas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Planos e Pagamentos</h2>
            <p className="text-gray-600">
              O VendaPro oferece um período de teste gratuito de <strong>7 dias</strong> com acesso completo.
              Após esse período, o acesso é limitado ao plano gratuito ou mediante assinatura de um plano pago.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
              <li>Os pagamentos são processados de forma segura pela <strong>Stripe</strong>.</li>
              <li>As assinaturas são renovadas automaticamente todo mês.</li>
              <li>Você pode cancelar a qualquer momento pelo portal de assinatura.</li>
              <li>Não há reembolso proporcional para cancelamentos no meio do período.</li>
              <li>Os preços podem ser alterados com aviso prévio de 30 dias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Retenção e Exclusão de Dados</h2>
            <p className="text-gray-600">
              Os dados financeiros são retidos conforme o plano contratado:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
              <li><strong>Gratuito:</strong> histórico de 30 dias</li>
              <li><strong>Básico:</strong> histórico de 90 dias</li>
              <li><strong>Pro:</strong> histórico de 1 ano</li>
              <li><strong>Full:</strong> histórico ilimitado</li>
            </ul>
            <p className="mt-2 text-gray-600">
              Registros mais antigos que o limite do plano são excluídos automaticamente.
              Ao cancelar a conta, todos os dados são removidos em até 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Propriedade dos Dados</h2>
            <p className="text-gray-600">
              Todos os dados inseridos na plataforma pertencem a você. O VendaPro não vende,
              compartilha ou utiliza seus dados financeiros para fins comerciais além da operação do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Disponibilidade do Serviço</h2>
            <p className="text-gray-600">
              Buscamos manter o serviço disponível 24h por dia, 7 dias por semana. No entanto, não garantimos
              disponibilidade ininterrupta e não nos responsabilizamos por prejuízos decorrentes de indisponibilidade
              temporária.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Cancelamento</h2>
            <p className="text-gray-600">
              Você pode cancelar sua conta a qualquer momento pelo painel de configurações.
              Podemos suspender ou encerrar contas que violem estes termos, com ou sem aviso prévio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Limitação de Responsabilidade</h2>
            <p className="text-gray-600">
              O VendaPro é uma ferramenta de apoio à gestão. Não nos responsabilizamos por decisões
              financeiras tomadas com base nas informações da plataforma, nem por perdas de dados
              causadas por uso indevido da conta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Contato</h2>
            <p className="text-gray-600">
              Dúvidas sobre estes termos podem ser enviadas para:{" "}
              <a href="mailto:suporte@appvendapro.com.br" className="text-green-600 hover:underline">
                suporte@appvendapro.com.br
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 flex gap-6 text-sm text-gray-400">
          <Link href="/privacidade" className="hover:text-gray-600">Política de Privacidade</Link>
          <Link href="/" className="hover:text-gray-600">Voltar ao início</Link>
        </div>
      </main>
    </div>
  );
}
