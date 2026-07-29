import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/socket.js";
import { campaignRoomName } from "../lib/games.js";
import { spin, SpinEngineError } from "./spinEngine.js";
import { prisma } from "../lib/prisma.js";

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

    socket.on("disconnect", () => {
      const campaignId = socket.data.campaignId as string | undefined;
      if (campaignId) broadcastParticipantCount(io, campaignId);
    });
  });
}
