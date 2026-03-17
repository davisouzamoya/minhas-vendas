import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const count = await prisma.transaction.count({
    where: { userId: user.id, tipo: "venda", statusPagamento: "pendente" },
  });

  return NextResponse.json({ count });
}
