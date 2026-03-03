import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';

// i18n configuration for GreenReceipt app
// Supports English (en) and Hindi (hi)
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi'],
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'greenreceipt-lang',
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
    
    react: {
      useSuspense: false, // Avoid hydration issues
    },
  });

export default i18n;
