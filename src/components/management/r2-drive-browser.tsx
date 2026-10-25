"use client";

import {
  FolderIcon,
  FOLDER_COLORS,
  folderColorValue,
} from "@/components/management/folder-icon";
import {
  R2FilePreview,
  type PreviewFile,
} from "@/components/management/r2-file-preview";
import {
  R2UploadQueue,
  type UploadQueueItem,
} from "@/components/management/r2-upload-queue";
import {
  FileType,
  getFileType,
  getFileTypeCategory,
} from "@/components/reui/file-type";
import {
  ArcContextMenu,
  ArcContextMenuContent,
  ArcContextMenuItem,
  ArcContextMenuLabel,
  ArcContextMenuRadioGroup,
  ArcContextMenuRadioItem,
  ArcContextMenuSeparator,
  ArcContextMenuSub,
  ArcContextMenuSubContent,
  ArcContextMenuSubTrigger,
  ArcContextMenuTrigger,
} from "@/components/arc/context-menu/context-menu";
import {
  FloatingButtonGroup,
  type FloatingButtonGroupItem,
} from "@/components/arc/floating-button-group/floating-button-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FolderOpen,
  FolderPlus,
  Home,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  MoreVertical,
  Palette,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

const DEFAULT_FOLDER_COLOR = folderColorValue("amber");

type R2Folder = {
  key: string;
  name: string;
  color?: string | null;
  size?: number;
  fileCount?: number;
};
type R2Object = {
  key: string;
  url: string;
  filename: string;
  folder: string;
  size: number;
  lastModified: string;
};

type ViewMode = "grid" | "list";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i += 1;
  }
  const digits = i === 0 ? 0 : n < 10 ? 1 : 0;
  return `${n.toFixed(digits)} ${units[i]}`;
}

function folderSizeLabel(folder: R2Folder) {
  const size = formatBytes(folder.size ?? 0);
  const count = folder.fileCount ?? 0;
  if (count <= 0) return size;
  return `${size} · ${count} file${count === 1 ? "" : "s"}`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function categoryLabel(filename: string) {
  const type = getFileType(filename);
  const cat = getFileTypeCategory(String(type));
  if (cat === "image") return "Image";
  if (cat === "video") return "Video";
  if (cat === "audio") return "Audio";
  if (cat === "archive") return "Archive";
  if (cat === "spreadsheet") return "Sheet";
  if (cat === "document") return String(type).toUpperCase();
  if (cat === "code") return String(type).toUpperCase();
  return String(type).toUpperCase();
}

function isVideoName(name: string) {
  return /\.(mp4|webm|mov|m4v)$/i.test(name);
}

function isImageName(name: string) {
  return /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(name);
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isCoarsePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

function rectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: DOMRect
) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function FolderColorMenu({
  folder,
  saving,
  onPick,
}: {
  folder: R2Folder;
  saving?: boolean;
  onPick: (color: string) => void;
}) {
  const current = (folder.color || DEFAULT_FOLDER_COLOR).toUpperCase();
  const activeId =
    FOLDER_COLORS.find((c) => c.value.toUpperCase() === current)?.id ?? "amber";
  return (
    <ArcContextMenuSub>
      <ArcContextMenuSubTrigger
        icon={
          saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Palette className="size-4" />
          )
        }
        trailing={
          <span
            className="cms-drive__color-swatch"
            style={{ background: current }}
          />
        }
      >
        Color
      </ArcContextMenuSubTrigger>
      <ArcContextMenuSubContent>
        <ArcContextMenuLabel>Folder color</ArcContextMenuLabel>
        <ArcContextMenuRadioGroup
          value={activeId}
          onValueChange={(id) => {
            const next = FOLDER_COLORS.find((c) => c.id === id);
            if (next) onPick(next.value);
          }}
        >
          {FOLDER_COLORS.map((c, i) => (
            <ArcContextMenuRadioItem
              key={c.id}
              value={c.id}
              disabled={saving}
              index={i}
              onSelect={() => {
                // Ensure click applies even if RadioGroup value is already set
                onPick(c.value);
              }}
              icon={
                <span
                  className="cms-drive__color-swatch"
                  style={{ background: c.value }}
                />
              }
            >
              {c.label}
            </ArcContextMenuRadioItem>
          ))}
        </ArcContextMenuRadioGroup>
      </ArcContextMenuSubContent>
    </ArcContextMenuSub>
  );
}

function FolderActionsMenu({
  folder,
  colorSaving,
  onOpen,
  onColor,
  onDelete,
}: {
  folder: R2Folder;
  colorSaving?: boolean;
  onOpen: () => void;
  onColor: (color: string) => void;
  onDelete: () => void;
}) {
  return (
    <ArcContextMenuContent>
      <ArcContextMenuItem
        icon={<FolderOpen className="size-4" />}
        onSelect={onOpen}
      >
        Open
      </ArcContextMenuItem>
      <ArcContextMenuSeparator />
      <FolderColorMenu
        folder={folder}
        saving={colorSaving}
        onPick={onColor}
      />
      <ArcContextMenuSeparator />
      <ArcContextMenuItem
        destructive
        icon={<Trash2 className="size-4" />}
        onSelect={onDelete}
      >
        Delete folder…
      </ArcContextMenuItem>
    </ArcContextMenuContent>
  );
}

export function R2DriveBrowser() {
  const [prefix, setPrefix] = useState("");
  const [folders, setFolders] = useState<R2Folder[]>([]);
  const [objects, setObjects] = useState<R2Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [mkdirOpen, setMkdirOpen] = useState(false);
  const [mkdirName, setMkdirName] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [colorSaving, setColorSaving] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewFile | null>(null);
  const [folderDelete, setFolderDelete] = useState<{
    folder: R2Folder;
    loading: boolean;
    deleting: boolean;
    fileCount: number;
    totalSize: number;
    samples: string[];
  } | null>(null);
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [anchorKey, setAnchorKey] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const aborted = useRef<Set<string>>(new Set());
  const historyIndexRef = useRef(0);
  const anchorRef = useRef<string | null>(null);
  const marqueeOrigin = useRef<{ x: number; y: number } | null>(null);
  const marqueeActive = useRef(false);
  historyIndexRef.current = historyIndex;
  anchorRef.current = anchorKey;

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const itemKeys = useMemo(
    () => [...folders.map((f) => f.key), ...objects.map((o) => o.key)],
    [folders, objects]
  );

  const crumbs = useMemo(
    () =>
      prefix
        ? prefix
            .replace(/\/$/, "")
            .split("/")
            .filter(Boolean)
            .map((part, i, arr) => ({
              name: part,
              prefix: `${arr.slice(0, i + 1).join("/")}/`,
            }))
        : [],
    [prefix]
  );

  const load = useCallback(async (nextPrefix: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        mode: "browse",
        prefix: nextPrefix,
      });
      const { ok, data, status } = await fetchJson<{
        success?: boolean;
        data?: { folders?: R2Folder[]; objects?: R2Object[] };
        error?: string;
      }>(`/api/cms/storage?${qs}`);
      if (!ok || !data.data) {
        setFolders([]);
        setObjects([]);
        setError(
          data.error ||
            (status === 503
              ? "R2 is not configured"
              : `Failed to browse (${status})`)
        );
        return;
      }
      setFolders(data.data.folders || []);
      setObjects(data.data.objects || []);
      setPrefix(nextPrefix);
    } catch {
      setError("Failed to browse R2");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Navigate like Finder — push onto history (drops any forward stack). */
  const navigate = useCallback(
    async (nextPrefix: string) => {
      const idx = historyIndexRef.current;
      setHistory((h) => [...h.slice(0, idx + 1), nextPrefix]);
      setHistoryIndex(idx + 1);
      await load(nextPrefix);
    },
    [load]
  );

  const goBack = useCallback(async () => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    const next = idx - 1;
    setHistoryIndex(next);
    await load(history[next]!);
  }, [history, load]);

  const goForward = useCallback(async () => {
    const idx = historyIndexRef.current;
    if (idx >= history.length - 1) return;
    const next = idx + 1;
    setHistoryIndex(next);
    await load(history[next]!);
  }, [history, load]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setAnchorKey(null);
  }, []);

  const selectRange = useCallback(
    (fromKey: string, toKey: string) => {
      const a = itemKeys.indexOf(fromKey);
      const b = itemKeys.indexOf(toKey);
      if (a < 0 || b < 0) {
        setSelected(new Set([toKey]));
        return;
      }
      const [lo, hi] = a < b ? [a, b] : [b, a];
      setSelected(new Set(itemKeys.slice(lo, hi + 1)));
    },
    [itemKeys]
  );

  const openItem = useCallback(
    (key: string) => {
      const folder = folders.find((f) => f.key === key);
      if (folder) {
        clearSelection();
        void navigate(folder.key);
        return;
      }
      const obj = objects.find((o) => o.key === key);
      if (obj) setPreview(obj);
    },
    [folders, objects, clearSelection, navigate]
  );

  /** Click / tap select. Desktop: select only. Touch: tap again on sole pick opens. */
  const onItemSelect = useCallback(
    (key: string, e: ReactMouseEvent | ReactPointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      /* Kill native text selection (red/pink “wire” on shift-click) */
      window.getSelection()?.removeAllRanges();
      const shift = e.shiftKey;
      const multi = e.metaKey || e.ctrlKey;
      if (shift && anchorRef.current) {
        selectRange(anchorRef.current, key);
        return;
      }
      if (multi) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
        setAnchorKey(key);
        return;
      }
      if (isCoarsePointer()) {
        setSelected((prev) => {
          if (prev.size === 1 && prev.has(key)) {
            queueMicrotask(() => openItem(key));
            return prev;
          }
          return new Set([key]);
        });
        setAnchorKey(key);
        return;
      }
      setSelected(new Set([key]));
      setAnchorKey(key);
    },
    [openItem, selectRange]
  );

  useEffect(() => {
    clearSelection();
  }, [prefix, clearSelection]);

  useEffect(() => {
    void load("");
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") clearSelection();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelection]);

  function folderDisplayColor(folder: R2Folder) {
    return folder.color || DEFAULT_FOLDER_COLOR;
  }

  async function createFolder() {
    const name = mkdirName.trim().replace(/\/+/g, "");
    if (!name) return;
    const path = `${prefix}${name}`;
    const { ok } = await fetchJson("/api/cms/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mkdir",
        path,
        color: DEFAULT_FOLDER_COLOR,
      }),
    });
    if (ok) {
      setMkdirName("");
      setMkdirOpen(false);
      await load(prefix);
    } else {
      setError("Could not create folder");
    }
  }

  async function setFolderColor(folder: R2Folder, color: string) {
    const prev = folder.color;
    setFolders((list) =>
      list.map((f) => (f.key === folder.key ? { ...f, color } : f))
    );
    setColorSaving(folder.key);
    try {
      const { ok } = await fetchJson("/api/cms/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-folder-color",
          path: folder.key,
          color,
        }),
      });
      if (!ok) {
        setFolders((list) =>
          list.map((f) =>
            f.key === folder.key ? { ...f, color: prev } : f
          )
        );
        setError("Could not save folder color");
      }
    } catch {
      setFolders((list) =>
        list.map((f) => (f.key === folder.key ? { ...f, color: prev } : f))
      );
      setError("Could not save folder color");
    } finally {
      setColorSaving(null);
    }
  }

  async function askDeleteFolder(folder: R2Folder) {
    setFolderDelete({
      folder,
      loading: true,
      deleting: false,
      fileCount: 0,
      totalSize: 0,
      samples: [],
    });
    try {
      const qs = new URLSearchParams({
        mode: "folder-info",
        prefix: folder.key,
      });
      const { ok, data } = await fetchJson<{
        data?: {
          fileCount?: number;
          totalSize?: number;
          samples?: string[];
        };
      }>(`/api/cms/storage?${qs}`);
      setFolderDelete((cur) =>
        cur && cur.folder.key === folder.key
          ? {
              ...cur,
              loading: false,
              fileCount: data.data?.fileCount ?? 0,
              totalSize: data.data?.totalSize ?? 0,
              samples: data.data?.samples ?? [],
            }
          : cur
      );
      if (!ok) {
        setFolderDelete((cur) =>
          cur && cur.folder.key === folder.key
            ? { ...cur, loading: false }
            : cur
        );
      }
    } catch {
      setFolderDelete((cur) =>
        cur && cur.folder.key === folder.key
          ? { ...cur, loading: false }
          : cur
      );
    }
  }

  async function confirmDeleteFolder() {
    if (!folderDelete) return;
    setFolderDelete((cur) => (cur ? { ...cur, deleting: true } : cur));
    try {
      const { ok } = await fetchJson("/api/cms/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-folder",
          path: folderDelete.folder.key,
        }),
      });
      if (ok) {
        setFolderDelete(null);
        await load(prefix);
      } else {
        setError("Could not delete folder");
        setFolderDelete((cur) => (cur ? { ...cur, deleting: false } : cur));
      }
    } catch {
      setError("Could not delete folder");
      setFolderDelete((cur) => (cur ? { ...cur, deleting: false } : cur));
    }
  }

  async function deleteObject(obj: R2Object) {
    if (!window.confirm(`Delete "${obj.filename}" from R2?`)) return;
    setDeleting(obj.key);
    try {
      const res = await fetch("/api/cms/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: obj.key }),
      });
      if (res.ok) await load(prefix);
    } finally {
      setDeleting(null);
    }
  }

  const selectedFolders = useMemo(
    () => folders.filter((f) => selected.has(f.key)),
    [folders, selected]
  );
  const selectedObjects = useMemo(
    () => objects.filter((o) => selected.has(o.key)),
    [objects, selected]
  );
  const selectedCount = selected.size;
  const soleKey =
    selectedCount === 1 ? ([...selected][0] as string) : null;

  async function deleteSelected() {
    if (selectedCount === 0) return;
    const label =
      selectedCount === 1
        ? `"${selectedFolders[0]?.name || selectedObjects[0]?.filename}"`
        : `${selectedCount} items`;
    if (!window.confirm(`Delete ${label} from R2? This cannot be undone.`)) {
      return;
    }
    setDeleting("batch");
    try {
      for (const folder of selectedFolders) {
        await fetchJson("/api/cms/storage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete-folder",
            path: folder.key,
          }),
        });
      }
      for (const obj of selectedObjects) {
        await fetch("/api/cms/storage", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: obj.key }),
        });
      }
      clearSelection();
      await load(prefix);
    } finally {
      setDeleting(null);
    }
  }

  function downloadSelected() {
    for (const obj of selectedObjects) {
      window.open(obj.url, "_blank", "noopener,noreferrer");
    }
  }

  function copySelectedLink() {
    const urls = selectedObjects.map((o) => o.url);
    if (urls.length === 0) return;
    void navigator.clipboard?.writeText(urls.join("\n"));
  }

  function onBodyPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || isCoarsePointer()) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-drive-key]")) return;
    if (target.closest("button, a, input, [role='menuitem']")) return;
    /* Never start a marquee while a menu / dialog is open */
    if (
      target.closest("[role='menu'], [data-radix-menu-content], .cms-arc-menu") ||
      document.querySelector("[data-state='open'][role='menu']")
    ) {
      return;
    }
    marqueeActive.current = true;
    marqueeOrigin.current = { x: e.clientX, y: e.clientY };
    setMarquee({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) clearSelection();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onBodyPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!marqueeActive.current || !marqueeOrigin.current) return;
    const ox = marqueeOrigin.current.x;
    const oy = marqueeOrigin.current.y;
    const x = Math.min(ox, e.clientX);
    const y = Math.min(oy, e.clientY);
    const w = Math.abs(e.clientX - ox);
    const h = Math.abs(e.clientY - oy);
    setMarquee({ x, y, w, h });
    if (w < 4 && h < 4) return;
    const box = { left: x, top: y, right: x + w, bottom: y + h };
    const hits = new Set<string>();
    bodyRef.current
      ?.querySelectorAll<HTMLElement>("[data-drive-key]")
      .forEach((el) => {
        const key = el.dataset.driveKey;
        if (key && rectsIntersect(box, el.getBoundingClientRect())) {
          hits.add(key);
        }
      });
    setSelected(hits);
  }

  function onBodyPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!marqueeActive.current) return;
    marqueeActive.current = false;
    marqueeOrigin.current = null;
    setMarquee(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const keys = [...selected];
    if (keys.length) setAnchorKey(keys[keys.length - 1] ?? null);
  }

  function patchQueue(id: string, patch: Partial<UploadQueueItem>) {
    setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function uploadOne(item: UploadQueueItem, file: File, folder: string) {
    aborted.current.delete(item.id);
    patchQueue(item.id, { status: "uploading", progress: 8 });
    try {
      const image = await fileToBase64(file);
      if (aborted.current.has(item.id)) return;
      patchQueue(item.id, { progress: 45 });
      const { ok, data } = await fetchJson<{
        success?: boolean;
        data?: { url?: string };
        error?: string;
      }>("/api/cms/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload", image, folder }),
      });
      if (aborted.current.has(item.id)) return;
      if (!ok || !data.data?.url) {
        patchQueue(item.id, {
          status: "failed",
          progress: 60,
          error: data.error || "Upload failed",
        });
        return;
      }
      patchQueue(item.id, { status: "done", progress: 100 });
      await load(prefix);
    } catch {
      if (!aborted.current.has(item.id)) {
        patchQueue(item.id, { status: "failed", progress: 40 });
      }
    }
  }

  const fileById = useRef<Map<string, File>>(new Map());

  function enqueueWithRetain(fileList: FileList | File[] | null) {
    if (!fileList || !fileList.length) return;
    const folder = prefix.replace(/\/$/, "") || "gallery";
    const files = Array.from(fileList);
    const items: UploadQueueItem[] = files.map((file) => {
      const id = newId();
      fileById.current.set(id, file);
      return {
        id,
        name: file.name,
        type: file.type || file.name,
        size: file.size,
        progress: 0,
        status: "uploading" as const,
        folder,
      };
    });
    setQueue((q) => [...items, ...q]);
    items.forEach((item) => {
      const file = fileById.current.get(item.id);
      if (file) void uploadOne(item, file, folder);
    });
  }

  function removeFromQueue(id: string) {
    aborted.current.add(id);
    fileById.current.delete(id);
    setQueue((q) => q.filter((f) => f.id !== id));
  }

  function retryUpload(id: string) {
    const file = fileById.current.get(id);
    const item = queue.find((f) => f.id === id);
    if (!file || !item) return;
    void uploadOne(item, file, item.folder || prefix.replace(/\/$/, "") || "gallery");
  }

  const empty = !loading && folders.length === 0 && objects.length === 0;

  const historyItems = useMemo<FloatingButtonGroupItem[]>(
    () => [
      {
        id: "back",
        label: "Back",
        icon: <ChevronLeft strokeWidth={2.25} />,
        iconOnly: true,
        disabled: !canGoBack || loading,
        onSelect: () => void goBack(),
      },
      {
        id: "forward",
        label: "Forward",
        icon: <ChevronRight strokeWidth={2.25} />,
        iconOnly: true,
        disabled: !canGoForward || loading,
        onSelect: () => void goForward(),
      },
    ],
    [canGoBack, canGoForward, loading, goBack, goForward]
  );

  const viewItems = useMemo<FloatingButtonGroupItem[]>(
    () => [
      {
        id: "grid",
        label: "Grid view",
        icon: <LayoutGrid />,
        iconOnly: true,
        pressed: view === "grid",
        onSelect: () => setView("grid"),
      },
      {
        id: "list",
        label: "List view",
        icon: <List />,
        iconOnly: true,
        pressed: view === "list",
        onSelect: () => setView("list"),
      },
    ],
    [view]
  );

  const idleActionItems: FloatingButtonGroupItem[] = [
    {
      id: "reload",
      label: "Reload",
      icon: <RefreshCw className={cn(loading && "animate-spin")} />,
      iconOnly: true,
      onSelect: () => void load(prefix),
    },
    { type: "separator" },
    {
      id: "mkdir",
      label: "New folder",
      icon: <FolderPlus />,
      onSelect: () => setMkdirOpen(true),
    },
    {
      id: "upload",
      label: "Upload",
      icon: <Upload />,
      onSelect: () => fileRef.current?.click(),
    },
  ];

  const selectionItems: FloatingButtonGroupItem[] = [
    {
      id: "clear",
      label: "Clear selection",
      icon: <X strokeWidth={2.25} />,
      iconOnly: true,
      onSelect: clearSelection,
    },
    {
      id: "count",
      label: `${selectedCount} selected`,
      reserveLabels: ["1 selected", "99 selected"],
      disabled: true,
    },
    { type: "separator" },
    ...(soleKey
      ? ([
          {
            id: "open",
            label: selectedFolders.length ? "Open folder" : "Preview",
            icon: selectedFolders.length ? <FolderOpen /> : <Eye />,
            iconOnly: true,
            onSelect: () => openItem(soleKey),
          },
        ] satisfies FloatingButtonGroupItem[])
      : []),
    ...(selectedObjects.length > 0
      ? ([
          {
            id: "download",
            label: "Download",
            icon: <Download />,
            iconOnly: true,
            onSelect: downloadSelected,
          },
          {
            id: "link",
            label: "Copy link",
            icon: <Link2 />,
            iconOnly: true,
            onSelect: copySelectedLink,
          },
        ] satisfies FloatingButtonGroupItem[])
      : []),
    {
      id: "delete",
      label: "Delete",
      icon:
        deleting === "batch" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Trash2 />
        ),
      iconOnly: true,
      disabled: deleting === "batch",
      onSelect: () => void deleteSelected(),
    },
  ];

  return (
    <div className="cms-drive">
      <div className="cms-drive__toolbar">
        <div className="cms-drive__nav">
          <FloatingButtonGroup
            className="cms-drive__fbg"
            label="History"
            variant="muted"
            size="sm"
            items={historyItems}
          />
          <nav className="cms-drive__crumbs" aria-label="Path">
            <button
              type="button"
              className="cms-drive__crumb"
              onClick={() => void navigate("")}
            >
              <Home className="size-3.5" />
              My Drive
            </button>
            {crumbs.map((c) => (
              <span key={c.prefix} className="cms-drive__crumb-row">
                <ChevronRight className="size-3 opacity-40" />
                <button
                  type="button"
                  className="cms-drive__crumb"
                  onClick={() => void navigate(c.prefix)}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="cms-drive__actions">
          <FloatingButtonGroup
            className="cms-drive__fbg"
            label="View"
            variant="muted"
            size="sm"
            items={viewItems}
          />
          {selectedCount > 0 ? (
            <FloatingButtonGroup
              className="cms-drive__fbg cms-drive__fbg--sel"
              label="Selection"
              variant="floating"
              size="sm"
              items={selectionItems}
            />
          ) : (
            <FloatingButtonGroup
              className="cms-drive__fbg"
              label="Drive actions"
              variant="muted"
              size="sm"
              items={idleActionItems}
            />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,.pdf,.zip,.json,.xlsx,.docx"
            multiple
            className="hidden"
            onChange={(e) => {
              enqueueWithRetain(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={photoRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              enqueueWithRetain(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {mkdirOpen ? (
        <div className="cms-drive__mkdir">
          <FolderPlus className="size-4 opacity-60" />
          <input
            autoFocus
            value={mkdirName}
            placeholder="Folder name"
            onChange={(e) => setMkdirName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void createFolder();
              if (e.key === "Escape") setMkdirOpen(false);
            }}
          />
          <Button type="button" size="sm" onClick={() => void createFolder()}>
            Create
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setMkdirOpen(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {error ? <p className="cms-drive__error">{error}</p> : null}

      <ArcContextMenu>
        <ArcContextMenuTrigger asChild>
          <div
            ref={bodyRef}
            className={cn(
              "cms-drive__body",
              marquee && "is-marqueeing"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
              e.preventDefault();
              enqueueWithRetain(e.dataTransfer.files);
            }}
            onPointerDown={onBodyPointerDown}
            onPointerMove={onBodyPointerMove}
            onPointerUp={onBodyPointerUp}
            onPointerCancel={onBodyPointerUp}
          >
            {marquee && (marquee.w > 3 || marquee.h > 3) ? (
              <div
                className="cms-drive__marquee"
                style={{
                  left: marquee.x,
                  top: marquee.y,
                  width: marquee.w,
                  height: marquee.h,
                }}
                aria-hidden
              />
            ) : null}
            {loading && empty ? (
              <div className="cms-drive__empty">
                <Loader2 className="size-8 animate-spin opacity-40" />
              </div>
            ) : empty ? (
              <div className="cms-drive__empty">
                <FolderIcon
                  color={DEFAULT_FOLDER_COLOR}
                  size={56}
                  variant="layered"
                />
                <p>This folder is empty</p>
                <p className="cms-drive__hint">
                  Right-click to upload, or drop files here
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => photoRef.current?.click()}
                >
                  <Plus className="size-3.5" />
                  Upload photos / video
                </Button>
              </div>
            ) : view === "grid" ? (
              <div className="cms-drive__grid-stack">
                {folders.length > 0 ? (
                  <div className="cms-drive__folders">
                    {folders.map((f) => (
                      <ArcContextMenu key={f.key}>
                        <ArcContextMenuTrigger asChild>
                          <button
                            type="button"
                            data-drive-key={f.key}
                            className={cn(
                              "cms-drive__folder",
                              selected.has(f.key) && "is-selected"
                            )}
                            onMouseDown={(e) => {
                              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                e.preventDefault();
                              }
                            }}
                            onClick={(e) => onItemSelect(f.key, e)}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openItem(f.key);
                            }}
                            title={`${f.name} — double-click to open · tap twice on touch`}
                          >
                            <FolderIcon
                              color={folderDisplayColor(f)}
                              size={72}
                              variant="layered"
                              title={f.name}
                            />
                            <span className="cms-drive__folder-label">
                              {f.name}
                            </span>
                            <span className="cms-drive__folder-meta">
                              {folderSizeLabel(f)}
                            </span>
                          </button>
                        </ArcContextMenuTrigger>
                        <FolderActionsMenu
                          folder={f}
                          colorSaving={colorSaving === f.key}
                          onOpen={() => openItem(f.key)}
                          onColor={(color) => void setFolderColor(f, color)}
                          onDelete={() => void askDeleteFolder(f)}
                        />
                      </ArcContextMenu>
                    ))}
                  </div>
                ) : null}
                <div className="cms-drive__grid">
                {objects.map((obj) => {
                  const isVideo = isVideoName(obj.filename);
                  const isImage = isImageName(obj.filename);
                  const openPreview = () => setPreview(obj);
                  return (
                    <ArcContextMenu key={obj.key}>
                      <ArcContextMenuTrigger asChild>
                        <article
                          data-drive-key={obj.key}
                          className={cn(
                            "cms-drive__card",
                            selected.has(obj.key) && "is-selected"
                          )}
                          onMouseDown={(e) => {
                            if (e.shiftKey || e.metaKey || e.ctrlKey) {
                              e.preventDefault();
                            }
                          }}
                          onClick={(e) => onItemSelect(obj.key, e)}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openPreview();
                          }}
                        >
                          <header className="cms-drive__card-head">
                            <div
                              className="cms-drive__card-open"
                              title={obj.filename}
                            >
                              <FileType
                                type={getFileType(obj.filename)}
                                size="sm"
                                variant="solid"
                                aria-hidden="true"
                              />
                              <div className="cms-drive__card-head-text">
                                <p
                                  className="cms-drive__card-name"
                                  title={obj.filename}
                                >
                                  {obj.filename}
                                </p>
                                <p className="cms-drive__card-sub">
                                  {formatBytes(obj.size)}
                                  <span aria-hidden>·</span>
                                  {formatDate(obj.lastModified)}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="cms-drive__card-more"
                                aria-label={`Actions for ${obj.filename}`}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={openPreview}>
                                  <Eye className="size-4" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(
                                      obj.url,
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                >
                                  <Download className="size-4" />
                                  Open / download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={deleting === obj.key}
                                  onClick={() => void deleteObject(obj)}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </header>
                          <div
                            className="cms-drive__card-preview"
                            aria-hidden
                          >
                            <div className="cms-drive__card-cover">
                              {isVideo ? (
                                <video
                                  src={obj.url}
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              ) : isImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={obj.url} alt="" loading="lazy" />
                              ) : (
                                <FileType
                                  type={getFileType(obj.filename)}
                                  size="xl"
                                  variant="solid"
                                />
                              )}
                            </div>
                          </div>
                        </article>
                      </ArcContextMenuTrigger>
                      <ArcContextMenuContent>
                        <ArcContextMenuItem
                          icon={<Eye className="size-4" />}
                          onSelect={() => setPreview(obj)}
                        >
                          Preview
                        </ArcContextMenuItem>
                        <ArcContextMenuItem
                          icon={<Download className="size-4" />}
                          onSelect={() =>
                            window.open(obj.url, "_blank", "noopener,noreferrer")
                          }
                        >
                          Open / download
                        </ArcContextMenuItem>
                        <ArcContextMenuSeparator />
                        <ArcContextMenuItem
                          destructive
                          disabled={deleting === obj.key}
                          icon={<Trash2 className="size-4" />}
                          onSelect={() => void deleteObject(obj)}
                        >
                          Delete
                        </ArcContextMenuItem>
                      </ArcContextMenuContent>
                    </ArcContextMenu>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="cms-drive__table-wrap">
                <table className="cms-drive__table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folders.map((f) => (
                      <ArcContextMenu key={f.key}>
                        <ArcContextMenuTrigger asChild>
                          <tr
                            data-drive-key={f.key}
                            className={cn(
                              "is-folder",
                              selected.has(f.key) && "is-selected"
                            )}
                            onMouseDown={(e) => {
                              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                e.preventDefault();
                              }
                            }}
                            onClick={(e) => onItemSelect(f.key, e)}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              openItem(f.key);
                            }}
                          >
                            <td>
                              <div className="cms-drive__name-cell">
                                <FolderIcon
                                  color={folderDisplayColor(f)}
                                  size={28}
                                  variant="layered"
                                />
                                <span className="font-medium">{f.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="cms-drive__type-pill">
                                Folder
                              </span>
                            </td>
                            <td className="cms-drive__muted tabular-nums">
                              {folderSizeLabel(f)}
                            </td>
                          </tr>
                        </ArcContextMenuTrigger>
                        <FolderActionsMenu
                          folder={f}
                          colorSaving={colorSaving === f.key}
                          onOpen={() => openItem(f.key)}
                          onColor={(color) => void setFolderColor(f, color)}
                          onDelete={() => void askDeleteFolder(f)}
                        />
                      </ArcContextMenu>
                    ))}
                    {objects.map((obj) => (
                      <ArcContextMenu key={obj.key}>
                        <ArcContextMenuTrigger asChild>
                          <tr
                            data-drive-key={obj.key}
                            className={cn(
                              "cms-drive__file-row",
                              selected.has(obj.key) && "is-selected"
                            )}
                            onMouseDown={(e) => {
                              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                e.preventDefault();
                              }
                            }}
                            onClick={(e) => onItemSelect(obj.key, e)}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              setPreview(obj);
                            }}
                          >
                            <td>
                              <div className="cms-drive__name-cell cms-drive__name-cell--file">
                                <FileType
                                  type={getFileType(obj.filename)}
                                  size="sm"
                                  variant="solid"
                                />
                                <div className="min-w-0 text-left">
                                  <p className="truncate font-medium">
                                    {obj.filename}
                                  </p>
                                  <p className="cms-drive__muted text-xs">
                                    {formatDate(obj.lastModified)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cms-drive__type-pill">
                                {categoryLabel(obj.filename)}
                              </span>
                            </td>
                            <td className="cms-drive__muted tabular-nums">
                              {formatBytes(obj.size)}
                            </td>
                          </tr>
                        </ArcContextMenuTrigger>
                        <ArcContextMenuContent>
                          <ArcContextMenuItem
                            icon={<Eye className="size-4" />}
                            onSelect={() => setPreview(obj)}
                          >
                            Preview
                          </ArcContextMenuItem>
                          <ArcContextMenuItem
                            icon={<Download className="size-4" />}
                            onSelect={() =>
                              window.open(
                                obj.url,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            Open / download
                          </ArcContextMenuItem>
                          <ArcContextMenuSeparator />
                          <ArcContextMenuItem
                            destructive
                            disabled={deleting === obj.key}
                            icon={<Trash2 className="size-4" />}
                            onSelect={() => void deleteObject(obj)}
                          >
                            Delete
                          </ArcContextMenuItem>
                        </ArcContextMenuContent>
                      </ArcContextMenu>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ArcContextMenuTrigger>
        <ArcContextMenuContent>
          <ArcContextMenuItem
            icon={<FolderPlus className="size-4" />}
            onSelect={() => setMkdirOpen(true)}
          >
            New folder
          </ArcContextMenuItem>
          <ArcContextMenuSeparator />
          <ArcContextMenuItem
            icon={<Upload className="size-4" />}
            onSelect={() => photoRef.current?.click()}
          >
            Upload photos / video
          </ArcContextMenuItem>
          <ArcContextMenuItem
            icon={<Upload className="size-4" />}
            onSelect={() => fileRef.current?.click()}
          >
            Upload files
          </ArcContextMenuItem>
          <ArcContextMenuSeparator />
          <ArcContextMenuItem
            icon={<RefreshCw className="size-4" />}
            onSelect={() => void load(prefix)}
          >
            Refresh
          </ArcContextMenuItem>
        </ArcContextMenuContent>
      </ArcContextMenu>

      <R2UploadQueue
        files={queue}
        onRemove={removeFromQueue}
        onRetry={retryUpload}
        onClearDone={() =>
          setQueue((q) => q.filter((f) => f.status !== "done"))
        }
      />

      {folderDelete ? (
        <div
          className="cms-drive__dialog-scrim"
          role="presentation"
          onClick={() => {
            if (!folderDelete.deleting) setFolderDelete(null);
          }}
        >
          <div
            className="cms-drive__dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cms-drive-del-title"
            aria-describedby="cms-drive-del-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cms-drive__dialog-icon" aria-hidden>
              <FolderIcon
                color={folderDisplayColor(folderDelete.folder)}
                size={44}
                variant="open"
              />
            </div>
            <h2 id="cms-drive-del-title" className="cms-drive__dialog-title">
              Delete “{folderDelete.folder.name}”?
            </h2>
            <p id="cms-drive-del-desc" className="cms-drive__dialog-body">
              {folderDelete.loading ? (
                <>Checking what’s inside this folder…</>
              ) : folderDelete.fileCount === 0 ? (
                <>
                  This folder is empty. Removing it only deletes the folder
                  itself.
                </>
              ) : (
                <>
                  Everything inside will be permanently removed from R2 —
                  including{" "}
                  <strong>
                    {folderDelete.fileCount}{" "}
                    {folderDelete.fileCount === 1 ? "file" : "files"}
                  </strong>{" "}
                  ({formatBytes(folderDelete.totalSize)}). Subfolders are
                  deleted too. This cannot be undone.
                </>
              )}
            </p>
            {!folderDelete.loading && folderDelete.samples.length > 0 ? (
              <ul className="cms-drive__dialog-samples">
                {folderDelete.samples.map((name) => (
                  <li key={name}>{name}</li>
                ))}
                {folderDelete.fileCount > folderDelete.samples.length ? (
                  <li className="is-more">
                    +{folderDelete.fileCount - folderDelete.samples.length} more
                  </li>
                ) : null}
              </ul>
            ) : null}
            <div className="cms-drive__dialog-actions">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={folderDelete.deleting}
                onClick={() => setFolderDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={folderDelete.loading || folderDelete.deleting}
                onClick={() => void confirmDeleteFolder()}
              >
                {folderDelete.deleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    Delete forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <R2FilePreview file={preview} onClose={() => setPreview(null)} />
      ) : null}
    </div>
  );
}
