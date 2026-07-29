import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPollSessionSchema } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const sessions = await prisma.pollSession.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { createdAt: "asc" }, include: { _count: { select: { answers: true } } } } },
      },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      isActive: s.isActive,
      createdAt: s.createdAt,
      questions: s.questions.map((q) => ({
        id: q.id,
        question: q.question,
        order: q.order,
        options: q.options.map((o) => ({ id: o.id, label: o.label, count: o._count.answers })),
      })),
    })),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createPollSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.pollSession.create({
    data: {
      campaignId: campaign.id,
      title: parsed.data.title,
      questions: {
        create: parsed.data.questions.map((q, index) => ({
          question: q.question,
          order: index,
          options: { create: q.options.map((label) => ({ label })) },
        })),
      },
    },
    include: { questions: { include: { options: true } } },
  });

  return NextResponse.json({ session }, { status: 201 });
}
