import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; questionId: string }> }
) {
  const { questionId } = await params;
  const question = await prisma.votingQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Pertanyaan tidak ditemukan" }, { status: 404 });
  }

  const votes = await prisma.voteEntry.findMany({
    where: { votingQuestionId: questionId },
    orderBy: { createdAt: "asc" },
    include: { participant: true, votingOption: true },
  });

  const header = ["Nama", "HP", "Pilihan", "Waktu"];
  const rows = votes.map((v) =>
    [v.participant.name, v.participant.phone, v.votingOption.label, v.createdAt.toISOString()].map(csvEscape)
  );
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="voting-${questionId}.csv"`,
    },
  });
}
