import {
  FolderOpen,
  HardDrive,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export type ManagementNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

/** Slim IA — account / passkeys live in the sidebar account settings popup.
 *  Assistant lives in the topbar chat rail (not a nav page). */
export const managementNav: ManagementNavItem[] = [
  { title: "Dashboard", href: "/cms", icon: LayoutDashboard, exact: true },
  { title: "Projects", href: "/cms/projects", icon: FolderOpen },
  { title: "Inquiries", href: "/cms/inquiries", icon: Inbox },
  { title: "Storage", href: "/cms/storage", icon: HardDrive },
];
