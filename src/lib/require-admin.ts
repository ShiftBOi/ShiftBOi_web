import { redirect } from "next/navigation";
import { requireCmsSession } from "@/lib/session";

/** Shape expected by ManagementShell / account menu (ported from original CMS). */
export type CmsAdminUser = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
};

export async function requireAdmin(): Promise<CmsAdminUser> {
  const session = await requireCmsSession();
  const user = session.user;
  return {
    id: user.id,
    username: user.name || user.email.split("@")[0] || "Admin",
    email: user.email,
    avatarUrl: user.image ?? null,
  };
}

/** For API routes that previously used requireAdmin redirect — return null instead. */
export async function getAdminOrNull(): Promise<CmsAdminUser | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

export function redirectToCmsLogin(): never {
  redirect("/cms/login");
}
