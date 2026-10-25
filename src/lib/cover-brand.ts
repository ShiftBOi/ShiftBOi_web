/**
 * Cover branding — Canva-style logo/images + multi-text, with layers & per-object glow.
 */

import {
  getCoverFontPreset,
  normalizeCoverFont,
  type CoverFontId,
} from "@/lib/cover-fonts";

export type CoverBrandBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CoverGlow = {
  glowEnabled: boolean;
  glowColor: string;
  glowBlur: number;
  glowOpacity: number;
};

export type CoverTextStyle = CoverGlow & {
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
};

export type CoverTextItem = CoverBrandBox &
  CoverTextStyle & {
    id: string;
    content: string;
  };

/** Primary mark (project.logo) — optional; layout still stores box + glow. */
export type CoverLogoItem = CoverBrandBox & CoverGlow;

/** Extra image/SVG overlays stored in layout JSON (src = public URL). */
export type CoverImageItem = CoverBrandBox &
  CoverGlow & {
    id: string;
    src: string;
  };

export type CoverGroup = {
  id: string;
  /** Layer ids bound together: "logo" | text.id | image.id */
  members: string[];
};

export type CoverBrandLayout = {
  version: 4;
  padding: number;
  logo: CoverLogoItem;
  images: CoverImageItem[];
  texts: CoverTextItem[];
  /** Bottom → top paint order. Ids: "logo" | text.id | image.id */
  layerOrder: string[];
  /** Named clusters of layers that move / select together */
  groups: CoverGroup[];
};

/**
 * Cover canvas — same aspect as landing `.hq-feat-media` (16 / 10).
 * Editor stage, baked SVG, and card media must share this ratio or
 * positions will drift on save.
 */
export const COVER_SVG_WIDTH = 960;
export const COVER_SVG_HEIGHT = 600;
/** width / height — keep in sync with CSS `aspect-ratio: 16 / 10`. */
export const COVER_ASPECT = COVER_SVG_WIDTH / COVER_SVG_HEIGHT;

/** Cover text font-size range (SVG viewBox units on COVER_SVG_*). */
export const COVER_FONT_SIZE_MIN = 10;
export const COVER_FONT_SIZE_MAX = 280;

export type LayerAction =
  | "front"
  | "forward"
  | "backward"
  | "back";

export const COVER_COLOR_PRESETS = [
  "#ffffff",
  "#f5f5f5",
  "#0a0a0a",
  "#d41828",
  "#f59e0b",
  "#22c55e",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
] as const;

/** Soft white halo — matches cover marks like the BOROS icon glow. */
export const DEFAULT_GLOW: CoverGlow = {
  glowEnabled: true,
  glowColor: "#ffffff",
  glowBlur: 16,
  glowOpacity: 0.6,
};

export const GLOW_PRESETS = [
  { id: "soft", label: "Soft", glowBlur: 10, glowOpacity: 0.4 },
  { id: "medium", label: "Medium", glowBlur: 16, glowOpacity: 0.6 },
  { id: "strong", label: "Strong", glowBlur: 26, glowOpacity: 0.75 },
] as const;

export const DEFAULT_TEXT_STYLE: CoverTextStyle = {
  fontSize: 36,
  color: "#ffffff",
  bold: true,
  italic: false,
  align: "center",
  ...DEFAULT_GLOW,
  glowBlur: 14,
  glowOpacity: 0.5,
};

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function createCoverTextItem(
  partial?: Partial<CoverTextItem>
): CoverTextItem {
  return {
    id: partial?.id || newId("t"),
    content: partial?.content ?? "Cover text",
    x: partial?.x ?? 28,
    y: partial?.y ?? 48,
    w: partial?.w ?? 44,
    h: partial?.h ?? 12,
    fontSize: partial?.fontSize ?? DEFAULT_TEXT_STYLE.fontSize,
    color: partial?.color ?? DEFAULT_TEXT_STYLE.color,
    bold: partial?.bold ?? DEFAULT_TEXT_STYLE.bold,
    italic: partial?.italic ?? DEFAULT_TEXT_STYLE.italic,
    align: partial?.align ?? DEFAULT_TEXT_STYLE.align,
    glowEnabled: partial?.glowEnabled ?? DEFAULT_TEXT_STYLE.glowEnabled,
    glowColor: partial?.glowColor ?? DEFAULT_TEXT_STYLE.glowColor,
    glowBlur: partial?.glowBlur ?? DEFAULT_TEXT_STYLE.glowBlur,
    glowOpacity: partial?.glowOpacity ?? DEFAULT_TEXT_STYLE.glowOpacity,
  };
}

export function createCoverImageItem(
  partial: Partial<CoverImageItem> & { src: string }
): CoverImageItem {
  return {
    id: partial.id || newId("img"),
    src: partial.src,
    x: partial.x ?? 36,
    y: partial.y ?? 28,
    w: partial.w ?? 28,
    h: partial.h ?? 18,
    glowEnabled: partial.glowEnabled ?? DEFAULT_GLOW.glowEnabled,
    glowColor: partial.glowColor ?? DEFAULT_GLOW.glowColor,
    glowBlur: partial.glowBlur ?? DEFAULT_GLOW.glowBlur,
    glowOpacity: partial.glowOpacity ?? DEFAULT_GLOW.glowOpacity,
  };
}

export const DEFAULT_COVER_BRAND: CoverBrandLayout = {
  version: 4,
  padding: 6,
  logo: {
    x: 38,
    y: 40,
    w: 10,
    h: 8,
    ...DEFAULT_GLOW,
  },
  images: [],
  texts: [
    createCoverTextItem({
      id: "primary",
      content: "",
      x: 30,
      y: 50,
      w: 40,
      h: 12,
    }),
  ],
  layerOrder: ["logo", "primary"],
  groups: [],
};

const CLAMP = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function parseGroups(
  raw: unknown,
  valid: Set<string>
): CoverGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: CoverGroup[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const members = Array.isArray(o.members)
      ? o.members.filter(
          (m): m is string => typeof m === "string" && valid.has(m)
        )
      : [];
    if (members.length < 2) continue;
    out.push({
      id:
        typeof o.id === "string" && o.id.trim()
          ? o.id.trim()
          : newId("g"),
      members: [...new Set(members)],
    });
  }
  return out;
}

export function findGroupFor(
  layout: CoverBrandLayout,
  layerId: string
): CoverGroup | null {
  return layout.groups.find((g) => g.members.includes(layerId)) ?? null;
}

/** Expand a layer id to its whole group (or itself). */
export function expandGroupIds(
  layout: CoverBrandLayout,
  layerId: string
): string[] {
  const g = findGroupFor(layout, layerId);
  return g ? [...g.members] : [layerId];
}

export function groupLayers(
  layout: CoverBrandLayout,
  memberIds: string[]
): CoverBrandLayout {
  const valid = new Set(coverLayerIds(layout));
  const members = [...new Set(memberIds.filter((id) => valid.has(id)))];
  if (members.length < 2) return layout;
  // Drop prior groups that overlap these members
  const groups = layout.groups.filter(
    (g) => !g.members.some((m) => members.includes(m))
  );
  groups.push({ id: newId("g"), members });
  return { ...layout, groups };
}

export function ungroupLayers(
  layout: CoverBrandLayout,
  layerIds: string[]
): CoverBrandLayout {
  const hit = new Set(layerIds);
  return {
    ...layout,
    groups: layout.groups.filter((g) => !g.members.some((m) => hit.has(m))),
  };
}

function box(raw: unknown, fallback: CoverBrandBox): CoverBrandBox {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const o = raw as Record<string, unknown>;
  return {
    x: CLAMP(Number(o.x) || fallback.x, 0, 95),
    y: CLAMP(Number(o.y) || fallback.y, 0, 95),
    w: CLAMP(Number(o.w) || fallback.w, 4, 96),
    h: CLAMP(Number(o.h) || fallback.h, 3, 80),
  };
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

function parseGlow(raw: Record<string, unknown>, fallback: CoverGlow): CoverGlow {
  return {
    glowEnabled:
      typeof raw.glowEnabled === "boolean"
        ? raw.glowEnabled
        : fallback.glowEnabled,
    glowColor: isHex(raw.glowColor) ? raw.glowColor : fallback.glowColor,
    glowBlur: CLAMP(Number(raw.glowBlur) || fallback.glowBlur, 0, 40),
    glowOpacity: CLAMP(
      Number(raw.glowOpacity) || fallback.glowOpacity,
      0,
      1
    ),
  };
}

function parseLogo(raw: unknown): CoverLogoItem {
  const base = box(raw, DEFAULT_COVER_BRAND.logo);
  const o =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    ...base,
    ...parseGlow(o, DEFAULT_COVER_BRAND.logo),
  };
}

function parseTextItem(
  raw: unknown,
  fallback: CoverTextItem,
  index: number
): CoverTextItem {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const o = raw as Record<string, unknown>;
  const base = box(raw, fallback);
  return {
    ...fallback,
    ...base,
    id:
      typeof o.id === "string" && o.id.trim()
        ? o.id.trim()
        : fallback.id || `t_${index}`,
    content: typeof o.content === "string" ? o.content : fallback.content,
    fontSize: CLAMP(
      Number(o.fontSize) || fallback.fontSize,
      COVER_FONT_SIZE_MIN,
      COVER_FONT_SIZE_MAX
    ),
    color: isHex(o.color) ? o.color : fallback.color,
    bold: o.bold !== false,
    italic: Boolean(o.italic),
    align:
      o.align === "left" || o.align === "right" || o.align === "center"
        ? o.align
        : fallback.align,
    ...parseGlow(o, {
      glowEnabled: fallback.glowEnabled,
      glowColor: fallback.glowColor,
      glowBlur: fallback.glowBlur,
      glowOpacity: fallback.glowOpacity,
    }),
  };
}

function parseImageItem(raw: unknown, index: number): CoverImageItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.src !== "string" || !o.src.trim()) return null;
  const fallback = createCoverImageItem({ src: o.src.trim() });
  const base = box(raw, fallback);
  return {
    ...fallback,
    ...base,
    id:
      typeof o.id === "string" && o.id.trim()
        ? o.id.trim()
        : `img_${index}`,
    src: o.src.trim(),
    ...parseGlow(o, DEFAULT_GLOW),
  };
}

export function coverLayerIds(layout: CoverBrandLayout): string[] {
  const ids = [
    "logo",
    ...layout.images.map((i) => i.id),
    ...layout.texts.map((t) => t.id),
  ];
  return ids;
}

export function normalizeLayerOrder(
  layout: Omit<CoverBrandLayout, "layerOrder"> & {
    layerOrder?: string[];
  }
): string[] {
  const valid = new Set(coverLayerIds(layout as CoverBrandLayout));
  const from =
    Array.isArray(layout.layerOrder) && layout.layerOrder.length > 0
      ? layout.layerOrder.filter((id) => valid.has(id))
      : [];
  for (const id of valid) {
    if (!from.includes(id)) from.push(id);
  }
  return from;
}

export function moveLayer(
  layout: CoverBrandLayout,
  id: string,
  action: LayerAction
): CoverBrandLayout {
  const order = [...normalizeLayerOrder(layout)];
  const idx = order.indexOf(id);
  if (idx < 0) return layout;
  order.splice(idx, 1);
  if (action === "front") order.push(id);
  else if (action === "back") order.unshift(id);
  else if (action === "forward") {
    const insert = Math.min(order.length, idx + 1);
    order.splice(insert, 0, id);
  } else {
    const insert = Math.max(0, idx - 1);
    order.splice(insert, 0, id);
  }
  return { ...layout, layerOrder: order };
}

export function layerZIndex(layout: CoverBrandLayout, id: string): number {
  const order = normalizeLayerOrder(layout);
  const i = order.indexOf(id);
  return i < 0 ? 2 : 2 + i;
}

export function primaryCoverText(layout: CoverBrandLayout): string {
  return layout.texts[0]?.content?.trim() || "";
}

export function coverTextsJoined(layout: CoverBrandLayout): string {
  return layout.texts
    .map((t) => t.content.trim())
    .filter(Boolean)
    .join("\n");
}

/** Migrate any prior version → v4. */
export function normalizeCoverBrand(
  raw: unknown,
  fallbackText = ""
): CoverBrandLayout {
  const blank: CoverBrandLayout = {
    ...DEFAULT_COVER_BRAND,
    logo: { ...DEFAULT_COVER_BRAND.logo },
    images: [],
    texts: DEFAULT_COVER_BRAND.texts.map((t) => ({
      ...t,
      content: fallbackText,
    })),
    layerOrder: ["logo", "primary"],
    groups: [],
  };

  if (!raw || typeof raw !== "object") return blank;
  const o = raw as Record<string, unknown>;

  if (Array.isArray(o.texts) || o.version === 3 || o.version === 4) {
    const texts = (Array.isArray(o.texts) ? o.texts : []).map((item, i) =>
      parseTextItem(
        item,
        createCoverTextItem({
          id: `t_${i}`,
          content: i === 0 ? fallbackText : "Text",
          y: 48 + i * 10,
        }),
        i
      )
    );
    const images = (Array.isArray(o.images) ? o.images : [])
      .map((item, i) => parseImageItem(item, i))
      .filter((x): x is CoverImageItem => Boolean(x));

    const layoutBase = {
      version: 4 as const,
      padding: CLAMP(Number(o.padding) || DEFAULT_COVER_BRAND.padding, 2, 20),
      logo: parseLogo(o.logo),
      images,
      texts:
        texts.length > 0
          ? texts
          : [
              createCoverTextItem({
                id: "primary",
                content: fallbackText,
              }),
            ],
      groups: [] as CoverGroup[],
    };
    const layerOrder = normalizeLayerOrder({
      ...layoutBase,
      layerOrder: Array.isArray(o.layerOrder)
        ? (o.layerOrder as string[])
        : undefined,
    });
    return {
      ...layoutBase,
      layerOrder,
      groups: parseGroups(o.groups, new Set(coverLayerIds({ ...layoutBase, layerOrder }))),
    };
  }

  // v2 single text
  if (o.version === 2 || o.logo || o.text) {
    const textRaw =
      o.text && typeof o.text === "object"
        ? (o.text as Record<string, unknown>)
        : {};
    const textBox = box(o.text, DEFAULT_COVER_BRAND.texts[0]!);
    const content =
      typeof textRaw.content === "string" ? textRaw.content : fallbackText;
    const texts = [
      parseTextItem(
        { ...textBox, ...textRaw, id: "primary", content },
        createCoverTextItem({
          id: "primary",
          content: fallbackText,
          ...textBox,
        }),
        0
      ),
    ];
    const layoutBase = {
      version: 4 as const,
      padding: CLAMP(Number(o.padding) || DEFAULT_COVER_BRAND.padding, 2, 20),
      logo: parseLogo(o.logo),
      images: [] as CoverImageItem[],
      texts,
      groups: [] as CoverGroup[],
    };
    return {
      ...layoutBase,
      layerOrder: normalizeLayerOrder(layoutBase),
      groups: [],
    };
  }

  // Legacy v1
  const x = CLAMP(Number(o.x) || 50, 5, 95);
  const y = CLAMP(Number(o.y) || 50, 5, 95);
  const logoSize = CLAMP(Number(o.logoSize) || 44, 16, 120);
  const textSize = CLAMP(Number(o.textSize) || 32, 12, 72);
  const color = isHex(o.color) ? o.color : "#ffffff";
  const stack = o.stack === "column" ? "column" : "row";
  const logoW = (logoSize / COVER_SVG_WIDTH) * 100;
  const logoH = (logoSize / COVER_SVG_HEIGHT) * 100;
  const textW = 36;
  const textItem = createCoverTextItem({
    id: "primary",
    content: fallbackText,
    fontSize: textSize,
    color,
    glowEnabled: o.glowEnabled !== false,
    glowColor: isHex(o.glowColor) ? o.glowColor : "#ffffff",
    glowBlur: CLAMP(Number(o.glowBlur) || 10, 0, 40),
    glowOpacity: CLAMP(Number(o.glowOpacity) || 0.4, 0, 1),
  });

  const logo: CoverLogoItem =
    stack === "column"
      ? {
          x: x - logoW / 2,
          y: y - logoH - 2,
          w: logoW,
          h: logoH,
          ...DEFAULT_GLOW,
        }
      : {
          x: x - logoW - 1,
          y: y - logoH / 2,
          w: logoW,
          h: logoH,
          ...DEFAULT_GLOW,
        };

  const texts =
    stack === "column"
      ? [
          {
            ...textItem,
            x: x - textW / 2,
            y: y + 1,
            w: textW,
            h: 10,
          },
        ]
      : [
          {
            ...textItem,
            x: x + 1,
            y: y - 4,
            w: textW,
            h: 10,
            align: "left" as const,
          },
        ];

  const layoutBase = {
    version: 4 as const,
    padding: CLAMP(Number(o.padding) || 8, 2, 20),
    logo,
    images: [] as CoverImageItem[],
    texts,
    groups: [] as CoverGroup[],
  };
  return {
    ...layoutBase,
    layerOrder: normalizeLayerOrder(layoutBase),
    groups: [],
  };
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Matches editor `.cms-canva-box__label` line-height. */
export const COVER_TEXT_LINE_HEIGHT = 1.15;

function wrapParagraph(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const charW = fontSize * 0.55;
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length * charW <= maxWidth || !current) {
      current = next;
      while (current.length * charW > maxWidth && current.length > 1) {
        const fit = Math.max(1, Math.floor(maxWidth / charW));
        lines.push(current.slice(0, fit));
        current = current.slice(fit);
      }
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Soft-wrap like the editor, preserving author newlines. */
export function wrapCoverText(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.trim()) return [];
  const out: string[] = [];
  for (const para of normalized.split("\n")) {
    out.push(...wrapParagraph(para, maxWidth, fontSize));
  }
  return out;
}

/** Shared bold weight — same rule in editor CSS and baked SVG. */
export function coverTextFontWeight(
  bold: boolean,
  presetWeight: number
): number {
  return bold ? Math.max(presetWeight, 700) : Math.min(presetWeight, 500);
}

function glowFilterXml(id: string, g: CoverGlow) {
  if (!g.glowEnabled || g.glowBlur <= 0) return "";
  const { r, g: gg, b } = hexToRgb(g.glowColor);
  // Dual blur — tight core + soft outer bloom
  const inner = Math.max(0.8, g.glowBlur * 0.28);
  const outer = Math.max(1.6, g.glowBlur * 0.55);
  const op = Math.max(0.15, Math.min(1, g.glowOpacity));
  return `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="${outer}" result="blurOuter"/>
  <feFlood flood-color="rgb(${r},${gg},${b})" flood-opacity="${op * 0.55}" result="colorOuter"/>
  <feComposite in="colorOuter" in2="blurOuter" operator="in" result="glowOuter"/>
  <feGaussianBlur in="SourceAlpha" stdDeviation="${inner}" result="blurInner"/>
  <feFlood flood-color="rgb(${r},${gg},${b})" flood-opacity="${op}" result="colorInner"/>
  <feComposite in="colorInner" in2="blurInner" operator="in" result="glowInner"/>
  <feMerge>
    <feMergeNode in="glowOuter"/>
    <feMergeNode in="glowInner"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>`;
}

function renderImageSvg(
  box: CoverBrandBox,
  src: string,
  width: number,
  height: number,
  filterId: string,
  glow: CoverGlow
): string {
  if (!src.trim()) return "";
  const lx = (box.x / 100) * width;
  const ly = (box.y / 100) * height;
  const lw = (box.w / 100) * width;
  const lh = (box.h / 100) * height;
  const filterAttr =
    glow.glowEnabled && glow.glowBlur > 0
      ? ` filter="url(#${filterId})"`
      : "";
  return `<image href="${escapeXml(src)}" xlink:href="${escapeXml(src)}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${lw.toFixed(1)}" height="${lh.toFixed(1)}" preserveAspectRatio="xMidYMid meet"${filterAttr} />`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Bake text via foreignObject so wrapping, weight, tracking, and box origin
 * match the editor's CSS (pre-wrap + overflow-wrap) 1:1.
 */
function renderTextSvg(
  t: CoverTextItem,
  width: number,
  height: number,
  fontId: CoverFontId,
  filterId: string
): string {
  const preset = getCoverFontPreset(fontId);
  const label = (t.content || "").trimEnd();
  if (!label.trim()) return "";
  const useGlow = t.glowEnabled && t.glowBlur > 0;
  // Box origin matches editor % left/top (no padding).
  const tx = (t.x / 100) * width;
  const ty = (t.y / 100) * height;
  const tw = (t.w / 100) * width;
  const fontSize = t.fontSize;
  const weight = coverTextFontWeight(t.bold, preset.weight);
  const tracking = preset.tracking || "0";
  const transform = preset.transform === "uppercase" ? "uppercase" : "none";
  const italic = t.italic ? "italic" : "normal";
  // Tall enough for wrapped lines; FO clips, so use remaining canvas height.
  const th = Math.max(height - ty, fontSize * COVER_TEXT_LINE_HEIGHT * 2);
  // Same CSS as `.cms-canva-box__label` + coverFontStyle / weight helper.
  const familyCss = preset.family.replace(/"/g, "'");
  const css = [
    "margin:0",
    "padding:0",
    "box-sizing:border-box",
    "width:100%",
    "height:auto",
    `font-family:${familyCss}`,
    `font-size:${fontSize}px`,
    `font-weight:${weight}`,
    `font-style:${italic}`,
    `letter-spacing:${tracking}`,
    `text-transform:${transform}`,
    `line-height:${COVER_TEXT_LINE_HEIGHT}`,
    `color:${t.color}`,
    `text-align:${t.align}`,
    "white-space:pre-wrap",
    "overflow-wrap:anywhere",
    "word-break:break-word",
    "overflow:visible",
  ].join(";");

  const fo = `<foreignObject x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}"><div xmlns="http://www.w3.org/1999/xhtml" style="${escapeXml(css)}">${escapeHtml(label)}</div></foreignObject>`;
  return useGlow ? `<g filter="url(#${filterId})">${fo}</g>` : fo;
}

export function buildCoverBrandSvg(opts: {
  layout: CoverBrandLayout;
  text?: string;
  logoUrl?: string | null;
  fontId?: CoverFontId | string | null;
  width?: number;
  height?: number;
}): string {
  const fallbackText = (opts.text || "").trim();
  const layout = normalizeCoverBrand(opts.layout, fallbackText);
  if (
    fallbackText &&
    layout.texts.every((t) => !t.content.trim()) &&
    layout.texts[0]
  ) {
    layout.texts[0] = { ...layout.texts[0], content: fallbackText };
  }

  const width = opts.width ?? COVER_SVG_WIDTH;
  const height = opts.height ?? COVER_SVG_HEIGHT;
  const logoUrl = opts.logoUrl?.trim() || "";
  const fontId = normalizeCoverFont(opts.fontId);
  const order = normalizeLayerOrder(layout);

  const filters: string[] = [];
  const byId = new Map<string, string>();

  if (logoUrl) {
    const fid = `glow-logo`;
    const f = glowFilterXml(fid, layout.logo);
    if (f) filters.push(f);
    byId.set(
      "logo",
      renderImageSvg(layout.logo, logoUrl, width, height, fid, layout.logo)
    );
  }

  layout.images.forEach((img) => {
    const fid = `glow-${img.id}`;
    const f = glowFilterXml(fid, img);
    if (f) filters.push(f);
    byId.set(
      img.id,
      renderImageSvg(img, img.src, width, height, fid, img)
    );
  });

  layout.texts.forEach((t) => {
    const fid = `glow-${t.id}`;
    const f = glowFilterXml(fid, t);
    if (f) filters.push(f);
    const svg = renderTextSvg(t, width, height, fontId, fid);
    if (svg) byId.set(t.id, svg);
  });

  const parts = order.map((id) => byId.get(id)).filter(Boolean) as string[];

  // meet fills exactly when media aspect ≡ canvas aspect (16/10) — no crop drift.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" preserveAspectRatio="xMidYMid meet">
  <defs>${filters.join("")}</defs>
  <g>${parts.join("\n  ")}</g>
</svg>`;
}

/** Normalize baked SVG to fill the locked 16/10 media frame without crop drift. */
export function ensureCoverSvgCrop(markup: string): string {
  const trimmed = markup.trim();
  if (!trimmed) return trimmed;
  if (/preserveAspectRatio\s*=/.test(trimmed)) {
    return trimmed.replace(
      /preserveAspectRatio\s*=\s*"[^"]*"/,
      'preserveAspectRatio="xMidYMid meet"'
    );
  }
  return trimmed.replace(
    /<svg\b/,
    '<svg preserveAspectRatio="xMidYMid meet"'
  );
}
