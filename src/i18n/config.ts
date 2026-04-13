import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import sr from './locales/sr.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'sr', label: 'Serbian', native: 'Srpski' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'sr'],
    resources: {
      en: { translation: en },
      sr: { translation: sr },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'trip-plan.lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
