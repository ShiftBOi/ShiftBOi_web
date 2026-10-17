/** Allow only a tiny HTML subset used by the CMS rich-text toolbar. */
export function sanitizeRichHtml(input: string): string {
  if (!input) return "";
  let html = String(input);
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<\/?(?!strong|b|em|i|span|br|p)([a-z0-9:-]+)[^>]*>/gi, "");
  html = html.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, "");
  html = html.replace(
    /\sclass\s*=\s*("([^"]*)"|'([^']*)')/gi,
    (_m, _q, a: string, b: string) => {
      const raw = a ?? b ?? "";
      const allowed = raw
        .split(/\s+/)
        .filter((c) => /^(rt-sm|rt-lg|rt-muted|rt-accent)$/.test(c));
      return allowed.length ? ` class="${allowed.join(" ")}"` : "";
    },
  );
  return html;
}

export function plainTextFromHtml(html: string): string {
  return sanitizeRichHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
