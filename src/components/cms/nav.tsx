"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "webport-cms-sidebar-collapsed";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        href: "/cms",
        label: "Dashboard",
        match: "dashboard" as const,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4.5 4.5h6.5v6.5H4.5zM13 4.5h6.5v4H13zM13 11h6.5v8.5H13zM4.5 13.5h6.5v6H4.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/cms/projects",
        label: "Projects",
        match: "projects" as const,
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
    ],
  },
];

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCollapse() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isActive(pathname: string, item: (typeof NAV_SECTIONS)[number]["items"][number]) {
  if (item.match === "dashboard") {
    return pathname === "/cms" || pathname === "/cms/";
  }
  if (item.match === "projects") return pathname.startsWith("/cms/projects");
  return false;
}

function NavList({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_SECTIONS.map((section, index) => (
        <div
          key={section.label}
          className={`cms-nav-section${index > 0 ? " has-rule" : ""}`}
        >
          <p className={`cms-nav-section-label${collapsed ? " is-collapsed" : ""}`}>
            {collapsed ? section.label.slice(0, 3) : section.label}
          </p>
          <div className="cms-nav-items">
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`cms-nav-link${active ? " is-active" : ""}${
                    collapsed ? " is-collapsed" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  {active ? <span className="cms-nav-rail" aria-hidden /> : null}
                  <span className="cms-nav-icon">{item.icon}</span>
                  {!collapsed ? <span className="cms-nav-text">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function CmsNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function renderChrome(collapsedBar: boolean, onNavigate?: () => void) {
    return (
      <>
        <div className={`cms-sidebar-head${collapsedBar ? " is-collapsed" : ""}`}>
          {collapsedBar ? (
            <button
              type="button"
              className="cms-brand-mark"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand"
            >
              s
            </button>
          ) : (
            <>
              <Link href="/cms" className="cms-brand-mark" aria-label="ShiftBOi CMS" onClick={onNavigate}>
                s
              </Link>
              <div className="cms-brand-copy">
                <p className="cms-brand-title">ShiftBOi</p>
                <p className="cms-brand-sub">CMS</p>
              </div>
              <button
                type="button"
                className="cms-sidebar-icon-btn cms-sidebar-collapse"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                title="Collapse"
              >
                <IconCollapse />
              </button>
            </>
          )}
        </div>

        <nav className="cms-nav-links" aria-label="CMS">
          <NavList pathname={pathname} collapsed={collapsedBar} onNavigate={onNavigate} />
        </nav>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="cms-mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <IconMenu />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="cms-mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`cms-sidebar cms-sidebar-mobile${mobileOpen ? " is-open" : ""}`}
        aria-label="CMS navigation"
      >
        <div className="cms-sidebar-head">
          <Link href="/cms" className="cms-brand-mark" aria-label="ShiftBOi CMS" onClick={() => setMobileOpen(false)}>
            s
          </Link>
          <div className="cms-brand-copy">
            <p className="cms-brand-title">ShiftBOi</p>
            <p className="cms-brand-sub">CMS</p>
          </div>
          <button
            type="button"
            className="cms-sidebar-icon-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <IconClose />
          </button>
        </div>
        <nav className="cms-nav-links" aria-label="CMS">
          <NavList pathname={pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </nav>
      </aside>

      <aside
        className={`cms-sidebar cms-sidebar-desktop${collapsed ? " is-collapsed" : ""}`}
        aria-label="CMS navigation"
      >
        {renderChrome(collapsed)}
      </aside>
    </>
  );
}
