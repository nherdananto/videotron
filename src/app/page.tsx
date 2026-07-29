import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">Interactive Videotron Engagement</h1>
      <p className="text-slate-400">
        Platform interaktif yang menghubungkan smartphone, QR Code, CMS, dan Videotron dalam satu ekosistem
        real-time.
      </p>
      <Link
        href="/cms"
        className="rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white hover:bg-indigo-400"
      >
        Buka CMS
      </Link>
    </main>
  );
}
