import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/(backend)/lib/supabase/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import {
  enviarEmailBoasVindas,
  enviarEmailAssinaturaAtivada,
  enviarEmailTrialExpirando,
  enviarEmailAssinaturaCancelada,
} from "@/app/(backend)/lib/email";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("Perfil").select("role").eq("userId", user.id).single();
  return perfil?.role === "admin" ? user : null;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { tipo } = await request.json();
  const email = admin.email!;
  const perfil = await prisma.perfil.findUnique({ where: { userId: admin.id } });
  const nomeNegocio = perfil?.nomeNegocio ?? "Teste";

  try {
    switch (tipo) {
      case "boas-vindas":
        await enviarEmailBoasVindas(email, nomeNegocio);
        break;
      case "assinatura":
        await enviarEmailAssinaturaAtivada(email, "pro");
        break;
      case "trial":
        await enviarEmailTrialExpirando(email, 3);
        break;
      case "cancelamento":
        await enviarEmailAssinaturaCancelada(email);
        break;
      default:
        return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, enviado_para: email });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
