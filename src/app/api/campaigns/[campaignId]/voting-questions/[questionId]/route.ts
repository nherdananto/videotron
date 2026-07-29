import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setVotingQuestionActiveSchema } from "@/lib/validation";
import { notifyCampaignUpdated } from "@/lib/realtime";
import { requireCmsUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; questionId: string }> }
) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { campaignId, questionId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = setVotingQuestionActiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      // Only one voting question can be "on air" per campaign at a time.
      await tx.votingQuestion.updateMany({
        where: { campaignId: campaign.id, isActive: true },
        data: { isActive: false },
      });
    }
    await tx.votingQuestion.update({
      where: { id: questionId },
      data: { isActive: parsed.data.isActive },
    });
  });

  notifyCampaignUpdated(campaignId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; questionId: string }> }
) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { campaignId, questionId } = await params;
  await prisma.votingQuestion.delete({ where: { id: questionId } });
  notifyCampaignUpdated(campaignId);
  return NextResponse.json({ ok: true });
}
