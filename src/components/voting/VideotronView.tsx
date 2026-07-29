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

export function VideotronView({ initialCampaign }: { initialCampaign: PublicVotingCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [participantCount, setParticipantCount] = useState(0);

  const socket = useSocket(campaign.slug, "videotron");

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/voting/public`);
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
    const onTally = (payload: VotingTallyPayload) => {
      setCampaign((c) => (c.question && c.question.id === payload.votingQuestionId ? { ...c, question: { id: payload.votingQuestionId, text: payload.question, options: payload.options } } : c));
    };
    const onUpdated = () => {
      void refetch();
    };

    socket.on("participant:count", onCount);
    socket.on("voting:update", onTally);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("participant:count", onCount);
      socket.off("voting:update", onTally);
      socket.off("campaign:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, campaign.slug]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 py-10 text-center">
      <div>
        <h1 className="text-4xl font-bold">{campaign.name}</h1>
        <p className="mt-2 text-slate-400">{participantCount} peserta terhubung</p>
      </div>

      {!campaign.isOpenForPlay && (
        <p className="rounded-md bg-amber-500/10 px-4 py-2 text-amber-300">Voting belum aktif untuk campaign ini.</p>
      )}

      {campaign.question ? (
        <div className="w-full max-w-2xl rounded-2xl bg-slate-900 p-8">
          <h2 className="mb-6 text-2xl font-semibold">{campaign.question.text}</h2>
          <VotingChart options={campaign.question.options} />
        </div>
      ) : (
        campaign.isOpenForPlay && <p className="text-slate-400">Menunggu pertanyaan diaktifkan dari CMS...</p>
      )}
    </main>
  );
}
