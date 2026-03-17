import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { ids, statusPagamento } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });

  await prisma.transaction.updateMany({
    where: { id: { in: ids }, userId },
    data: { statusPagamento },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });

  await prisma.transaction.deleteMany({
    where: { id: { in: ids }, userId },
  });

  return NextResponse.json({ ok: true });
}
