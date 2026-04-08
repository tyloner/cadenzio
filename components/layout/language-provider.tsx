"use client"

import { createContext, useContext } from "react"
import { t as translate, type TranslationKey } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n/detect"

const LangContext = createContext<Lang>("en")

export function LanguageProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export function useLang(): Lang {
  return useContext(LangContext)
}

/** Hook: returns a bound translate function for current language */
export function useT() {
  const lang = useLang()
  return (key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars)
}
