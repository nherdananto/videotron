import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { joinCampaignSchema } from "@/lib/validation";
import { GAME_SLUGS } from "@/lib/games";
import { joinOrCreateMatch, toMatchPayload, TicTacToeEngineError } from "@/server/ticTacToeEngine";
import { joinRace, ensureSessionStatus, getStandings, RacingEngineError } from "@/server/racingEngine";
import { emitToCampaign } from "@/lib/realtime";

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const body = await request.json();
  const parsed = joinCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const gameType = GAME_SLUGS[parsed.data.game];
  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignId },
    include: { games: { where: { gameType } } },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const now = new Date();
  const withinSchedule = (!campaign.startAt || now >= campaign.startAt) && (!campaign.endAt || now <= campaign.endAt);
  if (campaign.status !== "ACTIVE" || !withinSchedule || !campaign.games[0]?.isActive) {
    return NextResponse.json({ error: "Campaign belum aktif atau sudah berakhir" }, { status: 403 });
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

  if (parsed.data.game === "spin-wheel") {
    const existingSpin = await prisma.spinResult.findUnique({
      where: { campaignId_participantId: { campaignId: campaign.id, participantId: participant.id } },
    });
    return NextResponse.json({
      sessionToken: participant.sessionToken,
      participantId: participant.id,
      hasPlayed: Boolean(existingSpin),
    });
  }

  if (parsed.data.game === "voting") {
    const activeQuestion = await prisma.votingQuestion.findFirst({
      where: { campaignId: campaign.id, isActive: true },
    });
    const existingVote = activeQuestion
      ? await prisma.voteEntry.findUnique({
          where: { votingQuestionId_participantId: { votingQuestionId: activeQuestion.id, participantId: participant.id } },
        })
      : null;

    return NextResponse.json({
      sessionToken: participant.sessionToken,
      participantId: participant.id,
      activeQuestionId: activeQuestion?.id ?? null,
      votedOptionId: existingVote?.votingOptionId ?? null,
    });
  }

  if (parsed.data.game === "polling") {
    const activeSession = await prisma.pollSession.findFirst({
      where: { campaignId: campaign.id, isActive: true },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    const answers = activeSession
      ? await prisma.pollAnswer.findMany({
          where: {
            participantId: participant.id,
            pollQuestionId: { in: activeSession.questions.map((q) => q.id) },
          },
        })
      : [];

    return NextResponse.json({
      sessionToken: participant.sessionToken,
      participantId: participant.id,
      activeSessionId: activeSession?.id ?? null,
      answers: answers.map((a) => ({ pollQuestionId: a.pollQuestionId, pollOptionId: a.pollOptionId })),
    });
  }

  if (parsed.data.game === "quiz") {
    const activeQuestion = await prisma.quizQuestion.findFirst({
      where: { campaignId: campaign.id, isActive: true },
    });
    const existingAnswer = activeQuestion
      ? await prisma.quizAnswer.findUnique({
          where: { quizQuestionId_participantId: { quizQuestionId: activeQuestion.id, participantId: participant.id } },
        })
      : null;

    return NextResponse.json({
      sessionToken: participant.sessionToken,
      participantId: participant.id,
      activeQuestionId: activeQuestion?.id ?? null,
      answeredOptionId: existingAnswer?.quizOptionId ?? null,
    });
  }

  if (parsed.data.game === "tic-tac-toe") {
    try {
      const match = await joinOrCreateMatch(campaign.id, participant.id);
      emitToCampaign(campaignId, "tictactoe:update", toMatchPayload(match));
      const symbol = participant.id === match.playerXId ? "X" : "O";
      return NextResponse.json({
        sessionToken: participant.sessionToken,
        participantId: participant.id,
        symbol,
        match: toMatchPayload(match),
      });
    } catch (error) {
      const message = error instanceof TicTacToeEngineError ? error.message : "Gagal bergabung ke permainan";
      return NextResponse.json({ error: message }, { status: 409 });
    }
  }

  // game === "racing"
  const activeSession = await prisma.raceSession.findFirst({
    where: { campaignId: campaign.id, status: { in: ["WAITING", "COUNTDOWN", "RUNNING"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!activeSession) {
    return NextResponse.json({
      sessionToken: participant.sessionToken,
      participantId: participant.id,
      raceSessionId: null,
    });
  }

  try {
    const session = await ensureSessionStatus(activeSession.id);
    if (session.status === "WAITING") {
      await joinRace(campaign.id, participant.id, session.id);
    }
    const raceParticipant = await prisma.raceParticipant.findUnique({
      where: { raceSessionId_participantId: { raceSessionId: session.id, participantId: participant.id } },
    });
    return NextResponse.json({
      sessionToken: participant.sessionToken,
      participantId: participant.id,
      raceSessionId: session.id,
      trackName: session.trackName,
      status: session.status,
      startedAt: session.startedAt?.toISOString() ?? null,
      endsAt: session.endsAt?.toISOString() ?? null,
      joined: Boolean(raceParticipant),
      standings: await getStandings(session.id),
    });
  } catch (error) {
    const message = error instanceof RacingEngineError ? error.message : "Gagal bergabung ke race";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
