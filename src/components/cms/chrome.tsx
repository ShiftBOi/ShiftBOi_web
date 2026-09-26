"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useCmsTheme } from "@/components/cms/theme-provider";

const MENU = [
  {
    href: "/cms/projects",
    label: "Projects",
    match: (p: string) => p.startsWith("/cms/projects"),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 7.5h14v11H5zM8 7.5V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8v1.7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/cms/site",
    label: "Site",
    match: (p: string) => p.startsWith("/cms/site"),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M4.5 12h15M12 4.5c2.4 2.6 2.4 12.4 0 15M12 4.5c-2.4 2.6-2.4 12.4 0 15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/cms/settings",
    label: "Passkeys",
    match: (p: string) => p.startsWith("/cms/settings"),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3.5 4.8 7v5.2c0 4.4 3 8.1 7.2 9.3 4.2-1.2 7.2-4.9 7.2-9.3V7L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function crumbsFor(pathname: string): Array<{ label: string; href?: string }> {
  if (pathname.startsWith("/cms/projects/") && pathname !== "/cms/projects") {
    return [
      { label: "Projects", href: "/cms/projects" },
      { label: "Edit" },
    ];
  }
  if (pathname.startsWith("/cms/projects")) {
    return [{ label: "Projects" }];
  }
  if (pathname.startsWith("/cms/site")) {
    return [{ label: "Site" }];
  }
  if (pathname.startsWith("/cms/settings")) {
    return [{ label: "Passkeys" }];
  }
  return [{ label: "CMS" }];
}

export function CmsChrome({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useCmsTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const crumbs = crumbsFor(pathname);
  const initial = (email.slice(0, 1) || "A").toUpperCase();

  useEffect(() => {
    setMenuOpen(false);
    setClosing(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setUserOpen(false);
        if (menuOpen) closeMenu();
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function closeMenu() {
    setClosing(true);
    window.setTimeout(() => {
      setMenuOpen(false);
      setClosing(false);
    }, 180);
  }

  function toggleMenu() {
    if (menuOpen) closeMenu();
    else setMenuOpen(true);
  }

  async function signOut() {
    await authClient.signOut();
    router.replace("/cms/login");
    router.refresh();
  }

  const showTabs = menuOpen || closing;

  return (
    <div className="cms-chrome">
      <nav ref={rootRef} className="cms-crumb" aria-label="CMS">
        <button
          type="button"
          className={`cms-crumb-icon-btn${menuOpen ? " is-open" : ""}`}
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <span className="cms-crumb-rule" aria-hidden />

        {showTabs ? (
          <div className={`cms-crumb-tabs${closing ? " is-closing" : ""}`}>
            {MENU.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`cms-crumb-tab${active ? " is-active" : ""}`}
                  onClick={closeMenu}
                  title={item.label}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <span className="cms-crumb-rule" aria-hidden />
          </div>
        ) : null}

        <div className="cms-crumb-trail">
          {crumbs.map((item, index) => {
            const last = index === crumbs.length - 1;
            return (
              <span key={`${item.label}-${index}`} className="cms-crumb-trail-item">
                {index > 0 ? (
                  <span className="cms-crumb-sep" aria-hidden>
                    /
                  </span>
                ) : null}
                {item.href && !last ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span className={last ? "is-current" : undefined}>{item.label}</span>
                )}
              </span>
            );
          })}
        </div>

        <span className="cms-crumb-rule" aria-hidden />

        <button
          type="button"
          className="cms-crumb-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Light theme" : "Dark theme"}
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

        <div className="cms-user-menu">
          <button
            type="button"
            className="cms-user-trigger"
            aria-expanded={userOpen}
            aria-haspopup="menu"
            onClick={() => setUserOpen((v) => !v)}
          >
            <span className="cms-sidebar-avatar" aria-hidden>
              {initial}
            </span>
          </button>
          {userOpen ? (
            <div className="cms-user-dropdown" role="menu">
              <p className="cms-user-email">{email}</p>
              <Link href="/cms/settings" className="cms-user-item" role="menuitem">
                Passkeys
              </Link>
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
      </nav>
    </div>
  );
}
