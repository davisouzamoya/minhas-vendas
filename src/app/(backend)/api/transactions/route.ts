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
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = {
    userId,
    ...(tipo && { tipo }),
    ...(categoria && { categoria }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { data: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        tipo: body.tipo,
        descricao: body.descricao,
        produto: body.produto ?? null,
        categoria: body.categoria ?? null,
        quantidade: body.quantidade ?? null,
        valorUnitario: body.valor_unitario ?? null,
        valorTotal: body.valor_total,
        formaPagamento: body.forma_pagamento ?? null,
        data: new Date(body.data),
        mensagemOriginal: body.mensagem_original ?? null,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error("[POST /api/transactions]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
