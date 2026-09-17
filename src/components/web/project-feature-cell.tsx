"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react";

type Props = {
  href: string;
  title: string;
  body: string;
  children: ReactNode;
};

export function ProjectFeatureCell({ href, title, body, children }: Props) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <Link
      ref={rootRef}
      href={href}
      className={`hydra-feature-cell is-project-link${active ? " is-hot" : ""}`}
      data-hydra-stagger-item
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={onMove}
    >
      <h4 className="hydra-feature-title">{title}</h4>
      <p className="hydra-feature-body">{body}</p>
      <div className="hydra-feature-visual">{children}</div>
      <span
        className={`project-read-more${active ? " is-on" : ""}`}
        style={{ left: pos.x, top: pos.y }}
        aria-hidden
      >
        Read more
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h12M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
