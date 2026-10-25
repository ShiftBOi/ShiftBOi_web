export const fallbackLng = "en";
export const languages = ["en", "th", "zh", "fr", "ja"] as const;
export type Locale = (typeof languages)[number];

/** Public language picker (shown in chrome / drawer). */
export const menuLanguages = ["en", "th", "zh", "ja"] as const;
export type MenuLocale = (typeof menuLanguages)[number];

export const cookieName = "NEXT_LOCALE";

export const languageLabels: Record<Locale, string> = {
  en: "English",
  th: "ภาษาไทย",
  zh: "中文",
  fr: "Français",
  ja: "日本語",
};

export const languageCodes: Record<Locale, string> = {
  en: "EN",
  th: "TH",
  zh: "中",
  fr: "FR",
  ja: "JP",
};

export function isLocale(value: string): value is Locale {
  return (languages as readonly string[]).includes(value);
}

export function isMenuLocale(value: string): value is MenuLocale {
  return (menuLanguages as readonly string[]).includes(value);
}
