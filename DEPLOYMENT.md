# Deployment Guide

This covers deploying Interactive Videotron Engagement to a server you control (VM, VPS, bare
metal, or any container host). Read **Architecture Notes** before choosing a platform — it rules
out a few options.

## Architecture Notes (read first)

- **This is not a serverless app.** `server.ts` runs a persistent Node process (Next.js + a
  Socket.io server sharing one HTTP server). It cannot run on Vercel, AWS Lambda, or any
  request-scoped serverless platform — those don't support the always-on WebSocket connections
  the realtime engine depends on. Deploy it to a VM, container host (Fly.io, Railway, a
  Docker-capable VPS, ECS/Cloud Run with min-instances ≥ 1), or bare metal.
- **Single instance only, for now.** Realtime state (Socket.io rooms, participant counts) lives in
  the memory of one Node process. Running multiple replicas behind a load balancer will NOT work
  correctly — a participant connected to instance A never sees broadcasts triggered on instance B.
  Horizontal scaling would need a Socket.io Redis adapter (`@socket.io/redis-adapter`), which isn't
  implemented yet. Scale vertically (bigger instance) instead of horizontally until that's added.
- **WebSocket-aware reverse proxy required** if you put anything in front of the app (nginx,
  Caddy, a cloud load balancer) — see [Reverse Proxy / TLS](#reverse-proxy--tls) below. A proxy
  that doesn't forward `Upgrade`/`Connection` headers will silently break all realtime features
  (spin sync, live vote/poll/quiz updates, tic-tac-toe, racing) while the rest of the site still
  looks fine.
- **Reconnect resilience**: if the process restarts (deploy, crash, OOM), all active WebSocket
  connections drop. `socket.io-client` auto-reconnects and every client re-emits `room:join` on
  connect, so clients resync from the database automatically — no data is lost, but there's a
  few-second gap in realtime updates during a restart.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Prisma connection string. `file:./dev.db` (SQLite) by default — see [Database](#database) for PostgreSQL. |
| `PORT` | no (default `3000`) | Port the custom server listens on. |
| `AUTH_SECRET` | yes | HMAC signing key for CMS session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Rotating this invalidates every logged-in CMS session.** |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only for seeding | Consumed once by `npm run db:seed` to create the first CMS admin (`ADMIN_NAME` optional, defaults to "Admin"). Seeding is idempotent — safe to leave set permanently, it skips if that email already exists. |

Copy `.env.example` to `.env` and fill in real values. Never commit `.env` — it's already
`.gitignore`d.

## Deploy with Docker (recommended)

The repo ships a multi-stage `Dockerfile` and `docker-compose.yml`. This is the path most people
should use — it handles the build, migrations, and admin seeding for you.

> Not build-tested in the environment this was written in (no Docker daemon available there).
> Run through this once on a machine with Docker before treating it as verified for your setup.

1. On the target machine: `git clone <repo>`, `cd videotron`.
2. Create `.env` (same directory as `docker-compose.yml`) with at least `AUTH_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD` — docker compose reads `.env` automatically for the
   `${VAR}` substitutions in `docker-compose.yml`.
3. `docker compose up --build -d`
   - On startup, the container runs `prisma migrate deploy`, then `npm run db:seed` (creates the
     admin if it doesn't exist yet), then starts the server.
4. `docker compose logs -f app` — confirm you see `Interactive Videotron ready on http://localhost:3000`.
5. Visit `http://<server>:3000/cms/login` and log in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

**Data persistence**: SQLite lives at `/data/dev.db` inside the container, backed by the named
volume `videotron-db` — it survives `docker compose down` / container recreation. It's only lost if
you explicitly `docker compose down -v`.

**Updating**: `git pull`, then `docker compose up --build -d` again. Migrations and seeding re-run
automatically (both are safe to re-run).

## Deploy without Docker (VM / bare metal)

Requirements: Node.js 20+, a process manager (examples below use `pm2`; a systemd unit works
identically).

```bash
git clone <repo>
cd videotron
npm ci
cp .env.example .env   # then edit: DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma migrate deploy
npm run build
npm run db:seed
```

Run it under a process manager so it survives reboots/crashes — don't run `npm run start` directly
in a terminal for anything but a smoke test:

```bash
npm install -g pm2
pm2 start "npm run start" --name videotron
pm2 save
pm2 startup   # follow the printed instructions to enable on boot
```

Or as a systemd unit (`/etc/systemd/system/videotron.service`):

```ini
[Unit]
Description=Interactive Videotron Engagement
After=network.target

[Service]
WorkingDirectory=/opt/videotron
ExecStart=/usr/bin/npm run start
Restart=always
EnvironmentFile=/opt/videotron/.env
User=videotron

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now videotron
```

**Updating**: `git pull`, `npm ci`, `npx prisma migrate deploy`, `npm run build`, then restart the
process (`pm2 restart videotron` / `sudo systemctl restart videotron`).

## Reverse Proxy / TLS

Put nginx (or Caddy) in front for TLS termination — an HTTPS domain is required in practice, since
participants scan a QR code with their own phone's camera app over mobile data/venue WiFi, and
browsers increasingly restrict features on non-secure origins. The critical detail is forwarding
the WebSocket upgrade:

```nginx
server {
    listen 443 ssl http2;
    server_name videotron.example.com;

    ssl_certificate     /etc/letsencrypt/live/videotron.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/videotron.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

Caddy needs no special WebSocket config (it forwards upgrades by default):

```
videotron.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

If your platform's load balancer terminates TLS for you (Fly.io, Railway, a cloud ALB), confirm it
supports WebSocket passthrough — most do, but it's usually an explicit setting.

## Database

**Default: SQLite.** Fine for a single-server deployment at the scale this app targets (one event
running at a time, a few hundred concurrent participants). Back it up by copying the file (or the
Docker volume) — there's no live-replication story for SQLite, so back up on a schedule that
matches your risk tolerance (e.g. after each campaign, or nightly via cron):

```bash
# bare metal
cp prisma/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db

# docker
docker compose exec app cp /data/dev.db /data/backup-$(date +%Y%m%d-%H%M%S).db
docker cp <container>:/data/backup-....db ./backups/
```

**Switching to PostgreSQL** (recommended once you're running multiple concurrent campaigns or want
managed backups):

1. In `prisma/schema.prisma`, change the `datasource` block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres connection string (e.g.
   `postgresql://user:pass@host:5432/videotron`).
3. `npx prisma migrate deploy` — replays all existing migrations against the new database.
4. Rebuild/restart.

## Post-Deploy Checklist

- [ ] `/cms/login` reachable and admin login works
- [ ] Create a test campaign, activate one game, confirm the QR/join URL and videotron URL both load
- [ ] Open the join URL on a phone and the videotron URL on a second device/tab — confirm an
      action on the phone (spin, vote, move) shows up on the videotron in real time
- [ ] Confirm HTTPS is enforced (session cookie is `secure` in production — it won't be sent over
      plain HTTP, so login will silently appear broken if TLS isn't actually terminating correctly)
- [ ] Rotate the seeded admin password (see note below — there's no in-app password change yet)

## Known Operational Gaps

- **No password change/reset flow.** To rotate a compromised or default password, delete the CMS
  user (`/cms/users`, as another Admin) and recreate it — there's no PATCH-password endpoint yet.
- **No rate limiting** on login or any public endpoint (join, spin, vote, etc.) — put this behind a
  proxy/WAF with basic rate limiting if the event is public-facing and high-traffic.
- **No health-check endpoint.** If your platform requires one for load-balancer/orchestrator
  liveness checks, `GET /` returns `200` and is a reasonable stand-in for now.
