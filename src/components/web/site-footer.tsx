import { HydraFooterRule, ShiftBoiMark } from "@/components/web/hydra-primitives";
import { MatrixPortrait } from "@/components/web/matrix-portrait";

const FOOTER_COLS = [
  {
    title: "Home",
    links: [
      ["Focus", "/#use-cases"],
      ["Skills", "/#features"],
      ["How I Work", "/#architecture"],
      ["Engagement", "/#pricing"],
      ["Work", "/#work"],
      ["Contact", "/#contact"],
    ],
  },
  {
    title: "Focus",
    links: [
      ["Web Apps", "/#use-cases"],
      ["Mobile", "/#use-cases"],
      ["AI Features", "/#use-cases"],
    ],
  },
  {
    title: "Connect",
    links: [
      ["GitHub", "https://github.com/ShiftBOi"],
      ["X", "https://x.com/ShiftBOi_dev"],
      ["Contact", "/#contact"],
    ],
  },
  {
    title: "Studio",
    links: [
      ["ShiftBOi", "/"],
      ["Projects", "/#features"],
      ["CMS", "/cms/login"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "#"],
      ["Terms", "#"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <HydraFooterRule />
      <div className="site-footer-grid" aria-hidden />

      <div className="site-footer-table">
        <div className="site-footer-row site-footer-row-top">
          <div className="site-footer-row-inner site-footer-row-inner-top">
            <div className="site-footer-brand">
              <a href="/" className="site-footer-logo">
                <ShiftBoiMark className="site-footer-mark" />
                <span>ShiftBOi</span>
              </a>
              <p className="site-footer-tagline">Full-stack Web &amp; Mobile · ShiftBOi</p>
            </div>
          </div>
        </div>

        <div className="site-footer-row site-footer-row-body">
          <div className="site-footer-row-inner site-footer-row-inner-body">
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
            </div>

            <div className="site-footer-aside">
              <div className="site-footer-media">
                <div className="site-footer-media-socials" aria-label="Social links">
                  <span className="site-footer-media-rule" aria-hidden />
                  <div className="site-footer-media-socials-inner">
                    <a
                      href="https://x.com/ShiftBOi_dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="site-footer-social"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.71-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                      </svg>
                      <span>X</span>
                    </a>
                    <a
                      href="https://github.com/ShiftBOi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="site-footer-social"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2C6.477 2 2 6.486 2 12.021c0 4.425 2.865 8.18 6.839 9.504.5.093.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.622.069-.609.069-.609 1.004.071 1.532 1.033 1.532 1.033.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.952 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.944.359.31.678.922.678 1.858 0 1.34-.012 2.42-.012 2.75 0 .268.18.58.688.481A10.02 10.02 0 0 0 22 12.021C22 6.486 17.523 2 12 2z" />
                      </svg>
                      <span>GitHub</span>
                    </a>
                    <a href="/#contact" className="site-footer-social">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                      <span>Discord</span>
                    </a>
                  </div>
                  <span className="site-footer-media-rule" aria-hidden />
                </div>
                <div className="site-footer-media-stage">
                  <div className="site-footer-media-portrait" aria-hidden>
                    <MatrixPortrait />
                  </div>
                </div>
                <p className="site-footer-copy">© {new Date().getFullYear()} ShiftBOi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
