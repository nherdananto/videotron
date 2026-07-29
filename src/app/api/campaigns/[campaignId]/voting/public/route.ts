import { NextRequest, NextResponse } from "next/server";
import { getPublicVotingCampaign } from "@/lib/campaigns";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const campaign = await getPublicVotingCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}
