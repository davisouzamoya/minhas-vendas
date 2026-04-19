import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function base(conteudo: string) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <!-- Header -->
            <tr>
              <td style="background:#16a34a;padding:28px 40px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">⚡ VendaPro</span>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 40px 28px;">
                ${conteudo}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #f0f0f0;background:#fafafa;">
                <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                  VendaPro · Gestão digital para pequenos negócios<br>
                  <a href="${APP_URL}/privacidade" style="color:#9ca3af;">Política de Privacidade</a> ·
                  <a href="${APP_URL}/termos" style="color:#9ca3af;">Termos de Uso</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

function btn(texto: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#16a34a;color:#ffffff;font-size:14px;font-weight:600;border-radius:100px;text-decoration:none;">${texto}</a>`;
}

// ─── 1. Boas-vindas (trial ativado) ────────────────────────────────────────
export async function enviarEmailBoasVindas(para: string, nomeNegocio: string) {
  return resend.emails.send({
    from: FROM,
    to: para,
    subject: "Bem-vindo ao VendaPro! Seu trial de 7 dias começou 🎉",
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Olá, ${nomeNegocio || "bem-vindo"}!</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.6;">
        Seu trial gratuito de <strong>7 dias</strong> com acesso completo ao VendaPro foi ativado.
        Aproveite para explorar tudo sem limitações.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:10px;padding:20px;margin-bottom:8px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#15803d;">O que você pode fazer agora:</p>
          <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;line-height:2;">
            <li>Registrar vendas e despesas</li>
            <li>Cadastrar clientes e fornecedores</li>
            <li>Controlar seu estoque</li>
            <li>Ver relatórios e fluxo de caixa</li>
          </ul>
        </td></tr>
      </table>
      ${btn("Acessar o VendaPro", `${APP_URL}/dashboard`)}
    `),
  });
}

// ─── 2. Assinatura ativada ──────────────────────────────────────────────────
export async function enviarEmailAssinaturaAtivada(para: string, plano: string) {
  const nomes: Record<string, string> = { basico: "Básico", pro: "Pro", full: "Full" };
  const nomeDoPlano = nomes[plano] ?? plano;

  return resend.emails.send({
    from: FROM,
    to: para,
    subject: `Assinatura ativada — Plano ${nomeDoPlano} ✅`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Assinatura confirmada!</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
        Seu plano <strong>${nomeDoPlano}</strong> está ativo. Todos os recursos já estão disponíveis na sua conta.
      </p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background:#f9fafb;border-radius:10px;font-size:13px;color:#374151;">
        <tr><td><strong>Plano:</strong> ${nomeDoPlano}</td></tr>
        <tr><td><strong>Renovação:</strong> automática todo mês</td></tr>
        <tr><td><strong>Cancelamento:</strong> a qualquer momento pelo painel</td></tr>
      </table>
      ${btn("Ir para o Dashboard", `${APP_URL}/dashboard`)}
      <p style="margin-top:16px;font-size:12px;color:#9ca3af;">
        Para gerenciar ou cancelar sua assinatura, acesse <a href="${APP_URL}/planos" style="color:#16a34a;">Meus Planos</a>.
      </p>
    `),
  });
}

// ─── 3. Trial expirando ─────────────────────────────────────────────────────
export async function enviarEmailTrialExpirando(para: string, diasRestantes: number) {
  return resend.emails.send({
    from: FROM,
    to: para,
    subject: `Seu trial expira em ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} ⏳`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Seu trial está chegando ao fim</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.6;">
        Faltam apenas <strong>${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}</strong> para o seu período de trial expirar.
        Após isso, o acesso será limitado ao plano gratuito.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:8px;">
        <tr><td>
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
            Assine agora e continue com acesso a <strong>clientes, fornecedores, estoque, relatórios e fluxo de caixa</strong>.
            Planos a partir de <strong>R$ 29/mês</strong>.
          </p>
        </td></tr>
      </table>
      ${btn("Ver planos e assinar", `${APP_URL}/planos`)}
    `),
  });
}

// ─── 4. Assinatura cancelada ────────────────────────────────────────────────
export async function enviarEmailAssinaturaCancelada(para: string) {
  return resend.emails.send({
    from: FROM,
    to: para,
    subject: "Sua assinatura foi cancelada",
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Assinatura cancelada</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.6;">
        Sua assinatura foi cancelada com sucesso. Você voltou para o plano gratuito
        e ainda tem acesso ao histórico dos últimos <strong>30 dias</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:8px;">
        <tr><td>
          <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
            Registros com mais de 30 dias serão removidos automaticamente.
            Exporte seus dados antes de perder o acesso.
          </p>
        </td></tr>
      </table>
      ${btn("Reativar assinatura", `${APP_URL}/planos`)}
      <p style="margin-top:16px;font-size:12px;color:#9ca3af;">
        Sentimos sua falta. Se quiser nos contar o motivo do cancelamento, responda este e-mail.
      </p>
    `),
  });
}
