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

export function VideotronView({ initialCampaign }: { initialCampaign: PublicCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [participantCount, setParticipantCount] = useState(0);
  const [lastResult, setLastResult] = useState<SpinResultPayload | null>(null);
  const [spinToken, setSpinToken] = useState(0);

  const socket = useSocket(campaign.slug, "videotron");

  useEffect(() => {
    if (!socket) return;
    const onCount = (payload: { campaignId: string; count: number }) => {
      if (payload.campaignId === campaign.slug) setParticipantCount(payload.count);
    };
    const onResult = (payload: SpinResultPayload) => {
      setLastResult(payload);
      setSpinToken((t) => t + 1);
    };
    const onUpdated = async () => {
      const res = await fetch(`/api/campaigns/${campaign.slug}/public`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      }
    };

    socket.on("participant:count", onCount);
    socket.on("spin:result", onResult);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("participant:count", onCount);
      socket.off("spin:result", onResult);
      socket.off("campaign:updated", onUpdated);
    };
  }, [socket, campaign.slug]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 py-10 text-center">
      <div>
        <h1 className="text-4xl font-bold">{campaign.name}</h1>
        <p className="mt-2 text-slate-400">{participantCount} peserta terhubung</p>
      </div>

      <Wheel prizes={campaign.prizes} stopAngle={lastResult?.stopAngle} spinToken={spinToken} size={420} />

      {!campaign.isOpenForPlay && (
        <p className="rounded-md bg-amber-500/10 px-4 py-2 text-amber-300">
          Spin Wheel belum aktif untuk campaign ini.
        </p>
      )}

      {lastResult && (
        <div className="animate-pulse rounded-xl bg-slate-900 px-8 py-4 text-2xl font-semibold">
          {lastResult.participantName}: {lastResult.isWin ? lastResult.prizeLabel : "Belum beruntung"}
        </div>
      )}
    </main>
  );
}
