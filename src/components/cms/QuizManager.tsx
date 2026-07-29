"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  points: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timerSeconds: number;
  isActive: boolean;
  options: { id: string; label: string; isCorrect: boolean; count: number }[];
};

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

function emptyOptions() {
  return ["", ""];
}

export function QuizManager({ slug }: { slug: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(emptyOptions());
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState("100");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("MEDIUM");
  const [timerSeconds, setTimerSeconds] = useState("20");
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch(`/api/campaigns/${slug}/quiz-questions`);
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
    const payload = {
      question,
      options: options.map((label, i) => ({ label, isCorrect: i === correctIndex })),
      points: Number(points),
      difficulty,
      timerSeconds: Number(timerSeconds),
    };
    const res = await fetch(`/api/campaigns/${slug}/quiz-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal membuat soal");
      return;
    }
    setQuestion("");
    setOptions(emptyOptions());
    setCorrectIndex(0);
    setPoints("100");
    setDifficulty("MEDIUM");
    setTimerSeconds("20");
    void refetch();
  }

  async function handleSetActive(questionId: string, isActive: boolean) {
    await fetch(`/api/campaigns/${slug}/quiz-questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    void refetch();
  }

  async function handleDelete(questionId: string) {
    await fetch(`/api/campaigns/${slug}/quiz-questions/${questionId}`, { method: "DELETE" });
    void refetch();
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Quiz Berhadiah</h2>

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
                  <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:underline">
                    Hapus
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {q.difficulty} &middot; {q.points} poin &middot; {q.timerSeconds}s
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q.options.map((o) => `${o.isCorrect ? "✓ " : ""}${o.label}: ${o.count}`).join(" · ")} (total {total})
              </p>
            </div>
          );
        })}
        {questions.length === 0 && <p className="text-slate-400">Belum ada soal di bank soal.</p>}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 rounded-lg bg-slate-900 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Pertanyaan</label>
          <input
            required
            className="rounded-md bg-slate-800 px-3 py-2"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400">Opsi jawaban (pilih yang benar)</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-option"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
              />
              <input
                required
                className="flex-1 rounded-md bg-slate-800 px-3 py-2"
                value={opt}
                onChange={(e) => setOptions((os) => os.map((o, idx) => (idx === i ? e.target.value : o)))}
                placeholder={`Opsi ${i + 1}`}
              />
            </div>
          ))}
          <div className="flex gap-2">
            {options.length < 8 && (
              <button type="button" onClick={() => setOptions((os) => [...os, ""])} className="text-xs text-indigo-400 hover:underline">
                + Tambah opsi
              </button>
            )}
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  setOptions((os) => os.slice(0, -1));
                  setCorrectIndex((idx) => Math.min(idx, options.length - 2));
                }}
                className="text-xs text-slate-400 hover:underline"
              >
                Hapus opsi terakhir
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Point</label>
            <input
              type="number"
              min={1}
              className="w-24 rounded-md bg-slate-800 px-3 py-2"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Tingkat Kesulitan</label>
            <select
              className="rounded-md bg-slate-800 px-3 py-2"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as (typeof DIFFICULTIES)[number])}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Timer (detik)</label>
            <input
              type="number"
              min={5}
              className="w-24 rounded-md bg-slate-800 px-3 py-2"
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="self-start rounded-md bg-indigo-500 px-4 py-2 font-medium">
          Tambah Soal
        </button>
      </form>
    </section>
  );
}
