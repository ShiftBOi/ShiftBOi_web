"use client";

import { HydraFooterRule, ShiftBoiMark } from "@/components/web/hydra-primitives";
import { MatrixPortrait } from "@/components/web/matrix-portrait";
import { useSiteChat } from "@/components/web/site-chat";

type FooterProject = {
  slug: string;
  title: string;
};

type Props = {
  selectedProjects?: FooterProject[];
  contactEmail?: string;
};

const EXPLORE_LINKS = [
  ["Work", "/#work"],
  ["Focus", "/#use-cases"],
  ["Stack", "/#stack"],
  ["Practice", "/#practice"],
] as const;

const SOCIAL_LINKS = [
  ["GitHub", "https://github.com/ShiftBOi"],
  ["X / Twitter", "https://x.com/ShiftBOi_dev"],
] as const;

export function SiteFooter({
  selectedProjects = [],
  contactEmail = "rapeepongapic@gmail.com",
}: Props) {
  const { openChat } = useSiteChat();
  const selected = selectedProjects.slice(0, 6);
  const mailto = `mailto:${contactEmail}`;

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
                <div className="site-footer-col">
                  <p className="site-footer-col-title">Explore</p>
                  <ul>
                    {EXPLORE_LINKS.map(([label, href]) => (
                      <li key={label}>
                        <a href={href} className="site-footer-link">
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="site-footer-col">
                  <p className="site-footer-col-title">Selected</p>
                  <ul>
                    {selected.length > 0 ? (
                      selected.map((project) => (
                        <li key={project.slug}>
                          <a
                            href={`/projects/${project.slug}`}
                            className="site-footer-link"
                          >
                            {project.title}
                          </a>
                        </li>
                      ))
                    ) : (
                      <li>
                        <a href="/#work" className="site-footer-link">
                          View work
                        </a>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="site-footer-col">
                  <p className="site-footer-col-title">Connect</p>
                  <ul>
                    <li>
                      <a href={mailto} className="site-footer-link">
                        Email
                      </a>
                    </li>
                    {SOCIAL_LINKS.map(([label, href]) => (
                      <li key={label}>
                        <a
                          href={href}
                          className="site-footer-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

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
