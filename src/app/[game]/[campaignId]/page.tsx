import { notFound } from "next/navigation";
import { getPublicSpinWheelCampaign } from "@/lib/campaigns";
import { VideotronView } from "@/components/spin-wheel/VideotronView";

export default async function VideotronPage({
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

  return <VideotronView initialCampaign={campaign} />;
}
