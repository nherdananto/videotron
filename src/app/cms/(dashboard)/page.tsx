import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { CreateCampaignForm } from "@/components/cms/CreateCampaignForm";

export const dynamic = "force-dynamic";

export default async function CmsDashboardPage() {
  const user = await getSessionUser();
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true, spinResults: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">CMS &mdash; Campaign</h1>

      {user?.role === "ADMIN" && <CreateCampaignForm />}

      <div className="mt-8 flex flex-col gap-3">
        {campaigns.length === 0 && <p className="text-slate-400">Belum ada campaign.</p>}
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/cms/${c.slug}`}
            className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 hover:bg-slate-800"
          >
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-slate-400">/{c.slug} &middot; {c.status}</p>
            </div>
            <p className="text-sm text-slate-400">
              {c._count.participants} peserta &middot; {c._count.spinResults} spin
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
