"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function CmsNav({ user }: { user: { name: string; role: "ADMIN" | "OPERATOR" } }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/cms/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/cms" className="font-bold">
            Videotron CMS
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/cms/users" className="text-sm text-slate-400 hover:text-white">
              User &amp; Role
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">
            {user.name} <span className="text-slate-600">({user.role})</span>
          </span>
          <button onClick={handleLogout} className="rounded-md bg-slate-800 px-3 py-1.5 hover:bg-slate-700">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
