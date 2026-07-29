import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVotingQuestionSchema } from "@/lib/validation";
import { requireCmsUser } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const questions = await prisma.votingQuestion.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: { options: { orderBy: { createdAt: "asc" }, include: { _count: { select: { votes: true } } } } },
  });

  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      isActive: q.isActive,
      createdAt: q.createdAt,
      options: q.options.map((o) => ({ id: o.id, label: o.label, count: o._count.votes })),
    })),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createVotingQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const question = await prisma.votingQuestion.create({
    data: {
      campaignId: campaign.id,
      question: parsed.data.question,
      options: { create: parsed.data.options.map((label) => ({ label })) },
    },
    include: { options: true },
  });

  return NextResponse.json({ question }, { status: 201 });
}
