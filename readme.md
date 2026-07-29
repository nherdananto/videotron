# Interactive Videotron Engagement Platform

Platform interaktif berbasis web yang menghubungkan smartphone (QR Code), CMS, dan Videotron
dalam satu ekosistem real-time untuk meningkatkan engagement pengunjung pada event, mall,
exhibition, kampus, promosi, dan aktivitas pemasaran.

## Stack

- **Next.js 14** (App Router, TypeScript) — CMS, Videotron player, dan mobile join view dalam satu app
- **Custom Node server + Socket.io** (`server.ts`) — realtime engine, satu room per campaign
- **Prisma + SQLite** (dev) — ganti `provider`/`DATABASE_URL` ke PostgreSQL untuk staging/production
- **Tailwind CSS**

## Routing

- `/{namagame}/{campaignId}` — tampilan Videotron (mis. `/spin-wheel/abc12345`)
- `/{namagame}/join/{campaignId}` — tampilan mobile untuk visitor (mis. `/spin-wheel/join/abc12345`)
- `/cms` — dashboard CMS (buat campaign, kelola hadiah, pantau hasil live, QR join)

Saat ini hanya `spin-wheel` yang terimplementasi; slug game lain akan menampilkan halaman "belum tersedia".

## Getting Started

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Buka `http://localhost:3000/cms` untuk membuat campaign, aktifkan Spin Wheel, dan tambah hadiah.
Scan/klik join URL dari CMS di satu device (mobile) dan buka videotron URL di device lain — keduanya
akan sinkron real-time lewat Socket.io.

## Known Gaps (belum diimplementasi)

- Autentikasi & RBAC untuk CMS (saat ini `/cms` open access)
- Voting, Polling, Quiz, Tic Tac Toe, Racing, Instagram Wall (Fase berikutnya sesuai roadmap)
- Analytics dashboard, Audit Log, rate limiting

## Changelog

### 0.1.0 — 2026-07-29

- feat: scaffold platform (Next.js + Socket.io + Prisma)
- feat: Spin Wheel end-to-end — CMS campaign & prize management, QR join, mobile join/spin flow,
  videotron view with realtime-synced wheel animation, one-play-per-campaign enforcement
