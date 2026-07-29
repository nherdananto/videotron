const LANE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#8b5cf6", "#84cc16"];

export interface Standing {
  participantId: string;
  name: string;
  progress: number;
  finishedAt: string | null;
  rank: number | null;
}

export function RaceTrack({ standings }: { standings: Standing[] }) {
  return (
    <div className="flex w-full flex-col gap-3">
      {standings.map((s, i) => (
        <div key={s.participantId}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-300">
              {s.rank ? `#${s.rank} ` : ""}
              {s.name}
            </span>
            <span className="text-slate-400">{Math.round(s.progress)}%</span>
          </div>
          <div className="h-5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${s.progress}%`, backgroundColor: LANE_COLORS[i % LANE_COLORS.length] }}
            />
          </div>
        </div>
      ))}
      {standings.length === 0 && <p className="text-slate-500">Belum ada peserta.</p>}
    </div>
  );
}
