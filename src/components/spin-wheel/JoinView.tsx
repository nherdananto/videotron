"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Wheel } from "./Wheel";
import type { SpinResultPayload } from "@/types/socket";

interface PublicCampaign {
  slug: string;
  name: string;
  logoUrl: string | null;
  status: string;
  isOpenForPlay: boolean;
  prizes: { id: string; label: string; type: string }[];
}

type Session = { sessionToken: string; participantId: string; hasPlayed: boolean };

function sessionKey(slug: string) {
  return `videotron:session:${slug}`;
}

export function JoinView({ initialCampaign }: { initialCampaign: PublicCampaign }) {
  const campaign = initialCampaign;
  const [session, setSession] = useState<Session | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResultPayload | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const socket = useSocket(campaign.slug, "mobile");

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey(campaign.slug));
    if (raw) setSession(JSON.parse(raw));
  }, [campaign.slug]);

  useEffect(() => {
    if (!socket) return;
    const onResult = (payload: SpinResultPayload) => {
      if (payload.participantId !== session?.participantId) return;
      setLastResult(payload);
      setSpinToken((t) => t + 1);
      setSpinning(false);
      setSession((s) => (s ? { ...s, hasPlayed: true } : s));
    };
    const onError = (payload: { message: string }) => {
      setSpinning(false);
      setError(payload.message);
    };
    socket.on("spin:result", onResult);
    socket.on("spin:error", onError);
    return () => {
      socket.off("spin:result", onResult);
      socket.off("spin:error", onError);
    };
  }, [socket, session?.participantId]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal bergabung");
        return;
      }
      window.localStorage.setItem(sessionKey(campaign.slug), JSON.stringify(data));
      setSession(data);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSpin() {
    if (!socket || !session) return;
    setError(null);
    setSpinning(true);
    socket.emit("spin:request", { campaignId: campaign.slug, sessionToken: session.sessionToken });
  }

  if (!campaign.isOpenForPlay) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-lg text-amber-300">Spin Wheel belum aktif untuk campaign ini.</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-slate-400">Isi data untuk mulai bermain Spin The Wheel.</p>
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

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <Wheel prizes={campaign.prizes} stopAngle={lastResult?.stopAngle} spinToken={spinToken} size={260} />

      {session.hasPlayed || lastResult ? (
        <div className="rounded-xl bg-slate-900 px-6 py-4">
          <p className="text-sm text-slate-400">Hasil</p>
          <p className="text-xl font-semibold">
            {lastResult ? (lastResult.isWin ? lastResult.prizeLabel : "Belum beruntung") : "Sudah dimainkan"}
          </p>
        </div>
      ) : (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="rounded-full bg-indigo-500 px-10 py-4 text-lg font-bold disabled:opacity-50"
        >
          {spinning ? "Memutar..." : "SPIN"}
        </button>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  );
}
