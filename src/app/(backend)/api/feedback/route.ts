import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { tipo, titulo, mensagem } = body;

  if (!tipo || !titulo?.trim() || !mensagem?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const tiposValidos = ["melhoria", "bug", "elogio"];
  if (!tiposValidos.includes(tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: { userId, tipo, titulo: titulo.trim(), mensagem: mensagem.trim() },
  });

  return NextResponse.json(feedback, { status: 201 });
}
