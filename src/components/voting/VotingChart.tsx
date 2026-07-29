const BAR_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#8b5cf6", "#84cc16"];

export interface VotingOptionTally {
  id: string;
  label: string;
  count: number;
}

export function VotingChart({
  options,
  highlightOptionId,
}: {
  options: VotingOptionTally[];
  highlightOptionId?: string | null;
}) {
  const total = options.reduce((sum, o) => sum + o.count, 0);

  return (
    <div className="flex w-full flex-col gap-3">
      {options.map((option, i) => {
        const pct = total > 0 ? Math.round((option.count / total) * 100) : 0;
        return (
          <div key={option.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className={option.id === highlightOptionId ? "font-bold text-white" : "text-slate-300"}>
                {option.label}
                {option.id === highlightOptionId && " (pilihan Anda)"}
              </span>
              <span className="text-slate-400">
                {option.count} suara &middot; {pct}%
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
