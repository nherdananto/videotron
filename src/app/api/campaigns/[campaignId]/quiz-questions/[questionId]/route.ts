import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setQuizQuestionActiveSchema } from "@/lib/validation";
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
  const parsed = setQuizQuestionActiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      // Only one question per campaign can be "on air" at a time.
      await tx.quizQuestion.updateMany({
        where: { campaignId: campaign.id, isActive: true },
        data: { isActive: false },
      });
    }
    await tx.quizQuestion.update({
      where: { id: questionId },
      data: {
        isActive: parsed.data.isActive,
        activatedAt: parsed.data.isActive ? new Date() : undefined,
      },
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
  await prisma.quizQuestion.delete({ where: { id: questionId } });
  notifyCampaignUpdated(campaignId);
  return NextResponse.json({ ok: true });
}
