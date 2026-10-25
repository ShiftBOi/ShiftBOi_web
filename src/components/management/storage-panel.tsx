"use client";

import { R2DriveBrowser } from "@/components/management/r2-drive-browser";

export function StoragePanel() {
  return (
    <div className="cms-system">
      <header className="cms-system__head">
        <div>
          <p className="cms-eyebrow">Storage</p>
          <h1 className="cms-title">R2 Drive</h1>
          <p className="cms-subtitle">
            Browse, upload, and manage files on Cloudflare R2.
          </p>
        </div>
      </header>

      <div className="cms-system__tabs" role="tablist" aria-label="Storage">
        <button
          type="button"
          role="tab"
          aria-selected
          className="cms-system__tab is-active"
        >
          Storage
        </button>
      </div>

      <div className="cms-system__panel">
        <R2DriveBrowser />
      </div>
    </div>
  );
}
