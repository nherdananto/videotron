import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePrizeSchema } from "@/lib/validation";
import { requireCmsUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; prizeId: string }> }
) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { prizeId } = await params;
  const body = await request.json();
  const parsed = updatePrizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.quota !== undefined) {
    data.quotaRemaining = parsed.data.quota;
  }

  const prize = await prisma.spinPrize.update({
    where: { id: prizeId },
    data,
  });
  return NextResponse.json({ prize });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; prizeId: string }> }
) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { prizeId } = await params;
  await prisma.spinPrize.delete({ where: { id: prizeId } });
  return NextResponse.json({ ok: true });
}
