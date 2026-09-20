import { Outfit, Syne } from "next/font/google";
import "./cms.css";
import { CmsThemeProvider } from "@/components/cms/theme-provider";

const cmsSans = Outfit({
  subsets: ["latin"],
  variable: "--font-cms-sans",
  display: "swap",
});

const cmsDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-cms-display",
  display: "swap",
});

export default function CmsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`cms-root ${cmsSans.variable} ${cmsDisplay.variable}`}>
      <CmsThemeProvider>{children}</CmsThemeProvider>
    </div>
  );
}
