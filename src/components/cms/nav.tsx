"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/cms", label: "Overview" },
  { href: "/cms/projects", label: "Projects" },
  { href: "/cms/settings", label: "Passkeys" },
];

export function CmsNav({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/cms/login");
    router.refresh();
  }

  return (
    <aside className="flex w-full flex-col border-b border-[var(--color-border-subtle)] px-5 py-5 md:min-h-screen md:w-56 md:border-b-0 md:border-r md:px-6">
      <Link href="/cms" className="text-[length:var(--font-size-xl)] tracking-tight">
        WebPort CMS
      </Link>
      <p className="mt-2 truncate text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
        {email}
      </p>
      <nav aria-label="CMS" className="mt-8 flex gap-3 md:flex-col">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[length:var(--font-size-md)] text-[var(--color-text-inverse)] transition-colors hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex gap-4 pt-8">
        <Link
          href="/"
          className="text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)] hover:text-white"
        >
          View site
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)] hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
