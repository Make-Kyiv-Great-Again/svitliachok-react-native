import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import uk from './locales/uk.json';

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then((language) => {
        if (language) {
          // If language was stored before, use it
          return callback(language);
        } else {
          // If no language stored, use device locale
          const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
          return callback(deviceLang);
        }
      });
    } catch (error) {
      console.log('Error reading language', error);
      callback('en');
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error caching language', error);
    }
  },
};

const resources = {
  en: { translation: en },
  uk: { translation: uk },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v4',
  });

export default i18n;
