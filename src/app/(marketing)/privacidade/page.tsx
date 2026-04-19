import Link from "next/link";
import { TrendingUp } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade — VendaPro",
  description: "Como o VendaPro coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-400 mb-10">Última atualização: abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Quem somos</h2>
            <p className="text-gray-600">
              O <strong>VendaPro</strong> é uma plataforma de gestão financeira para pequenos negócios.
              Esta política descreve como coletamos, usamos e protegemos seus dados pessoais,
              em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Dados que coletamos</h2>
            <div className="space-y-3 text-gray-600">
              <div>
                <p className="font-medium text-gray-700">Dados de cadastro:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Nome e e-mail (fornecidos no cadastro)</li>
                  <li>Logotipo do negócio (opcional)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Dados financeiros do seu negócio:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Transações (vendas, despesas, entradas e saídas)</li>
                  <li>Clientes e fornecedores cadastrados</li>
                  <li>Produtos e estoque</li>
                  <li>Fotos de comprovantes (opcional)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Dados de pagamento:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Dados de cartão <strong>não são armazenados</strong> em nossos servidores — são processados diretamente pela Stripe</li>
                  <li>Armazenamos apenas o identificador do cliente e da assinatura na Stripe</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Dados de uso:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Informações de acesso e navegação para fins de melhoria do serviço</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Fornecer e operar a plataforma</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Enviar comunicações sobre o serviço (quando aplicável)</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Cumprir obrigações legais</li>
            </ul>
            <p className="mt-2 text-gray-600">
              <strong>Não vendemos, alugamos ou compartilhamos seus dados financeiros com terceiros para fins comerciais.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Compartilhamento com terceiros</h2>
            <p className="text-gray-600 mb-2">
              Utilizamos os seguintes serviços de terceiros, cada um com sua própria política de privacidade:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Supabase</strong> — autenticação e armazenamento de dados (servidores na nuvem)</li>
              <li><strong>Stripe</strong> — processamento seguro de pagamentos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Retenção de dados</h2>
            <p className="text-gray-600">
              Os dados financeiros são retidos conforme o plano contratado (30 dias a ilimitado).
              Ao cancelar a conta, todos os seus dados são excluídos permanentemente em até 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Segurança</h2>
            <p className="text-gray-600">
              Adotamos medidas técnicas para proteger seus dados, incluindo:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
              <li>Comunicação criptografada via HTTPS</li>
              <li>Autenticação segura via Supabase Auth</li>
              <li>Acesso aos dados restrito ao próprio usuário</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Seus direitos (LGPD)</h2>
            <p className="text-gray-600 mb-2">Você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
            <p className="mt-2 text-gray-600">
              Para exercer esses direitos, entre em contato pelo e-mail abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Cookies</h2>
            <p className="text-gray-600">
              Utilizamos cookies essenciais para manter sua sessão autenticada. Não utilizamos
              cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Alterações nesta política</h2>
            <p className="text-gray-600">
              Podemos atualizar esta política periodicamente. Alterações significativas serão
              comunicadas por e-mail ou via aviso na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Contato e DPO</h2>
            <p className="text-gray-600">
              Para dúvidas, solicitações ou exercício dos seus direitos, entre em contato:{" "}
              <a href="mailto:suporte@appvendapro.com.br" className="text-green-600 hover:underline">
                suporte@appvendapro.com.br
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 flex gap-6 text-sm text-gray-400">
          <Link href="/termos" className="hover:text-gray-600">Termos de Uso</Link>
          <Link href="/" className="hover:text-gray-600">Voltar ao início</Link>
        </div>
      </main>
    </div>
  );
}
