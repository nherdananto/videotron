# --- deps: install dependencies once, reused by builder and runner ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --- builder: generate Prisma client and produce the Next.js production build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- runner: minimal image that actually serves the app ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY package.json next.config.mjs tsconfig.json server.ts docker-entrypoint.sh ./

EXPOSE 3000
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
