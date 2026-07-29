"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameActivationCard } from "./GameActivationCard";
import { VotingManager } from "./VotingManager";
import { PollingManager } from "./PollingManager";
import { QuizManager } from "./QuizManager";
import { TicTacToeManager } from "./TicTacToeManager";
import { RacingManager } from "./RacingManager";
import { AnalyticsSummary } from "./AnalyticsSummary";

type Prize = {
  id: string;
  label: string;
  type: string;
  probability: number;
  quota: number | null;
  quotaRemaining: number | null;
};

type Campaign = {
  slug: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ENDED";
  spinWheelActive: boolean;
  votingActive: boolean;
  pollingActive: boolean;
  quizActive: boolean;
  ticTacToeActive: boolean;
  racingActive: boolean;
  prizes: Prize[];
};

type GameLinks = { joinUrl: string; videotronUrl: string; qrDataUrl: string };

type Analytics = {
  participantCount: number;
  spinCount: number;
  spinWinCount: number;
  voteCount: number;
  pollAnswerCount: number;
  quizAnswerCount: number;
  quizTotalPoints: number;
  quizAccuracy: number | null;
  ticTacToeMatchCount: number;
  raceSessionCount: number;
};

type Result = {
  id: string;
  participantName: string;
  participantPhone: string;
  prizeLabel: string;
  isWin: boolean;
  createdAt: string;
};

const PRIZE_TYPES = ["VOUCHER", "DISKON", "MERCHANDISE", "KUPON_BELANJA", "LUCKY_POINT", "NO_PRIZE"];

export function CampaignDetail({
  campaign,
  spinWheel,
  voting,
  polling,
  quiz,
  ticTacToe,
  racing,
  analytics,
}: {
  campaign: Campaign;
  spinWheel: GameLinks;
  voting: GameLinks;
  polling: GameLinks;
  quiz: GameLinks;
  ticTacToe: GameLinks;
  racing: GameLinks;
  analytics: Analytics;
}) {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [newPrize, setNewPrize] = useState({ label: "", type: "VOUCHER", probability: "10", quota: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/campaigns/${campaign.slug}/results`)
      .then((res) => res.json())
      .then((data) => setResults(data.results ?? []));
  }, [campaign.slug]);

  async function patchCampaign(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/campaigns/${campaign.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal menyimpan perubahan");
      return;
    }
    router.refresh();
  }

  async function handleAddPrize(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/campaigns/${campaign.slug}/prizes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newPrize.label,
        type: newPrize.type,
        probability: Number(newPrize.probability),
        quota: newPrize.quota ? Number(newPrize.quota) : null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal menambah hadiah");
      return;
    }
    setNewPrize({ label: "", type: "VOUCHER", probability: "10", quota: "" });
    router.refresh();
  }

  async function handleDeletePrize(prizeId: string) {
    await fetch(`/api/campaigns/${campaign.slug}/prizes/${prizeId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-slate-400">/{campaign.slug}</p>
        </div>
        <div className="flex gap-2">
          {(["DRAFT", "ACTIVE", "ENDED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => patchCampaign({ status })}
              className={`rounded-md px-3 py-1.5 text-sm ${
                campaign.status === status ? "bg-indigo-500" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="mb-8">
        <AnalyticsSummary analytics={analytics} />
      </div>

      <div className="mb-8 flex flex-col gap-4">
        <GameActivationCard
          gameLabel="Spin Wheel"
          isActive={campaign.spinWheelActive}
          onToggle={(checked) => patchCampaign({ spinWheelActive: checked })}
          joinUrl={spinWheel.joinUrl}
          videotronUrl={spinWheel.videotronUrl}
          qrDataUrl={spinWheel.qrDataUrl}
        />
        <GameActivationCard
          gameLabel="Voting"
          isActive={campaign.votingActive}
          onToggle={(checked) => patchCampaign({ votingActive: checked })}
          joinUrl={voting.joinUrl}
          videotronUrl={voting.videotronUrl}
          qrDataUrl={voting.qrDataUrl}
        />
        <GameActivationCard
          gameLabel="Polling"
          isActive={campaign.pollingActive}
          onToggle={(checked) => patchCampaign({ pollingActive: checked })}
          joinUrl={polling.joinUrl}
          videotronUrl={polling.videotronUrl}
          qrDataUrl={polling.qrDataUrl}
        />
        <GameActivationCard
          gameLabel="Quiz"
          isActive={campaign.quizActive}
          onToggle={(checked) => patchCampaign({ quizActive: checked })}
          joinUrl={quiz.joinUrl}
          videotronUrl={quiz.videotronUrl}
          qrDataUrl={quiz.qrDataUrl}
        />
        <GameActivationCard
          gameLabel="Tic Tac Toe"
          isActive={campaign.ticTacToeActive}
          onToggle={(checked) => patchCampaign({ ticTacToeActive: checked })}
          joinUrl={ticTacToe.joinUrl}
          videotronUrl={ticTacToe.videotronUrl}
          qrDataUrl={ticTacToe.qrDataUrl}
        />
        <GameActivationCard
          gameLabel="Racing"
          isActive={campaign.racingActive}
          onToggle={(checked) => patchCampaign({ racingActive: checked })}
          joinUrl={racing.joinUrl}
          videotronUrl={racing.videotronUrl}
          qrDataUrl={racing.qrDataUrl}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Hadiah</h2>
        <div className="flex flex-col gap-2">
          {campaign.prizes.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md bg-slate-900 px-4 py-2">
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-slate-400">
                  {p.type} &middot; bobot {p.probability} &middot; kuota{" "}
                  {p.quota === null ? "unlimited" : `${p.quotaRemaining}/${p.quota}`}
                </p>
              </div>
              <button onClick={() => handleDeletePrize(p.id)} className="text-sm text-red-400 hover:underline">
                Hapus
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddPrize} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-slate-900 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Label</label>
            <input
              required
              className="rounded-md bg-slate-800 px-3 py-2"
              value={newPrize.label}
              onChange={(e) => setNewPrize((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Tipe</label>
            <select
              className="rounded-md bg-slate-800 px-3 py-2"
              value={newPrize.type}
              onChange={(e) => setNewPrize((f) => ({ ...f, type: e.target.value }))}
            >
              {PRIZE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Probabilitas (bobot)</label>
            <input
              type="number"
              min={0}
              className="w-28 rounded-md bg-slate-800 px-3 py-2"
              value={newPrize.probability}
              onChange={(e) => setNewPrize((f) => ({ ...f, probability: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Kuota (kosongkan = unlimited)</label>
            <input
              type="number"
              min={0}
              className="w-28 rounded-md bg-slate-800 px-3 py-2"
              value={newPrize.quota}
              onChange={(e) => setNewPrize((f) => ({ ...f, quota: e.target.value }))}
            />
          </div>
          <button type="submit" className="rounded-md bg-indigo-500 px-4 py-2 font-medium">
            Tambah Hadiah
          </button>
        </form>
      </section>

      <div className="mb-8">
        <VotingManager slug={campaign.slug} />
      </div>

      <div className="mb-8">
        <PollingManager slug={campaign.slug} />
      </div>

      <div className="mb-8">
        <QuizManager slug={campaign.slug} />
      </div>

      <div className="mb-8">
        <TicTacToeManager slug={campaign.slug} />
      </div>

      <div className="mb-8">
        <RacingManager slug={campaign.slug} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Riwayat Pemenang</h2>
        <div className="overflow-x-auto rounded-lg bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">HP</th>
                <th className="px-4 py-2">Hasil</th>
                <th className="px-4 py-2">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="px-4 py-2">{r.participantName}</td>
                  <td className="px-4 py-2">{r.participantPhone}</td>
                  <td className="px-4 py-2">{r.isWin ? r.prizeLabel : "No Prize"}</td>
                  <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                    Belum ada peserta bermain.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
