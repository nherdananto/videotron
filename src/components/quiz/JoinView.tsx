"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
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

type Session = { sessionToken: string; participantId: string };

function sessionKey(slug: string) {
  return `videotron:quiz-session:${slug}`;
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

export function JoinView({ initialCampaign }: { initialCampaign: PublicQuizCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [session, setSession] = useState<Session | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answeredOptionId, setAnsweredOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<LeaderboardEntryPayload[] | undefined>();

  const socket = useSocket(campaign.slug, "mobile");
  const remaining = useCountdown(campaign.question?.activatedAt ?? null, campaign.question?.timerSeconds ?? 0);

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey(campaign.slug));
    if (raw) setSession(JSON.parse(raw));
  }, [campaign.slug]);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/quiz/public`);
    if (res.ok) {
      const data = await res.json();
      setCampaign((prev) => {
        if (data.campaign.question?.id !== prev.question?.id) {
          setAnsweredOptionId(null);
          setFeedback(null);
        }
        return data.campaign;
      });
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onTally = (_payload: QuizTallyPayload) => {
      // Distribution isn't shown on mobile — only the videotron reveals it live.
    };
    const onAccepted = (payload: {
      quizQuestionId: string;
      quizOptionId: string;
      participantId: string;
      isCorrect: boolean;
      pointsAwarded: number;
    }) => {
      if (payload.participantId !== session?.participantId) return;
      setAnsweredOptionId(payload.quizOptionId);
      setFeedback({ isCorrect: payload.isCorrect, pointsAwarded: payload.pointsAwarded });
    };
    const onError = (payload: { message: string }) => setError(payload.message);
    const onLeaderboard = (payload: { period: "today"; entries: LeaderboardEntryPayload[] }) =>
      setLiveLeaderboard(payload.entries);
    const onUpdated = () => void refetch();

    socket.on("quiz:update", onTally);
    socket.on("quiz:accepted", onAccepted);
    socket.on("quiz:error", onError);
    socket.on("quiz:leaderboard", onLeaderboard);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("quiz:update", onTally);
      socket.off("quiz:accepted", onAccepted);
      socket.off("quiz:error", onError);
      socket.off("quiz:leaderboard", onLeaderboard);
      socket.off("campaign:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, session?.participantId]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, game: "quiz" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal bergabung");
        return;
      }
      const newSession = { sessionToken: data.sessionToken, participantId: data.participantId };
      window.localStorage.setItem(sessionKey(campaign.slug), JSON.stringify(newSession));
      setSession(newSession);
      if (data.answeredOptionId) setAnsweredOptionId(data.answeredOptionId);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAnswer(quizOptionId: string) {
    if (!socket || !session || remaining <= 0) return;
    setError(null);
    socket.emit("quiz:answer", { campaignId: campaign.slug, sessionToken: session.sessionToken, quizOptionId });
  }

  if (!campaign.isOpenForPlay) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-lg text-amber-300">Quiz belum aktif untuk campaign ini.</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-slate-400">Isi data untuk ikut quiz.</p>
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

  if (!campaign.question) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
        <p className="text-center text-slate-400">Menunggu soal diaktifkan dari CMS...</p>
        <Leaderboard campaignSlug={campaign.slug} liveTodayEntries={liveLeaderboard} />
      </main>
    );
  }

  const hasAnswered = Boolean(answeredOptionId);
  const timeUp = remaining <= 0 && !hasAnswered;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {campaign.question.difficulty} &middot; {campaign.question.points} poin
        </span>
        <span className={`text-xl font-bold ${remaining <= 5 ? "text-red-400" : "text-slate-200"}`}>{remaining}s</span>
      </div>
      <h1 className="text-xl font-bold">{campaign.question.text}</h1>

      {hasAnswered || timeUp ? (
        <div className="rounded-xl bg-slate-900 px-6 py-4 text-center">
          {feedback ? (
            <>
              <p className={`text-lg font-semibold ${feedback.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                {feedback.isCorrect ? "Benar!" : "Kurang tepat"}
              </p>
              <p className="text-sm text-slate-400">+{feedback.pointsAwarded} poin</p>
            </>
          ) : (
            <p className="text-slate-400">{timeUp ? "Waktu habis" : "Jawaban terkirim"}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaign.question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              className="rounded-md bg-slate-800 px-4 py-3 text-left font-medium hover:bg-indigo-500"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Leaderboard campaignSlug={campaign.slug} liveTodayEntries={liveLeaderboard} />
    </main>
  );
}
