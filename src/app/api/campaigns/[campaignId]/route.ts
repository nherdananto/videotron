import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCampaignSchema } from "@/lib/validation";
import { notifyCampaignUpdated } from "@/lib/realtime";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignId },
    include: {
      games: true,
      spinPrizes: { orderBy: { createdAt: "asc" } },
      _count: { select: { participants: true, spinResults: true } },
    },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const body = await request.json();
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!existing) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const { spinWheelActive, votingActive, pollingActive, quizActive, ticTacToeActive, racingActive, ...campaignFields } =
    parsed.data;

  await prisma.campaign.update({
    where: { slug: campaignId },
    data: campaignFields,
  });

  const gameActivations: {
    gameType: "SPIN_WHEEL" | "VOTING" | "POLLING" | "QUIZ" | "TIC_TAC_TOE" | "RACING";
    isActive?: boolean;
  }[] = [
    { gameType: "SPIN_WHEEL", isActive: spinWheelActive },
    { gameType: "VOTING", isActive: votingActive },
    { gameType: "POLLING", isActive: pollingActive },
    { gameType: "QUIZ", isActive: quizActive },
    { gameType: "TIC_TAC_TOE", isActive: ticTacToeActive },
    { gameType: "RACING", isActive: racingActive },
  ];
  for (const { gameType, isActive } of gameActivations) {
    if (isActive === undefined) continue;
    await prisma.campaignGame.upsert({
      where: { campaignId_gameType: { campaignId: existing.id, gameType } },
      update: { isActive },
      create: { campaignId: existing.id, gameType, isActive },
    });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignId },
    include: { games: true },
  });

  notifyCampaignUpdated(campaignId);
  return NextResponse.json({ campaign });
}
