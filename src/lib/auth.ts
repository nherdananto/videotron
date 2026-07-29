import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "videotron_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env var is not set — required to sign CMS session cookies");
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

interface SessionPayload {
  userId: string;
  role: "ADMIN" | "OPERATOR";
  exp: number;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(userId: string, role: "ADMIN" | "OPERATOR"): string {
  const payload: SessionPayload = { userId, role, exp: Date.now() + SESSION_TTL_MS };
  const body = base64url(JSON.stringify(payload));
  const signature = base64url(createHmac("sha256", getSecret()).update(body).digest());
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = base64url(createHmac("sha256", getSecret()).update(body).digest());
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return prisma.cmsUser.findUnique({ where: { id: payload.userId } });
}

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

/** Use at the top of any CMS-only API route: `const auth = await requireCmsUser(); if (auth instanceof NextResponse) return auth;` */
export async function requireCmsUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Anda harus login untuk mengakses CMS" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const result = await requireCmsUser();
  if (result instanceof NextResponse) return result;
  if (result.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya Admin yang dapat melakukan aksi ini" }, { status: 403 });
  }
  return result;
}
