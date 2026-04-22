import { NextResponse } from "next/server";
import { prisma } from "@/app/(backend)/lib/prisma";
import { createClient } from "@/app/(backend)/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: perfil } = await supabase.from("Perfil").select("role").eq("userId", user.id).single();
  if (perfil?.role !== "admin") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
  });

  const userIds = [...new Set(feedbacks.map((f) => f.userId))];
  const perfis = userIds.length > 0
    ? await prisma.perfil.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, nomeNegocio: true },
      })
    : [];

  const perfilMap = Object.fromEntries(perfis.map((p) => [p.userId, p.nomeNegocio]));

  const result = feedbacks.map((f) => ({
    ...f,
    nomeNegocio: perfilMap[f.userId] ?? "—",
  }));

  return NextResponse.json(result);
}
