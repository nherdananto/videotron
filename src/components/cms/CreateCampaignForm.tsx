"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCampaignForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Gagal membuat campaign");
        return;
      }
      router.push(`/cms/${data.campaign.slug}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-900 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Nama Campaign</label>
        <input
          required
          className="rounded-md bg-slate-800 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Slug (opsional, untuk URL)</label>
        <input
          className="rounded-md bg-slate-800 px-3 py-2"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="auto-generate"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-500 px-4 py-2 font-medium disabled:opacity-50"
      >
        {submitting ? "Membuat..." : "Buat Campaign"}
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
