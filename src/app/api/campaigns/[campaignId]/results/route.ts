import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const results = await prisma.spinResult.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: { participant: true, prize: true },
  });

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      participantName: r.participant.name,
      participantPhone: r.participant.phone,
      prizeLabel: r.prize?.label ?? "No Prize",
      isWin: r.isWin,
      createdAt: r.createdAt,
    })),
  });
}
