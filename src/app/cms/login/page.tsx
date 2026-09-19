import { Suspense } from "react";
import Link from "next/link";
import { CmsLoginForm } from "@/components/cms/login-form";

export const metadata = {
  title: "CMS Login",
};

export default function CmsLoginPage() {
  return (
    <main className="cms-login-page">
      <div className="cms-login-orb cms-login-orb-a" aria-hidden />
      <div className="cms-login-orb cms-login-orb-b" aria-hidden />
      <div className="cms-login-orb cms-login-orb-c" aria-hidden />

      <div className="cms-login-frame">
        <div className="cms-login-topbar">
          <Link href="/" className="cms-login-back">
            ← Back to site
          </Link>
        </div>

        <div className="cms-login-glass">
          <Suspense fallback={<p className="cms-empty">Loading…</p>}>
            <CmsLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
