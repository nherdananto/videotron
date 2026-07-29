import type { GameType } from "@prisma/client";

// Maps the URL slug used in /{namagame}/{campaignId} to the internal GameType enum.
export const GAME_SLUGS: Record<string, GameType> = {
  "spin-wheel": "SPIN_WHEEL",
  voting: "VOTING",
  polling: "POLLING",
  quiz: "QUIZ",
  "tic-tac-toe": "TIC_TAC_TOE",
  racing: "RACING",
  "instagram-wall": "INSTAGRAM_WALL",
};

export function campaignRoomName(campaignId: string): string {
  return `campaign:${campaignId}`;
}
