import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startRace, getStandings, RacingEngineError } from "@/server/racingEngine";
import { emitToCampaign } from "@/lib/realtime";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; sessionId: string }> }
) {
  const { campaignId, sessionId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  try {
    const session = await startRace(campaign.id, sessionId);
    emitToCampaign(campaignId, "racing:update", {
      sessionId: session.id,
      status: session.status,
      startedAt: session.startedAt?.toISOString() ?? null,
      endsAt: session.endsAt?.toISOString() ?? null,
      standings: await getStandings(session.id),
    });
    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof RacingEngineError ? error.message : "Gagal memulai race";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
