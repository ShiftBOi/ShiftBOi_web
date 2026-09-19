"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useCmsTheme } from "@/components/cms/theme-provider";

const links = [
  { href: "/cms", label: "Overview" },
  { href: "/cms/projects", label: "Projects" },
  { href: "/cms/settings", label: "Passkeys" },
];

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2.2M12 19.8V22M4.2 12H2M22 12h-2.2M5.05 5.05l1.56 1.56M17.39 17.39l1.56 1.56M18.95 5.05l-1.56 1.56M6.61 17.39l-1.56 1.56"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.5 14.3A8.2 8.2 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 4H6.8A2.8 2.8 0 0 0 4 6.8v10.4A2.8 2.8 0 0 0 6.8 20H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 16.5 18.5 12 14 7.5M8.5 12h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CmsNav({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useCmsTheme();

  async function signOut() {
    await authClient.signOut();
    router.replace("/cms/login");
    router.refresh();
  }

  return (
    <aside className="cms-sidebar">
      <Link href="/cms" className="cms-brand">
        <span className="cms-brand-mark" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </span>
        ShiftBOi CMS
      </Link>
      <p className="cms-sidebar-email">{email}</p>

      <button
        type="button"
        className="cms-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <IconSun /> : <IconMoon />}
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <nav aria-label="CMS" className="cms-nav-links">
        {links.map((link) => {
          const active =
            link.href === "/cms"
              ? pathname === "/cms"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`cms-nav-link${active ? " is-active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="cms-sidebar-footer">
        <Link href="/">View site</Link>
        <button
          type="button"
          className="cms-logout-btn"
          onClick={signOut}
          aria-label="Sign out"
        >
          <IconLogout />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
