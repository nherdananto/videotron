import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";
import { campaignRoomName } from "@/lib/games";
import { spin, SpinEngineError } from "@/server/spinEngine";
import { castVote, VotingEngineError } from "@/server/votingEngine";
import { answerPoll, PollEngineError } from "@/server/pollEngine";
import { answerQuiz, getLeaderboard, QuizEngineError } from "@/server/quizEngine";
import { prisma } from "@/lib/prisma";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function broadcastParticipantCount(io: AppServer, campaignId: string) {
  const room = campaignRoomName(campaignId);
  const count = io.sockets.adapter.rooms.get(room)?.size ?? 0;
  io.to(room).emit("participant:count", { campaignId, count });
}

export function registerSocketHandlers(io: AppServer) {
  io.on("connection", (socket: AppSocket) => {
    socket.on("room:join", ({ campaignId, role }) => {
      socket.join(campaignRoomName(campaignId));
      socket.data.campaignId = campaignId;
      socket.data.role = role;
      broadcastParticipantCount(io, campaignId);
    });

    socket.on("spin:request", async ({ campaignId: campaignSlug, sessionToken }) => {
      try {
        const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } });
        const participant = await prisma.participant.findUnique({ where: { sessionToken } });
        if (!campaign || !participant || participant.campaignId !== campaign.id) {
          socket.emit("spin:error", { message: "Sesi tidak valid untuk campaign ini" });
          return;
        }
        const result = await spin(campaign.id, participant.id);
        io.to(campaignRoomName(campaignSlug)).emit("spin:result", {
          participantId: result.participantId,
          participantName: result.participantName,
          prizeId: result.prizeId,
          prizeLabel: result.prizeLabel,
          isWin: result.isWin,
          stopAngle: result.stopAngle,
        });
      } catch (error) {
        const message = error instanceof SpinEngineError ? error.message : "Terjadi kesalahan saat memutar roda";
        socket.emit("spin:error", { message });
      }
    });

    socket.on("vote:cast", async ({ campaignId: campaignSlug, sessionToken, votingOptionId }) => {
      try {
        const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } });
        const participant = await prisma.participant.findUnique({ where: { sessionToken } });
        if (!campaign || !participant || participant.campaignId !== campaign.id) {
          socket.emit("vote:error", { message: "Sesi tidak valid untuk campaign ini" });
          return;
        }
        const tally = await castVote(campaign.id, participant.id, votingOptionId);
        socket.emit("vote:accepted", {
          votingQuestionId: tally.votingQuestionId,
          votingOptionId,
          participantId: participant.id,
        });
        io.to(campaignRoomName(campaignSlug)).emit("voting:update", tally);
      } catch (error) {
        const message = error instanceof VotingEngineError ? error.message : "Terjadi kesalahan saat mengirim vote";
        socket.emit("vote:error", { message });
      }
    });

    socket.on("poll:answer", async ({ campaignId: campaignSlug, sessionToken, pollOptionId }) => {
      try {
        const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } });
        const participant = await prisma.participant.findUnique({ where: { sessionToken } });
        if (!campaign || !participant || participant.campaignId !== campaign.id) {
          socket.emit("poll:error", { message: "Sesi tidak valid untuk campaign ini" });
          return;
        }
        const tally = await answerPoll(campaign.id, participant.id, pollOptionId);
        socket.emit("poll:accepted", {
          pollQuestionId: tally.pollQuestionId,
          pollOptionId,
          participantId: participant.id,
        });
        io.to(campaignRoomName(campaignSlug)).emit("polling:update", tally);
      } catch (error) {
        const message = error instanceof PollEngineError ? error.message : "Terjadi kesalahan saat mengirim jawaban";
        socket.emit("poll:error", { message });
      }
    });

    socket.on("quiz:answer", async ({ campaignId: campaignSlug, sessionToken, quizOptionId }) => {
      try {
        const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } });
        const participant = await prisma.participant.findUnique({ where: { sessionToken } });
        if (!campaign || !participant || participant.campaignId !== campaign.id) {
          socket.emit("quiz:error", { message: "Sesi tidak valid untuk campaign ini" });
          return;
        }
        const { tally, isCorrect, pointsAwarded } = await answerQuiz(campaign.id, participant.id, quizOptionId);
        socket.emit("quiz:accepted", {
          quizQuestionId: tally.quizQuestionId,
          quizOptionId,
          participantId: participant.id,
          isCorrect,
          pointsAwarded,
        });
        const room = campaignRoomName(campaignSlug);
        io.to(room).emit("quiz:update", tally);
        const entries = await getLeaderboard(campaign.id, "today");
        io.to(room).emit("quiz:leaderboard", { period: "today", entries });
      } catch (error) {
        const message = error instanceof QuizEngineError ? error.message : "Terjadi kesalahan saat mengirim jawaban";
        socket.emit("quiz:error", { message });
      }
    });

    socket.on("disconnect", () => {
      const campaignId = socket.data.campaignId as string | undefined;
      if (campaignId) broadcastParticipantCount(io, campaignId);
    });
  });
}
