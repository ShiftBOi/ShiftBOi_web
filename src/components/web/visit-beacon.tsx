"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function VisitBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/cms")) return;
    if (last.current === pathname) return;
    last.current = pathname;

    const ctrl = new AbortController();
    void fetch("/api/analytics/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
      signal: ctrl.signal,
    }).catch(() => {
      // ignore offline / aborted
    });

    return () => ctrl.abort();
  }, [pathname]);

  return null;
}
