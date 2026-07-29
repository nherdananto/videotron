import { prisma } from "@/lib/prisma";

export class RacingEngineError extends Error {}

const COUNTDOWN_MS = 3000;
const PROGRESS_PER_TAP = 4;

export interface RaceStanding {
  participantId: string;
  name: string;
  progress: number;
  finishedAt: string | null;
  rank: number | null;
}

async function getStandings(raceSessionId: string): Promise<RaceStanding[]> {
  const participants = await prisma.raceParticipant.findMany({
    where: { raceSessionId },
    include: { participant: true },
  });
  return participants
    .map((p) => ({
      participantId: p.participantId,
      name: p.participant.name,
      progress: Math.min(100, p.progress),
      finishedAt: p.finishedAt?.toISOString() ?? null,
      rank: p.rank,
    }))
    .sort((a, b) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      return b.progress - a.progress;
    });
}

/** Lazily evolves WAITING->COUNTDOWN->RUNNING->FINISHED based on wall-clock time — no server timers to manage. */
export async function ensureSessionStatus(sessionId: string) {
  let session = await prisma.raceSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new RacingEngineError("Race tidak ditemukan");

  const now = Date.now();
  if (session.status === "COUNTDOWN" && session.startedAt && now >= session.startedAt.getTime()) {
    session = await prisma.raceSession.update({ where: { id: sessionId }, data: { status: "RUNNING" } });
  }
  if (session.status === "RUNNING" && session.endsAt && now >= session.endsAt.getTime()) {
    await finalizeSession(sessionId);
    session = await prisma.raceSession.findUnique({ where: { id: sessionId } });
  }
  return session!;
}

async function finalizeSession(sessionId: string) {
  const unfinished = await prisma.raceParticipant.findMany({
    where: { raceSessionId: sessionId, finishedAt: null },
    orderBy: { progress: "desc" },
  });
  const finishedCount = await prisma.raceParticipant.count({
    where: { raceSessionId: sessionId, finishedAt: { not: null } },
  });

  await prisma.$transaction([
    ...unfinished.map((p, i) =>
      prisma.raceParticipant.update({ where: { id: p.id }, data: { rank: finishedCount + i + 1 } })
    ),
    prisma.raceSession.update({ where: { id: sessionId }, data: { status: "FINISHED" } }),
  ]);
}

export async function joinRace(campaignId: string, participantId: string, raceSessionId: string) {
  const session = await ensureSessionStatus(raceSessionId);
  if (session.campaignId !== campaignId) {
    throw new RacingEngineError("Race tidak ditemukan untuk campaign ini");
  }
  if (session.status !== "WAITING") {
    throw new RacingEngineError("Race sudah dimulai, tidak bisa join lagi");
  }

  const existing = await prisma.raceParticipant.findUnique({
    where: { raceSessionId_participantId: { raceSessionId, participantId } },
  });
  if (existing) return session;

  const count = await prisma.raceParticipant.count({ where: { raceSessionId } });
  if (count >= session.maxPlayers) {
    throw new RacingEngineError("Race sudah penuh");
  }

  await prisma.raceParticipant.create({ data: { raceSessionId, participantId } });
  return session;
}

export async function startRace(campaignId: string, sessionId: string) {
  const existing = await prisma.raceSession.findUnique({ where: { id: sessionId } });
  if (!existing || existing.campaignId !== campaignId) {
    throw new RacingEngineError("Race tidak ditemukan untuk campaign ini");
  }
  if (existing.status !== "WAITING") {
    throw new RacingEngineError("Race sudah dimulai");
  }

  const startedAt = new Date(Date.now() + COUNTDOWN_MS);
  const session = await prisma.raceSession.update({
    where: { id: sessionId },
    data: { status: "COUNTDOWN", startedAt },
  });
  const endsAt = new Date(startedAt.getTime() + session.durationSeconds * 1000);
  return prisma.raceSession.update({ where: { id: sessionId }, data: { endsAt } });
}

export async function accelerate(campaignId: string, participantId: string, raceSessionId: string) {
  const session = await ensureSessionStatus(raceSessionId);
  if (session.campaignId !== campaignId) {
    throw new RacingEngineError("Race tidak ditemukan untuk campaign ini");
  }
  if (session.status !== "RUNNING") {
    throw new RacingEngineError("Race belum berjalan");
  }

  const participant = await prisma.raceParticipant.findUnique({
    where: { raceSessionId_participantId: { raceSessionId, participantId } },
  });
  if (!participant) {
    throw new RacingEngineError("Anda tidak terdaftar di race ini");
  }

  if (!participant.finishedAt) {
    // Atomic increment — a plain read-then-write here loses updates under concurrent taps.
    const updated = await prisma.raceParticipant.update({
      where: { id: participant.id },
      data: { progress: { increment: PROGRESS_PER_TAP } },
    });

    if (updated.progress >= 100 && !updated.finishedAt) {
      // updateMany's WHERE is evaluated atomically, so only one concurrent tap can win this claim.
      const claimed = await prisma.raceParticipant.updateMany({
        where: { id: participant.id, finishedAt: null },
        data: { finishedAt: new Date() },
      });
      if (claimed.count === 1) {
        const rank = await prisma.raceParticipant.count({ where: { raceSessionId, finishedAt: { not: null } } });
        await prisma.raceParticipant.update({ where: { id: participant.id }, data: { rank } });
      }
    }
  }

  return { session, standings: await getStandings(raceSessionId) };
}

export { getStandings };
