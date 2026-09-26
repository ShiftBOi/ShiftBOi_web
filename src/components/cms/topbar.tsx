"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useCmsTheme } from "@/components/cms/theme-provider";
import { useCmsChat } from "@/components/cms/chat-context";
import { BloubFace } from "@/components/cms/bloub-face";

const TITLES: Array<{ match: (path: string) => boolean; title: string; eyebrow: string }> = [
  { match: (p) => p === "/cms" || p === "/cms/", title: "Dashboard", eyebrow: "Overview" },
  { match: (p) => p.startsWith("/cms/projects"), title: "Projects", eyebrow: "Content" },
];

export function CmsTopbar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useCmsTheme();
  const { open: chatOpen, toggleChat } = useCmsChat();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const meta = TITLES.find((t) => t.match(pathname)) ?? {
    title: "CMS",
    eyebrow: "ShiftBOi",
  };

  const isProjectDetail = /^\/cms\/projects\/[^/]+$/.test(pathname);
  const display = isProjectDetail
    ? { eyebrow: "Projects", title: "Edit project" }
    : meta;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function signOut() {
    await authClient.signOut();
    router.replace("/cms/login");
    router.refresh();
  }

  const initial = (email.slice(0, 1) || "A").toUpperCase();

  return (
    <header className="cms-topbar">
      <div className="cms-topbar-copy">
        <p className="cms-topbar-eyebrow">{display.eyebrow}</p>
        <h1 className="cms-topbar-title">{display.title}</h1>
      </div>

      <div className="cms-topbar-actions">
        <button
          type="button"
          className={`cms-sidebar-icon-btn cms-bloub-btn${chatOpen ? " is-active" : ""}`}
          onClick={toggleChat}
          aria-label={chatOpen ? "Close assistant" : "Open assistant"}
          aria-pressed={chatOpen}
          title={chatOpen ? "Close assistant" : "Assistant"}
        >
          <BloubFace size={24} active={chatOpen} />
        </button>

        <button
          type="button"
          className="cms-sidebar-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light" : "Dark"}
        >
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M12 2.5v2M12 19.5V22M4.5 12H2.5M21.5 12h-2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M20.2 14.1A8 8 0 0 1 9.9 3.8 8.3 8.3 0 1 0 20.2 14.1Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="cms-user-menu" ref={menuRef}>
          <button
            type="button"
            className="cms-user-trigger"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="cms-sidebar-avatar" aria-hidden>
              {initial}
            </span>
            <span className="cms-user-chevron" aria-hidden>
              ▾
            </span>
          </button>

          {open ? (
            <div className="cms-user-dropdown" role="menu">
              <p className="cms-user-email">{email}</p>
              <Link href="/" className="cms-user-item" role="menuitem">
                View site
              </Link>
              <button
                type="button"
                className="cms-user-item is-danger"
                role="menuitem"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
