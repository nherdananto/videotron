"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { RaceTrack, type Standing } from "./RaceTrack";
import type { RaceUpdatePayload } from "@/types/socket";

interface PublicRacingCampaign {
  slug: string;
  name: string;
  status: string;
  isOpenForPlay: boolean;
  session: {
    id: string;
    trackName: string;
    status: "WAITING" | "COUNTDOWN" | "RUNNING" | "FINISHED";
    startedAt: string | null;
    endsAt: string | null;
    standings: Standing[];
  } | null;
}

type Session = { sessionToken: string; participantId: string };

function sessionKey(slug: string) {
  return `videotron:racing-session:${slug}`;
}

export function JoinView({ initialCampaign }: { initialCampaign: PublicRacingCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [session, setSession] = useState<Session | null>(null);
  const [joined, setJoined] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const socket = useSocket(campaign.slug, "mobile");

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey(campaign.slug));
    if (raw) setSession(JSON.parse(raw));
  }, [campaign.slug]);

  async function refetchPublic() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/racing/public`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload: RaceUpdatePayload) => {
      setCampaign((c) => (c.session ? { ...c, session: { ...c.session, ...payload } } : c));
    };
    const onError = (payload: { message: string }) => setError(payload.message);
    socket.on("racing:update", onUpdate);
    socket.on("racing:error", onError);
    return () => {
      socket.off("racing:update", onUpdate);
      socket.off("racing:error", onError);
    };
  }, [socket]);

  const status = campaign.session?.status;
  useEffect(() => {
    if (!session || (status !== "COUNTDOWN" && status !== "RUNNING")) return;
    const interval = setInterval(() => {
      setNow(Date.now());
      void refetchPublic();
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, game: "racing" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal bergabung");
        return;
      }
      const newSession = { sessionToken: data.sessionToken, participantId: data.participantId };
      window.localStorage.setItem(sessionKey(campaign.slug), JSON.stringify(newSession));
      setSession(newSession);
      setJoined(Boolean(data.joined));
      if (data.raceSessionId) {
        setCampaign((c) => ({
          ...c,
          session: {
            id: data.raceSessionId,
            trackName: data.trackName,
            status: data.status,
            startedAt: data.startedAt,
            endsAt: data.endsAt,
            standings: data.standings,
          },
        }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleAccelerate() {
    if (!socket || !session || !campaign.session) return;
    socket.emit("racing:accelerate", {
      campaignId: campaign.slug,
      sessionToken: session.sessionToken,
      raceSessionId: campaign.session.id,
    });
  }

  if (!campaign.isOpenForPlay) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-lg text-amber-300">Racing belum aktif untuk campaign ini.</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-slate-400">Isi data untuk join race.</p>
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
        <p className="text-slate-400">Belum ada race yang dibuka. Tunggu operator memulai race.</p>
      </main>
    );
  }

  if (!joined && campaign.session.status !== "WAITING") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-slate-400">Race sedang berjalan, Anda belum terdaftar. Tunggu race berikutnya.</p>
        <RaceTrack standings={campaign.session.standings} />
      </main>
    );
  }

  const countdownRemaining = campaign.session.startedAt
    ? Math.ceil((new Date(campaign.session.startedAt).getTime() - now) / 1000)
    : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <h1 className="text-xl font-bold">{campaign.session.trackName}</h1>

      {campaign.session.status === "WAITING" && <p className="text-slate-400">Menunggu race dimulai dari CMS...</p>}
      {campaign.session.status === "COUNTDOWN" && (
        <p className="text-4xl font-bold text-amber-300">{Math.max(0, countdownRemaining)}</p>
      )}
      {campaign.session.status === "RUNNING" && (
        <button
          onClick={handleAccelerate}
          className="h-32 w-32 rounded-full bg-indigo-500 text-xl font-bold active:scale-95"
        >
          GAS!
        </button>
      )}
      {campaign.session.status === "FINISHED" && <p className="text-lg font-semibold">Race selesai!</p>}

      <RaceTrack standings={campaign.session.standings} />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  );
}
