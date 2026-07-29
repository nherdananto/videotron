"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  isActive: boolean;
  createdAt: string;
  options: { id: string; label: string; count: number }[];
};

export function VotingManager({ slug }: { slug: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${slug}/voting-questions`);
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions ?? []);
    }
  }

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const options = newOptions.map((o) => o.trim()).filter(Boolean);
    const res = await fetch(`/api/campaigns/${slug}/voting-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion, options }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal membuat pertanyaan");
      return;
    }
    setNewQuestion("");
    setNewOptions(["", ""]);
    void refetch();
  }

  async function handleSetActive(questionId: string, isActive: boolean) {
    await fetch(`/api/campaigns/${slug}/voting-questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    void refetch();
  }

  async function handleDelete(questionId: string) {
    await fetch(`/api/campaigns/${slug}/voting-questions/${questionId}`, { method: "DELETE" });
    void refetch();
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Live Voting</h2>

      <div className="flex flex-col gap-3">
        {questions.map((q) => {
          const total = q.options.reduce((sum, o) => sum + o.count, 0);
          return (
            <div key={q.id} className="rounded-md bg-slate-900 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {q.question} {q.isActive && <span className="ml-2 text-xs text-emerald-400">● ON AIR</span>}
                </p>
                <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => handleSetActive(q.id, !q.isActive)}
                    className={`rounded-md px-3 py-1 ${q.isActive ? "bg-slate-700 hover:bg-slate-600" : "bg-indigo-500 hover:bg-indigo-400"}`}
                  >
                    {q.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <a
                    href={`/api/campaigns/${slug}/voting-questions/${q.id}/export`}
                    className="rounded-md bg-slate-700 px-3 py-1 hover:bg-slate-600"
                  >
                    Export CSV
                  </a>
                  <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:underline">
                    Hapus
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {q.options.map((o) => `${o.label}: ${o.count}`).join(" · ")} (total {total} suara)
              </p>
            </div>
          );
        })}
        {questions.length === 0 && <p className="text-slate-400">Belum ada pertanyaan voting.</p>}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 rounded-lg bg-slate-900 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Pertanyaan</label>
          <input
            required
            className="rounded-md bg-slate-800 px-3 py-2"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Makanan favorit?"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400">Opsi jawaban</label>
          {newOptions.map((opt, i) => (
            <input
              key={i}
              required
              className="rounded-md bg-slate-800 px-3 py-2"
              value={opt}
              onChange={(e) =>
                setNewOptions((opts) => opts.map((o, idx) => (idx === i ? e.target.value : o)))
              }
              placeholder={`Opsi ${i + 1}`}
            />
          ))}
          <div className="flex gap-2">
            {newOptions.length < 8 && (
              <button
                type="button"
                onClick={() => setNewOptions((opts) => [...opts, ""])}
                className="text-sm text-indigo-400 hover:underline"
              >
                + Tambah opsi
              </button>
            )}
            {newOptions.length > 2 && (
              <button
                type="button"
                onClick={() => setNewOptions((opts) => opts.slice(0, -1))}
                className="text-sm text-slate-400 hover:underline"
              >
                Hapus opsi terakhir
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="self-start rounded-md bg-indigo-500 px-4 py-2 font-medium">
          Buat Pertanyaan
        </button>
      </form>
    </section>
  );
}
