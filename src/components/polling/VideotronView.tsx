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

export function VideotronView({ initialCampaign }: { initialCampaign: PublicPollingCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [participantCount, setParticipantCount] = useState(0);

  const socket = useSocket(campaign.slug, "videotron");

  async function refetch() {
    const res = await fetch(`/api/campaigns/${campaign.slug}/polling/public`);
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
    const onUpdated = () => void refetch();

    socket.on("participant:count", onCount);
    socket.on("polling:update", onTally);
    socket.on("campaign:updated", onUpdated);
    return () => {
      socket.off("participant:count", onCount);
      socket.off("polling:update", onTally);
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
        <p className="rounded-md bg-amber-500/10 px-4 py-2 text-amber-300">Polling belum aktif untuk campaign ini.</p>
      )}

      {campaign.session ? (
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <h2 className="text-xl font-semibold text-slate-300">{campaign.session.title}</h2>
          {campaign.session.questions.map((q) => (
            <div key={q.id} className="rounded-2xl bg-slate-900 p-8 text-left">
              <h3 className="mb-6 text-2xl font-semibold">{q.text}</h3>
              <VotingChart options={q.options} />
            </div>
          ))}
        </div>
      ) : (
        campaign.isOpenForPlay && <p className="text-slate-400">Menunggu sesi polling diaktifkan dari CMS...</p>
      )}
    </main>
  );
}
