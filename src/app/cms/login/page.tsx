import { Suspense } from "react";
import Link from "next/link";
import { CmsLoginForm } from "@/components/cms/login-form";

export const metadata = {
  title: "CMS Login",
};

export default function CmsLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="mb-8 w-full max-w-md">
        <Link
          href="/"
          className="text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)] hover:text-white"
        >
          ← Back to site
        </Link>
        <h1 className="mt-4 text-[length:var(--font-size-4xl)] tracking-tight">
          CMS sign in
        </h1>
      </div>
      <Suspense fallback={<p className="token-muted">Loading…</p>}>
        <CmsLoginForm />
      </Suspense>
    </main>
  );
}
