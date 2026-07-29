"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { VotingChart } from "@/components/voting/VotingChart";
import { Leaderboard } from "./Leaderboard";
import type { QuizTallyPayload, LeaderboardEntryPayload } from "@/types/socket";

interface PublicQuizCampaign {
  slug: string;
  name: string;
  status: string;
  isOpenForPlay: boolean;
  question: {
    id: string;
    text: string;
    points: number;
    difficulty: string;
    timerSeconds: number;
    activatedAt: string | null;
    options: { id: string; label: string }[];
  } | null;
}

function useCountdown(activatedAt: string | null, timerSeconds: number) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!activatedAt) {
      setRemaining(0);
      return;
    }
    const deadline = new Date(activatedAt).getTime() + timerSeconds * 1000;
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [activatedAt, timerSeconds]);
  return remaining;
}

export function VideotronView({ initialCampaign }: { initialCampaign: PublicQuizCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [participantCount, setParticipantCount] = useState(0);
  const [tallyByQuestion, setTallyByQuestion] = useState<{ id: string; options: { id: string; label: string; count: number }[] } | null>(
    null
  );
  const [liveLeaderboard, setLiveLeaderboard] = useState<LeaderboardEntryPayload[] | undefined>();

  const socket = useSocket(campaign.slug, "videotron");
  const remaining = useCountdown(campaign.question?.activatedAt ?? null, campaign.question?.timerSeconds ?? 0);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/quiz/public`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
      setTallyByQuestion(null);
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onCount = (payload: { campaignId: string; count: number }) => {
      if (payload.campaignId === campaign.slug) setParticipantCount(payload.count);
    };
    const onTally = (payload: QuizTallyPayload) => {
      setTallyByQuestion({ id: payload.quizQuestionId, options: payload.options });
    };
    const onLeaderboard = (payload: { period: "today"; entries: LeaderboardEntryPayload[] }) => {
      setLiveLeaderboard(payload.entries);
    };
    const onUpdated = () => void refetch();

    socket.on("participant:count", onCount);
    socket.on("quiz:update", onTally);
    socket.on("quiz:leaderboard", onLeaderboard);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("participant:count", onCount);
      socket.off("quiz:update", onTally);
      socket.off("quiz:leaderboard", onLeaderboard);
      socket.off("campaign:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, campaign.slug]);

  const question = campaign.question;
  const options =
    question && tallyByQuestion?.id === question.id
      ? tallyByQuestion.options
      : question?.options.map((o) => ({ ...o, count: 0 })) ?? [];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 py-10 text-center">
      <div>
        <h1 className="text-4xl font-bold">{campaign.name}</h1>
        <p className="mt-2 text-slate-400">{participantCount} peserta terhubung</p>
      </div>

      {!campaign.isOpenForPlay && (
        <p className="rounded-md bg-amber-500/10 px-4 py-2 text-amber-300">Quiz belum aktif untuk campaign ini.</p>
      )}

      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {question ? (
          <div className="rounded-2xl bg-slate-900 p-8 text-left">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {question.difficulty} &middot; {question.points} poin
              </span>
              <span className={`text-2xl font-bold ${remaining <= 5 ? "text-red-400" : "text-slate-200"}`}>
                {remaining}s
              </span>
            </div>
            <h2 className="mb-6 text-2xl font-semibold">{question.text}</h2>
            <VotingChart options={options} />
          </div>
        ) : (
          campaign.isOpenForPlay && (
            <div className="flex items-center justify-center rounded-2xl bg-slate-900 p-8">
              <p className="text-slate-400">Menunggu soal diaktifkan dari CMS...</p>
            </div>
          )
        )}

        <Leaderboard campaignSlug={campaign.slug} liveTodayEntries={liveLeaderboard} />
      </div>
    </main>
  );
}
