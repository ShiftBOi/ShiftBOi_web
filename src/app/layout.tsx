import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { VisitBeacon } from "@/components/web/visit-beacon";
import "./globals.css";

/** Primary UI sans — OFL via Google Fonts (replaces Aeonik Trial). */
const siteSans = Space_Grotesk({
  variable: "--font-site-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ShiftBOi",
    template: "%s · ShiftBOi",
  },
  description:
    "Full-stack Web & Mobile Developer — production web, mobile, APIs, and AI-ready experiences under ShiftBOi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${siteSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <VisitBeacon />
      </body>
    </html>
  );
}
