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

  const clientes = await prisma.cliente.findMany({
    where: { userId },
    orderBy: { nome: "asc" },
    include: {
      transacoes: {
        select: { valorTotal: true, data: true, statusPagamento: true, tipo: true },
        orderBy: { data: "desc" },
      },
    },
  });

  const now = Date.now();
  const resultado = clientes.map((c) => {
    const vendas = c.transacoes.filter((t) => t.tipo === "venda" || t.tipo === "entrada");
    const lastPurchase = vendas[0] ?? null;
    const pendingAmount = c.transacoes
      .filter((t) => t.statusPagamento === "pendente")
      .reduce((s, t) => s + t.valorTotal, 0);
    const daysSince = lastPurchase
      ? Math.floor((now - new Date(lastPurchase.data).getTime()) / 86400000)
      : null;

    return {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      aniversario: c.aniversario?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      lastPurchaseDate: lastPurchase?.data.toISOString() ?? null,
      lastPurchaseAmount: lastPurchase?.valorTotal ?? null,
      daysSinceLastPurchase: daysSince,
      pendingAmount,
      isNew: now - new Date(c.createdAt).getTime() < 30 * 86400000,
    };
  });

  return NextResponse.json(resultado);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const cliente = await prisma.cliente.create({
      data: {
        userId,
        nome: body.nome,
        telefone: body.telefone ?? null,
        email: body.email ?? null,
        aniversario: body.aniversario ? new Date(body.aniversario) : null,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
