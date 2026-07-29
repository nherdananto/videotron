import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRaceSessionSchema } from "@/lib/validation";
import { getStandings } from "@/server/racingEngine";
import { requireCmsUser } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const sessions = await prisma.raceSession.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
  });

  const withStandings = await Promise.all(
    sessions.map(async (s) => ({
      id: s.id,
      trackName: s.trackName,
      durationSeconds: s.durationSeconds,
      maxPlayers: s.maxPlayers,
      status: s.status,
      createdAt: s.createdAt,
      standings: await getStandings(s.id),
    }))
  );

  return NextResponse.json({ sessions: withStandings });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createRaceSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.raceSession.create({
    data: {
      campaignId: campaign.id,
      trackName: parsed.data.trackName,
      durationSeconds: parsed.data.durationSeconds,
      maxPlayers: parsed.data.maxPlayers,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
