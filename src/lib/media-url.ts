/** True when a URL (or filename) looks like a playable video asset. */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split("?")[0]?.split("#")[0] ?? url;
  return /\.(mp4|webm|mov|m4v|ogg)(\s*$)/i.test(clean);
}
