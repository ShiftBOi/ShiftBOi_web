import { prisma } from "@/lib/prisma";

const KEY = "site_profile";

export type SiteProfile = {
  name: string;
  title: string;
  wordmark: string;
  heroSubhead: string;
  heroHelper: string;
  email: string;
  disabledLocales: string[];
};

const DEFAULTS: SiteProfile = {
  name: "ShiftBOi",
  title: "Portfolio",
  wordmark: "ShiftBOi",
  heroSubhead: "",
  heroHelper: "",
  email: "",
  disabledLocales: [],
};

export async function ensureSiteSettings(): Promise<SiteProfile & { id: string }> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
  if (row && row.value && typeof row.value === "object") {
    return {
      id: row.id,
      ...DEFAULTS,
      ...(row.value as Partial<SiteProfile>),
    };
  }
  const created = await prisma.siteSetting.create({
    data: {
      key: KEY,
      value: DEFAULTS,
    },
  });
  return { id: created.id, ...DEFAULTS };
}

export async function getSiteProfile(): Promise<SiteProfile> {
  const s = await ensureSiteSettings();
  const { id: _id, ...profile } = s;
  return profile;
}

export async function updateSiteProfile(
  patch: Partial<SiteProfile>,
): Promise<SiteProfile> {
  const current = await ensureSiteSettings();
  const next = { ...DEFAULTS, ...current, ...patch };
  const { id: _id, ...profile } = next;
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: profile },
    update: { value: profile },
  });
  return profile;
}
