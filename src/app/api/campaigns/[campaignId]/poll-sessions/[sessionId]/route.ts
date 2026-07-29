import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setPollSessionActiveSchema } from "@/lib/validation";
import { notifyCampaignUpdated } from "@/lib/realtime";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; sessionId: string }> }
) {
  const { campaignId, sessionId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = setPollSessionActiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      // Only one poll session can be "on air" per campaign at a time.
      await tx.pollSession.updateMany({
        where: { campaignId: campaign.id, isActive: true },
        data: { isActive: false },
      });
    }
    await tx.pollSession.update({
      where: { id: sessionId },
      data: { isActive: parsed.data.isActive },
    });
  });

  notifyCampaignUpdated(campaignId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; sessionId: string }> }
) {
  const { campaignId, sessionId } = await params;
  await prisma.pollSession.delete({ where: { id: sessionId } });
  notifyCampaignUpdated(campaignId);
  return NextResponse.json({ ok: true });
}
