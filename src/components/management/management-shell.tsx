"use client";

import { CmsChatPanel } from "@/components/cms/quick-chat";
import { CmsChatProvider, useCmsChat } from "@/components/cms/chat-context";
import { CmsTopbar } from "@/components/cms/topbar";
import {
  ResizablePanel,
  ResizablePanels,
} from "@/components/arc/resizable-panels/resizable-panels";
import { CmsNotifyProvider } from "@/components/management/cms-notify";
import { CmsScrollbar } from "@/components/management/cms-scrollbar";
import { CmsMark } from "@/components/management/cms-mark";
import { ManagementSidebar } from "@/components/management/management-sidebar";
import { cn } from "cn";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

const COMPACT_MQ = "(max-width: 1023px)";
const LAYOUT_KEY = "webport-cms-assist-share";
const DEFAULT_ASSIST_SHARE = 32;

function readAssistShare() {
  if (typeof window === "undefined") return DEFAULT_ASSIST_SHARE;
  try {
    const n = Number(localStorage.getItem(LAYOUT_KEY));
    if (Number.isFinite(n) && n >= 18 && n <= 55) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_ASSIST_SHARE;
}

function ShellStage({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="cms-shell__stage">
      <Suspense
        fallback={
          <header className="cms-topbar">
            <div className="cms-topbar-copy">
              <p className="cms-topbar-eyebrow">ShiftBOi</p>
              <h1 className="cms-topbar-title">CMS</h1>
            </div>
          </header>
        }
      >
        <CmsTopbar email={email} />
      </Suspense>

      <div className="cms-shell__main">
        <div ref={scrollRef} className="cms-shell__scroll">
          <div className="cms-shell__inner">{children}</div>
        </div>
        <CmsScrollbar scrollRef={scrollRef} />
      </div>
    </div>
  );
}

function ShellInner({
  user,
  children,
}: {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { open: chatOpen, closeChat } = useCmsChat();
  const [assistShare, setAssistShare] = useState(DEFAULT_ASSIST_SHARE);

  useEffect(() => {
    setAssistShare(readAssistShare());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_MQ);
    const sync = () => {
      const next = mq.matches;
      setCompact(next);
      if (!next) setNavOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!compact || !navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [compact, navOpen]);

  const onLayoutChange = useCallback(
    (sizes: number[]) => {
      const assist = sizes[1] ?? 0;
      // Drag/flick collapsed the assistant — fully close; reopen only via topbar.
      if (assist < 6) {
        // Defer unmount so the settle spring can finish without a hard cut.
        requestAnimationFrame(() => closeChat());
        return;
      }
      const next = Math.min(55, Math.max(18, Math.round(assist * 10) / 10));
      setAssistShare(next);
      try {
        localStorage.setItem(LAYOUT_KEY, String(next));
      } catch {
        /* ignore */
      }
    },
    [closeChat],
  );

  async function logout() {
    const { authClient } = await import("@/lib/auth-client");
    await authClient.signOut();
    router.push("/cms/login");
    router.refresh();
  }

  const stageShare = Math.max(45, 100 - assistShare);

  return (
    <div
      className={cn("cms-shell", navOpen && "is-nav-open", chatOpen && "has-chat")}
    >
      <header className="cms-shell__topbar">
        <button
          type="button"
          className="cms-shell__menu-btn"
          aria-label="Open menu"
          aria-expanded={navOpen}
          aria-controls="cms-sidebar"
          onClick={() => setNavOpen(true)}
        >
          <Menu className="size-[1.15rem]" strokeWidth={1.75} />
        </button>
        <Link href="/cms" className="cms-shell__topbar-brand">
          <CmsMark className="cms-shell__topbar-mark" title="" />
          <span className="cms-shell__topbar-title">
            ShiftBOi
            <span className="cms-shell__topbar-tag">CMS</span>
          </span>
        </Link>
      </header>

      {navOpen ? (
        <button
          type="button"
          className="cms-shell__backdrop"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <ManagementSidebar
        user={user}
        onLogout={logout}
        compact={compact}
        mobileOpen={navOpen}
        onMobileClose={() => setNavOpen(false)}
      />

      <div className="cms-shell__workspace">
        {compact ? (
          <>
            <ShellStage email={user.email}>{children}</ShellStage>
            {chatOpen ? (
              <div className="cms-chat-panel-mobile">
                <CmsChatPanel />
              </div>
            ) : null}
          </>
        ) : chatOpen ? (
          <ResizablePanels
            key="assist-open"
            label="CMS workspace"
            className="cms-shell__split"
            onLayoutChange={onLayoutChange}
          >
            <ResizablePanel
              id="cms-stage"
              label="Content"
              defaultSize={stageShare}
              minSize={320}
            >
              <ShellStage email={user.email}>{children}</ShellStage>
            </ResizablePanel>
            <ResizablePanel
              id="cms-assistant"
              label="Assistant"
              defaultSize={assistShare}
              minSize={280}
              maxSize={680}
              collapsible
              className="cms-shell__assist-pane"
            >
              <CmsChatPanel />
            </ResizablePanel>
          </ResizablePanels>
        ) : (
          <ShellStage email={user.email}>{children}</ShellStage>
        )}
      </div>
    </div>
  );
}

export function ManagementShell({
  user,
  children,
}: {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
  children: React.ReactNode;
}) {
  return (
    <CmsNotifyProvider>
      <CmsChatProvider>
        <ShellInner user={user}>{children}</ShellInner>
      </CmsChatProvider>
    </CmsNotifyProvider>
  );
}
