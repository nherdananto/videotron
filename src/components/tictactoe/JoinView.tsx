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

type Session = { sessionToken: string; participantId: string; symbol: "X" | "O"; matchId: string };

function sessionKey(slug: string) {
  return `videotron:tictactoe-session:${slug}`;
}

export function JoinView({ initialCampaign }: { initialCampaign: PublicTicTacToeCampaign }) {
  const campaign = initialCampaign;
  const [session, setSession] = useState<Session | null>(null);
  const [match, setMatch] = useState<TicTacToeMatchPayload | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const socket = useSocket(campaign.slug, "mobile");

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey(campaign.slug));
    if (raw) setSession(JSON.parse(raw));
  }, [campaign.slug]);

  useEffect(() => {
    if (!socket || !session) return;
    const onUpdate = (payload: TicTacToeMatchPayload) => {
      if (payload.id === session.matchId) setMatch(payload);
    };
    const onError = (payload: { message: string }) => setError(payload.message);
    socket.on("tictactoe:update", onUpdate);
    socket.on("tictactoe:error", onError);
    return () => {
      socket.off("tictactoe:update", onUpdate);
      socket.off("tictactoe:error", onError);
    };
  }, [socket, session]);

  async function doJoin(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/campaigns/${campaign.slug}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, game: "tic-tac-toe" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Gagal bergabung");
      return null;
    }
    const newSession = {
      sessionToken: data.sessionToken,
      participantId: data.participantId,
      symbol: data.symbol,
      matchId: data.match.id,
    };
    window.localStorage.setItem(sessionKey(campaign.slug), JSON.stringify(newSession));
    setSession(newSession);
    setMatch(data.match);
    return newSession;
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await doJoin(form);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCellClick(cellIndex: number) {
    if (!socket || !session) return;
    setError(null);
    socket.emit("tictactoe:move", { campaignId: campaign.slug, sessionToken: session.sessionToken, matchId: session.matchId, cellIndex });
  }

  async function handlePlayAgain() {
    await doJoin(form);
  }

  if (!campaign.isOpenForPlay) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-lg text-amber-300">Tic Tac Toe belum aktif untuk campaign ini.</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-slate-400">Isi data untuk main Tic Tac Toe. Anda akan dipasangkan otomatis.</p>
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nama"
            className="rounded-md bg-slate-800 px-4 py-2.5"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            type="email"
            placeholder="Email (opsional)"
            className="rounded-md bg-slate-800 px-4 py-2.5"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            required
            placeholder="Nomor HP"
            className="rounded-md bg-slate-800 px-4 py-2.5"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-500 px-4 py-2.5 font-medium disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Gabung"}
          </button>
        </form>
      </main>
    );
  }

  const isMyTurn = match?.status === "IN_PROGRESS" && match.currentTurn === session.symbol;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <p className="text-slate-400">
        Anda bermain sebagai <span className="font-bold text-white">{session.symbol}</span>
      </p>

      {match?.status === "WAITING" && <p className="text-slate-400">Menunggu lawan scan QR...</p>}
      {match?.status === "IN_PROGRESS" && (
        <p className={isMyTurn ? "font-semibold text-emerald-400" : "text-slate-400"}>
          {isMyTurn ? "Giliran Anda!" : "Menunggu lawan..."}
        </p>
      )}
      {match?.status === "FINISHED" && (
        <p className="text-lg font-semibold">
          {match.winner === "DRAW" ? "Seri!" : match.winner === session.symbol ? "Anda menang!" : "Anda kalah."}
        </p>
      )}

      {match && <Board board={match.board} onCellClick={isMyTurn ? handleCellClick : undefined} disabled={!isMyTurn} />}

      {match?.status === "FINISHED" && (
        <button onClick={handlePlayAgain} className="rounded-md bg-indigo-500 px-4 py-2.5 font-medium">
          Main Lagi
        </button>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  );
}
