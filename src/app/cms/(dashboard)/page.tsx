import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "CMS",
};

export default async function CmsHomePage() {
  const [projectCount, publishedCount, passkeyCount] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { published: true } }),
    prisma.passkey.count(),
  ]);

  return (
    <div>
      <h1 className="text-[length:var(--font-size-4xl)] tracking-tight">Overview</h1>
      <p className="mt-3 max-w-xl text-[length:var(--font-size-lg)] text-[var(--color-text-inverse)]">
        Manage portfolio content. Auth is OTP + passkey only for the allowlisted
        admin email.
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          ["Projects", projectCount],
          ["Published", publishedCount],
          ["Passkeys", passkeyCount],
        ].map(([label, value]) => (
          <div key={label as string} className="border-t border-[var(--color-border-default)] pt-4">
            <dt className="text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
              {label}
            </dt>
            <dd className="mt-2 text-[length:var(--font-size-4xl)] tracking-tight">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/cms/projects"
          className="min-h-11 border border-white bg-white px-5 text-[length:var(--font-size-lg)] leading-[2.75rem] text-black"
        >
          Manage projects
        </Link>
        <Link
          href="/cms/settings"
          className="min-h-11 border border-[var(--color-border-default)] px-5 text-[length:var(--font-size-lg)] leading-[2.75rem]"
        >
          Register passkey
        </Link>
      </div>
    </div>
  );
}
