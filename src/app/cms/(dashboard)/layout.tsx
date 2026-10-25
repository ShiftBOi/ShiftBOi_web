import { ManagementShell } from "@/components/management/management-shell";
import { requireAdmin } from "@/lib/require-admin";

export default async function CmsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return <ManagementShell user={user}>{children}</ManagementShell>;
}
