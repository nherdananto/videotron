import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { CampaignDetail } from "@/components/cms/CampaignDetail";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignId },
    include: {
      games: true,
      spinPrizes: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) notFound();

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${protocol}://${host}`;
  const joinUrl = `${origin}/spin-wheel/join/${campaign.slug}`;
  const videotronUrl = `${origin}/spin-wheel/${campaign.slug}`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl, { margin: 1, width: 240 });

  const spinWheelGame = campaign.games.find((g) => g.gameType === "SPIN_WHEEL");

  return (
    <CampaignDetail
      campaign={{
        slug: campaign.slug,
        name: campaign.name,
        status: campaign.status,
        spinWheelActive: spinWheelGame?.isActive ?? false,
        prizes: campaign.spinPrizes.map((p) => ({
          id: p.id,
          label: p.label,
          type: p.type,
          probability: p.probability,
          quota: p.quota,
          quotaRemaining: p.quotaRemaining,
        })),
      }}
      joinUrl={joinUrl}
      videotronUrl={videotronUrl}
      qrDataUrl={qrDataUrl}
    />
  );
}
