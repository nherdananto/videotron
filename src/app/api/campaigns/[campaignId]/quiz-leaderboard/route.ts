import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLeaderboard, type LeaderboardPeriod } from "@/server/quizEngine";

export async function GET(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const periodParam = request.nextUrl.searchParams.get("period");
  const period: LeaderboardPeriod =
    periodParam === "week" || periodParam === "month" ? periodParam : "today";

  const entries = await getLeaderboard(campaign.id, period);
  return NextResponse.json({ period, entries });
}
