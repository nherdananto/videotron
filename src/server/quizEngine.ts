import { prisma } from "@/lib/prisma";

export class QuizEngineError extends Error {}

export interface QuizTally {
  quizQuestionId: string;
  question: string;
  options: { id: string; label: string; count: number }[];
  totalAnswers: number;
}

export interface QuizAnswerResult {
  tally: QuizTally;
  isCorrect: boolean;
  pointsAwarded: number;
}

export type LeaderboardPeriod = "today" | "week" | "month";

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  points: number;
}

async function getQuizTally(quizQuestionId: string): Promise<QuizTally> {
  const question = await prisma.quizQuestion.findUnique({
    where: { id: quizQuestionId },
    include: { options: { orderBy: { createdAt: "asc" }, include: { _count: { select: { answers: true } } } } },
  });
  if (!question) throw new QuizEngineError("Pertanyaan quiz tidak ditemukan");

  const options = question.options.map((o) => ({ id: o.id, label: o.label, count: o._count.answers }));
  return {
    quizQuestionId: question.id,
    question: question.question,
    options,
    totalAnswers: options.reduce((sum, o) => sum + o.count, 0),
  };
}

export async function answerQuiz(
  campaignId: string,
  participantId: string,
  quizOptionId: string
): Promise<QuizAnswerResult> {
  const option = await prisma.quizOption.findUnique({
    where: { id: quizOptionId },
    include: { quizQuestion: true },
  });
  if (!option || option.quizQuestion.campaignId !== campaignId) {
    throw new QuizEngineError("Opsi jawaban tidak valid");
  }
  const question = option.quizQuestion;
  if (!question.isActive || !question.activatedAt) {
    throw new QuizEngineError("Pertanyaan ini sudah tidak aktif");
  }
  const deadline = question.activatedAt.getTime() + question.timerSeconds * 1000;
  if (Date.now() > deadline) {
    throw new QuizEngineError("Waktu menjawab sudah habis");
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant || participant.campaignId !== campaignId) {
    throw new QuizEngineError("Peserta tidak ditemukan untuk campaign ini");
  }

  const existing = await prisma.quizAnswer.findUnique({
    where: { quizQuestionId_participantId: { quizQuestionId: question.id, participantId } },
  });
  if (existing) {
    throw new QuizEngineError("Anda sudah menjawab pertanyaan ini");
  }

  const isCorrect = option.isCorrect;
  const pointsAwarded = isCorrect ? question.points : 0;

  await prisma.quizAnswer.create({
    data: { quizQuestionId: question.id, quizOptionId, participantId, isCorrect, pointsAwarded },
  });

  return { tally: await getQuizTally(question.id), isCorrect, pointsAwarded };
}

function periodStart(period: LeaderboardPeriod): Date {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isoDayOfWeek = (startOfDay.getDay() + 6) % 7; // Monday = 0
    startOfDay.setDate(startOfDay.getDate() - isoDayOfWeek);
    return startOfDay;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getLeaderboard(campaignId: string, period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const since = periodStart(period);

  const grouped = await prisma.quizAnswer.groupBy({
    by: ["participantId"],
    where: { quizQuestion: { campaignId }, createdAt: { gte: since } },
    _sum: { pointsAwarded: true },
    orderBy: { _sum: { pointsAwarded: "desc" } },
    take: 10,
  });

  const participants = await prisma.participant.findMany({
    where: { id: { in: grouped.map((g) => g.participantId) } },
  });
  const nameById = new Map(participants.map((p) => [p.id, p.name]));

  return grouped.map((g) => ({
    participantId: g.participantId,
    name: nameById.get(g.participantId) ?? "Unknown",
    points: g._sum.pointsAwarded ?? 0,
  }));
}
