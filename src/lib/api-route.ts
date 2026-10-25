import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.name || session.user.email.split("@")[0] || "Admin",
  };
}

type JsonInit = { status?: number; headers?: HeadersInit };

/** Standard success envelope: `{ success: true, data? }` */
export function apiOk<T = unknown>(data?: T, init: JsonInit = {}) {
  const body =
    data === undefined ? { success: true as const } : { success: true as const, data };
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: init.headers,
  });
}

/** Standard error envelope: `{ success: false, error }` */
export function apiFail(
  error: string,
  status = 400,
  init: JsonInit & { extra?: Record<string, unknown> } = {}
) {
  return NextResponse.json(
    { success: false as const, error, ...init.extra },
    { status, headers: init.headers }
  );
}

export function apiUnauthorized(message = "Unauthorized") {
  return apiFail(message, 401);
}

export function apiNotFound(message = "Not found") {
  return apiFail(message, 404);
}

export function apiForbidden(message = "Forbidden") {
  return apiFail(message, 403);
}

export function apiConflict(message: string) {
  return apiFail(message, 409);
}

export function apiUnavailable(message: string) {
  return apiFail(message, 503);
}

export type ApiUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type AuthResult =
  | { ok: true; user: ApiUser }
  | { ok: false; response: NextResponse };

/** Session gate for mutating / management routes. */
export async function requireApiUser(
  message = "Authentication required"
): Promise<AuthResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, response: apiUnauthorized(message) };
    return { ok: true, user };
  } catch {
    return { ok: false, response: apiUnauthorized("Authentication failed") };
  }
}

/** Parse JSON body; returns fail response on invalid JSON. */
export async function readJson<T = Record<string, unknown>>(
  request: Request
): Promise<{ ok: true; body: T } | { ok: false; response: NextResponse }> {
  try {
    const body = (await request.json()) as T;
    return { ok: true, body };
  } catch {
    return { ok: false, response: apiFail("Invalid JSON body", 400) };
  }
}

/**
 * Wrap a route handler with consistent 500 logging.
 * Use for public GETs and long try/catch blocks.
 */
export function withApiHandler<Args extends unknown[]>(
  label: string,
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`${label} failed:`, error);
      return apiFail("Internal server error", 500);
    }
  };
}
