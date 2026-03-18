import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const transactionId = parseInt(id);
    const body = await request.json();

    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        tipo: body.tipo,
        descricao: body.descricao,
        produto: body.produto ?? null,
        categoria: body.categoria ?? null,
        quantidade: body.quantidade ?? null,
        valorUnitario: body.valor_unitario ?? null,
        valorTotal: body.valor_total,
        formaPagamento: body.forma_pagamento ?? null,
        statusPagamento: body.statusPagamento ?? null,
        observacoes: body.observacoes ?? null,
        comprovanteUrl: body.comprovanteUrl ?? null,
        fotoUrl: body.fotoUrl ?? null,
        data: new Date(body.data),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/transactions/:id]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const transactionId = parseInt(id);

    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    await prisma.transaction.delete({ where: { id: transactionId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/transactions/:id]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
