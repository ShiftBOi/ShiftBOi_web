import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireCmsSession() {
  const session = await getSession();

  if (!session?.user || !isAllowedAdminEmail(session.user.email)) {
    redirect("/cms/login");
  }

  return session;
}
