"use client";

import { ExpandingButtonGroup } from "@/components/arc/expanding-button-group/expanding-button-group";
import { FloatingButtonGroup } from "@/components/arc/floating-button-group/floating-button-group";
import { Tooltip } from "@/components/arc/tooltip/tooltip";
import { R2Finder } from "@/components/management/r2-finder";
import {
  buildCoverBrandSvg,
  COVER_COLOR_PRESETS,
  COVER_FONT_SIZE_MAX,
  COVER_FONT_SIZE_MIN,
  COVER_SVG_WIDTH,
  COVER_TEXT_LINE_HEIGHT,
  coverTextFontWeight,
  createCoverImageItem,
  createCoverTextItem,
  DEFAULT_COVER_BRAND,
  DEFAULT_GLOW,
  ensureCoverSvgCrop,
  expandGroupIds,
  findGroupFor,
  groupLayers,
  layerZIndex,
  moveLayer,
  normalizeCoverBrand,
  normalizeLayerOrder,
  primaryCoverText,
  ungroupLayers,
  type CoverBrandLayout,
  type CoverGlow,
  type CoverImageItem,
  type CoverTextItem,
  type LayerAction,
} from "@/lib/cover-brand";
import { isVideoUrl } from "@/lib/media-url";
import {
  COVER_FONT_PRESETS,
  coverFontStyle,
  coverFontsStylesheetUrl,
  getCoverFontPreset,
  normalizeCoverFont,
  type CoverFontId,
} from "@/lib/cover-fonts";
import { cn } from "cn";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  BringToFront,
  ChevronLeft,
  ChevronRight,
  Download,
  FileImage,
  Group,
  ImagePlus,
  Italic,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  SendToBack,
  Sparkles,
  Trash2,
  Type,
  Ungroup,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Props = {
  coverUrl: string;
  logoUrl?: string | null;
  text: string;
  fontId: string | null | undefined;
  layout: CoverBrandLayout | null | undefined;
  projectLabel: string;
  dirty?: boolean;
  saving?: boolean;
  uploading?: boolean;
  onTextChange: (text: string) => void;
  onFontChange: (id: CoverFontId) => void;
  onLayoutChange: (layout: CoverBrandLayout) => void;
  onClearLogo: () => void;
  /** Upload image/SVG → returns public URL for canvas overlays */
  onUploadAsset: (file: File) => Promise<string>;
  onCoverPick: (file: File | null) => void;
  /** Cover URL from R2 picker (already stored) */
  onCoverUrl?: (url: string) => void;
  onBack: () => void;
  onEditDetail: () => void;
  onSave: () => void;
};

type SelItem =
  | { kind: "logo" }
  | { kind: "text"; id: string }
  | { kind: "image"; id: string };

type Sel = SelItem | null;

type DragKind =
  | "move-multi"
  | "resize-logo"
  | "resize-image"
  | "resize-text-w"
  | "resize-text-corner"
  | null;

type CtxMenu = {
  x: number;
  y: number;
  id: string;
  kind: "logo" | "text" | "image";
};

const SNAP = 1.2;
const LOGO_ID = "logo";

function layerIdOf(s: SelItem): string {
  return s.kind === "logo" ? LOGO_ID : s.id;
}

function sameSel(a: SelItem, b: SelItem) {
  return a.kind === b.kind && layerIdOf(a) === layerIdOf(b);
}

function selFromLayerId(
  layout: CoverBrandLayout,
  id: string
): SelItem | null {
  if (id === LOGO_ID) return { kind: "logo" };
  if (layout.texts.some((t) => t.id === id)) return { kind: "text", id };
  if (layout.images.some((i) => i.id === id)) return { kind: "image", id };
  return null;
}

/** Stage-relative size so widening the text box does not change type size. */
function stageFontSize(fontSize: number) {
  return `${((fontSize / COVER_SVG_WIDTH) * 100).toFixed(4)}cqi`;
}

export function CoverBrandComposer({
  coverUrl,
  logoUrl,
  text,
  fontId,
  layout: layoutRaw,
  projectLabel,
  dirty,
  saving,
  uploading,
  onTextChange,
  onFontChange,
  onLayoutChange,
  onClearLogo,
  onUploadAsset,
  onCoverPick,
  onCoverUrl,
  onBack,
  onEditDetail,
  onSave,
}: Props) {
  const layout = normalizeCoverBrand(layoutRaw, text);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [finderMode, setFinderMode] = useState<"cover" | "asset" | null>(null);
  const bootstrapped = useRef(false);

  const [sels, setSels] = useState<SelItem[]>([]);
  const sel: Sel = sels[sels.length - 1] ?? null;
  const selectedIds = new Set(sels.map(layerIdOf));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [glowOpen, setGlowOpen] = useState(false);
  const [ctx, setCtx] = useState<CtxMenu | null>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({
    v: [],
    h: [],
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pastRef = useRef<CoverBrandLayout[]>([]);
  const futureRef = useRef<CoverBrandLayout[]>([]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const drag = useRef<{
    kind: DragKind;
    startX: number;
    startY: number;
    orig: CoverBrandLayout;
    textId?: string;
    imageId?: string;
    moveIds?: string[];
    handle?: string;
    historyPushed?: boolean;
  } | null>(null);
  const dragMoved = useRef(false);

  function setSel(next: Sel | SelItem[]) {
    if (Array.isArray(next)) setSels(next);
    else setSels(next ? [next] : []);
  }

  function isSelected(item: SelItem) {
    return sels.some((s) => sameSel(s, item));
  }

  /** Click / Shift+click selection. Expanding groups unless additive toggle of one. */
  function pickSelect(item: SelItem, shiftKey: boolean) {
    const layoutNow = layoutRef.current;
    if (shiftKey) {
      setSels((prev) => {
        if (prev.some((s) => sameSel(s, item))) {
          return prev.filter((s) => !sameSel(s, item));
        }
        const expanded = expandGroupIds(layoutNow, layerIdOf(item))
          .map((id) => selFromLayerId(layoutNow, id))
          .filter((x): x is SelItem => Boolean(x));
        const next = [...prev];
        for (const e of expanded) {
          if (!next.some((s) => sameSel(s, e))) next.push(e);
        }
        return next;
      });
      return;
    }
    const expanded = expandGroupIds(layoutNow, layerIdOf(item))
      .map((id) => selFromLayerId(layoutNow, id))
      .filter((x): x is SelItem => Boolean(x));
    setSels(expanded.length ? expanded : [item]);
  }

  const font = normalizeCoverFont(fontId);
  const fontLabel =
    COVER_FONT_PRESETS.find((p) => p.id === font)?.label || "Font";

  const activeText =
    sel?.kind === "text"
      ? layout.texts.find((t) => t.id === sel.id) || null
      : null;
  const activeImage =
    sel?.kind === "image"
      ? layout.images.find((t) => t.id === sel.id) || null
      : null;
  const activeGlow: CoverGlow | null =
    sel?.kind === "logo"
      ? layout.logo
      : activeText
        ? activeText
        : activeImage
          ? activeImage
          : null;

  // First enter → select primary text so font tools show
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const first = layout.texts[0];
    if (first) setSel({ kind: "text", id: first.id });
  }, [layout.texts]);

  useEffect(() => {
    const href = coverFontsStylesheetUrl();
    let link = document.getElementById(
      "hq-cover-fonts-all"
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "hq-cover-fonts-all";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, []);

  useEffect(() => {
    if (!editingId) return;
    editRef.current?.focus();
    editRef.current?.select();
  }, [editingId]);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const applyLayout = useCallback(
    (next: CoverBrandLayout) => {
      const normalized = normalizeCoverBrand(next);
      onLayoutChange(normalized);
      onTextChange(primaryCoverText(normalized));
    },
    [onLayoutChange, onTextChange]
  );

  const pushPast = useCallback(() => {
    pastRef.current.push(structuredClone(layoutRef.current));
    if (pastRef.current.length > 40) pastRef.current.shift();
    futureRef.current = [];
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const commitLayout = useCallback(
    (next: CoverBrandLayout) => {
      pushPast();
      applyLayout(next);
    },
    [applyLayout, pushPast]
  );

  const liveLayout = useCallback(
    (next: CoverBrandLayout) => applyLayout(next),
    [applyLayout]
  );

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(structuredClone(layoutRef.current));
    applyLayout(prev);
    setEditingId(null);
    syncHistoryFlags();
  }, [applyLayout, syncHistoryFlags]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(structuredClone(layoutRef.current));
    applyLayout(next);
    setEditingId(null);
    syncHistoryFlags();
  }, [applyLayout, syncHistoryFlags]);

  function closeMenus() {
    setFontOpen(false);
    setColorOpen(false);
    setGlowOpen(false);
    setCtx(null);
  }

  function clearSelection() {
    setSels([]);
    setEditingId(null);
    closeMenus();
  }

  // Click blank stage, workspace, or outside editor → deselect + close menus
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as HTMLElement | null;
      if (!t) return;

      const inObject = Boolean(t.closest(".cms-canva-box"));
      const inPop = Boolean(
        t.closest(".cms-canva-pop, .cms-canva-ctx, .cms-canva__menu-wrap")
      );
      const inTopbar = Boolean(t.closest(".cms-canva__topbar"));
      const inStage = Boolean(stageRef.current?.contains(t));
      const inRoot = Boolean(rootRef.current?.contains(t));

      // Interacting with an object or its open menu — keep selection
      if (inObject || inPop) return;

      // Any click outside open menus closes them
      closeMenus();

      // Outside canvas (workspace chrome, page chrome, or blank deselect layer)
      const onBlankStage =
        inStage &&
        (t === stageRef.current ||
          t.classList.contains("cms-canva__deselect") ||
          t.classList.contains("cms-brand-composer__bg") ||
          t.classList.contains("cms-brand-composer__veil") ||
          t.classList.contains("cms-brand-composer__guide"));

      if (!inRoot || (!inStage && !inTopbar) || onBlankStage) {
        setSels([]);
        setEditingId(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const patchText = useCallback(
    (
      id: string,
      patch: Partial<CoverTextItem>,
      opts?: { history?: boolean }
    ) => {
      const next = {
        ...layout,
        texts: layout.texts.map((t) =>
          t.id === id ? { ...t, ...patch } : t
        ),
      };
      if (opts?.history === false) liveLayout(next);
      else commitLayout(next);
    },
    [commitLayout, layout, liveLayout]
  );

  const patchLogoGlow = useCallback(
    (patch: Partial<CoverGlow>) => {
      commitLayout({ ...layout, logo: { ...layout.logo, ...patch } });
    },
    [commitLayout, layout]
  );

  const patchImage = useCallback(
    (id: string, patch: Partial<CoverImageItem>) => {
      commitLayout({
        ...layout,
        images: layout.images.map((img) =>
          img.id === id ? { ...img, ...patch } : img
        ),
      });
    },
    [commitLayout, layout]
  );

  const addText = useCallback(() => {
    const n = layout.texts.length;
    const item = createCoverTextItem({
      content: n === 0 ? "Cover text" : "New text",
      x: 24 + (n % 4) * 4,
      y: 42 + (n % 5) * 8,
      w: 40,
      h: 10,
      fontSize: n === 0 ? 36 : 24,
      // First text gets the soft glow; extras start clean
      glowEnabled: n === 0,
    });
    const next = {
      ...layout,
      texts: [...layout.texts, item],
      layerOrder: [...normalizeLayerOrder(layout), item.id],
    };
    commitLayout(next);
    setSel({ kind: "text", id: item.id });
    setEditingId(item.id);
    closeMenus();
  }, [commitLayout, layout]);

  const addOverlayFromUrl = useCallback(
    (url: string) => {
      const item = createCoverImageItem({
        src: url,
        x: 30 + (layout.images.length % 3) * 5,
        y: 24 + (layout.images.length % 3) * 6,
      });
      const next = {
        ...layout,
        images: [...layout.images, item],
        layerOrder: [...normalizeLayerOrder(layout), item.id],
      };
      commitLayout(next);
      setSel({ kind: "image", id: item.id });
      closeMenus();
    },
    [commitLayout, layout]
  );

  async function onAssetFile(file: File | null) {
    if (!file) return;
    try {
      const url = await onUploadAsset(file);
      addOverlayFromUrl(url);
    } catch {
      /* parent */
    }
  }

  const removeActive = useCallback(() => {
    if (sels.length === 0) return;
    let next = { ...layout };
    let clearLogo = false;
    for (const item of sels) {
      if (item.kind === "text") {
        if (next.texts.length <= 1) {
          next = {
            ...next,
            texts: next.texts.map((t) =>
              t.id === item.id ? { ...t, content: "" } : t
            ),
          };
        } else {
          const texts = next.texts.filter((t) => t.id !== item.id);
          next = {
            ...next,
            texts,
            layerOrder: normalizeLayerOrder({ ...next, texts }),
          };
        }
      } else if (item.kind === "image") {
        const images = next.images.filter((i) => i.id !== item.id);
        next = {
          ...next,
          images,
          layerOrder: normalizeLayerOrder({ ...next, images }),
        };
      } else if (item.kind === "logo") {
        clearLogo = true;
      }
    }
    const remainingIds = new Set([
      ...(clearLogo ? [] : [LOGO_ID]),
      ...next.texts.map((t) => t.id),
      ...next.images.map((i) => i.id),
    ]);
    next = {
      ...next,
      groups: next.groups
        .map((g) => ({
          ...g,
          members: g.members.filter((m) => remainingIds.has(m)),
        }))
        .filter((g) => g.members.length >= 2),
    };
    commitLayout(next);
    if (clearLogo) onClearLogo();
    setSels([]);
    setEditingId(null);
  }, [commitLayout, layout, onClearLogo, sels]);

  const groupSelection = useCallback(() => {
    if (sels.length < 2) return;
    commitLayout(groupLayers(layout, sels.map(layerIdOf)));
    setCtx(null);
  }, [commitLayout, layout, sels]);

  const ungroupSelection = useCallback(() => {
    if (sels.length === 0) return;
    commitLayout(ungroupLayers(layout, sels.map(layerIdOf)));
    setCtx(null);
  }, [commitLayout, layout, sels]);

  const applyLayer = useCallback(
    (id: string, action: LayerAction) => {
      commitLayout(moveLayer(layout, id, action));
      setCtx(null);
    },
    [commitLayout, layout]
  );

  function exportSvg() {
    const svg = buildCoverBrandSvg({
      layout,
      text,
      logoUrl,
      fontId: font,
    });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(projectLabel || "cover").replace(/\s+/g, "-").toLowerCase()}-brand.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        if (typing && !e.shiftKey) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) onSave();
        return;
      }
      if (e.key === "Escape") {
        clearSelection();
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !typing &&
        sels.length > 0
      ) {
        e.preventDefault();
        removeActive();
      }
      if (meta && e.key.toLowerCase() === "g" && !typing) {
        e.preventDefault();
        if (e.shiftKey) ungroupSelection();
        else groupSelection();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    dirty,
    groupSelection,
    onSave,
    redo,
    removeActive,
    saving,
    sels.length,
    undo,
    ungroupSelection,
  ]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = drag.current;
      const stage = stageRef.current;
      if (!d || !stage) return;
      const rect = stage.getBoundingClientRect();
      const px = e.clientX - d.startX;
      const py = e.clientY - d.startY;
      if (!dragMoved.current && Math.hypot(px, py) < 3) return;
      if (!dragMoved.current) {
        dragMoved.current = true;
        if (!d.historyPushed) {
          pastRef.current.push(structuredClone(d.orig));
          if (pastRef.current.length > 40) pastRef.current.shift();
          futureRef.current = [];
          d.historyPushed = true;
          syncHistoryFlags();
        }
      }
      const dx = (px / rect.width) * 100;
      const dy = (py / rect.height) * 100;
      const shift = e.shiftKey;
      const next = structuredClone(d.orig) as CoverBrandLayout;

      if (d.kind === "move-multi" && d.moveIds?.length) {
        const moveSet = new Set(d.moveIds);
        for (const id of d.moveIds) {
          if (id === LOGO_ID) {
            next.logo.x = clamp(d.orig.logo.x + dx, 0, 96 - d.orig.logo.w);
            next.logo.y = clamp(d.orig.logo.y + dy, 0, 96 - d.orig.logo.h);
          } else {
            const ti = next.texts.findIndex((t) => t.id === id);
            const to = d.orig.texts.find((t) => t.id === id);
            if (ti >= 0 && to) {
              next.texts[ti]!.x = clamp(to.x + dx, 0, 96 - to.w);
              next.texts[ti]!.y = clamp(to.y + dy, 0, 96 - 4);
              continue;
            }
            const ii = next.images.findIndex((t) => t.id === id);
            const io = d.orig.images.find((t) => t.id === id);
            if (ii >= 0 && io) {
              next.images[ii]!.x = clamp(io.x + dx, 0, 96 - io.w);
              next.images[ii]!.y = clamp(io.y + dy, 0, 96 - io.h);
            }
          }
        }
        const moving = boxesFromIds(next, d.moveIds);
        const others = allBoxes(next).filter((b) => !moveSet.has(b.id));
        const snapped = snapGroup(moving, others);
        applyBoxDelta(next, d.moveIds, snapped.dx, snapped.dy);
        setGuides(snapped.guides);
      } else if (d.kind === "resize-logo") {
        resizeBox(next.logo, d.orig.logo, dx, dy, d.handle || "se", 4, 4, true);
        setGuides(
          snapResize(next.logo, allBoxes(next).filter((b) => b.id !== LOGO_ID))
        );
      } else if (d.kind === "resize-image" && d.imageId) {
        const idx = next.images.findIndex((t) => t.id === d.imageId);
        const orig = d.orig.images.find((t) => t.id === d.imageId);
        if (idx < 0 || !orig) return;
        resizeBox(
          next.images[idx]!,
          orig,
          dx,
          dy,
          d.handle || "se",
          4,
          4,
          true
        );
        setGuides(
          snapResize(
            next.images[idx]!,
            allBoxes(next).filter((b) => b.id !== d.imageId)
          )
        );
      } else if (d.kind === "resize-text-w" && d.textId) {
        const idx = next.texts.findIndex((t) => t.id === d.textId);
        const orig = d.orig.texts.find((t) => t.id === d.textId);
        if (idx < 0 || !orig) return;
        const h = d.handle || "e";
        if (h === "e") {
          next.texts[idx]!.w = clamp(orig.w + dx, 8, 96 - orig.x);
        } else {
          const nw = clamp(orig.w - dx, 8, orig.x + orig.w);
          next.texts[idx]!.x = orig.x + orig.w - nw;
          next.texts[idx]!.w = nw;
        }
        setGuides(
          snapResize(
            next.texts[idx]!,
            allBoxes(next).filter((b) => b.id !== d.textId)
          )
        );
      } else if (d.kind === "resize-text-corner" && d.textId) {
        const idx = next.texts.findIndex((t) => t.id === d.textId);
        const orig = d.orig.texts.find((t) => t.id === d.textId);
        if (idx < 0 || !orig) return;
        const handle = d.handle || "se";
        const sx = handle.includes("e")
          ? (orig.w + dx) / Math.max(1, orig.w)
          : (orig.w - dx) / Math.max(1, orig.w);
        const sy = handle.includes("s")
          ? (orig.h + dy) / Math.max(1, orig.h)
          : (orig.h - dy) / Math.max(1, orig.h);
        const scale = shift
          ? Math.max(0.25, (Math.abs(sx) + Math.abs(sy)) / 2)
          : Math.max(0.25, Math.abs(sx) >= Math.abs(sy) ? sx : sy);
        const fontSize = clamp(
          Math.round(orig.fontSize * scale),
          COVER_FONT_SIZE_MIN,
          COVER_FONT_SIZE_MAX
        );
        const w = clamp(orig.w * scale, 8, 90);
        const hBox = clamp(
          Math.max(4, (fontSize / orig.fontSize) * orig.h),
          4,
          80
        );
        let x = orig.x;
        let y = orig.y;
        if (handle.includes("w")) x = orig.x + orig.w - w;
        if (handle.includes("n")) y = orig.y + orig.h - hBox;
        next.texts[idx] = {
          ...next.texts[idx]!,
          x: clamp(x, 0, 96 - w),
          y: clamp(y, 0, 96 - hBox),
          w,
          h: hBox,
          fontSize,
        };
        setGuides(
          snapResize(
            next.texts[idx]!,
            allBoxes(next).filter((b) => b.id !== d.textId)
          )
        );
      }
      liveLayout(next);
    }
    function onUp() {
      drag.current = null;
      dragMoved.current = false;
      setGuides({ v: [], h: [] });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [liveLayout, syncHistoryFlags]);

  /**
   * Live bake preview — identical to what save writes / cards render.
   * Hit-target boxes stay invisible so CSS glow ≠ SVG glow drift.
   */
  const bakePreview = useMemo(() => {
    const markup = ensureCoverSvgCrop(
      buildCoverBrandSvg({
        layout,
        text: text || primaryCoverText(layout),
        logoUrl,
        fontId: font,
      })
    );
    return markup.replace(/^<\?xml[^>]*>\s*/i, "");
  }, [layout, text, logoUrl, font]);

  function openCtx(
    e: React.MouseEvent,
    kind: CtxMenu["kind"],
    id: string
  ) {
    e.preventDefault();
    e.stopPropagation();
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage) return;
    const item: SelItem =
      kind === "logo"
        ? { kind: "logo" }
        : kind === "text"
          ? { kind: "text", id }
          : { kind: "image", id };
    // Keep multi-selection if right-clicking an already-selected object
    if (!isSelected(item)) {
      pickSelect(item, e.shiftKey);
    }
    setCtx({
      x: e.clientX - stage.left,
      y: e.clientY - stage.top,
      kind,
      id,
    });
  }

  function beginMove(e: React.PointerEvent, item: SelItem) {
    e.stopPropagation();
    e.preventDefault();
    closeMenus();
    setEditingId(null);
    let nextSels = sels;
    if (e.shiftKey) {
      pickSelect(item, true);
      return;
    }
    if (!isSelected(item) || sels.length <= 1) {
      const expanded = expandGroupIds(layout, layerIdOf(item))
        .map((id) => selFromLayerId(layout, id))
        .filter((x): x is SelItem => Boolean(x));
      nextSels = expanded.length ? expanded : [item];
      setSels(nextSels);
    }
    dragMoved.current = false;
    drag.current = {
      kind: "move-multi",
      startX: e.clientX,
      startY: e.clientY,
      orig: layout,
      moveIds: nextSels.map(layerIdOf),
    };
  }

  return (
    <div ref={rootRef} className="cms-canva">
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => onCoverPick(e.target.files?.[0] ?? null)}
      />
      <input
        ref={assetInputRef}
        type="file"
        accept="image/*,.svg,image/svg+xml"
        className="sr-only"
        onChange={(e) => void onAssetFile(e.target.files?.[0] ?? null)}
      />

      <header className="cms-canva__topbar">
        <div className="cms-canva__topbar-left">
          <button type="button" className="cms-canva__nav-btn" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </button>
          <div className="cms-canva__crumb">
            <span>Cover</span>
            <em>{projectLabel}</em>
          </div>
          <div className="cms-canva-tray" role="toolbar" aria-label="History">
            <TrayIcon label="Undo" onClick={undo} disabled={!canUndo}>
              <ChevronLeft className="size-3.5" />
            </TrayIcon>
            <TrayIcon label="Redo" onClick={redo} disabled={!canRedo}>
              <ChevronRight className="size-3.5" />
            </TrayIcon>
          </div>
        </div>

        <div className="cms-canva__topbar-tools">
          {/* Add elements — spread tools (not a dropdown) */}
          <div className="cms-canva-tray cms-canva-tray--labeled" role="toolbar" aria-label="Add">
            <span className="cms-canva-tray__label">Add</span>
            <FloatingButtonGroup
              label="Add elements"
              variant="muted"
              size="sm"
              items={[
                {
                  id: "text",
                  label: "Text",
                  icon: <Type className="size-3.5" />,
                  iconOnly: true,
                  onSelect: () => {
                    closeMenus();
                    addText();
                  },
                },
                {
                  id: "image",
                  label: "SVG / image · R2",
                  icon: <FileImage className="size-3.5" />,
                  iconOnly: true,
                  onSelect: () => {
                    closeMenus();
                    setFinderMode("asset");
                  },
                },
                { type: "separator" },
                {
                  id: "cover",
                  label: "Cover photo · R2",
                  icon: <ImagePlus className="size-3.5" />,
                  iconOnly: true,
                  onSelect: () => {
                    closeMenus();
                    setFinderMode("cover");
                  },
                },
              ]}
            />
          </div>

          {activeText ? (
            <div className="cms-canva-tray" role="toolbar" aria-label="Text">
              <div className="cms-canva__menu-wrap">
                <button
                  type="button"
                  className={cn("cms-canva__chip", fontOpen && "is-open")}
                  onClick={() => {
                    setFontOpen((v) => !v);
                    setColorOpen(false);
                    setGlowOpen(false);
                  }}
                >
                  <Type className="size-3.5" />
                  <span style={coverFontStyle(font)}>{fontLabel}</span>
                </button>
                {fontOpen ? (
                  <div className="cms-canva-pop cms-canva-pop--fonts">
                    {COVER_FONT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={cn(font === preset.id && "is-active")}
                        style={coverFontStyle(preset.id)}
                        onClick={() => {
                          onFontChange(preset.id);
                          setFontOpen(false);
                        }}
                      >
                        <span>{preset.label}</span>
                        <em>Aa</em>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="cms-canva__size">
                <button
                  type="button"
                  onClick={() =>
                    patchText(activeText.id, {
                      fontSize: clamp(
                        activeText.fontSize - 2,
                        COVER_FONT_SIZE_MIN,
                        COVER_FONT_SIZE_MAX
                      ),
                    })
                  }
                >
                  <Minus className="size-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  className="cms-canva__size-input"
                  value={String(activeText.fontSize)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    if (!raw) return;
                    patchText(activeText.id, {
                      fontSize: clamp(
                        Number(raw) || 16,
                        COVER_FONT_SIZE_MIN,
                        COVER_FONT_SIZE_MAX
                      ),
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    patchText(activeText.id, {
                      fontSize: clamp(
                        activeText.fontSize + 2,
                        COVER_FONT_SIZE_MIN,
                        COVER_FONT_SIZE_MAX
                      ),
                    })
                  }
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              <ColorMenu
                open={colorOpen}
                color={activeText.color}
                onToggle={() => {
                  setColorOpen((v) => !v);
                  setFontOpen(false);
                  setGlowOpen(false);
                }}
                onPick={(c) => {
                  patchText(activeText.id, { color: c });
                  setColorOpen(false);
                }}
              />

              <span className="cms-canva-tray__rule" aria-hidden />
              <TrayIcon
                label="Bold"
                pressed={activeText.bold}
                onClick={() =>
                  patchText(activeText.id, { bold: !activeText.bold })
                }
              >
                <Bold className="size-3.5" />
              </TrayIcon>
              <TrayIcon
                label="Italic"
                pressed={activeText.italic}
                onClick={() =>
                  patchText(activeText.id, { italic: !activeText.italic })
                }
              >
                <Italic className="size-3.5" />
              </TrayIcon>
              <span className="cms-canva-tray__rule" aria-hidden />
              <TrayIcon
                label="Left"
                pressed={activeText.align === "left"}
                onClick={() => patchText(activeText.id, { align: "left" })}
              >
                <AlignLeft className="size-3.5" />
              </TrayIcon>
              <TrayIcon
                label="Center"
                pressed={activeText.align === "center"}
                onClick={() => patchText(activeText.id, { align: "center" })}
              >
                <AlignCenter className="size-3.5" />
              </TrayIcon>
              <TrayIcon
                label="Right"
                pressed={activeText.align === "right"}
                onClick={() => patchText(activeText.id, { align: "right" })}
              >
                <AlignRight className="size-3.5" />
              </TrayIcon>
              <span className="cms-canva-tray__rule" aria-hidden />
              <EffectsPanel
                open={glowOpen}
                glow={activeText}
                onToggle={() => {
                  setGlowOpen((v) => !v);
                  setFontOpen(false);
                  setColorOpen(false);
                }}
                onChange={(patch) => patchText(activeText.id, patch)}
              />
              <TrayIcon label="Delete" onClick={removeActive}>
                <Trash2 className="size-3.5" />
              </TrayIcon>
            </div>
          ) : sel?.kind === "logo" || activeImage ? (
            <div className="cms-canva-tray cms-canva-tray--labeled" role="toolbar" aria-label="Effect">
              <span className="cms-canva-tray__label">Effect</span>
              {activeGlow ? (
                <EffectsPanel
                  open={glowOpen}
                  glow={activeGlow}
                  onToggle={() => {
                    setGlowOpen((v) => !v);
                  }}
                  onChange={(patch) => {
                    if (sel?.kind === "logo") patchLogoGlow(patch);
                    else if (activeImage) patchImage(activeImage.id, patch);
                  }}
                />
              ) : null}
              <TrayIcon label="Delete" onClick={removeActive}>
                <Trash2 className="size-3.5" />
              </TrayIcon>
            </div>
          ) : null}
        </div>

        <div className="cms-canva__topbar-right">
          <div className="cms-canva-tray" role="toolbar" aria-label="Cover">
            <TrayIcon
              label="Download SVG"
              onClick={exportSvg}
            >
              <Download className="size-3.5" />
            </TrayIcon>
            <TrayIcon
              label="Reset"
              onClick={() => {
                const reset = {
                  ...DEFAULT_COVER_BRAND,
                  logo: { ...DEFAULT_COVER_BRAND.logo },
                  images: [],
                  texts: [
                    createCoverTextItem({
                      id: "primary",
                      content: text || "",
                    }),
                  ],
                  layerOrder: ["logo", "primary"],
                  groups: [],
                };
                commitLayout(reset);
                setSel({ kind: "text", id: "primary" });
                setEditingId(null);
              }}
            >
              <RotateCcw className="size-3.5" />
            </TrayIcon>
            <TrayIcon label="Edit detail" onClick={onEditDetail}>
              <Pencil className="size-3.5" />
            </TrayIcon>
          </div>

          <ExpandingButtonGroup
            label="Save cover"
            size="md"
            defaultExpanded="save"
            items={[
              {
                id: "save",
                label: saving ? "Saving…" : "Save",
                doneLabel: "Saved",
                icon: <Save className="size-4" />,
                disabled: saving || !dirty,
                onSelect: () => onSave(),
              },
            ]}
          />
        </div>
      </header>

      <div
        className="cms-canva__workspace"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
      >
        {/* Exact landing card classes — same scale as project section */}
        <div className="hq-feat-card cms-canva__card">
        <div
          ref={stageRef}
          className="hq-feat-media cms-canva__stage"
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) setCtx(null);
          }}
        >
          <button
            type="button"
            className="cms-canva__deselect"
            aria-label="Deselect"
          />
          {coverUrl ? (
            isVideoUrl(coverUrl) ? (
              <video
                src={coverUrl}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                className="hq-feat-img cms-brand-composer__bg"
                aria-hidden
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="hq-feat-img cms-brand-composer__bg"
              />
            )
          ) : (
            <div className="hq-feat-img hq-feat-img--fallback cms-brand-composer__bg" />
          )}
          <span
            className="hq-feat-veil cms-brand-composer__veil"
            aria-hidden
          />
          {/* Exact save output — what landing/CMS cards show */}
          {bakePreview ? (
            <div
              className={cn(
                "hq-cover-brand-svg cms-canva__bake-preview",
                editingId && "is-dimmed"
              )}
              aria-hidden
              dangerouslySetInnerHTML={{ __html: bakePreview }}
            />
          ) : null}
          {guides.v.map((x) => (
            <span
              key={`gv-${x}`}
              className="cms-brand-composer__guide cms-brand-composer__guide--v is-on"
              style={{ left: `${x}%` }}
              aria-hidden
            />
          ))}
          {guides.h.map((y) => (
            <span
              key={`gh-${y}`}
              className="cms-brand-composer__guide cms-brand-composer__guide--h is-on"
              style={{ top: `${y}%` }}
              aria-hidden
            />
          ))}
          {sels.length > 1 ? (
            <GroupBounds layout={layout} sels={sels} logoUrl={logoUrl} />
          ) : null}

          {logoUrl ? (
            <div
              className={cn(
                "cms-canva-box cms-canva-box--hit",
                selectedIds.has(LOGO_ID) && "is-selected"
              )}
              style={{
                left: `${layout.logo.x}%`,
                top: `${layout.logo.y}%`,
                width: `${layout.logo.w}%`,
                height: `${layout.logo.h}%`,
                zIndex:
                  layerZIndex(layout, LOGO_ID) +
                  (selectedIds.has(LOGO_ID) ? 20 : 0),
              }}
              onPointerDown={(e) => beginMove(e, { kind: "logo" })}
              onContextMenu={(e) => openCtx(e, "logo", LOGO_ID)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" draggable={false} />
              {sel?.kind === "logo" && sels.length === 1 ? (
                <Handles
                  onResize={(handle, e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    dragMoved.current = false;
                    drag.current = {
                      kind: "resize-logo",
                      startX: e.clientX,
                      startY: e.clientY,
                      orig: layout,
                      handle,
                    };
                  }}
                />
              ) : null}
            </div>
          ) : null}

          {layout.images.map((img) => {
            const selected = selectedIds.has(img.id);
            const primary = sel?.kind === "image" && sel.id === img.id;
            return (
              <div
                key={img.id}
                className={cn(
                  "cms-canva-box cms-canva-box--hit",
                  selected && "is-selected"
                )}
                style={{
                  left: `${img.x}%`,
                  top: `${img.y}%`,
                  width: `${img.w}%`,
                  height: `${img.h}%`,
                  zIndex: layerZIndex(layout, img.id) + (selected ? 20 : 0),
                }}
                onPointerDown={(e) =>
                  beginMove(e, { kind: "image", id: img.id })
                }
                onContextMenu={(e) => openCtx(e, "image", img.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" draggable={false} />
                {primary && sels.length === 1 ? (
                  <Handles
                    onResize={(handle, e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      dragMoved.current = false;
                      drag.current = {
                        kind: "resize-image",
                        startX: e.clientX,
                        startY: e.clientY,
                        orig: layout,
                        imageId: img.id,
                        handle,
                      };
                    }}
                  />
                ) : null}
              </div>
            );
          })}

          {layout.texts.map((item) => {
            const selected = selectedIds.has(item.id);
            const primary = sel?.kind === "text" && sel.id === item.id;
            const editing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "cms-canva-box cms-canva-box--text cms-canva-box--hit",
                  selected && "is-selected",
                  editing && "is-editing"
                )}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.w}%`,
                  height: "auto",
                  zIndex: layerZIndex(layout, item.id) + (selected ? 20 : 0),
                }}
                onPointerDown={(e) => {
                  if (editing) {
                    e.stopPropagation();
                    return;
                  }
                  beginMove(e, { kind: "text", id: item.id });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setSel({ kind: "text", id: item.id });
                  setEditingId(item.id);
                  closeMenus();
                }}
                onContextMenu={(e) => openCtx(e, "text", item.id)}
              >
                {editing ? (
                  <textarea
                    ref={editRef}
                    className="cms-canva-box__editor"
                    value={item.content}
                    rows={Math.max(1, item.content.split("\n").length)}
                    spellCheck={false}
                    style={{
                      ...coverFontStyle(font),
                      fontSize: stageFontSize(item.fontSize),
                      color: item.color,
                      fontWeight: coverTextFontWeight(
                        item.bold,
                        getCoverFontPreset(font).weight
                      ),
                      fontStyle: item.italic ? "italic" : "normal",
                      textAlign: item.align,
                      lineHeight: COVER_TEXT_LINE_HEIGHT,
                    }}
                    onChange={(e) =>
                      patchText(
                        item.id,
                        { content: e.target.value },
                        { history: false }
                      )
                    }
                    onPointerDown={(e) => e.stopPropagation()}
                    onFocus={() => pushPast()}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setEditingId(null);
                      }
                    }}
                    onBlur={() => setEditingId(null)}
                  />
                ) : (
                  <span
                    className="cms-canva-box__label"
                    style={{
                      ...coverFontStyle(font),
                      fontSize: stageFontSize(item.fontSize),
                      color: item.color,
                      fontWeight: coverTextFontWeight(
                        item.bold,
                        getCoverFontPreset(font).weight
                      ),
                      fontStyle: item.italic ? "italic" : "normal",
                      textAlign: item.align,
                      lineHeight: COVER_TEXT_LINE_HEIGHT,
                    }}
                  >
                    {item.content.trim() || "Double-click to type"}
                  </span>
                )}
                {primary && sels.length === 1 && !editing ? (
                  <Handles
                    sides
                    onResize={(handle, e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const side = handle === "e" || handle === "w";
                      dragMoved.current = false;
                      drag.current = {
                        kind: side ? "resize-text-w" : "resize-text-corner",
                        startX: e.clientX,
                        startY: e.clientY,
                        orig: layout,
                        textId: item.id,
                        handle,
                      };
                    }}
                  />
                ) : null}
              </div>
            );
          })}

          {ctx ? (
            <div
              className="cms-canva-ctx"
              style={{ left: ctx.x, top: ctx.y }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {sels.length >= 2 ? (
                <button type="button" onClick={groupSelection}>
                  <Group className="size-3.5" /> Group
                </button>
              ) : null}
              {sels.some((s) => findGroupFor(layout, layerIdOf(s))) ? (
                <button type="button" onClick={ungroupSelection}>
                  <Ungroup className="size-3.5" /> Ungroup
                </button>
              ) : null}
              {sels.length >= 2 ||
              sels.some((s) => findGroupFor(layout, layerIdOf(s))) ? (
                <span className="cms-canva-ctx__rule" aria-hidden />
              ) : null}
              <button type="button" onClick={() => applyLayer(ctx.id, "front")}>
                <BringToFront className="size-3.5" /> Bring to front
              </button>
              <button
                type="button"
                onClick={() => applyLayer(ctx.id, "forward")}
              >
                <ArrowUp className="size-3.5" /> Bring forward
              </button>
              <button
                type="button"
                onClick={() => applyLayer(ctx.id, "backward")}
              >
                <ArrowDown className="size-3.5" /> Send backward
              </button>
              <button type="button" onClick={() => applyLayer(ctx.id, "back")}>
                <SendToBack className="size-3.5" /> Send to back
              </button>
            </div>
          ) : null}
        </div>
        <div className="hq-feat-panel cms-canva__card-panel" aria-hidden>
          <p className="hq-feat-panel-title">{projectLabel || "Project"}</p>
          <p className="hq-feat-desc">
            Card description stays to two lines on the landing cover.
          </p>
          <p className="hq-feat-type">Cover preview</p>
        </div>
        </div>

        {uploading ? (
          <p className="cms-canva__status">Uploading…</p>
        ) : (
          <p className="cms-canva__status">
            Preview = saved SVG · Shift+click multi · ⌘S save
          </p>
        )}
      </div>

      <R2Finder
        open={finderMode !== null}
        folder={finderMode === "cover" ? "coverimage" : "cover-assets"}
        title={
          finderMode === "cover" ? "Cover photo · R2" : "Canvas asset · R2"
        }
        accept={
          finderMode === "asset"
            ? "image/*,.svg,image/svg+xml"
            : "image/*,video/*"
        }
        onClose={() => setFinderMode(null)}
        onSelect={(url) => {
          if (finderMode === "cover") {
            onCoverUrl?.(url);
          } else {
            addOverlayFromUrl(url);
          }
          setFinderMode(null);
        }}
      />
    </div>
  );
}

function ColorMenu({
  open,
  color,
  onToggle,
  onPick,
}: {
  open: boolean;
  color: string;
  onToggle: () => void;
  onPick: (c: string) => void;
}) {
  return (
    <div className="cms-canva__menu-wrap">
      <button
        type="button"
        className={cn("cms-canva__color-btn", open && "is-open")}
        title="Color"
        onClick={onToggle}
      >
        <span style={{ background: color }} />
      </button>
      {open ? (
        <div className="cms-canva-pop cms-canva-pop--color">
          <div className="cms-canva-pop__swatches">
            {COVER_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  "cms-canva-pop__swatch",
                  color.toLowerCase() === c && "is-active"
                )}
                style={{ background: c }}
                onClick={() => onPick(c)}
                aria-label={c}
              />
            ))}
          </div>
          <label className="cms-canva-pop__custom">
            <span>Custom</span>
            <input
              type="color"
              value={/^#([0-9a-f]{6})$/i.test(color) ? color : "#ffffff"}
              onChange={(e) => onPick(e.target.value)}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

/** Effects panel — solid tray, numeric +/- only (no Soft/Med/Strong). */
function EffectsPanel({
  open,
  glow,
  onToggle,
  onChange,
}: {
  open: boolean;
  glow: CoverGlow;
  onToggle: () => void;
  onChange: (patch: Partial<CoverGlow>) => void;
}) {
  const opacityPct = Math.round(glow.glowOpacity * 100);

  return (
    <div className="cms-canva__menu-wrap">
      <FloatingButtonGroup
        label="Glow"
        variant="muted"
        size="sm"
        items={[
          {
            id: "glow",
            label: "Glow",
            icon: <Sparkles className="size-3.5" />,
            pressed: open || glow.glowEnabled,
            onSelect: onToggle,
          },
        ]}
      />
      {open ? (
        <div className="cms-canva-pop cms-canva-pop--effects">
          <header className="cms-canva-effects__head">
            <Sparkles className="size-3.5" />
            <div className="cms-canva-effects__titles">
              <span>Glow</span>
              <em>Halo behind this object</em>
            </div>
            <ExpandingButtonGroup
              label="Glow power"
              size="sm"
              className="cms-canva-effects__toggle"
              defaultExpanded="power"
              items={[
                {
                  id: "power",
                  label: glow.glowEnabled ? "On" : "Off",
                  doneLabel: glow.glowEnabled ? "On" : "Off",
                  icon: <Sparkles className="size-3.5" />,
                  onSelect: () =>
                    onChange({
                      glowEnabled: !glow.glowEnabled,
                      ...(glow.glowEnabled
                        ? {}
                        : {
                            glowBlur: glow.glowBlur || DEFAULT_GLOW.glowBlur,
                            glowOpacity:
                              glow.glowOpacity || DEFAULT_GLOW.glowOpacity,
                            glowColor: glow.glowColor || DEFAULT_GLOW.glowColor,
                          }),
                    }),
                },
              ]}
            />
          </header>

          <div className="cms-canva-effects__preview" aria-hidden>
            <span
              className="cms-canva-effects__orb"
              style={{
                background: glow.glowColor,
                opacity: glow.glowEnabled ? 0.95 : 0.35,
                boxShadow: glow.glowEnabled
                  ? [
                      `0 0 ${Math.max(6, glow.glowBlur * 0.35)}px ${glow.glowColor}`,
                      `0 0 ${Math.max(14, glow.glowBlur * 0.9)}px color-mix(in srgb, ${glow.glowColor} ${Math.round(glow.glowOpacity * 80)}%, transparent)`,
                      `0 0 ${Math.max(28, glow.glowBlur * 1.6)}px color-mix(in srgb, ${glow.glowColor} ${Math.round(glow.glowOpacity * 45)}%, transparent)`,
                    ].join(", ")
                  : "none",
              }}
            />
          </div>

          <div
            className={cn(
              "cms-canva-effects__body",
              !glow.glowEnabled && "is-dim"
            )}
          >
            <div className="cms-canva-effects__field">
              <span>Blur</span>
              <Stepper
                value={glow.glowBlur}
                min={0}
                max={40}
                step={1}
                onChange={(glowBlur) =>
                  onChange({
                    glowBlur,
                    glowEnabled: glowBlur > 0 ? true : glow.glowEnabled,
                  })
                }
              />
            </div>

            <div className="cms-canva-effects__field">
              <span>Strength</span>
              <Stepper
                value={opacityPct}
                min={0}
                max={100}
                step={5}
                suffix="%"
                onChange={(pct) =>
                  onChange({
                    glowOpacity: pct / 100,
                    glowEnabled: pct > 0 ? true : glow.glowEnabled,
                  })
                }
              />
            </div>

            <div className="cms-canva-effects__field cms-canva-effects__field--color">
              <span>Color</span>
              <div className="cms-canva-pop__swatches cms-canva-pop__swatches--tight">
                {COVER_COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "cms-canva-pop__swatch",
                      glow.glowColor.toLowerCase() === c && "is-active"
                    )}
                    style={{ background: c }}
                    onClick={() =>
                      onChange({ glowColor: c, glowEnabled: true })
                    }
                    aria-label={c}
                  />
                ))}
              </div>
              <label className="cms-canva-effects__picker" title="Custom">
                <span style={{ background: glow.glowColor }} />
                <input
                  type="color"
                  value={
                    /^#([0-9a-f]{6})$/i.test(glow.glowColor)
                      ? glow.glowColor
                      : DEFAULT_GLOW.glowColor
                  }
                  onChange={(e) =>
                    onChange({
                      glowColor: e.target.value,
                      glowEnabled: true,
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="cms-canva__size cms-canva__size--step">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clamp(value - step, min, max))}
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        className="cms-canva__size-input"
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.-]/g, "");
          if (raw === "" || raw === "-") return;
          const n = Number(raw);
          if (Number.isNaN(n)) return;
          onChange(clamp(n, min, max));
        }}
        aria-label="Value"
      />
      {suffix ? <em className="cms-canva__size-suffix">{suffix}</em> : null}
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clamp(value + step, min, max))}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function TrayIcon({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={label} side="bottom">
      <button
        type="button"
        className={cn("cms-canva-tray__btn", pressed && "is-on")}
        aria-label={label}
        aria-pressed={pressed === undefined ? undefined : pressed}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function Handles({
  sides,
  onResize,
}: {
  sides?: boolean;
  onResize: (handle: string, e: ReactPointerEvent) => void;
}) {
  return (
    <>
      {["nw", "ne", "sw", "se"].map((h) => (
        <span
          key={h}
          className={cn("cms-canva-handle", `is-${h}`)}
          onPointerDown={(e) => onResize(h, e)}
        />
      ))}
      {sides
        ? (["w", "e"] as const).map((h) => (
            <span
              key={h}
              className={cn(
                "cms-canva-handle cms-canva-handle--side",
                `is-${h}`
              )}
              onPointerDown={(e) => onResize(h, e)}
            />
          ))
        : null}
    </>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type GuideBox = { id: string; x: number; y: number; w: number; h: number };

function allBoxes(layout: CoverBrandLayout): GuideBox[] {
  return [
    { id: LOGO_ID, ...layout.logo },
    ...layout.images.map((i) => ({
      id: i.id,
      x: i.x,
      y: i.y,
      w: i.w,
      h: i.h,
    })),
    ...layout.texts.map((t) => ({
      id: t.id,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
    })),
  ];
}

function boxesFromIds(layout: CoverBrandLayout, ids: string[]): GuideBox[] {
  const set = new Set(ids);
  return allBoxes(layout).filter((b) => set.has(b.id));
}

function boundsOf(boxes: GuideBox[]) {
  if (boxes.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

function nearestSnap(
  value: number,
  targets: number[],
  threshold = SNAP
): { value: number; hit: number | null } {
  let best = threshold + 1;
  let hit: number | null = null;
  for (const t of targets) {
    const d = Math.abs(value - t);
    if (d < best) {
      best = d;
      hit = t;
    }
  }
  if (hit === null || best > threshold) return { value, hit: null };
  return { value: hit, hit };
}

/** Snap a moving group to stage center + other objects (Canva-style). */
function snapGroup(moving: GuideBox[], others: GuideBox[]) {
  const box = boundsOf(moving);
  const xTargets = [50, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
  const yTargets = [50, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const left = nearestSnap(box.x, xTargets);
  const midX = nearestSnap(cx, xTargets);
  const right = nearestSnap(box.x + box.w, xTargets);
  const top = nearestSnap(box.y, yTargets);
  const midY = nearestSnap(cy, yTargets);
  const bottom = nearestSnap(box.y + box.h, yTargets);

  let dx = 0;
  let dy = 0;
  const v: number[] = [];
  const h: number[] = [];

  const xHits = [
    { delta: left.hit !== null ? left.value - box.x : Infinity, line: left.hit },
    {
      delta: midX.hit !== null ? midX.value - cx : Infinity,
      line: midX.hit,
    },
    {
      delta: right.hit !== null ? right.value - (box.x + box.w) : Infinity,
      line: right.hit,
    },
  ].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
  if (xHits[0] && Number.isFinite(xHits[0].delta) && Math.abs(xHits[0].delta) <= SNAP) {
    dx = xHits[0].delta;
    if (xHits[0].line !== null) v.push(xHits[0].line);
  }

  const yHits = [
    { delta: top.hit !== null ? top.value - box.y : Infinity, line: top.hit },
    {
      delta: midY.hit !== null ? midY.value - cy : Infinity,
      line: midY.hit,
    },
    {
      delta: bottom.hit !== null ? bottom.value - (box.y + box.h) : Infinity,
      line: bottom.hit,
    },
  ].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
  if (yHits[0] && Number.isFinite(yHits[0].delta) && Math.abs(yHits[0].delta) <= SNAP) {
    dy = yHits[0].delta;
    if (yHits[0].line !== null) h.push(yHits[0].line);
  }

  // Always show group center when multi-moving
  if (moving.length > 1) {
    const ncx = cx + dx;
    const ncy = cy + dy;
    if (!v.includes(ncx)) v.push(ncx);
    if (!h.includes(ncy)) h.push(ncy);
  }

  return { dx, dy, guides: { v: [...new Set(v.map((n) => +n.toFixed(2)))], h: [...new Set(h.map((n) => +n.toFixed(2)))] } };
}

function applyBoxDelta(
  layout: CoverBrandLayout,
  ids: string[],
  dx: number,
  dy: number
) {
  if (!dx && !dy) return;
  for (const id of ids) {
    if (id === LOGO_ID) {
      layout.logo.x = clamp(layout.logo.x + dx, 0, 96 - layout.logo.w);
      layout.logo.y = clamp(layout.logo.y + dy, 0, 96 - layout.logo.h);
      continue;
    }
    const t = layout.texts.find((x) => x.id === id);
    if (t) {
      t.x = clamp(t.x + dx, 0, 96 - t.w);
      t.y = clamp(t.y + dy, 0, 96 - 4);
      continue;
    }
    const img = layout.images.find((x) => x.id === id);
    if (img) {
      img.x = clamp(img.x + dx, 0, 96 - img.w);
      img.y = clamp(img.y + dy, 0, 96 - img.h);
    }
  }
}

/** Alignment + matching-width guides while resizing one box. */
function snapResize(
  box: { x: number; y: number; w: number; h: number },
  others: GuideBox[]
): { v: number[]; h: number[] } {
  const v: number[] = [];
  const h: number[] = [];
  const edgesX = [box.x, box.x + box.w / 2, box.x + box.w];
  const edgesY = [box.y, box.y + box.h / 2, box.y + box.h];
  for (const t of [50, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])]) {
    if (edgesX.some((e) => Math.abs(e - t) <= SNAP)) v.push(+t.toFixed(2));
  }
  for (const t of [50, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])]) {
    if (edgesY.some((e) => Math.abs(e - t) <= SNAP)) h.push(+t.toFixed(2));
  }
  for (const o of others) {
    if (Math.abs(box.w - o.w) <= SNAP) {
      v.push(+o.x.toFixed(2), +(o.x + o.w).toFixed(2));
    }
    if (Math.abs(box.h - o.h) <= SNAP) {
      h.push(+o.y.toFixed(2), +(o.y + o.h).toFixed(2));
    }
  }
  return { v: [...new Set(v)], h: [...new Set(h)] };
}

function GroupBounds({
  layout,
  sels,
  logoUrl,
}: {
  layout: CoverBrandLayout;
  sels: SelItem[];
  logoUrl?: string | null;
}) {
  const ids = sels
    .map(layerIdOf)
    .filter((id) => (id === LOGO_ID ? Boolean(logoUrl) : true));
  const boxes = boxesFromIds(layout, ids);
  if (boxes.length < 2) return null;
  const b = boundsOf(boxes);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return (
    <>
      <span
        className="cms-canva-group-bounds"
        style={{
          left: `${b.x}%`,
          top: `${b.y}%`,
          width: `${b.w}%`,
          height: `${b.h}%`,
        }}
        aria-hidden
      />
      <span
        className="cms-brand-composer__guide cms-brand-composer__guide--v is-on is-group"
        style={{ left: `${cx}%` }}
        aria-hidden
      />
      <span
        className="cms-brand-composer__guide cms-brand-composer__guide--h is-on is-group"
        style={{ top: `${cy}%` }}
        aria-hidden
      />
    </>
  );
}

function resizeBox(
  box: { x: number; y: number; w: number; h: number },
  orig: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  handle: string,
  minW: number,
  minH: number,
  lockAspect = false
) {
  let { x, y, w, h } = { ...orig };
  if (lockAspect) {
    const ratio = orig.w / Math.max(0.001, orig.h);
    const sx = handle.includes("e")
      ? (orig.w + dx) / Math.max(1, orig.w)
      : handle.includes("w")
        ? (orig.w - dx) / Math.max(1, orig.w)
        : 1;
    const sy = handle.includes("s")
      ? (orig.h + dy) / Math.max(1, orig.h)
      : handle.includes("n")
        ? (orig.h - dy) / Math.max(1, orig.h)
        : 1;
    const scale = Math.max(0.2, Math.abs(sx) >= Math.abs(sy) ? sx : sy);
    w = clamp(orig.w * scale, minW, 90);
    h = clamp(w / ratio, minH, 90);
    if (handle.includes("w")) x = orig.x + orig.w - w;
    if (handle.includes("n")) y = orig.y + orig.h - h;
  } else {
    if (handle.includes("e")) w = clamp(orig.w + dx, minW, 96 - orig.x);
    if (handle.includes("s")) h = clamp(orig.h + dy, minH, 96 - orig.y);
    if (handle.includes("w")) {
      w = clamp(orig.w - dx, minW, orig.x + orig.w);
      x = orig.x + orig.w - w;
    }
    if (handle.includes("n")) {
      h = clamp(orig.h - dy, minH, orig.y + orig.h);
      y = orig.y + orig.h - h;
    }
  }
  box.x = clamp(x, 0, 96 - w);
  box.y = clamp(y, 0, 96 - h);
  box.w = w;
  box.h = h;
}
