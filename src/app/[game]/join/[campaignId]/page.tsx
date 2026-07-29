import { notFound } from "next/navigation";
import {
  getPublicSpinWheelCampaign,
  getPublicVotingCampaign,
  getPublicPollingCampaign,
  getPublicQuizCampaign,
} from "@/lib/campaigns";
import { JoinView as SpinWheelJoinView } from "@/components/spin-wheel/JoinView";
import { JoinView as VotingJoinView } from "@/components/voting/JoinView";
import { JoinView as PollingJoinView } from "@/components/polling/JoinView";
import { JoinView as QuizJoinView } from "@/components/quiz/JoinView";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ game: string; campaignId: string }>;
}) {
  const { game, campaignId } = await params;

  if (game === "spin-wheel") {
    const campaign = await getPublicSpinWheelCampaign(campaignId);
    if (!campaign) notFound();
    return <SpinWheelJoinView initialCampaign={campaign} />;
  }

  if (game === "voting") {
    const campaign = await getPublicVotingCampaign(campaignId);
    if (!campaign) notFound();
    return <VotingJoinView initialCampaign={campaign} />;
  }

  if (game === "polling") {
    const campaign = await getPublicPollingCampaign(campaignId);
    if (!campaign) notFound();
    return <PollingJoinView initialCampaign={campaign} />;
  }

  if (game === "quiz") {
    const campaign = await getPublicQuizCampaign(campaignId);
    if (!campaign) notFound();
    return <QuizJoinView initialCampaign={campaign} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-center text-slate-400">
      Game &quot;{game}&quot; belum tersedia pada versi ini.
    </main>
  );
}
