import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/cms/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/cms/login");
  if (currentUser.role !== "ADMIN") redirect("/cms");

  const users = await prisma.cmsUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">User &amp; Role</h1>
      <UsersManager
        currentUserId={currentUser.id}
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
      />
    </main>
  );
}
