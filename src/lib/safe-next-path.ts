/**
 * Prevent open redirects after CMS login.
 * Only same-origin relative paths are allowed.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/cms",
): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback;
  return trimmed;
}
