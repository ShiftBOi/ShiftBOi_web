import {
  fallbackLng,
  isLocale,
  languageCodes,
  languageLabels,
  languages,
  menuLanguages,
  type Locale,
  type MenuLocale,
} from "@/i18n/settings";
import { ensureSiteSettings, updateSiteProfile } from "@/lib/site-settings";

export type LocaleAccess = {
  disabled: Locale[];
  enabled: Locale[];
  menu: MenuLocale[];
  fallback: Locale;
};

export type LocaleAdminRow = {
  id: Locale;
  label: string;
  code: string;
  path: string;
  enabled: boolean;
};

type Cache = { at: number; access: LocaleAccess };

const g = globalThis as unknown as { __hqLocaleAccess?: Cache };
const CACHE_MS = 2_000;

function uniqLocales(values: unknown): Locale[] {
  if (!Array.isArray(values)) return [];
  const out: Locale[] = [];
  for (const value of values) {
    if (typeof value === "string" && isLocale(value) && !out.includes(value)) {
      out.push(value);
    }
  }
  return out;
}

function buildAccess(disabledRaw: unknown): LocaleAccess {
  const disabled = uniqLocales(disabledRaw);
  const enabled = languages.filter((l) => !disabled.includes(l));
  const safeEnabled = enabled.length > 0 ? enabled : ([fallbackLng] as Locale[]);
  const menu = menuLanguages.filter((l) => safeEnabled.includes(l));
  const fallback = safeEnabled.includes(fallbackLng)
    ? fallbackLng
    : (safeEnabled[0] ?? fallbackLng);

  return {
    disabled: enabled.length > 0 ? disabled : [],
    enabled: [...safeEnabled],
    menu: [...menu],
    fallback,
  };
}

function readCache(): LocaleAccess | null {
  const hit = g.__hqLocaleAccess;
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) return null;
  return hit.access;
}

function writeCache(access: LocaleAccess) {
  g.__hqLocaleAccess = { at: Date.now(), access };
}

export function invalidateLocaleCache() {
  delete g.__hqLocaleAccess;
}

/** One DB read → enabled / menu / fallback for proxy, layouts, and APIs. */
export async function getLocaleAccess(): Promise<LocaleAccess> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const settings = await ensureSiteSettings();
    const access = buildAccess(settings.disabledLocales);
    writeCache(access);
    return access;
  } catch {
    return cached ?? buildAccess([]);
  }
}

export async function getDisabledLocales(): Promise<Locale[]> {
  return (await getLocaleAccess()).disabled;
}

export async function getEnabledLocales(): Promise<Locale[]> {
  return (await getLocaleAccess()).enabled;
}

export async function getPublicMenuLocales(): Promise<MenuLocale[]> {
  return (await getLocaleAccess()).menu;
}

export async function getPublicFallbackLocale(): Promise<Locale> {
  return (await getLocaleAccess()).fallback;
}

export async function isLocalePubliclyEnabled(locale: string): Promise<boolean> {
  if (!isLocale(locale)) return false;
  return (await getLocaleAccess()).enabled.includes(locale);
}

export function toLocaleAdminRows(access: LocaleAccess): LocaleAdminRow[] {
  return languages.map((id) => ({
    id,
    label: languageLabels[id],
    code: languageCodes[id],
    path: `/${id}`,
    enabled: access.enabled.includes(id),
  }));
}

export async function listLocaleAdminRows(): Promise<{
  rows: LocaleAdminRow[];
  access: LocaleAccess;
}> {
  const access = await getLocaleAccess();
  return { rows: toLocaleAdminRows(access), access };
}

/** Persist closed locales. At least one language must remain open. */
export async function setDisabledLocales(
  nextDisabled: string[]
): Promise<LocaleAccess> {
  const disabled = uniqLocales(nextDisabled);
  const enabled = languages.filter((l) => !disabled.includes(l));
  if (enabled.length === 0) {
    throw new Error("At least one language must stay open");
  }

  const access = buildAccess(disabled);
  await updateSiteProfile({ disabledLocales: access.disabled });
  invalidateLocaleCache();
  writeCache(access);
  return access;
}

/** Toggle a single public locale open/closed. */
export async function setLocaleEnabled(
  locale: string,
  enabled: boolean
): Promise<LocaleAccess> {
  if (!isLocale(locale)) {
    throw new Error("Unknown locale");
  }

  const { disabled } = await getLocaleAccess();
  const next = enabled
    ? disabled.filter((l) => l !== locale)
    : disabled.includes(locale)
      ? disabled
      : [...disabled, locale];

  return setDisabledLocales(next);
}

/** Pick the best enabled locale from cookie / Accept-Language. */
export function detectEnabledLocale(
  enabled: readonly Locale[],
  fallback: Locale,
  cookieLocale?: string | null,
  acceptLanguage?: string | null
): Locale {
  if (cookieLocale && isLocale(cookieLocale) && enabled.includes(cookieLocale)) {
    return cookieLocale;
  }

  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const code = part.split(";")[0]?.trim().toLowerCase().slice(0, 2);
      if (code && isLocale(code) && enabled.includes(code)) return code;
    }
  }

  return fallback;
}
