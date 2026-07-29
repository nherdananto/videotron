import { prisma } from "@/lib/prisma";

export class TicTacToeEngineError extends Error {}

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

type Cell = "X" | "O" | null;

function checkWinner(board: Cell[]): "X" | "O" | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const withPlayers = { include: { playerX: true, playerO: true } } as const;

export async function joinOrCreateMatch(campaignId: string, participantId: string) {
  const inProgress = await prisma.ticTacToeMatch.findFirst({
    where: { campaignId, status: "IN_PROGRESS", OR: [{ playerXId: participantId }, { playerOId: participantId }] },
    ...withPlayers,
  });
  if (inProgress) return inProgress;

  const waiting = await prisma.ticTacToeMatch.findFirst({
    where: { campaignId, status: "WAITING" },
    orderBy: { createdAt: "asc" },
    ...withPlayers,
  });
  if (waiting) {
    if (waiting.playerXId === participantId) return waiting;
    return prisma.ticTacToeMatch.update({
      where: { id: waiting.id },
      data: { playerOId: participantId, status: "IN_PROGRESS" },
      ...withPlayers,
    });
  }

  const anyInProgress = await prisma.ticTacToeMatch.findFirst({
    where: { campaignId, status: "IN_PROGRESS" },
  });
  if (anyInProgress) {
    throw new TicTacToeEngineError("Match sedang berjalan, coba lagi sebentar lagi");
  }

  return prisma.ticTacToeMatch.create({
    data: {
      campaignId,
      playerXId: participantId,
      board: Array(9).fill(null),
      status: "WAITING",
    },
    ...withPlayers,
  });
}

export async function makeMove(campaignId: string, participantId: string, matchId: string, cellIndex: number) {
  const match = await prisma.ticTacToeMatch.findUnique({ where: { id: matchId } });
  if (!match || match.campaignId !== campaignId) {
    throw new TicTacToeEngineError("Match tidak ditemukan");
  }
  if (match.status !== "IN_PROGRESS") {
    throw new TicTacToeEngineError("Match belum atau sudah tidak berjalan");
  }

  const symbol = participantId === match.playerXId ? "X" : participantId === match.playerOId ? "O" : null;
  if (!symbol) {
    throw new TicTacToeEngineError("Anda bukan pemain di match ini");
  }
  if (match.currentTurn !== symbol) {
    throw new TicTacToeEngineError("Bukan giliran Anda");
  }
  if (cellIndex < 0 || cellIndex > 8) {
    throw new TicTacToeEngineError("Sel tidak valid");
  }

  const board = match.board as Cell[];
  if (board[cellIndex] !== null) {
    throw new TicTacToeEngineError("Sel sudah terisi");
  }

  board[cellIndex] = symbol;
  const winner = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);

  return prisma.ticTacToeMatch.update({
    where: { id: matchId },
    data: {
      board,
      currentTurn: symbol === "X" ? "O" : "X",
      status: winner || isDraw ? "FINISHED" : "IN_PROGRESS",
      winner: winner ?? (isDraw ? "DRAW" : null),
      finishedAt: winner || isDraw ? new Date() : null,
    },
    ...withPlayers,
  });
}

export function toMatchPayload(match: {
  id: string;
  playerXId: string;
  playerX: { name: string };
  playerOId: string | null;
  playerO: { name: string } | null;
  board: unknown;
  currentTurn: string;
  status: string;
  winner: string | null;
}) {
  return {
    id: match.id,
    playerXId: match.playerXId,
    playerXName: match.playerX.name,
    playerOId: match.playerOId,
    playerOName: match.playerO?.name ?? null,
    board: match.board as (string | null)[],
    currentTurn: match.currentTurn,
    status: match.status as "WAITING" | "IN_PROGRESS" | "FINISHED",
    winner: match.winner,
  };
}
