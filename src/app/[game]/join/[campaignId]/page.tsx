import { notFound } from "next/navigation";
import { getPublicSpinWheelCampaign } from "@/lib/campaigns";
import { JoinView } from "@/components/spin-wheel/JoinView";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ game: string; campaignId: string }>;
}) {
  const { game, campaignId } = await params;
  if (game !== "spin-wheel") {
    return (
      <main className="flex min-h-screen items-center justify-center text-center text-slate-400">
        Game &quot;{game}&quot; belum tersedia pada versi ini.
      </main>
    );
  }

  const campaign = await getPublicSpinWheelCampaign(campaignId);
  if (!campaign) notFound();

  return <JoinView initialCampaign={campaign} />;
}
