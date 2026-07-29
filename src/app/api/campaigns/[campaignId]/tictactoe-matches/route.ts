import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsUser } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const matches = await prisma.ticTacToeMatch.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: { playerX: true, playerO: true },
  });

  const stats = {
    totalMatches: matches.length,
    xWins: matches.filter((m) => m.winner === "X").length,
    oWins: matches.filter((m) => m.winner === "O").length,
    draws: matches.filter((m) => m.winner === "DRAW").length,
  };

  return NextResponse.json({
    stats,
    matches: matches.map((m) => ({
      id: m.id,
      playerXName: m.playerX.name,
      playerOName: m.playerO?.name ?? null,
      status: m.status,
      winner: m.winner,
      createdAt: m.createdAt,
      finishedAt: m.finishedAt,
    })),
  });
}
