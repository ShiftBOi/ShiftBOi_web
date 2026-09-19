import "./cms.css";
import { CmsThemeProvider } from "@/components/cms/theme-provider";

export default function CmsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CmsThemeProvider>{children}</CmsThemeProvider>;
}
