import { prisma } from "@/lib/prisma";

export async function getPublicSpinWheelCampaign(slug: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      games: { where: { gameType: "SPIN_WHEEL" } },
      spinPrizes: { orderBy: { createdAt: "asc" }, select: { id: true, label: true, type: true } },
    },
  });
  if (!campaign) return null;

  const now = new Date();
  const withinSchedule = (!campaign.startAt || now >= campaign.startAt) && (!campaign.endAt || now <= campaign.endAt);

  return {
    slug: campaign.slug,
    name: campaign.name,
    logoUrl: campaign.logoUrl,
    status: campaign.status,
    isOpenForPlay: campaign.status === "ACTIVE" && withinSchedule && (campaign.games[0]?.isActive ?? false),
    prizes: campaign.spinPrizes,
  };
}
