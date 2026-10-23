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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3001");

const siteDescription =
  "Full-stack Web & Mobile Developer — production web, mobile, APIs, and AI-ready experiences under ShiftBOi.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ShiftBOi",
    template: "%s · ShiftBOi",
  },
  description: siteDescription,
  applicationName: "ShiftBOi",
  authors: [{ name: "ShiftBOi" }],
  creator: "ShiftBOi",
  keywords: [
    "ShiftBOi",
    "Full-stack Developer",
    "Web",
    "Mobile",
    "Portfolio",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ShiftBOi",
    title: "ShiftBOi — Full-stack Web & Mobile",
    description: siteDescription,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ShiftBOi — Full-stack Web & Mobile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShiftBOi — Full-stack Web & Mobile",
    description: siteDescription,
    images: ["/og.png"],
  },
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
