"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Creattie mailbox success mark (ported from ttianqii-web-original).
 * Source JSON: black outlines + purple accent → retinted to white + ShiftBOi violet.
 */

const CREATTIE_SCRIPTS = [
  "https://creattie.com/js/manifest.js",
  "https://creattie.com/js/vendor.js",
  "https://creattie.com/js/embed.js?id=f702d08fa3177bffcb38",
];
const CREATTIE_ANIM_SRC =
  "https://ik.imagekit.io/creattie/main/saved_colors/147436/kbz871InKXGN53Ux.json";

const PURPLE = [0.647, 0.271, 0.835] as const;
const WHITE = [1, 1, 1] as const;
const FALLBACK_VIOLET = [139 / 255, 92 / 255, 246 / 255] as const; // #8b5cf6

let creattiePreload: Promise<void> | null = null;
let retintedUrlCache: Promise<string> | null = null;

export function preloadSentSuccess() {
  if (typeof window === "undefined") return Promise.resolve();
  creattiePreload ??= Promise.all([
    ...CREATTIE_SCRIPTS.map(
      (src) =>
        new Promise<void>((resolve) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        }),
    ),
    fetch(CREATTIE_ANIM_SRC).catch(() => undefined),
  ]).then(() => undefined);
  return creattiePreload;
}

function nearChannel(a: number, b: number, tol = 0.08) {
  return Math.abs(a - b) <= tol;
}

function isPurple(k: number[]) {
  return (
    k.length >= 3 &&
    nearChannel(k[0], PURPLE[0]) &&
    nearChannel(k[1], PURPLE[1]) &&
    nearChannel(k[2], PURPLE[2])
  );
}

function isBlack(k: number[]) {
  return k.length >= 3 && k[0] <= 0.08 && k[1] <= 0.08 && k[2] <= 0.08;
}

function parseCssColor(
  raw: string,
): readonly [number, number, number] | null {
  const hex = raw.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = raw
    .trim()
    .match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i,
    );
  if (rgb) {
    return [
      Number(rgb[1]) / 255,
      Number(rgb[2]) / 255,
      Number(rgb[3]) / 255,
    ];
  }
  return null;
}

function readAccent(el: Element): readonly [number, number, number] {
  const style = getComputedStyle(el);
  const raw =
    style.getPropertyValue("--color-hydra-accent").trim() ||
    style.getPropertyValue("--color-violet-bright").trim() ||
    "#8b5cf6";
  return parseCssColor(raw) ?? FALLBACK_VIOLET;
}

function recolorLottie(
  data: unknown,
  accent: readonly [number, number, number],
) {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;
    const obj = node as Record<string, unknown>;
    if (
      (obj.ty === "st" || obj.ty === "fl") &&
      obj.c &&
      typeof obj.c === "object"
    ) {
      const c = obj.c as { a?: number; k?: number[] };
      if (Array.isArray(c.k) && typeof c.k[0] === "number") {
        const k = c.k;
        let next = k;
        if (isPurple(k)) {
          next = [
            accent[0],
            accent[1],
            accent[2],
            ...(k[3] != null ? [k[3]] : []),
          ];
        } else if (isBlack(k)) {
          next = [
            WHITE[0],
            WHITE[1],
            WHITE[2],
            ...(k[3] != null ? [k[3]] : []),
          ];
        }
        return { ...obj, c: { ...c, k: next } };
      }
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) out[key] = walk(value);
    return out;
  };
  return walk(data);
}

async function getRetintedAnimUrl(host: Element) {
  retintedUrlCache ??= (async () => {
    const res = await fetch(CREATTIE_ANIM_SRC);
    const json = await res.json();
    const accent = readAccent(host);
    const next = recolorLottie(json, accent);
    const blob = new Blob([JSON.stringify(next)], {
      type: "application/json",
    });
    return URL.createObjectURL(blob);
  })();
  return retintedUrlCache;
}

function AnimatedMailbox() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await preloadSentSuccess();
      if (cancelled || !wrapper.current) return;
      const url = await getRetintedAnimUrl(wrapper.current);
      if (!cancelled) setSrc(url);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!src || !wrapper.current) return;
    const el = wrapper.current.querySelector("creattie-embed");
    const Vue = (
      window as unknown as {
        Vue?: new (opts: { el: Element }) => unknown;
      }
    ).Vue;
    if (el && Vue) new Vue({ el });
  }, [src]);

  return (
    <div
      ref={wrapper}
      className="sb-sent-anim"
      dangerouslySetInnerHTML={{
        __html: src
          ? `<creattie-embed class="sb-sent-anim" src="${src}" delay="1" speed="100" frame_rate="24" stroke_width="12.5" trigger="loop" style="width:100%;background-color:"></creattie-embed>`
          : "",
      }}
    />
  );
}

export function SentSuccess({
  email,
  title = "Message sent",
  body = "Thanks for getting in touch. I'll reply soon to",
  note = "Check your inbox for a confirmation",
  onAgain,
}: {
  email: string;
  title?: string;
  body?: string;
  note?: string;
  onAgain?: () => void;
}) {
  return (
    <div className="sb-sent-success" role="status" aria-live="polite">
      <AnimatedMailbox />
      <h3 className="sb-sent-success__title">{title}</h3>
      <p className="sb-sent-success__body">
        {body}{" "}
        <span className="sb-sent-success__email">{email}</span>
      </p>
      <div className="sb-sent-success__pill">
        <span className="sb-sent-success__dot" aria-hidden>
          <span className="sb-sent-success__dot-ping" />
          <span className="sb-sent-success__dot-core" />
        </span>
        {note}
      </div>
      {onAgain ? (
        <button type="button" className="sb-touch__again" onClick={onAgain}>
          Send another
        </button>
      ) : null}
    </div>
  );
}
