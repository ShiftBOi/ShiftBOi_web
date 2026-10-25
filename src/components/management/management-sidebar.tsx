"use client";

import { CmsAccountMenu } from "@/components/management/cms-account-menu";
import { CmsMark } from "@/components/management/cms-mark";
import { managementNav } from "@/components/management/nav";
import { cn } from "cn";
import { PanelLeft, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ManagementSidebar({
  user,
  onLogout,
  compact = false,
  mobileOpen = false,
  onMobileClose,
}: {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
  onLogout: () => void | Promise<unknown>;
  /** Phone / iPad layout — drawer instead of rail */
  compact?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // On compact devices always show full labels inside the drawer
  const railCollapsed = compact ? false : collapsed;

  useEffect(() => {
    if (compact) return;
    const saved = window.localStorage.getItem("cms-sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, [compact]);

  useEffect(() => {
    document.documentElement.dataset.cmsSidebar = railCollapsed
      ? "collapsed"
      : "open";
    if (compact) {
      document.documentElement.dataset.cmsNav = mobileOpen ? "open" : "closed";
    } else {
      delete document.documentElement.dataset.cmsNav;
    }
    return () => {
      delete document.documentElement.dataset.cmsSidebar;
      delete document.documentElement.dataset.cmsNav;
    };
  }, [railCollapsed, compact, mobileOpen]);

  useEffect(() => {
    if (compact) return;
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed((value) => {
          const next = !value;
          window.localStorage.setItem("cms-sidebar-collapsed", next ? "1" : "0");
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact]);

  useEffect(() => {
    if (!compact || !mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onMobileClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact, mobileOpen, onMobileClose]);

  function toggle() {
    if (compact) {
      onMobileClose?.();
      return;
    }
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("cms-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      id="cms-sidebar"
      className={cn(
        "cms-sidebar",
        railCollapsed && "is-collapsed",
        compact && "is-drawer",
        compact && mobileOpen && "is-drawer-open"
      )}
      aria-label="CMS navigation"
      aria-hidden={compact && !mobileOpen ? true : undefined}
    >
      <div className="cms-sidebar__brand">
        {railCollapsed ? (
          <Link
            href="/cms"
            className="cms-sidebar__mark-only"
            title="CMS"
          >
            <CmsMark className="cms-sidebar__logo" title="" />
          </Link>
        ) : (
          <Link href="/cms" className="cms-sidebar__brand-link">
            <CmsMark className="cms-sidebar__logo" title="" />
            <div className="min-w-0">
              <p className="cms-sidebar__eyebrow">Management</p>
              <p className="cms-sidebar__name">
                ShiftBOi
                <span className="cms-sidebar__tag">CMS</span>
              </p>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          title={
            compact
              ? "Close menu"
              : railCollapsed
                ? "Expand menu (⌘B)"
                : "Collapse menu (⌘B)"
          }
          className="cms-sidebar__icon-btn"
        >
          {compact ? (
            <X className="size-4" />
          ) : (
            <PanelLeft className="size-4" />
          )}
        </button>
      </div>

      <nav className="cms-sidebar__nav">
        {!railCollapsed ? (
          <p className="cms-sidebar__section">Platform</p>
        ) : null}
        {managementNav.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={cn("cms-sidebar__link", active && "is-active")}
              onClick={() => {
                if (compact) onMobileClose?.();
              }}
            >
              <Icon className="size-[1.05rem] shrink-0" strokeWidth={1.75} />
              {!railCollapsed ? <span>{item.title}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="cms-sidebar__foot">
        <CmsAccountMenu
          user={user}
          onLogout={onLogout}
          collapsed={railCollapsed}
        />
      </div>
    </aside>
  );
}
