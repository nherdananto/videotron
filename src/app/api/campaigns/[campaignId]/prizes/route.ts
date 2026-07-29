import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPrizeSchema } from "@/lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createPrizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prize = await prisma.spinPrize.create({
    data: {
      campaignId: campaign.id,
      label: parsed.data.label,
      type: parsed.data.type,
      probability: parsed.data.probability,
      quota: parsed.data.quota ?? null,
      quotaRemaining: parsed.data.quota ?? null,
      validFrom: parsed.data.validFrom ?? null,
      validUntil: parsed.data.validUntil ?? null,
    },
  });

  return NextResponse.json({ prize }, { status: 201 });
}
