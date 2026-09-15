export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase().trim() || "rapeepongapic@gmail.com";

export function isAllowedAdminEmail(email: string): boolean {
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}
