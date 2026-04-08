import en, { type TranslationKey } from "./en"
import ja from "./ja"

export type Lang = "en" | "ja"
export type { TranslationKey }

const TRANSLATIONS: Record<Lang, Record<TranslationKey, string>> = { en, ja }

export const LANG_COOKIE = "cadenzio_lang"

/** Translate a key, interpolating {placeholders} from vars */
export function t(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>): string {
  let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v))
    }
  }
  return str
}

/** Infer lang from Vercel geo country header or Accept-Language */
export function detectLang(countryCode: string | null, acceptLanguage: string | null): Lang {
  if (countryCode === "JP") return "ja"
  if (acceptLanguage?.toLowerCase().startsWith("ja")) return "ja"
  return "en"
}
