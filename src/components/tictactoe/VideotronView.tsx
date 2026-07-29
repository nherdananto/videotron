"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Board } from "./Board";
import type { TicTacToeMatchPayload } from "@/types/socket";

interface PublicTicTacToeCampaign {
  slug: string;
  name: string;
  status: string;
  isOpenForPlay: boolean;
  match: TicTacToeMatchPayload | null;
}

export function VideotronView({ initialCampaign }: { initialCampaign: PublicTicTacToeCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [participantCount, setParticipantCount] = useState(0);

  const socket = useSocket(campaign.slug, "videotron");

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/tictactoe/public`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onCount = (payload: { campaignId: string; count: number }) => {
      if (payload.campaignId === campaign.slug) setParticipantCount(payload.count);
    };
    const onUpdate = (match: TicTacToeMatchPayload) => setCampaign((c) => ({ ...c, match }));
    const onUpdated = () => void refetch();

    socket.on("participant:count", onCount);
    socket.on("tictactoe:update", onUpdate);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("participant:count", onCount);
      socket.off("tictactoe:update", onUpdate);
      socket.off("campaign:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, campaign.slug]);

  const match = campaign.match;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 py-10 text-center">
      <div>
        <h1 className="text-4xl font-bold">{campaign.name}</h1>
        <p className="mt-2 text-slate-400">{participantCount} peserta terhubung</p>
      </div>

      {!campaign.isOpenForPlay && (
        <p className="rounded-md bg-amber-500/10 px-4 py-2 text-amber-300">
          Tic Tac Toe belum aktif untuk campaign ini.
        </p>
      )}

      {match ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-8 text-lg">
            <span className={match.currentTurn === "X" && match.status === "IN_PROGRESS" ? "font-bold text-indigo-300" : "text-slate-400"}>
              X: {match.playerXName}
            </span>
            <span className="text-slate-600">vs</span>
            <span className={match.currentTurn === "O" && match.status === "IN_PROGRESS" ? "font-bold text-rose-300" : "text-slate-400"}>
              O: {match.playerOName ?? "menunggu lawan..."}
            </span>
          </div>

          <Board board={match.board} />

          {match.status === "FINISHED" && (
            <p className="text-xl font-semibold">
              {match.winner === "DRAW" ? "Seri!" : `${match.winner === "X" ? match.playerXName : match.playerOName} menang!`}
            </p>
          )}
          {match.status === "WAITING" && <p className="text-slate-400">Menunggu pemain kedua scan QR...</p>}
        </div>
      ) : (
        campaign.isOpenForPlay && <p className="text-slate-400">Menunggu pemain scan QR untuk memulai...</p>
      )}
    </main>
  );
}
