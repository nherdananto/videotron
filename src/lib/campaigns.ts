import { prisma } from "@/lib/prisma";

export async function getPublicVotingCampaign(slug: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      games: { where: { gameType: "VOTING" } },
      votingQuestions: {
        where: { isActive: true },
        include: { options: { orderBy: { createdAt: "asc" }, include: { _count: { select: { votes: true } } } } },
        take: 1,
      },
    },
  });
  if (!campaign) return null;

  const now = new Date();
  const withinSchedule = (!campaign.startAt || now >= campaign.startAt) && (!campaign.endAt || now <= campaign.endAt);
  const activeQuestion = campaign.votingQuestions[0] ?? null;

  return {
    slug: campaign.slug,
    name: campaign.name,
    status: campaign.status,
    isOpenForPlay: campaign.status === "ACTIVE" && withinSchedule && (campaign.games[0]?.isActive ?? false),
    question: activeQuestion
      ? {
          id: activeQuestion.id,
          text: activeQuestion.question,
          options: activeQuestion.options.map((o) => ({ id: o.id, label: o.label, count: o._count.votes })),
        }
      : null,
  };
}

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
