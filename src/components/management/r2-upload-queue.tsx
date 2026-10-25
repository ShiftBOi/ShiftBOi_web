"use client";

import {
  FileType,
  getFileType,
} from "@/components/reui/file-type";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { cn } from "cn";
import { ChevronDown, ChevronUp, RotateCwIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type UploadQueueItem = {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "failed";
  folder?: string;
  error?: string;
};

function formatSize(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function R2UploadQueue({
  files,
  onRemove,
  onRetry,
  onClearDone,
}: {
  files: UploadQueueItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onClearDone?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const done = useMemo(
    () => files.filter((f) => f.status === "done").length,
    [files]
  );
  const failed = useMemo(
    () => files.filter((f) => f.status === "failed").length,
    [files]
  );
  const uploading = useMemo(
    () => files.filter((f) => f.status === "uploading").length,
    [files]
  );

  useEffect(() => {
    if (files.length > 0) {
      setOpen(true);
      setMinimized(false);
    }
  }, [files.length]);

  if (!open || files.length === 0) return null;

  return (
    <div className="cms-upload-dock" role="dialog" aria-label="Uploads">
      <header className="cms-upload-dock__head">
        <div>
          <p className="cms-upload-dock__title">Uploads</p>
          <p className="cms-upload-dock__summary">
            {files.length === 0
              ? "No files in the queue."
              : `${done} of ${files.length} uploaded${
                  failed ? `, ${failed} failed` : ""
                }${uploading ? ` · ${uploading} in progress` : ""}`}
          </p>
        </div>
        <div className="cms-upload-dock__head-actions">
          {done > 0 && onClearDone ? (
            <button
              type="button"
              className="cms-upload-dock__text-btn"
              onClick={onClearDone}
            >
              Clear done
            </button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={minimized ? "Expand uploads" : "Minimize uploads"}
            onClick={() => setMinimized((v) => !v)}
          >
            {minimized ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close uploads"
            onClick={() => setOpen(false)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </header>

      {!minimized ? (
        <ItemGroup aria-label="Upload queue" className="cms-upload-dock__list">
          {files.map((file) => (
            <Item
              key={file.id}
              role="listitem"
              variant="outline"
              size="sm"
              className="cms-upload-dock__item"
            >
              <ItemMedia>
                <FileType
                  type={getFileType(file.type || file.name)}
                  size="sm"
                  aria-hidden="true"
                />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="max-w-full">
                  <span className="truncate" title={file.name}>
                    {file.name}
                  </span>
                </ItemTitle>
                {file.status === "uploading" ? (
                  <div className="flex h-4 items-center gap-2">
                    <Progress
                      value={file.progress}
                      aria-label={`Uploading ${file.name}`}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                      {file.progress}%
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs leading-4">
                    {formatSize(file.size)}
                    <span
                      aria-hidden="true"
                      className="bg-muted-foreground/40 mx-1.5 inline-block size-1 rounded-full align-middle"
                    />
                    {file.status === "done" ? (
                      "Uploaded"
                    ) : (
                      <span className="text-destructive">
                        Failed at {file.progress}%
                      </span>
                    )}
                  </p>
                )}
              </ItemContent>
              <ItemActions>
                {file.status === "failed" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Retry upload of ${file.name}`}
                    onClick={() => onRetry(file.id)}
                  >
                    <RotateCwIcon aria-hidden="true" />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    file.status === "uploading"
                      ? `Cancel upload of ${file.name}`
                      : `Remove ${file.name}`
                  }
                  onClick={() => onRemove(file.id)}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : null}

      {minimized && uploading > 0 ? (
        <div className={cn("cms-upload-dock__mini-bar")}>
          <Progress value={Math.round((done / files.length) * 100)} />
        </div>
      ) : null}
    </div>
  );
}
