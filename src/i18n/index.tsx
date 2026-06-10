import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ar } from './ar';
import { en } from './en';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

type TranslationParams = Record<string, string | number>;

type TranslationContextValue = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
  isRtl: boolean;
  direction: Direction;
};

const LANGUAGE_STORAGE_KEY = 'fitmind_language';

const dictionaries: Record<Language, Record<string, string>> = {
  en,
  ar,
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'ar';
}

function interpolate(value: string, params?: TranslationParams) {
  if (!params) return value;

  return Object.entries(params).reduce(
    (text, [key, replacement]) =>
      text.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(replacement)),
    value
  );
}

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    let mounted = true;

    SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY)
      .then((storedLanguage) => {
        if (mounted && isLanguage(storedLanguage)) {
          setLanguageState(storedLanguage);
        }
      })
      .catch(() => {
        // Keep English as the safe fallback if storage is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isRtl = language === 'ar';
  const direction: Direction = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    I18nManager.allowRTL(true);

    if (I18nManager.isRTL !== isRtl) {
      I18nManager.forceRTL(isRtl);
    }
  }, [isRtl]);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const dictionary = dictionaries[language];
      const englishFallback = dictionaries.en;
      return interpolate(dictionary[key] ?? englishFallback[key] ?? key, params);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRtl,
      direction,
    }),
    [direction, isRtl, language, setLanguage, t]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useTranslation must be used inside TranslationProvider.');
  }

  return context;
}
