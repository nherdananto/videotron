import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { userId } = await params;
  if (userId === auth.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun Anda sendiri" }, { status: 400 });
  }

  await prisma.cmsUser.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
