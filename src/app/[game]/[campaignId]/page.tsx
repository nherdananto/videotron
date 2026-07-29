import { notFound } from "next/navigation";
import {
  getPublicSpinWheelCampaign,
  getPublicVotingCampaign,
  getPublicPollingCampaign,
  getPublicQuizCampaign,
  getPublicTicTacToeCampaign,
  getPublicRacingCampaign,
} from "@/lib/campaigns";
import { VideotronView as SpinWheelVideotronView } from "@/components/spin-wheel/VideotronView";
import { VideotronView as VotingVideotronView } from "@/components/voting/VideotronView";
import { VideotronView as PollingVideotronView } from "@/components/polling/VideotronView";
import { VideotronView as QuizVideotronView } from "@/components/quiz/VideotronView";
import { VideotronView as TicTacToeVideotronView } from "@/components/tictactoe/VideotronView";
import { VideotronView as RacingVideotronView } from "@/components/racing/VideotronView";

export default async function VideotronPage({
  params,
}: {
  params: Promise<{ game: string; campaignId: string }>;
}) {
  const { game, campaignId } = await params;

  if (game === "spin-wheel") {
    const campaign = await getPublicSpinWheelCampaign(campaignId);
    if (!campaign) notFound();
    return <SpinWheelVideotronView initialCampaign={campaign} />;
  }

  if (game === "voting") {
    const campaign = await getPublicVotingCampaign(campaignId);
    if (!campaign) notFound();
    return <VotingVideotronView initialCampaign={campaign} />;
  }

  if (game === "polling") {
    const campaign = await getPublicPollingCampaign(campaignId);
    if (!campaign) notFound();
    return <PollingVideotronView initialCampaign={campaign} />;
  }

  if (game === "quiz") {
    const campaign = await getPublicQuizCampaign(campaignId);
    if (!campaign) notFound();
    return <QuizVideotronView initialCampaign={campaign} />;
  }

  if (game === "tic-tac-toe") {
    const campaign = await getPublicTicTacToeCampaign(campaignId);
    if (!campaign) notFound();
    return <TicTacToeVideotronView initialCampaign={campaign} />;
  }

  if (game === "racing") {
    const campaign = await getPublicRacingCampaign(campaignId);
    if (!campaign) notFound();
    return <RacingVideotronView initialCampaign={campaign} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-center text-slate-400">
      Game &quot;{game}&quot; belum tersedia pada versi ini.
    </main>
  );
}
