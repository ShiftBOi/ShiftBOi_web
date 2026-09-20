import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordPageHit } from "@/lib/analytics";

const COOKIE = "sb_vid";
const MAX_AGE = 60 * 60 * 24 * 365;

function shouldSkip(path: string) {
  return (
    path.startsWith("/cms") ||
    path.startsWith("/api") ||
    path.startsWith("/_next")
  );
}

export async function POST(request: NextRequest) {
  let path = "/";
  try {
    const body = (await request.json()) as { path?: string };
    if (typeof body.path === "string" && body.path.startsWith("/")) {
      path = body.path.slice(0, 200);
    }
  } catch {
    // empty body is fine
  }

  if (shouldSkip(path)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let visitorId = request.cookies.get(COOKIE)?.value;
  const isNew = !visitorId;
  if (!visitorId) visitorId = randomUUID();

  try {
    await recordPageHit(visitorId);
  } catch (err) {
    console.error("[analytics] hit failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  if (isNew) {
    res.cookies.set(COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE,
    });
  }
  return res;
}
