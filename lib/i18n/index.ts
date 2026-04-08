import en, { type TranslationKey } from "./en"
import ja from "./ja"
// Re-export thin types so app code only needs one import
export type { Lang } from "./detect"
export { LANG_COOKIE } from "./detect"
export type { TranslationKey } from "./en"

const TRANSLATIONS = { en, ja } as const

/** Translate a key, interpolating {placeholders} from vars */
export function t(lang: "en" | "ja", key: TranslationKey, vars?: Record<string, string | number>): string {
  let str: string = (TRANSLATIONS[lang] as Record<string, string>)[key]
    ?? (TRANSLATIONS.en as Record<string, string>)[key]
    ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v))
    }
  }
  return str
}
