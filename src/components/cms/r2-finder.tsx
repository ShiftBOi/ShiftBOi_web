"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/cms-storage-format";

type FolderRow = { key: string; name: string };
type ObjectRow = {
  key: string;
  url: string;
  size: number;
  filename: string;
};

export function R2Finder({
  open,
  onClose,
  onSelect,
  folder = "cms",
  title = "Choose media",
  accept = "image/*,video/*",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder?: string;
  title?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [prefix, setPrefix] = useState(folder.endsWith("/") ? folder : `${folder}/`);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [objects, setObjects] = useState<ObjectRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPrefix: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cms/storage?mode=browse&prefix=${encodeURIComponent(nextPrefix)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Browse failed");
      setFolders(json.data.folders || []);
      setObjects(json.data.objects || []);
      setPrefix(nextPrefix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Browse failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const start = folder ? (folder.endsWith("/") ? folder : `${folder}/`) : "";
    void load(start);
  }, [open, folder, load]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      let lastUrl = "";
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        form.set("folder", prefix.replace(/\/$/, "") || "cms");
        const res = await fetch("/api/cms/storage", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        lastUrl = json.data.url;
      }
      if (lastUrl) onSelect(lastUrl);
      await load(prefix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!open) return null;

  return (
    <div className="cms-finder-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cms-finder"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cms-finder-head">
          <h2 className="cms-finder-title">{title}</h2>
          <button type="button" className="cms-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="cms-drive-toolbar">
          <button type="button" className="cms-btn" disabled={!prefix} onClick={() => {
            const parts = prefix.replace(/\/$/, "").split("/").filter(Boolean);
            parts.pop();
            void load(parts.length ? `${parts.join("/")}/` : "");
          }}>
            Up
          </button>
          <button
            type="button"
            className="cms-btn cms-btn-primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Upload
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            hidden
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <span className="cms-drive-summary">{busy ? "Loading…" : prefix || "root"}</span>
        </div>
        {error ? <p className="cms-error">{error}</p> : null}
        <div className="cms-drive-grid" style={{ overflow: "auto" }}>
          {folders.map((folderRow) => (
            <button
              key={folderRow.key}
              type="button"
              className="cms-drive-item"
              onClick={() => void load(folderRow.key)}
            >
              <div className="cms-drive-thumb">Folder</div>
              <p className="cms-drive-name">{folderRow.name}</p>
            </button>
          ))}
          {objects.map((obj) => (
            <button
              key={obj.key}
              type="button"
              className="cms-drive-item"
              onClick={() => onSelect(obj.url)}
            >
              <div className="cms-drive-thumb">
                {/\.(mp4|webm|mov)(\?|$)/i.test(obj.url) ? (
                  <video src={obj.url} muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={obj.url} alt="" />
                )}
              </div>
              <p className="cms-drive-name">{obj.filename}</p>
              <p className="cms-drive-meta">{formatBytes(obj.size)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
