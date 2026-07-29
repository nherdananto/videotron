import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { createCampaignSchema } from "@/lib/validation";
import { requireCmsUser, requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireCmsUser();
  if (auth instanceof NextResponse) return auth;

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { games: true, _count: { select: { participants: true, spinResults: true } } },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug ?? nanoid(8).toLowerCase();
  const existing = await prisma.campaign.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 409 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: parsed.data.name,
      slug,
      logoUrl: parsed.data.logoUrl ?? undefined,
      bannerUrl: parsed.data.bannerUrl ?? undefined,
      startAt: parsed.data.startAt ?? undefined,
      endAt: parsed.data.endAt ?? undefined,
      games: {
        create: { gameType: "SPIN_WHEEL", isActive: false },
      },
    },
    include: { games: true },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
