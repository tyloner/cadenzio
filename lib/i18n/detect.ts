// Thin module — safe to import in Edge middleware (no translation dictionaries)
export const LANG_COOKIE = "cadenzio_lang"

export type Lang = "en" | "ja"

export function detectLang(countryCode: string | null, acceptLanguage: string | null): Lang {
  if (countryCode === "JP") return "ja"
  if (acceptLanguage?.toLowerCase().startsWith("ja")) return "ja"
  return "en"
}
