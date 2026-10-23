---
name: ascii-reveal
description: >-
  Integrates quanhoangindex/ascii-reveal — React ASCII decode/scramble loading
  and skeleton effects. Use when the user asks for ascii-reveal, ASCII loading,
  decode reveal, glyph scramble, AsciiSkeleton, or cinematic text/image reveal
  on mount / loading states.
---

# ascii-reveal (ShiftBOi)

Open-source React loading effect by [Quan Hoang](https://github.com/quanhoangindex/ascii-reveal).
Demo: https://quanhoangindex.github.io/ascii-reveal/

Content stays in the DOM (no layout shift). Scramble draws on a canvas layer above.
~15 KB gzipped, no runtime deps beyond React. Respects `prefers-reduced-motion`.

## Install

Not published on npm yet — install from GitHub:

```bash
npm i github:quanhoangindex/ascii-reveal
```

Peer: React ≥ 17. Works with Next.js App Router (`"use client"` entry).

## Quick usage

```tsx
"use client";

import { AsciiReveal } from "ascii-reveal";

export function Page() {
  return (
    <AsciiReveal preset="decode" duration="fast">
      <article className="card" data-ascii="surface">
        <img src="/cover.jpg" alt="" />
        <h2>Hello</h2>
        <button data-ascii="fade">Read more</button>
      </article>
    </AsciiReveal>
  );
}
```

### Loading + skeleton

```tsx
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";

<AsciiReveal loading={!data}>
  {data ? <Profile data={data} /> : <AsciiSkeleton lines={3} variant="scan" />}
</AsciiReveal>
```

### Theming (ShiftBOi)

Set on a wrapper near the reveal:

```css
.sb-ascii {
  --ascii-accent: #7c3aed;
  --ascii-flash: #a78bfa;
  --ascii-glyph: rgba(255, 255, 255, 0.45);
  --ascii-font: var(--font-family-pixel), ui-monospace, monospace;
  --ascii-surface: #000000;
  --ascii-skeleton: rgba(255, 255, 255, 0.35);
  --ascii-mascot: #a78bfa;
}
```

## Marking elements

| Attribute | Effect |
| --- | --- |
| `data-ascii="surface"` | Cards/panels — dot field + corner frame, then fade |
| `data-ascii="fade"` | Buttons/chips — fade on the wave |
| `data-ascii="media"` | Treat as glyph media |
| `data-ascii="skip"` | Leave subtree alone (toolbars) |

## Key props

| Prop | Notes |
| --- | --- |
| `preset` | `'decode' \| 'dither' \| 'terminal' \| 'blueprint'` (default `decode`) |
| `duration` | `'fast'` (~400 ms) or `'cinematic'` (hero) |
| `loading` | Scramble out while true; decode in when false |
| `lazy` | Below-fold decode on scroll (default true) |
| `revealOnHydrate` | Default false — SSR content stays readable |
| `mascot` | `'spider' \| 'ghost' \| 'pumpkin' \| 'bat'` or SVG URL |
| `origin` | `'center' \| 'top-left' \| 'pointer' \| { x, y }` |

## ShiftBOi guidance

- Prefer `duration="fast"` for CMS / data panels; `cinematic` only for rare hero moments.
- Do **not** wrap the whole site or Lenis/ScrollTrigger pin sections without need — one canvas per reveal.
- Boot splash (`SiteLoadingOverlay`) is separate; use ascii-reveal for content decode, not as a full-page replacement unless asked.
- After fonts load late, start reveal after `document.fonts.ready` if glyphs misalign.
- For imperative replay: `ref.current?.reveal({ within, origin })`.

## Without React

```ts
import { createAsciiReveal } from "ascii-reveal/core";
const reveal = createAsciiReveal(el, { preset: "dither" });
reveal.reveal();
```

## When implementing

1. Confirm package is installed (`github:quanhoangindex/ascii-reveal`).
2. Mark the wrapper `"use client"`.
3. Apply ShiftBOi CSS variables above.
4. Keep interactive chrome (`data-ascii="skip"`) usable during animation.
5. Test with reduced motion (should fall back to short fade).
