# Interactive Videotron Engagement Platform

Platform interaktif berbasis web yang menghubungkan smartphone (QR Code), CMS, dan Videotron
dalam satu ekosistem real-time untuk meningkatkan engagement pengunjung pada event, mall,
exhibition, kampus, promosi, dan aktivitas pemasaran.

## Stack

- **Next.js 16** (App Router, TypeScript) — CMS, Videotron player, dan mobile join view dalam satu app
- **Custom Node server + Socket.io** (`server.ts`) — realtime engine, satu room per campaign
- **Prisma + SQLite** (dev) — ganti `provider`/`DATABASE_URL` ke PostgreSQL untuk staging/production
- **Tailwind CSS**

## Routing

- `/{namagame}/{campaignId}` — tampilan Videotron (mis. `/spin-wheel/abc12345`, `/voting/abc12345`, `/polling/abc12345`, `/quiz/abc12345`)
- `/{namagame}/join/{campaignId}` — tampilan mobile untuk visitor (mis. `/spin-wheel/join/abc12345`)
- `/cms` — dashboard CMS (buat campaign, kelola hadiah/voting/polling/quiz, analytics, pantau hasil live, QR join)

Saat ini `spin-wheel`, `voting`, `polling`, dan `quiz` yang terimplementasi; slug game lain akan
menampilkan halaman "belum tersedia".

## Getting Started

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Buka `http://localhost:3000/cms` untuk membuat campaign, aktifkan game yang diinginkan, dan kelola
hadiah/pertanyaan voting. Scan/klik join URL dari CMS di satu device (mobile) dan buka videotron URL
di device lain — keduanya akan sinkron real-time lewat Socket.io.

## Docker

```bash
docker compose up --build
```

Menjalankan `prisma migrate deploy` otomatis saat container start, lalu serve di port 3000. Database
SQLite disimpan di named volume `videotron-db` agar persist antar restart. Untuk PostgreSQL, ganti
`provider` di `prisma/schema.prisma` ke `postgresql` dan set `DATABASE_URL` sesuai.

> Catatan: Dockerfile/compose ini belum di-build-test di environment pengembangan (tidak ada Docker
> daemon tersedia saat dibuat) — jalankan `docker compose up --build` secara lokal untuk verifikasi
> sebelum dipakai untuk deployment.

## Known Gaps (belum diimplementasi)

- Autentikasi & RBAC untuk CMS (saat ini `/cms` open access)
- Tic Tac Toe, Racing, Instagram Wall (Fase berikutnya sesuai roadmap)
- Audit Log, rate limiting

## Changelog

### 0.4.0 — 2026-07-29

- feat: Quiz Berhadiah end-to-end (Game 4) — bank soal dengan point/tingkat kesulitan/timer per soal,
  satu soal on-air per campaign, countdown tersinkron di videotron & HP lewat `activatedAt`, penilaian
  jawaban otomatis, leaderboard Top 10 real-time (Hari Ini/Minggu Ini/Bulan Ini)
- feat: Analytics summary di CMS — ringkasan peserta, spin, vote, jawaban polling, dan skor quiz
- fix: unifikasi import server-side (`server.ts`, `src/server/*`) ke alias `@/*` — sebelumnya memakai
  import relatif ber-`.js` yang gagal di-bundle Turbopack begitu sebuah engine file (quizEngine)
  perlu diimpor langsung oleh sebuah API route

### 0.3.0 — 2026-07-29

- feat: Live Polling end-to-end (Game 3) — sesi polling dengan banyak pertanyaan sekaligus, peserta
  menjawab berurutan dalam satu sesi, videotron menampilkan seluruh chart pertanyaan secara live,
  export CSV seluruh jawaban per sesi
- feat: generalisasi lebih lanjut pada join API dan activation toggle untuk game ketiga (Polling)

### 0.2.0 — 2026-07-29

- feat: Live Voting end-to-end (Game 2) — CMS pertanyaan & opsi, aktifkan/nonaktifkan satu pertanyaan
  per campaign, join/vote flow mobile, videotron live bar chart, export CSV hasil voting
- feat: generalisasi join API dan toggle aktivasi game per campaign untuk mendukung multi-game
- feat: Docker packaging (Dockerfile multi-stage + docker-compose, migrate-on-start)
- chore: upgrade Next.js ke v16 (memperbaiki kerentanan keamanan kritis di v14)

### 0.1.0 — 2026-07-29

- feat: scaffold platform (Next.js + Socket.io + Prisma)
- feat: Spin Wheel end-to-end — CMS campaign & prize management, QR join, mobile join/spin flow,
  videotron view with realtime-synced wheel animation, one-play-per-campaign enforcement
