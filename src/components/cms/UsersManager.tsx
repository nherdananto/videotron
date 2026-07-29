"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; email: string; name: string; role: "ADMIN" | "OPERATOR"; createdAt: string };

export function UsersManager({ currentUserId, initialUsers }: { currentUserId: string; initialUsers: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OPERATOR" as "ADMIN" | "OPERATOR" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/cms-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Gagal membuat user");
        return;
      }
      setUsers((u) => [...u, data.user]);
      setForm({ name: "", email: "", password: "", role: "OPERATOR" });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId: string) {
    await fetch(`/api/cms-users/${userId}`, { method: "DELETE" });
    setUsers((u) => u.filter((x) => x.id !== userId));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-lg bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2 text-right">
                  {u.id !== currentUserId && (
                    <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:underline">
                      Hapus
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-900 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Nama</label>
          <input
            required
            className="rounded-md bg-slate-800 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Email</label>
          <input
            required
            type="email"
            className="rounded-md bg-slate-800 px-3 py-2"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Password</label>
          <input
            required
            type="password"
            minLength={8}
            className="rounded-md bg-slate-800 px-3 py-2"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Role</label>
          <select
            className="rounded-md bg-slate-800 px-3 py-2"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "ADMIN" | "OPERATOR" }))}
          >
            <option value="OPERATOR">OPERATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={submitting} className="rounded-md bg-indigo-500 px-4 py-2 font-medium disabled:opacity-50">
          {submitting ? "Memproses..." : "Tambah User"}
        </button>
      </form>
    </div>
  );
}
