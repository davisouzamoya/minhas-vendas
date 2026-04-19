import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";
import { enviarEmailTrialExpirando } from "@/app/(backend)/lib/email";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Busca perfis com trial expirando em exatamente 3 dias
  const em3dias = new Date();
  em3dias.setDate(em3dias.getDate() + 3);
  const inicio = new Date(em3dias);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(em3dias);
  fim.setHours(23, 59, 59, 999);

  const perfis = await prisma.perfil.findMany({
    where: {
      trialEndsAt: { gte: inicio, lte: fim },
      plan: "gratuito",
    },
  });

  if (perfis.length === 0) return NextResponse.json({ enviados: 0 });

  // Busca e-mails no Supabase Auth
  const supabase = await createClient();
  let enviados = 0;

  for (const perfil of perfis) {
    try {
      const { data } = await supabase.auth.admin.getUserById(perfil.userId);
      if (data.user?.email) {
        await enviarEmailTrialExpirando(data.user.email, 3);
        enviados++;
      }
    } catch {
      // Continua para o próximo
    }
  }

  return NextResponse.json({ enviados });
}
