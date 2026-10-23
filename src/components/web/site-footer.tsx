"use client";

import { useSiteChat } from "@/components/web/site-chat";
import { FooterDinos } from "@/components/web/footer-dinos";

type FooterProject = {
  slug: string;
  title: string;
};

type Props = {
  selectedProjects?: FooterProject[];
  contactEmail?: string;
};

const LEFT_LINKS = [
  ["About", "/#use-cases"],
  ["Work", "/#work"],
  ["Contact", "/#get-in-touch"],
] as const;

const RIGHT_LINKS = [
  ["GitHub", "https://github.com/ShiftBOi"],
  ["X / Twitter", "https://x.com/ShiftBOi_dev"],
] as const;

const YEAR = new Date().getFullYear();

export function SiteFooter({
  selectedProjects: _selectedProjects = [],
  contactEmail = "rapeepongapic@gmail.com",
}: Props) {
  const { openChat } = useSiteChat();
  const mailto = `mailto:${contactEmail}`;

  return (
    <footer id="site-footer" className="site-footer">
      <div className="site-footer-bar">
        <nav className="site-footer-bar-left" aria-label="Footer">
          {LEFT_LINKS.map(([label, href]) => (
            <a key={label} href={href} className="site-footer-bar-link">
              {label}
            </a>
          ))}
          <button
            type="button"
            className="site-footer-bar-link"
            onClick={openChat}
          >
            Chat
          </button>
        </nav>

        <div className="site-footer-bar-right">
          <a href={mailto} className="site-footer-bar-link">
            Email
          </a>
          {RIGHT_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="site-footer-bar-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          ))}
          <span className="site-footer-bar-copy">© {YEAR} ShiftBOi</span>
        </div>
      </div>

      <FooterDinos />
    </footer>
  );
}
