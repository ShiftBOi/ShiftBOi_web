/**
 * Resolve site-public paths to Cloudflare R2 when media migration is live.
 * Absolute http(s) URLs and data/blob URLs pass through unchanged.
 */

const R2_PREFIXES = [
  "/images/",
  "/uploads/",
  "/videos/",
  "/dino/",
  "/brand/",
  "/illustrations/",
] as const;

/** Root-level media files migrated to R2 (exact path match). */
const R2_ROOT_FILES = new Set([
  "/og.png",
  "/dino-dash.png",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
  "/favicon.ico",
  "/brand-mark.svg",
]);

function r2PublicBase() {
  // Prefer NEXT_PUBLIC_ so client components (CMS previews) resolve too.
  return (
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");
}

export function isR2MigratedPath(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (R2_ROOT_FILES.has(p)) return true;
  return R2_PREFIXES.some((prefix) => p.startsWith(prefix));
}

/** Turn `/images/foo.png` into `https://…r2.dev/images/foo.png` when R2 is live. */
export function publicAssetUrl(src: string | null | undefined): string {
  if (!src) return "";
  const value = src.trim();
  if (!value) return "";
  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const path = value.startsWith("/") ? value : `/${value}`;
  const base = r2PublicBase();
  if (base && isR2MigratedPath(path)) {
    return `${base}${path}`;
  }
  return path;
}

/** Rewrite every matching absolute path inside a string (e.g. markdown / JSON). */
export function rewritePublicAssetUrls(text: string): string {
  const base = r2PublicBase();
  if (!base) return text;
  return text.replace(
    /(\/(?:images|uploads|videos|dino|brand|illustrations)\/[^\s"'`)]+)/g,
    (match) => `${base}${match}`,
  );
}
