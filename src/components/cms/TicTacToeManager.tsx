"use client";

import { useEffect, useState } from "react";

type Match = {
  id: string;
  playerXName: string;
  playerOName: string | null;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  winner: string | null;
  createdAt: string;
  finishedAt: string | null;
};

type Stats = { totalMatches: number; xWins: number; oWins: number; draws: number };

export function TicTacToeManager({ slug }: { slug: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMatches: 0, xWins: 0, oWins: 0, draws: 0 });

  useEffect(() => {
    fetch(`/api/campaigns/${slug}/tictactoe-matches`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches ?? []);
        setStats(data.stats ?? stats);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Tic Tac Toe</h2>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-900 px-4 py-3">
          <p className="text-xs text-slate-400">Total Match</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalMatches}</p>
        </div>
        <div className="rounded-lg bg-slate-900 px-4 py-3">
          <p className="text-xs text-slate-400">X Menang</p>
          <p className="mt-1 text-2xl font-semibold">{stats.xWins}</p>
        </div>
        <div className="rounded-lg bg-slate-900 px-4 py-3">
          <p className="text-xs text-slate-400">O Menang</p>
          <p className="mt-1 text-2xl font-semibold">{stats.oWins}</p>
        </div>
        <div className="rounded-lg bg-slate-900 px-4 py-3">
          <p className="text-xs text-slate-400">Seri</p>
          <p className="mt-1 text-2xl font-semibold">{stats.draws}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-2">X</th>
              <th className="px-4 py-2">O</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Hasil</th>
              <th className="px-4 py-2">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-t border-slate-800">
                <td className="px-4 py-2">{m.playerXName}</td>
                <td className="px-4 py-2">{m.playerOName ?? "-"}</td>
                <td className="px-4 py-2">{m.status}</td>
                <td className="px-4 py-2">{m.winner ?? "-"}</td>
                <td className="px-4 py-2">{new Date(m.createdAt).toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                  Belum ada match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
