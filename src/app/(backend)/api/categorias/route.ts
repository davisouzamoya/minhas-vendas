import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

const DEFAULT_CATEGORIAS = ["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"];

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const perfil = await prisma.perfil.findUnique({ where: { userId } });
  const cats = (perfil as { categorias?: string[] | null } | null)?.categorias;
  return NextResponse.json(cats ?? DEFAULT_CATEGORIAS);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const nome = body.nome?.trim()?.toLowerCase();
    if (!nome) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });

    const perfil = await prisma.perfil.findUnique({ where: { userId } });
    const cats = ((perfil as { categorias?: string[] | null } | null)?.categorias) ?? DEFAULT_CATEGORIAS;
    if (cats.includes(nome)) return NextResponse.json(cats);

    const updated = [...cats, nome];
    await (prisma.perfil as unknown as { upsert: (args: unknown) => Promise<unknown> }).upsert({
      where: { userId },
      update: { categorias: updated },
      create: { userId, nomeNegocio: "", categorias: updated },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const nome = body.nome?.trim()?.toLowerCase();

    const perfil = await prisma.perfil.findUnique({ where: { userId } });
    const cats = ((perfil as { categorias?: string[] | null } | null)?.categorias) ?? DEFAULT_CATEGORIAS;
    const updated = cats.filter((c) => c !== nome);

    await (prisma.perfil as unknown as { upsert: (args: unknown) => Promise<unknown> }).upsert({
      where: { userId },
      update: { categorias: updated },
      create: { userId, nomeNegocio: "", categorias: updated },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
