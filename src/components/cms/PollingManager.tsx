"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  questions: {
    id: string;
    question: string;
    order: number;
    options: { id: string; label: string; count: number }[];
  }[];
};

type DraftQuestion = { question: string; options: string[] };

function emptyQuestion(): DraftQuestion {
  return { question: "", options: ["", ""] };
}

export function PollingManager({ slug }: { slug: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${slug}/poll-sessions`);
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions ?? []);
    }
  }

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q))
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      title,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options.map((o) => o.trim()).filter(Boolean),
      })),
    };
    const res = await fetch(`/api/campaigns/${slug}/poll-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal membuat sesi polling");
      return;
    }
    setTitle("");
    setQuestions([emptyQuestion()]);
    void refetch();
  }

  async function handleSetActive(sessionId: string, isActive: boolean) {
    await fetch(`/api/campaigns/${slug}/poll-sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    void refetch();
  }

  async function handleDelete(sessionId: string) {
    await fetch(`/api/campaigns/${slug}/poll-sessions/${sessionId}`, { method: "DELETE" });
    void refetch();
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Live Polling</h2>

      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-md bg-slate-900 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {s.title} {s.isActive && <span className="ml-2 text-xs text-emerald-400">● ON AIR</span>}
              </p>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => handleSetActive(s.id, !s.isActive)}
                  className={`rounded-md px-3 py-1 ${s.isActive ? "bg-slate-700 hover:bg-slate-600" : "bg-indigo-500 hover:bg-indigo-400"}`}
                >
                  {s.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <a
                  href={`/api/campaigns/${slug}/poll-sessions/${s.id}/export`}
                  className="rounded-md bg-slate-700 px-3 py-1 hover:bg-slate-600"
                >
                  Export CSV
                </a>
                <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:underline">
                  Hapus
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {s.questions.map((q) => {
                const total = q.options.reduce((sum, o) => sum + o.count, 0);
                return (
                  <p key={q.id} className="text-xs text-slate-400">
                    {q.question} &mdash; {q.options.map((o) => `${o.label}: ${o.count}`).join(" · ")} (total {total})
                  </p>
                );
              })}
            </div>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-slate-400">Belum ada sesi polling.</p>}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4 rounded-lg bg-slate-900 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Judul Sesi</label>
          <input
            required
            className="rounded-md bg-slate-800 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Polling Kepuasan Event"
          />
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="rounded-md border border-slate-800 p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Pertanyaan {qIndex + 1}</label>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIndex))}
                  className="text-xs text-red-400 hover:underline"
                >
                  Hapus pertanyaan
                </button>
              )}
            </div>
            <input
              required
              className="mt-1 w-full rounded-md bg-slate-800 px-3 py-2"
              value={q.question}
              onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
              placeholder="Bagaimana pengalaman Anda?"
            />
            <div className="mt-2 flex flex-col gap-2">
              {q.options.map((opt, oIndex) => (
                <input
                  key={oIndex}
                  required
                  className="rounded-md bg-slate-800 px-3 py-2"
                  value={opt}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                  placeholder={`Opsi ${oIndex + 1}`}
                />
              ))}
              <div className="flex gap-2">
                {q.options.length < 8 && (
                  <button
                    type="button"
                    onClick={() => updateQuestion(qIndex, { options: [...q.options, ""] })}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    + Tambah opsi
                  </button>
                )}
                {q.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => updateQuestion(qIndex, { options: q.options.slice(0, -1) })}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    Hapus opsi terakhir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
          className="self-start text-sm text-indigo-400 hover:underline"
        >
          + Tambah pertanyaan
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="self-start rounded-md bg-indigo-500 px-4 py-2 font-medium">
          Buat Sesi Polling
        </button>
      </form>
    </section>
  );
}
