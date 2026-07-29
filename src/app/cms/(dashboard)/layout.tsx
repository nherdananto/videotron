import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { CmsNav } from "@/components/cms/CmsNav";

export default async function CmsDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/cms/login");

  return (
    <div>
      <CmsNav user={{ name: user.name, role: user.role }} />
      {children}
    </div>
  );
}
