import type { Metadata } from "next";
import { CmsThemeProvider } from "@/components/management/cms-theme";
import "./cms-tokens.css";
import "./cms.css";
import "./cms-topbar-chat.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: {
    default: "ShiftBOi CMS",
    template: "%s · ShiftBOi CMS",
  },
};

export default function CmsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cms-root">
      <CmsThemeProvider>{children}</CmsThemeProvider>
    </div>
  );
}
