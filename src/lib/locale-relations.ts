import type { Locale } from "@/i18n/settings";
import { languages } from "@/i18n/settings";

export type TranslationRelation =
  | "translationEn"
  | "translationTh"
  | "translationJa"
  | "translationFr"
  | "translationZh";

export function translationRelation(locale: Locale): TranslationRelation {
  if (locale === "th") return "translationTh";
  if (locale === "ja") return "translationJa";
  if (locale === "fr") return "translationFr";
  if (locale === "zh") return "translationZh";
  return "translationEn";
}

export function emptyLocaleMap<T>(factory: () => T): Record<Locale, T> {
  return Object.fromEntries(languages.map((l) => [l, factory()])) as Record<
    Locale,
    T
  >;
}

export function pickTranslationRow<T extends Record<string, unknown>>(
  item: Partial<Record<TranslationRelation, T | null | undefined>>,
  locale: Locale,
): T | null {
  return item[translationRelation(locale)] ?? item.translationEn ?? null;
}
