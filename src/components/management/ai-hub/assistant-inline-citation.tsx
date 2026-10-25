"use client";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export type CitationSource = {
  title: string;
  url?: string;
  snippet?: string;
  hostname?: string;
};

/** Known platforms → homepage (for logo + hover card). */
const PLATFORM_SITES: Record<string, { title: string; url: string }> = {
  nextjs: { title: "Next.js", url: "https://nextjs.org" },
  "next.js": { title: "Next.js", url: "https://nextjs.org" },
  react: { title: "React", url: "https://react.dev" },
  vercel: { title: "Vercel", url: "https://vercel.com" },
  groq: { title: "Groq", url: "https://groq.com" },
  typescript: { title: "TypeScript", url: "https://www.typescriptlang.org" },
  tailwind: { title: "Tailwind CSS", url: "https://tailwindcss.com" },
  "tailwind css": { title: "Tailwind CSS", url: "https://tailwindcss.com" },
  "shadcn/ui": { title: "shadcn/ui", url: "https://ui.shadcn.com" },
  shadcn: { title: "shadcn/ui", url: "https://ui.shadcn.com" },
  "framer motion": { title: "Framer Motion", url: "https://www.framer.com/motion" },
  prisma: { title: "Prisma", url: "https://www.prisma.io" },
  github: { title: "GitHub", url: "https://github.com" },
  openai: { title: "OpenAI", url: "https://openai.com" },
};

export function faviconUrl(urlOrHost: string) {
  try {
    const host = urlOrHost.includes("://")
      ? new URL(urlOrHost).hostname
      : urlOrHost.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return "";
  }
}

export function resolvePlatformCitation(
  token: string
): CitationSource | null {
  const key = token.trim().toLowerCase();
  const hit = PLATFORM_SITES[key];
  if (!hit) return null;
  return {
    title: hit.title,
    url: hit.url,
    hostname: new URL(hit.url).hostname,
  };
}

export function InlineCitation({ source }: { source: CitationSource }) {
  const url = source.url || "";
  let hostname = source.hostname || "";
  if (!hostname && url) {
    try {
      hostname = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      hostname = source.title;
    }
  }
  const icon = url || hostname ? faviconUrl(url || hostname) : "";
  const label = hostname || source.title;

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={10}
        closeDelay={100}
        render={
          <Button
            variant="secondary"
            size="xs"
            className="cms-ai-cite"
            type="button"
          />
        }
      >
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="cms-ai-cite__icon" />
        ) : null}
        <span className="cms-ai-cite__label">{label}</span>
      </HoverCardTrigger>
      <HoverCardContent className="cms-ai-cite__card flex w-64 flex-col gap-1">
        <div className="cms-ai-cite__card-head">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="cms-ai-cite__icon cms-ai-cite__icon--lg" />
          ) : null}
          <div className="font-medium">{source.title}</div>
        </div>
        {source.snippet ? (
          <p className="cms-ai-cite__snippet">{source.snippet}</p>
        ) : null}
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="cms-ai-cite__link">
            {hostname}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
