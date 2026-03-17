import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
