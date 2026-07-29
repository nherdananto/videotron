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
  { params }: { params: Promise<{ campaignId: string; sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await prisma.pollSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    return NextResponse.json({ error: "Sesi polling tidak ditemukan" }, { status: 404 });
  }

  const answers = await prisma.pollAnswer.findMany({
    where: { pollQuestion: { pollSessionId: sessionId } },
    orderBy: { createdAt: "asc" },
    include: { participant: true, pollOption: true, pollQuestion: true },
  });

  const header = ["Nama", "HP", "Pertanyaan", "Jawaban", "Waktu"];
  const rows = answers.map((a) =>
    [a.participant.name, a.participant.phone, a.pollQuestion.question, a.pollOption.label, a.createdAt.toISOString()].map(
      csvEscape
    )
  );
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="polling-${sessionId}.csv"`,
    },
  });
}
