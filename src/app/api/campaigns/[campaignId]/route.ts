import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCampaignSchema } from "@/lib/validation";
import { campaignRoomName } from "@/lib/games";

function notifyCampaignUpdated(campaignId: string) {
  import("@/server/ioSingleton")
    .then(({ getIO }) => getIO().to(campaignRoomName(campaignId)).emit("campaign:updated", { campaignId }))
    .catch(() => {
      // Socket server not initialized (e.g. during build) — safe to ignore.
    });
}

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

  const { spinWheelActive, ...campaignFields } = parsed.data;

  await prisma.campaign.update({
    where: { slug: campaignId },
    data: campaignFields,
  });

  if (spinWheelActive !== undefined) {
    await prisma.campaignGame.update({
      where: { campaignId_gameType: { campaignId: existing.id, gameType: "SPIN_WHEEL" } },
      data: { isActive: spinWheelActive },
    });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignId },
    include: { games: true },
  });

  notifyCampaignUpdated(campaignId);
  return NextResponse.json({ campaign });
}
