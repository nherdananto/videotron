"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { VotingChart } from "@/components/voting/VotingChart";
import type { PollTallyPayload } from "@/types/socket";

interface PublicPollingCampaign {
  slug: string;
  name: string;
  status: string;
  isOpenForPlay: boolean;
  session: {
    id: string;
    title: string;
    questions: { id: string; text: string; options: { id: string; label: string; count: number }[] }[];
  } | null;
}

type Session = { sessionToken: string; participantId: string };

function sessionKey(slug: string) {
  return `videotron:poll-session:${slug}`;
}

export function JoinView({ initialCampaign }: { initialCampaign: PublicPollingCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [session, setSession] = useState<Session | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answered, setAnswered] = useState<Record<string, string>>({});

  const socket = useSocket(campaign.slug, "mobile");

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey(campaign.slug));
    if (raw) setSession(JSON.parse(raw));
  }, [campaign.slug]);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/polling/public`);
    if (res.ok) {
      const data = await res.json();
      setCampaign((prev) => {
        if (data.campaign.session?.id !== prev.session?.id) setAnswered({});
        return data.campaign;
      });
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onTally = (payload: PollTallyPayload) => {
      setCampaign((c) =>
        c.session
          ? {
              ...c,
              session: {
                ...c.session,
                questions: c.session.questions.map((q) =>
                  q.id === payload.pollQuestionId ? { ...q, options: payload.options } : q
                ),
              },
            }
          : c
      );
    };
    const onAccepted = (payload: { pollQuestionId: string; pollOptionId: string; participantId: string }) => {
      if (payload.participantId !== session?.participantId) return;
      setAnswered((a) => ({ ...a, [payload.pollQuestionId]: payload.pollOptionId }));
    };
    const onError = (payload: { message: string }) => setError(payload.message);
    const onUpdated = () => void refetch();

    socket.on("polling:update", onTally);
    socket.on("poll:accepted", onAccepted);
    socket.on("poll:error", onError);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("polling:update", onTally);
      socket.off("poll:accepted", onAccepted);
      socket.off("poll:error", onError);
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
        body: JSON.stringify({ ...form, game: "polling" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal bergabung");
        return;
      }
      const newSession = { sessionToken: data.sessionToken, participantId: data.participantId };
      window.localStorage.setItem(sessionKey(campaign.slug), JSON.stringify(newSession));
      setSession(newSession);
      const prevAnswers: Record<string, string> = {};
      for (const a of data.answers ?? []) prevAnswers[a.pollQuestionId] = a.pollOptionId;
      setAnswered(prevAnswers);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAnswer(pollOptionId: string) {
    if (!socket || !session) return;
    setError(null);
    socket.emit("poll:answer", { campaignId: campaign.slug, sessionToken: session.sessionToken, pollOptionId });
  }

  if (!campaign.isOpenForPlay) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-lg text-amber-300">Polling belum aktif untuk campaign ini.</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-slate-400">Isi data untuk ikut polling.</p>
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

  if (!campaign.session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-slate-400">Menunggu sesi polling diaktifkan dari CMS...</p>
      </main>
    );
  }

  const questions = campaign.session.questions;
  const nextQuestion = questions.find((q) => !answered[q.id]);

  if (!nextQuestion) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
        <h1 className="text-xl font-bold">Terima kasih!</h1>
        <p className="text-slate-400">Semua pertanyaan sudah dijawab.</p>
        <div className="flex flex-col gap-6">
          {questions.map((q) => (
            <div key={q.id}>
              <h3 className="mb-2 text-sm font-medium text-slate-300">{q.text}</h3>
              <VotingChart options={q.options} highlightOptionId={answered[q.id]} />
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <p className="text-sm text-slate-400">
        Pertanyaan {questions.findIndex((q) => q.id === nextQuestion.id) + 1} dari {questions.length}
      </p>
      <h1 className="text-xl font-bold">{nextQuestion.text}</h1>
      <div className="flex flex-col gap-3">
        {nextQuestion.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleAnswer(option.id)}
            className="rounded-md bg-slate-800 px-4 py-3 text-left font-medium hover:bg-indigo-500"
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  );
}
