import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const r2Public = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "")
  .replace(/\/$/, "");
/** Only redirect /images etc. after `migrate-public-to-r2` succeeds (set R2_MEDIA_MIGRATED=1). */
const r2MediaLive =
  Boolean(r2Public) &&
  /^(1|true|yes)$/i.test(process.env.R2_MEDIA_MIGRATED || "");

let r2Hostname: string | null = null;
try {
  if (r2Public) r2Hostname = new URL(r2Public).hostname;
} catch {
  r2Hostname = null;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(r2Hostname
        ? [{ protocol: "https" as const, hostname: r2Hostname }]
        : []),
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    if (!r2MediaLive) return [];
    // Proxy (do not 308-redirect): <video>/<img>/canvas stay same-origin.
    // Cross-origin redirects break the hero ASCII portrait (drawImage + getImageData).
    const folders = [
      "images",
      "uploads",
      "videos",
      "dino",
      "brand",
      "illustrations",
    ] as const;
    const folderRewrites = folders.map((folder) => ({
      source: `/${folder}/:path*`,
      destination: `${r2Public}/${folder}/:path*`,
    }));
    const rootFiles = [
      "og.png",
      "dino-dash.png",
      "icon-192.png",
      "icon-512.png",
      "favicon-32.png",
      "favicon.ico",
      "brand-mark.svg",
    ];
    const rootRewrites = rootFiles.map((file) => ({
      source: `/${file}`,
      destination: `${r2Public}/${file}`,
    }));
    return [...folderRewrites, ...rootRewrites];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
