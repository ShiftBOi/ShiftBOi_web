"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { INTRO_EXIT_MS } from "./site-loading-timing";
import styles from "./site-loading-overlay.module.css";

type Props = {
  label?: string;
  open?: boolean;
  leaving?: boolean;
  onSkip?: () => void;
  className?: string;
};

/** Minimal boot / route splash — soft bg + centered mark + wordmark. */
export function SiteLoadingOverlay({
  label = "shiftboi",
  open = true,
  leaving = false,
  onSkip,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const interactive = Boolean(onSkip);

  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const previousFocus = document.activeElement;
    const siblings = interactive
      ? Array.from(root.parentElement?.children ?? []).filter(
          (element): element is HTMLElement =>
            element instanceof HTMLElement &&
            element !== root &&
            !["SCRIPT", "STYLE", "LINK"].includes(element.tagName),
        )
      : [];
    const originalInert = siblings.map((element) => element.inert);
    siblings.forEach((element) => {
      element.inert = true;
    });
    if (interactive) root.focus({ preventScroll: true });
    return () => {
      siblings.forEach((element, index) => {
        element.inert = originalInert[index]!;
      });
      if (
        interactive &&
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [open, interactive]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className={`${styles.overlay} ${className}`.trim()}
      style={{ "--exit-duration": `${INTRO_EXIT_MS}ms` } as CSSProperties}
      data-state={leaving ? "leaving" : "loading"}
      data-site-loader
      data-lenis-prevent
      role={interactive ? "dialog" : "status"}
      aria-modal={interactive || undefined}
      aria-label="Opening ShiftBOi"
      tabIndex={interactive ? -1 : undefined}
      onClick={onSkip}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (["Escape", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          onSkip?.();
        }
        if (event.key === "Tab") {
          event.preventDefault();
          rootRef.current?.focus();
        }
      }}
    >
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.haze} aria-hidden />

      <div className={styles.scene}>
        <div className={styles.lockup}>
          <span className={styles.mark} aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <p className={styles.title}>{label}</p>
        </div>
      </div>

      <noscript>
        <style>{"[data-site-loader]{display:none!important}"}</style>
      </noscript>
    </div>
  );
}
