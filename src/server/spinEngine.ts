import type { Prisma, SpinPrize } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class SpinEngineError extends Error {}

interface SpinOutcome {
  participantId: string;
  participantName: string;
  prizeId: string | null;
  prizeLabel: string;
  isWin: boolean;
  stopAngle: number;
}

function isPrizeEligibleNow(prize: SpinPrize, now: Date): boolean {
  if (prize.validFrom && now < prize.validFrom) return false;
  if (prize.validUntil && now > prize.validUntil) return false;
  if (prize.quota !== null && (prize.quotaRemaining ?? 0) <= 0) return false;
  return true;
}

function weightedPick(eligible: SpinPrize[]): SpinPrize {
  const totalWeight = eligible.reduce((sum, p) => sum + p.probability, 0);
  if (totalWeight <= 0) {
    return eligible[Math.floor(Math.random() * eligible.length)];
  }
  let roll = Math.random() * totalWeight;
  for (const prize of eligible) {
    roll -= prize.probability;
    if (roll <= 0) return prize;
  }
  return eligible[eligible.length - 1];
}

/** Both videotron and mobile animate to this exact angle, so the visible result always matches. */
function computeStopAngle(sliceIndex: number, totalSlices: number): number {
  const sliceSize = 360 / totalSlices;
  const margin = sliceSize * 0.15;
  const offsetWithinSlice = margin + Math.random() * (sliceSize - margin * 2);
  return sliceIndex * sliceSize + offsetWithinSlice;
}

export async function spin(campaignId: string, participantId: string): Promise<SpinOutcome> {
  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant || participant.campaignId !== campaignId) {
    throw new SpinEngineError("Participant not found for this campaign");
  }

  const existing = await prisma.spinResult.findUnique({
    where: { campaignId_participantId: { campaignId, participantId } },
  });
  if (existing) {
    throw new SpinEngineError("Anda sudah bermain untuk campaign ini");
  }

  const allPrizes = await prisma.spinPrize.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
  });
  if (allPrizes.length === 0) {
    throw new SpinEngineError("Campaign ini belum memiliki hadiah yang dikonfigurasi");
  }

  const now = new Date();
  const eligible = allPrizes.filter((p) => isPrizeEligibleNow(p, now));
  const chosen = eligible.length > 0 ? weightedPick(eligible) : null;
  const sliceIndex = chosen ? allPrizes.findIndex((p) => p.id === chosen.id) : 0;
  const stopAngle = computeStopAngle(sliceIndex, allPrizes.length);
  const isWin = chosen !== null && chosen.type !== "NO_PRIZE";

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (chosen && chosen.quota !== null) {
      await tx.spinPrize.update({
        where: { id: chosen.id },
        data: { quotaRemaining: { decrement: 1 } },
      });
    }
    await tx.spinResult.create({
      data: {
        campaignId,
        participantId,
        prizeId: chosen?.id ?? null,
        isWin,
      },
    });
  });

  return {
    participantId,
    participantName: participant.name,
    prizeId: chosen?.id ?? null,
    prizeLabel: chosen?.label ?? "No Prize",
    isWin,
    stopAngle,
  };
}
