import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const produto = await prisma.produto.findFirst({ where: { id: Number(id), userId } });
  if (!produto) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json(produto);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const exists = await prisma.produto.findFirst({ where: { id: Number(id), userId } });
    if (!exists) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    // Se for ajuste de estoque, apenas atualiza a quantidade
    if (body.ajuste !== undefined) {
      const novoEstoque = exists.estoque + Number(body.ajuste);
      const updated = await prisma.produto.update({
        where: { id: Number(id) },
        data: { estoque: Math.max(0, novoEstoque) },
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.produto.update({
      where: { id: Number(id) },
      data: {
        nome: body.nome,
        descricao: body.descricao ?? null,
        categoria: body.categoria ?? null,
        preco: body.preco != null ? Number(body.preco) : null,
        precoCusto: body.precoCusto != null ? Number(body.precoCusto) : null,
        estoque: body.estoque != null ? Number(body.estoque) : exists.estoque,
        estoqueMinimo: body.estoqueMinimo != null ? Number(body.estoqueMinimo) : null,
        unidade: body.unidade ?? null,
        ativo: body.ativo !== undefined ? body.ativo : exists.ativo,
        fotoUrl: body.fotoUrl !== undefined ? body.fotoUrl : exists.fotoUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const exists = await prisma.produto.findFirst({ where: { id: Number(id), userId } });
    if (!exists) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const vendas = await prisma.transaction.count({
      where: { userId, tipo: "venda", produto: exists.nome },
    });
    if (vendas > 0) {
      return NextResponse.json(
        { error: "Produto possui vendas registradas e não pode ser excluído." },
        { status: 409 }
      );
    }

    await prisma.produto.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
