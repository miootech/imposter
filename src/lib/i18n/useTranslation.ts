import { usePreferencesStore } from '@/stores/preferencesStore'
import { TRANSLATIONS, type TranslationKey, type Language } from './translations'

export function useTranslation() {
  const uiLanguage = usePreferencesStore((s) => s.uiLanguage) ?? 'de'

  const t = (key: TranslationKey): string => {
    const langDict = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de
    return (langDict as Record<string, string>)[key] ?? (TRANSLATIONS.de as Record<string, string>)[key] ?? key
  }

  return {
    t,
    language: uiLanguage as Language,
    isGerman: uiLanguage === 'de',
    isEnglish: uiLanguage === 'en',
  }
}
