import { NextResponse } from "next/server";
import { checkPassword, createSessionToken, isPasswordConfigured, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

const attempts = new Map<string, { count: number; until: number }>();

export async function POST(req: Request) {
  if (!isPasswordConfigured()) {
    return NextResponse.json({ error: "APP_PASSWORD is not configured on the server." }, { status: 500 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.until > now) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    /* ignore */
  }

  if (!checkPassword(password)) {
    const count = (entry?.count ?? 0) + 1;
    attempts.set(ip, { count, until: count >= 5 ? now + 60_000 : 0 });
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  attempts.delete(ip);

  try {
    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to sign in" }, { status: 500 });
  }
}
