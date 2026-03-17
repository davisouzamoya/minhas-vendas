import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const fornecedores = await prisma.fornecedor.findMany({
    where: { userId },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(fornecedores);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const fornecedor = await prisma.fornecedor.create({
      data: {
        userId,
        nome: body.nome,
        telefone: body.telefone ?? null,
        email: body.email ?? null,
      },
    });

    return NextResponse.json(fornecedor, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
