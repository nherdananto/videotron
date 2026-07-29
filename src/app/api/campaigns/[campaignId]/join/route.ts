import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { joinCampaignSchema } from "@/lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignId },
    include: { games: { where: { gameType: "SPIN_WHEEL" } } },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const now = new Date();
  const withinSchedule = (!campaign.startAt || now >= campaign.startAt) && (!campaign.endAt || now <= campaign.endAt);
  if (campaign.status !== "ACTIVE" || !withinSchedule || !campaign.games[0]?.isActive) {
    return NextResponse.json({ error: "Campaign belum aktif atau sudah berakhir" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = joinCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let participant = await prisma.participant.findUnique({
    where: { campaignId_phone: { campaignId: campaign.id, phone: parsed.data.phone } },
  });

  if (!participant) {
    participant = await prisma.participant.create({
      data: {
        campaignId: campaign.id,
        name: parsed.data.name,
        email: parsed.data.email ?? undefined,
        phone: parsed.data.phone,
        sessionToken: nanoid(24),
      },
    });
  }

  const existingSpin = await prisma.spinResult.findUnique({
    where: { campaignId_participantId: { campaignId: campaign.id, participantId: participant.id } },
  });

  return NextResponse.json({
    sessionToken: participant.sessionToken,
    participantId: participant.id,
    hasPlayed: Boolean(existingSpin),
  });
}
