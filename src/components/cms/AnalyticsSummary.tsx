type Analytics = {
  participantCount: number;
  spinCount: number;
  spinWinCount: number;
  voteCount: number;
  pollAnswerCount: number;
  quizAnswerCount: number;
  quizTotalPoints: number;
  quizAccuracy: number | null;
};

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg bg-slate-900 px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function AnalyticsSummary({ analytics }: { analytics: Analytics }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Analytics</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total Peserta" value={analytics.participantCount} />
        <StatTile
          label="Spin Wheel"
          value={analytics.spinCount}
          sub={analytics.spinCount > 0 ? `${analytics.spinWinCount} menang` : undefined}
        />
        <StatTile label="Total Vote" value={analytics.voteCount} />
        <StatTile label="Jawaban Polling" value={analytics.pollAnswerCount} />
        <StatTile
          label="Jawaban Quiz"
          value={analytics.quizAnswerCount}
          sub={analytics.quizAccuracy !== null ? `${Math.round(analytics.quizAccuracy * 100)}% benar` : undefined}
        />
        <StatTile label="Total Poin Quiz" value={analytics.quizTotalPoints} />
      </div>
    </section>
  );
}
