"use client";

import { useEffect, useState } from "react";

type Entry = { participantId: string; name: string; points: number };
type Period = "today" | "week" | "month";

const TABS: { key: Period; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
];

export function Leaderboard({
  campaignSlug,
  liveTodayEntries,
}: {
  campaignSlug: string;
  liveTodayEntries?: Entry[];
}) {
  const [period, setPeriod] = useState<Period>("today");
  const [entries, setEntries] = useState<Entry[]>(liveTodayEntries ?? []);

  useEffect(() => {
    if (period === "today" && liveTodayEntries) {
      setEntries(liveTodayEntries);
    }
  }, [period, liveTodayEntries]);

  useEffect(() => {
    if (period === "today" && liveTodayEntries) return;
    let cancelled = false;
    fetch(`/api/campaigns/${campaignSlug}/quiz-leaderboard?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEntries(data.entries ?? []);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, campaignSlug]);

  return (
    <div className="rounded-2xl bg-slate-900 p-6">
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPeriod(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              period === t.key ? "bg-indigo-500" : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ol className="flex flex-col gap-2">
        {entries.map((e, i) => (
          <li key={e.participantId} className="flex items-center justify-between rounded-md bg-slate-800 px-4 py-2">
            <span>
              <span className="mr-3 text-slate-400">#{i + 1}</span>
              {e.name}
            </span>
            <span className="font-semibold">{e.points} pts</span>
          </li>
        ))}
        {entries.length === 0 && <p className="text-slate-500">Belum ada skor.</p>}
      </ol>
    </div>
  );
}
