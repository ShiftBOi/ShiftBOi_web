"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useCmsTheme } from "@/components/cms/theme-provider";

const links = [
  {
    href: "/cms",
    label: "Overview",
    exact: true as const,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 10.5 12 4.5l7.5 6V19a1.5 1.5 0 0 1-1.5 1.5h-3.2v-5.2h-5.6v5.2H6A1.5 1.5 0 0 1 4.5 19v-8.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/cms/projects",
    label: "Projects",
    id: "projects" as const,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 7.5h14v11H5zM8 7.5V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8v1.7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/cms/settings",
    label: "Passkeys",
    id: "settings" as const,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3.5 4.8 7v5.2c0 4.4 3 8.1 7.2 9.3 4.2-1.2 7.2-4.9 7.2-9.3V7L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2.5v2M12 19.5V22M4.5 12H2.5M21.5 12h-2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.2 14.1A8 8 0 0 1 9.9 3.8 8.3 8.3 0 1 0 20.2 14.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 5.5H7A1.5 1.5 0 0 0 5.5 7v10A1.5 1.5 0 0 0 7 18.5h3M13 12h7.5M17.5 8.5 21 12l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSite() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 12h15M12 4.5c2.4 2.6 2.4 12.4 0 15M12 4.5c-2.4 2.6-2.4 12.4 0 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isLinkActive(pathname: string, link: (typeof links)[number]) {
  if ("exact" in link && link.exact) return pathname === "/cms";
  if ("id" in link && link.id === "projects") return pathname.startsWith("/cms/projects");
  if ("id" in link && link.id === "settings") return pathname.startsWith("/cms/settings");
  return false;
}

export function CmsNav({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useCmsTheme();
  const reduceMotion = useReducedMotion();

  async function signOut() {
    await authClient.signOut();
    router.replace("/cms/login");
    router.refresh();
  }

  return (
    <aside className="cms-sidebar" aria-label="CMS navigation">
      <Link href="/cms" className="cms-brand-mark" aria-label="shiftboi home">
        s
      </Link>

      <LayoutGroup id="cms-sidebar-nav">
        <nav aria-label="CMS" className="cms-nav-links">
          {links.map((link) => {
            const isActive = isLinkActive(pathname, link);

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`cms-nav-link${isActive ? " is-active" : ""}`}
                aria-label={link.label}
                title={link.label}
              >
                {isActive ? (
                  <motion.span
                    layoutId="cms-nav-active-pill"
                    className="cms-nav-pill"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            type: "tween",
                            duration: 0.45,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                    aria-hidden
                  />
                ) : null}
                <span className="cms-nav-icon">{link.icon}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="cms-sidebar-footer">
        <button
          type="button"
          className="cms-nav-link cms-nav-action"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light" : "Dark"}
        >
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
        <Link
          href="/"
          className="cms-nav-link cms-nav-action"
          aria-label="View site"
          title="View site"
        >
          <IconSite />
        </Link>
        <button
          type="button"
          className="cms-nav-link cms-nav-action"
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <IconLogout />
        </button>
        <span className="cms-sidebar-email" title={email}>
          {email.slice(0, 1).toUpperCase()}
        </span>
      </div>
    </aside>
  );
}
