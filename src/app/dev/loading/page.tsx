import { notFound } from "next/navigation";
import { SiteLoadingPreview } from "@/components/web/site-loading-preview";

export const metadata = { title: "Shift motion preview", robots: { index: false, follow: false } };

export default function LoadingPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <SiteLoadingPreview />;
}
