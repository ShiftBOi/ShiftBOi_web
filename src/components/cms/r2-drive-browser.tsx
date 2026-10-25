"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCmsNotify } from "@/components/cms/cms-notify";
import { formatBytes } from "@/lib/cms-storage-format";

type FolderRow = {
  key: string;
  name: string;
  color: string | null;
  size: number;
  fileCount: number;
};

type ObjectRow = {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  filename: string;
  folder: string;
};

type BrowseData = {
  storage: "r2" | "local";
  prefix: string;
  folders: FolderRow[];
  objects: ObjectRow[];
};

type SummaryData = {
  totalFiles: number;
  totalSize: number;
  limitBytes: number;
  limitLabel: string;
  storage: string;
};

function isMedia(url: string) {
  return /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|mov)(\?|$)/i.test(url);
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function R2DriveBrowser() {
  const notify = useCmsNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [prefix, setPrefix] = useState("");
  const [data, setData] = useState<BrowseData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [selected, setSelected] = useState<ObjectRow | null>(null);
  const [preview, setPreview] = useState<ObjectRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (nextPrefix = prefix) => {
    setBusy(true);
    try {
      const [browseRes, summaryRes] = await Promise.all([
        fetch(`/api/cms/storage?mode=browse&prefix=${encodeURIComponent(nextPrefix)}`),
        fetch("/api/cms/storage?mode=summary"),
      ]);
      const browseJson = await browseRes.json();
      const summaryJson = await summaryRes.json();
      if (!browseRes.ok) throw new Error(browseJson.error || "Browse failed");
      setData(browseJson.data as BrowseData);
      if (summaryRes.ok) setSummary(summaryJson.data as SummaryData);
      setPrefix(nextPrefix);
      setSelected(null);
    } catch (err) {
      notify.error(
        "Storage unavailable",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setBusy(false);
    }
  }, [notify, prefix]);

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount
  }, []);

  const crumbs = [
    { label: "Root", prefix: "" },
    ...prefix
      .replace(/\/$/, "")
      .split("/")
      .filter(Boolean)
      .map((part, index, parts) => ({
        label: part,
        prefix: `${parts.slice(0, index + 1).join("/")}/`,
      })),
  ];

  async function createFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    const path = `${prefix}${name.trim().replace(/\/+/g, "-")}`;
    const res = await fetch("/api/cms/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mkdir", path }),
    });
    const json = await res.json();
    if (!res.ok) {
      notify.error("Could not create folder", json.error);
      return;
    }
    notify.success("Folder created");
    await load(prefix);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        form.set("folder", prefix.replace(/\/$/, "") || "cms");
        const res = await fetch("/api/cms/storage", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
      }
      notify.success(files.length === 1 ? "Uploaded" : `${files.length} files uploaded`);
      await load(prefix);
    } catch (err) {
      notify.error(
        "Upload failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeSelected() {
    if (!selected) return;
    const ok = await notify.confirm({
      title: "Delete this file?",
      description: selected.filename,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch("/api/cms/storage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: selected.key }),
    });
    const json = await res.json();
    if (!res.ok) {
      notify.error("Delete failed", json.error);
      return;
    }
    notify.success("Deleted");
    setPreview(null);
    await load(prefix);
  }

  async function removeFolder(folder: FolderRow) {
    const ok = await notify.confirm({
      title: "Delete this folder?",
      description: `${folder.name} and all nested files will be removed.`,
      confirmLabel: "Delete folder",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch("/api/cms/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-folder", path: folder.key }),
    });
    const json = await res.json();
    if (!res.ok) {
      notify.error("Delete failed", json.error);
      return;
    }
    notify.success("Folder deleted");
    await load(prefix);
  }

  return (
    <div className="cms-drive">
      <div className="cms-drive-toolbar">
        <div className="cms-drive-crumbs">
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.prefix}-${crumb.label}`}>
              {i > 0 ? " / " : null}
              <button
                type="button"
                className={`cms-drive-crumb${crumb.prefix === prefix ? " is-current" : ""}`}
                onClick={() => void load(crumb.prefix)}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
        <p className="cms-drive-summary">
          {summary
            ? `${summary.totalFiles} files · ${formatBytes(summary.totalSize)} / ${summary.limitLabel} · ${data?.storage || "…"}`
            : busy
              ? "Loading…"
              : ""}
        </p>
        <button type="button" className="cms-btn" disabled={busy} onClick={() => void load(prefix)}>
          Refresh
        </button>
        <button type="button" className="cms-btn" disabled={busy} onClick={() => void createFolder()}>
          New folder
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Upload
        </button>
        <button
          type="button"
          className="cms-btn is-danger"
          disabled={!selected || busy}
          onClick={() => void removeSelected()}
        >
          Delete
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => void uploadFiles(e.target.files)}
        />
      </div>

      {!data?.folders.length && !data?.objects.length ? (
        <div className="cms-drive-empty">
          {busy ? "Loading…" : "This folder is empty. Upload media or create a folder."}
        </div>
      ) : (
        <div className="cms-drive-grid">
          {data?.folders.map((folder) => (
            <button
              key={folder.key}
              type="button"
              className="cms-drive-item"
              onDoubleClick={() => void load(folder.key)}
              onClick={() => setSelected(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                void removeFolder(folder);
              }}
              title="Double-click to open · right-click to delete"
            >
              <div
                className="cms-drive-thumb"
                style={{
                  background: folder.color
                    ? `color-mix(in oklab, ${folder.color} 35%, var(--cms-paper-2))`
                    : undefined,
                }}
              >
                Folder
              </div>
              <p className="cms-drive-name">{folder.name}</p>
              <p className="cms-drive-meta">
                {folder.fileCount} files · {formatBytes(folder.size)}
              </p>
            </button>
          ))}
          {data?.objects.map((obj) => (
            <button
              key={obj.key}
              type="button"
              className={`cms-drive-item${selected?.key === obj.key ? " is-selected" : ""}`}
              onClick={() => setSelected(obj)}
              onDoubleClick={() => setPreview(obj)}
            >
              <div className="cms-drive-thumb">
                {isMedia(obj.url) ? (
                  isVideo(obj.url) ? (
                    <video src={obj.url} muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obj.url} alt="" />
                  )
                ) : (
                  "File"
                )}
              </div>
              <p className="cms-drive-name">{obj.filename}</p>
              <p className="cms-drive-meta">{formatBytes(obj.size)}</p>
            </button>
          ))}
        </div>
      )}

      {preview ? (
        <div className="cms-drive-preview-backdrop" role="presentation">
          <div className="cms-drive-preview">
            <div className="cms-drive-toolbar" style={{ marginBottom: "0.75rem" }}>
              <p className="cms-drive-name" style={{ marginRight: "auto" }}>
                {preview.filename}
              </p>
              <a className="cms-btn" href={preview.url} target="_blank" rel="noreferrer">
                Open
              </a>
              <button type="button" className="cms-btn" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            {isVideo(preview.url) ? (
              <video src={preview.url} controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={preview.filename} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
