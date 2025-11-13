'use client';

import { useLanguage } from './contexts/language-context';
import koTranslations from '../locales/ko.json';
import enTranslations from '../locales/en.json';

type TranslationKey = string;

const translations = {
  ko: koTranslations,
  en: enTranslations,
};

export function useTranslation() {
  const { locale } = useLanguage();

  const t = (key: TranslationKey, values?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace placeholders like {count} with actual values
    if (values) {
      return value.replace(/\{(\w+)\}/g, (match, placeholder) => {
        return values[placeholder]?.toString() ?? match;
      });
    }

    return value;
  };

  return { t, locale };
}
