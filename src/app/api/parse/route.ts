import { NextRequest, NextResponse } from "next/server";
import { parseMessage } from "@/backend/lib/parser";
import { prisma } from "@/backend/lib/prisma";

export async function POST(request: NextRequest) {
  const { mensagem, salvar } = await request.json();

  if (!mensagem) {
    return NextResponse.json({ error: "mensagem é obrigatória" }, { status: 400 });
  }

  const parsed = await parseMessage(mensagem);

  if (salvar) {
    const transaction = await prisma.transaction.create({
      data: {
        tipo: parsed.tipo,
        descricao: parsed.descricao,
        produto: parsed.produto,
        categoria: parsed.categoria,
        quantidade: parsed.quantidade,
        valorUnitario: parsed.valor_unitario,
        valorTotal: parsed.valor_total,
        formaPagamento: parsed.forma_pagamento,
        data: new Date(parsed.data),
        mensagemOriginal: mensagem,
      },
    });
    return NextResponse.json({ parsed, transaction }, { status: 201 });
  }

  return NextResponse.json({ parsed });
}
