import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const clienteId = parseInt(id);
  if (isNaN(clienteId)) return NextResponse.json({ total: 0, count: 0 });

  const pendentes = await prisma.transaction.aggregate({
    where: { userId: user.id, clienteId, tipo: "venda", statusPagamento: "pendente" },
    _sum: { valorTotal: true },
    _count: true,
  });

  return NextResponse.json({
    total: pendentes._sum.valorTotal ?? 0,
    count: pendentes._count,
  });
}
