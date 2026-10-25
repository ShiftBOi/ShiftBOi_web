import { InquiriesList } from "@/components/management/editors/inquiries-list";

export const metadata = { title: "Inquiries" };
export const dynamic = "force-dynamic";

export default function CmsInquiriesPage() {
  return <InquiriesList />;
}
