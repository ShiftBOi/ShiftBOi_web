import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const aeonikFallback = Space_Grotesk({
  variable: "--font-aeonik-fallback",
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
    <html lang="en" className={`${aeonikFallback.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
