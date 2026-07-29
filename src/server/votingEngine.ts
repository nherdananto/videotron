import { prisma } from "../lib/prisma.js";

export class VotingEngineError extends Error {}

export interface VotingTally {
  votingQuestionId: string;
  question: string;
  options: { id: string; label: string; count: number }[];
  totalVotes: number;
}

export async function getTally(votingQuestionId: string): Promise<VotingTally> {
  const question = await prisma.votingQuestion.findUnique({
    where: { id: votingQuestionId },
    include: { options: { orderBy: { createdAt: "asc" }, include: { _count: { select: { votes: true } } } } },
  });
  if (!question) throw new VotingEngineError("Pertanyaan voting tidak ditemukan");

  const options = question.options.map((o) => ({ id: o.id, label: o.label, count: o._count.votes }));
  return {
    votingQuestionId: question.id,
    question: question.question,
    options,
    totalVotes: options.reduce((sum, o) => sum + o.count, 0),
  };
}

export async function castVote(
  campaignId: string,
  participantId: string,
  votingOptionId: string
): Promise<VotingTally> {
  const option = await prisma.votingOption.findUnique({
    where: { id: votingOptionId },
    include: { votingQuestion: true },
  });
  if (!option || option.votingQuestion.campaignId !== campaignId) {
    throw new VotingEngineError("Opsi voting tidak valid");
  }
  if (!option.votingQuestion.isActive) {
    throw new VotingEngineError("Pertanyaan voting ini sudah tidak aktif");
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant || participant.campaignId !== campaignId) {
    throw new VotingEngineError("Peserta tidak ditemukan untuk campaign ini");
  }

  const existing = await prisma.voteEntry.findUnique({
    where: {
      votingQuestionId_participantId: {
        votingQuestionId: option.votingQuestionId,
        participantId,
      },
    },
  });
  if (existing) {
    throw new VotingEngineError("Anda sudah vote untuk pertanyaan ini");
  }

  await prisma.voteEntry.create({
    data: { votingQuestionId: option.votingQuestionId, votingOptionId, participantId },
  });

  return getTally(option.votingQuestionId);
}
