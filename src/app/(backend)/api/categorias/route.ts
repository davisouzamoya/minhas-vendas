import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

const DEFAULT_CATEGORIAS = ["roupa", "alimentação", "fornecedor", "transporte", "serviço", "outro"];

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getCats(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ categorias: string[] | null }[]>`
    SELECT "categorias" FROM "Perfil" WHERE "userId" = ${userId} LIMIT 1
  `;
  return rows[0]?.categorias ?? DEFAULT_CATEGORIAS;
}

async function saveCats(userId: string, cats: string[]) {
  const json = JSON.stringify(cats);
  await prisma.$executeRaw`
    UPDATE "Perfil" SET "categorias" = ${json}::jsonb WHERE "userId" = ${userId}
  `;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await getCats(userId));
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const nome = body.nome?.trim()?.toLowerCase();
    if (!nome) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });

    const cats = await getCats(userId);
    if (cats.includes(nome)) return NextResponse.json(cats);

    const updated = [...cats, nome];
    await saveCats(userId, updated);
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

    const cats = await getCats(userId);
    const updated = cats.filter((c) => c !== nome);
    await saveCats(userId, updated);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
