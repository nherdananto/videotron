import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(3).max(120),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "slug hanya boleh huruf kecil, angka, dan tanda strip")
    .optional(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(3).max(120).optional(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ENDED"]).optional(),
  spinWheelActive: z.boolean().optional(),
  votingActive: z.boolean().optional(),
  pollingActive: z.boolean().optional(),
  quizActive: z.boolean().optional(),
  ticTacToeActive: z.boolean().optional(),
  racingActive: z.boolean().optional(),
});

export const createPrizeSchema = z.object({
  label: z.string().min(1).max(80),
  type: z.enum(["VOUCHER", "DISKON", "MERCHANDISE", "KUPON_BELANJA", "LUCKY_POINT", "NO_PRIZE"]),
  probability: z.number().min(0).max(1000),
  quota: z.number().int().min(0).optional().nullable(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
});

export const updatePrizeSchema = createPrizeSchema.partial();

export const joinCampaignSchema = z.object({
  game: z.enum(["spin-wheel", "voting", "polling", "quiz", "tic-tac-toe", "racing"]),
  name: z.string().min(1).max(120),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(6).max(20),
});

export const createVotingQuestionSchema = z.object({
  question: z.string().min(3).max(200),
  options: z.array(z.string().min(1).max(80)).min(2).max(8),
});

export const castVoteSchema = z.object({
  sessionToken: z.string().min(1),
  votingOptionId: z.string().min(1),
});

export const setVotingQuestionActiveSchema = z.object({
  isActive: z.boolean(),
});

export const createPollSessionSchema = z.object({
  title: z.string().min(3).max(200),
  questions: z
    .array(
      z.object({
        question: z.string().min(3).max(200),
        options: z.array(z.string().min(1).max(80)).min(2).max(8),
      })
    )
    .min(1)
    .max(20),
});

export const setPollSessionActiveSchema = z.object({
  isActive: z.boolean(),
});

export const createQuizQuestionSchema = z
  .object({
    question: z.string().min(3).max(200),
    options: z
      .array(z.object({ label: z.string().min(1).max(80), isCorrect: z.boolean() }))
      .min(2)
      .max(8),
    points: z.number().int().min(1).max(10000).default(100),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
    timerSeconds: z.number().int().min(5).max(300).default(20),
  })
  .refine((data) => data.options.some((o) => o.isCorrect), {
    message: "Minimal satu opsi harus ditandai benar",
    path: ["options"],
  });

export const setQuizQuestionActiveSchema = z.object({
  isActive: z.boolean(),
});

export const createRaceSessionSchema = z.object({
  trackName: z.string().min(1).max(120),
  durationSeconds: z.number().int().min(10).max(600).default(30),
  maxPlayers: z.number().int().min(2).max(50).default(6),
});
