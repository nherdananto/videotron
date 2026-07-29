"use client";

import { useEffect, useState } from "react";

type Standing = { participantId: string; name: string; progress: number; rank: number | null };
type Session = {
  id: string;
  trackName: string;
  durationSeconds: number;
  maxPlayers: number;
  status: "WAITING" | "COUNTDOWN" | "RUNNING" | "FINISHED";
  createdAt: string;
  standings: Standing[];
};

export function RacingManager({ slug }: { slug: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [trackName, setTrackName] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("30");
  const [maxPlayers, setMaxPlayers] = useState("6");
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${slug}/race-sessions`);
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions ?? []);
    }
  }

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/campaigns/${slug}/race-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackName,
        durationSeconds: Number(durationSeconds),
        maxPlayers: Number(maxPlayers),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal membuat race");
      return;
    }
    setTrackName("");
    setDurationSeconds("30");
    setMaxPlayers("6");
    void refetch();
  }

  async function handleStart(sessionId: string) {
    setError(null);
    const res = await fetch(`/api/campaigns/${slug}/race-sessions/${sessionId}/start`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal memulai race");
      return;
    }
    void refetch();
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Racing Game</h2>

      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-md bg-slate-900 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {s.trackName} <span className="ml-2 text-xs text-slate-400">({s.status})</span>
              </p>
              {s.status === "WAITING" && (
                <button
                  onClick={() => handleStart(s.id)}
                  className="rounded-md bg-indigo-500 px-3 py-1 text-sm hover:bg-indigo-400"
                >
                  Mulai Race
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {s.durationSeconds}s &middot; maks {s.maxPlayers} pemain &middot; {s.standings.length} bergabung
            </p>
            {s.standings.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {s.standings
                  .slice()
                  .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.progress - a.progress)
                  .map((st) => `${st.rank ? `#${st.rank} ` : ""}${st.name}: ${Math.round(st.progress)}%`)
                  .join(" · ")}
              </p>
            )}
          </div>
        ))}
        {sessions.length === 0 && <p className="text-slate-400">Belum ada race.</p>}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-slate-900 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Nama Track</label>
          <input
            required
            className="rounded-md bg-slate-800 px-3 py-2"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            placeholder="Sirkuit Jakarta"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Durasi (detik)</label>
          <input
            type="number"
            min={10}
            className="w-24 rounded-md bg-slate-800 px-3 py-2"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Jumlah Pemain Maks</label>
          <input
            type="number"
            min={2}
            className="w-24 rounded-md bg-slate-800 px-3 py-2"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
          />
        </div>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
        <button type="submit" className="rounded-md bg-indigo-500 px-4 py-2 font-medium">
          Buat Race
        </button>
      </form>
    </section>
  );
}
