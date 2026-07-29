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

export function VideotronView({ initialCampaign }: { initialCampaign: PublicRacingCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [participantCount, setParticipantCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const socket = useSocket(campaign.slug, "videotron");

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/racing/public`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onCount = (payload: { campaignId: string; count: number }) => {
      if (payload.campaignId === campaign.slug) setParticipantCount(payload.count);
    };
    const onUpdate = (payload: RaceUpdatePayload) => {
      setCampaign((c) =>
        c.session
          ? { ...c, session: { ...c.session, ...payload } }
          : c
      );
    };
    const onUpdated = () => void refetch();

    socket.on("participant:count", onCount);
    socket.on("racing:update", onUpdate);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("participant:count", onCount);
      socket.off("racing:update", onUpdate);
      socket.off("campaign:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, campaign.slug]);

  const status = campaign.session?.status;
  useEffect(() => {
    if (status !== "COUNTDOWN" && status !== "RUNNING") return;
    const interval = setInterval(() => {
      setNow(Date.now());
      void refetch();
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const session = campaign.session;
  const countdownRemaining = session?.startedAt ? Math.ceil((new Date(session.startedAt).getTime() - now) / 1000) : 0;
  const raceRemaining = session?.endsAt ? Math.max(0, Math.ceil((new Date(session.endsAt).getTime() - now) / 1000)) : 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 py-10 text-center">
      <div>
        <h1 className="text-4xl font-bold">{campaign.name}</h1>
        <p className="mt-2 text-slate-400">{participantCount} peserta terhubung</p>
      </div>

      {!campaign.isOpenForPlay && (
        <p className="rounded-md bg-amber-500/10 px-4 py-2 text-amber-300">Racing belum aktif untuk campaign ini.</p>
      )}

      {session ? (
        <div className="w-full max-w-2xl rounded-2xl bg-slate-900 p-8">
          <h2 className="mb-2 text-2xl font-semibold">{session.trackName}</h2>
          {session.status === "WAITING" && <p className="mb-4 text-slate-400">Menunggu race dimulai dari CMS...</p>}
          {session.status === "COUNTDOWN" && (
            <p className="mb-4 text-3xl font-bold text-amber-300">{Math.max(0, countdownRemaining)}</p>
          )}
          {session.status === "RUNNING" && <p className="mb-4 text-xl font-semibold text-emerald-400">Sisa {raceRemaining}s</p>}
          {session.status === "FINISHED" && <p className="mb-4 text-xl font-semibold">Race selesai!</p>}
          <RaceTrack standings={session.standings} />
        </div>
      ) : (
        campaign.isOpenForPlay && <p className="text-slate-400">Belum ada race yang dibuka dari CMS.</p>
      )}
    </main>
  );
}
