"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { INTRO_EXIT_MS } from "./site-loading-timing";
import styles from "./site-loading-overlay.module.css";

type Props = {
  label?: string;
  eyebrow?: string;
  open?: boolean;
  leaving?: boolean;
  onSkip?: () => void;
  className?: string;
};

/** Shared by the initial boot sequence, Next's route fallback and the design preview. */
export function SiteLoadingOverlay({
  label = "ShiftBOi",
  eyebrow = "Ideas into experiences.",
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
    // Only the boot intro is modal; the route fallback remains a polite status.
    const siblings = interactive
      ? Array.from(root.parentElement?.children ?? []).filter(
          (element): element is HTMLElement => element instanceof HTMLElement
            && element !== root && !["SCRIPT", "STYLE", "LINK"].includes(element.tagName),
        )
      : [];
    const originalInert = siblings.map((element) => element.inert);
    siblings.forEach((element) => { element.inert = true; });
    if (interactive) root.focus({ preventScroll: true });
    return () => {
      siblings.forEach((element, index) => { element.inert = originalInert[index]; });
      if (interactive && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
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
      <div className={styles.panels} aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={styles.panel} style={{ "--order": index } as CSSProperties} />
        ))}
      </div>

      <div className={styles.scene}>
        <div className={styles.lockup}>
          <span className={styles.mark} aria-hidden>
            {[0, 1, 2, 3].map((index) => <i key={index} />)}
          </span>
          <p className={styles.title} aria-label={label}>
            {Array.from(label).map((letter, index) => (
              <span className={styles.letterMask} key={`${letter}-${index}`} aria-hidden>
                <span className={styles.letter} style={{ "--letter": index } as CSSProperties}>{letter === " " ? "\u00a0" : letter}</span>
              </span>
            ))}
          </p>
          <span className={styles.fullStop} aria-hidden />
        </div>
        <div className={styles.subtitleMask}><p className={styles.subtitle}>{eyebrow}</p></div>
      </div>

      <noscript><style>{"[data-site-loader]{display:none!important}"}</style></noscript>
    </div>
  );
}
