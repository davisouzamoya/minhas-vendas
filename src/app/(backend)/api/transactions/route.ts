import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

const include = {
  cliente: { select: { id: true, nome: true } },
  fornecedor: { select: { id: true, nome: true } },
};

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const clienteId = searchParams.get("clienteId");
  const fornecedorId = searchParams.get("fornecedorId");
  const exportCsv = searchParams.get("export") === "csv";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = {
    userId,
    ...(tipo && { tipo }),
    ...(categoria && { categoria }),
    ...(clienteId && { clienteId: parseInt(clienteId) }),
    ...(fornecedorId && { fornecedorId: parseInt(fornecedorId) }),
    ...(dataInicio || dataFim ? {
      data: {
        ...(dataInicio && { gte: new Date(dataInicio) }),
        ...(dataFim && { lte: new Date(dataFim + "T23:59:59") }),
      },
    } : {}),
  };

  if (exportCsv) {
    const all = await prisma.transaction.findMany({ where, orderBy: { data: "desc" }, include });
    return NextResponse.json({ transactions: all, total: all.length });
  }

  const [transactions, total, aggVendas, aggDespesas, aggEntradas] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { data: "desc" }, skip: (page - 1) * limit, take: limit, include }),
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({ where: { ...where, tipo: "venda" }, _sum: { valorTotal: true } }),
    prisma.transaction.aggregate({ where: { ...where, tipo: "despesa" }, _sum: { valorTotal: true } }),
    prisma.transaction.aggregate({ where: { ...where, tipo: "entrada" }, _sum: { valorTotal: true } }),
  ]);

  const totais = {
    vendas: aggVendas._sum.valorTotal ?? 0,
    despesas: aggDespesas._sum.valorTotal ?? 0,
    entradas: aggEntradas._sum.valorTotal ?? 0,
    saldo: (aggVendas._sum.valorTotal ?? 0) + (aggEntradas._sum.valorTotal ?? 0) - (aggDespesas._sum.valorTotal ?? 0),
  };

  return NextResponse.json({ transactions, total, page, limit, totais });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();

    const baseData = {
      userId,
      tipo: body.tipo,
      descricao: body.descricao,
      produto: body.produto ?? null,
      categoria: body.categoria ?? null,
      quantidade: body.quantidade ?? null,
      valorUnitario: body.valor_unitario ?? null,
      valorTotal: body.valor_total,
      formaPagamento: body.forma_pagamento ?? null,
      mensagemOriginal: body.mensagem_original ?? null,
      clienteId: body.clienteId ?? null,
      fornecedorId: body.fornecedorId ?? null,
      statusPagamento: body.statusPagamento ?? null,
      recorrente: body.recorrente ?? false,
    };

    const transaction = await prisma.transaction.create({
      data: { ...baseData, data: new Date(body.data) },
      include,
    });

    // Gera cópias mensais se recorrente
    if (body.recorrente && body.meses && body.meses > 1) {
      const baseDate = new Date(body.data);
      const copies = [];
      for (let i = 1; i < body.meses; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        copies.push({ ...baseData, data: d });
      }
      await prisma.transaction.createMany({ data: copies });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error("[POST /api/transactions]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
