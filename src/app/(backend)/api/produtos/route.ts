import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const apenasAtivos = searchParams.get("ativos") === "1";

  const produtos = await prisma.produto.findMany({
    where: {
      userId,
      ...(apenasAtivos ? { ativo: true } : {}),
      ...(q ? { nome: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(produtos);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const produto = await prisma.produto.create({
      data: {
        userId,
        nome: body.nome,
        descricao: body.descricao ?? null,
        categoria: body.categoria ?? null,
        preco: body.preco != null ? Number(body.preco) : null,
        precoCusto: body.precoCusto != null ? Number(body.precoCusto) : null,
        estoque: body.estoque != null ? Number(body.estoque) : 0,
        estoqueMinimo: body.estoqueMinimo != null ? Number(body.estoqueMinimo) : null,
        unidade: body.unidade ?? null,
        ativo: body.ativo !== false,
        fotoUrl: body.fotoUrl ?? null,
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
