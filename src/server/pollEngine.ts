import { prisma } from "../lib/prisma.js";

export class PollEngineError extends Error {}

export interface PollTally {
  pollQuestionId: string;
  question: string;
  options: { id: string; label: string; count: number }[];
  totalVotes: number;
}

export async function getPollTally(pollQuestionId: string): Promise<PollTally> {
  const question = await prisma.pollQuestion.findUnique({
    where: { id: pollQuestionId },
    include: { options: { orderBy: { createdAt: "asc" }, include: { _count: { select: { answers: true } } } } },
  });
  if (!question) throw new PollEngineError("Pertanyaan polling tidak ditemukan");

  const options = question.options.map((o) => ({ id: o.id, label: o.label, count: o._count.answers }));
  return {
    pollQuestionId: question.id,
    question: question.question,
    options,
    totalVotes: options.reduce((sum, o) => sum + o.count, 0),
  };
}

export async function answerPoll(
  campaignId: string,
  participantId: string,
  pollOptionId: string
): Promise<PollTally> {
  const option = await prisma.pollOption.findUnique({
    where: { id: pollOptionId },
    include: { pollQuestion: { include: { pollSession: true } } },
  });
  if (!option || option.pollQuestion.pollSession.campaignId !== campaignId) {
    throw new PollEngineError("Opsi polling tidak valid");
  }
  if (!option.pollQuestion.pollSession.isActive) {
    throw new PollEngineError("Sesi polling ini sudah tidak aktif");
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant || participant.campaignId !== campaignId) {
    throw new PollEngineError("Peserta tidak ditemukan untuk campaign ini");
  }

  const existing = await prisma.pollAnswer.findUnique({
    where: {
      pollQuestionId_participantId: {
        pollQuestionId: option.pollQuestionId,
        participantId,
      },
    },
  });
  if (existing) {
    throw new PollEngineError("Anda sudah menjawab pertanyaan ini");
  }

  await prisma.pollAnswer.create({
    data: { pollQuestionId: option.pollQuestionId, pollOptionId, participantId },
  });

  return getPollTally(option.pollQuestionId);
}
