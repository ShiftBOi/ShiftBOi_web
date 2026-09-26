"use client";

import { HydraFooterRule, ShiftBoiMark } from "@/components/web/hydra-primitives";
import { MatrixPortrait } from "@/components/web/matrix-portrait";
import { useSiteChat } from "@/components/web/site-chat";

const FOOTER_COLS = [
  {
    title: "Explore",
    links: [
      ["Work", "/#work"],
      ["Focus", "/#use-cases"],
      ["Stack", "/#stack"],
      ["Practice", "/#practice"],
    ],
  },
  {
    title: "Selected",
    links: [
      ["Vibesaur", "/projects/vibesaur"],
      ["SKNAT", "/projects/sknat"],
      ["Worldgate", "/projects/worldgate"],
      ["Tastesiam", "/projects/tastesiam"],
      ["Seenpi", "/projects/seenpi"],
    ],
  },
  {
    title: "Connect",
    links: [
      ["Email", "mailto:rapeepongapic@gmail.com"],
      ["GitHub", "https://github.com/ShiftBOi"],
      ["X / Twitter", "https://x.com/ShiftBOi_dev"],
    ],
  },
] as const;

export function SiteFooter() {
  const { openChat } = useSiteChat();

  return (
    <footer id="site-footer" className="site-footer">
      <HydraFooterRule />
      <div className="site-footer-grid" aria-hidden />

      <div className="site-footer-table">
        <div className="site-footer-row site-footer-row-body">
          <div className="site-footer-row-inner site-footer-row-inner-body">
            <div className="site-footer-main">
              <div className="site-footer-brand">
                <a href="/" className="site-footer-logo">
                  <ShiftBoiMark className="site-footer-mark" />
                  <span>ShiftBOi</span>
                </a>
                <p className="site-footer-tagline">
                  Full-stack Web &amp; Mobile Developer — Rapeepong Apichanakulchai
                </p>
              </div>
              <p className="site-footer-blurb">
                Portfolio for production web, mobile, and AI-ready products —
                selected work, stack, and craft notes under one brand.
              </p>
              <div className="site-footer-nav">
                {FOOTER_COLS.map((col) => (
                  <div key={col.title} className="site-footer-col">
                    <p className="site-footer-col-title">{col.title}</p>
                    <ul>
                      {col.links.map(([label, href]) => (
                        <li key={label}>
                          <a
                            href={href}
                            className="site-footer-link"
                            {...(href.startsWith("http")
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                          >
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="site-footer-col">
                  <p className="site-footer-col-title">Chat</p>
                  <ul>
                    <li>
                      <button
                        type="button"
                        className="site-footer-link"
                        onClick={openChat}
                      >
                        Open assistant
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="site-footer-aside">
              <div className="site-footer-media">
                <div className="site-footer-media-stage">
                  <div className="site-footer-media-portrait" aria-hidden>
                    <MatrixPortrait />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
