"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { VotingChart } from "./VotingChart";
import type { VotingTallyPayload } from "@/types/socket";

interface PublicVotingCampaign {
  slug: string;
  name: string;
  status: string;
  isOpenForPlay: boolean;
  question: { id: string; text: string; options: { id: string; label: string; count: number }[] } | null;
}

type Session = { sessionToken: string; participantId: string };

function sessionKey(slug: string) {
  return `videotron:voting-session:${slug}`;
}

export function JoinView({ initialCampaign }: { initialCampaign: PublicVotingCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [session, setSession] = useState<Session | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

  const socket = useSocket(campaign.slug, "mobile");

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey(campaign.slug));
    if (raw) setSession(JSON.parse(raw));
  }, [campaign.slug]);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/voting/public`);
    if (res.ok) {
      const data = await res.json();
      setCampaign((prev) => {
        if (data.campaign.question?.id !== prev.question?.id) setVotedOptionId(null);
        return data.campaign;
      });
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onTally = (payload: VotingTallyPayload) => {
      setCampaign((c) =>
        c.question && c.question.id === payload.votingQuestionId
          ? { ...c, question: { id: payload.votingQuestionId, text: payload.question, options: payload.options } }
          : c
      );
    };
    const onAccepted = (payload: { votingQuestionId: string; votingOptionId: string; participantId: string }) => {
      if (payload.participantId !== session?.participantId) return;
      setVotedOptionId(payload.votingOptionId);
    };
    const onError = (payload: { message: string }) => setError(payload.message);
    const onUpdated = () => void refetch();

    socket.on("voting:update", onTally);
    socket.on("vote:accepted", onAccepted);
    socket.on("vote:error", onError);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("voting:update", onTally);
      socket.off("vote:accepted", onAccepted);
      socket.off("vote:error", onError);
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
        body: JSON.stringify({ ...form, game: "voting" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal bergabung");
        return;
      }
      const newSession = { sessionToken: data.sessionToken, participantId: data.participantId };
      window.localStorage.setItem(sessionKey(campaign.slug), JSON.stringify(newSession));
      setSession(newSession);
      if (data.votedOptionId) setVotedOptionId(data.votedOptionId);
    } finally {
      setSubmitting(false);
    }
  }

  function handleVote(votingOptionId: string) {
    if (!socket || !session) return;
    setError(null);
    socket.emit("vote:cast", { campaignId: campaign.slug, sessionToken: session.sessionToken, votingOptionId });
  }

  if (!campaign.isOpenForPlay) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-lg text-amber-300">Voting belum aktif untuk campaign ini.</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-slate-400">Isi data untuk ikut voting.</p>
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
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-slate-400">Menunggu pertanyaan diaktifkan dari CMS...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-xl font-bold">{campaign.question.text}</h1>

      {votedOptionId ? (
        <VotingChart options={campaign.question.options} highlightOptionId={votedOptionId} />
      ) : (
        <div className="flex flex-col gap-3">
          {campaign.question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              className="rounded-md bg-slate-800 px-4 py-3 text-left font-medium hover:bg-indigo-500"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  );
}
