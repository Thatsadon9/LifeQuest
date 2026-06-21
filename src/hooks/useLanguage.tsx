/**
 * Language management: persisted to profile (DB) and localStorage, applied via
 * `lang` on <html> and `lang-th` class for Thai typography.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../types';
import { setLanguage as persistLanguage } from '../lib/actions';
import { getUserItem, setUserItem } from '../lib/auth/userStorage';
import { getDict, t as translate, type Dict } from '../i18n';
import { localizeRankTitle } from '../i18n/localize';
import { NAV_ITEMS } from '../components/nav';
import { useLevel as useLevelBase, useProfile, type LevelView } from './data';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'lifequest-language';

interface LanguageContextValue {
  locale: Language;
  setLanguage: (locale: Language) => void;
  toggleLanguage: () => void;
}

interface TContextValue {
  t: (path: string, params?: Record<string, string | number>) => string;
  locale: Language;
  dict: Dict;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const TContext = createContext<TContextValue | null>(null);

function readStoredLanguage(userId: string | null): Language {
  if (userId) {
    const stored = getUserItem(STORAGE_KEY, userId);
    if (stored === 'en' || stored === 'th') return stored;
  }
  return 'en';
}

function applyLanguage(locale: Language): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = locale;
  root.classList.toggle('lang-th', locale === 'th');
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const profile = useProfile();
  const [locale, setLocaleState] = useState<Language>(() =>
    readStoredLanguage(user?.id ?? null),
  );

  useEffect(() => {
    setLocaleState(readStoredLanguage(user?.id ?? null));
  }, [user?.id]);

  useEffect(() => {
    applyLanguage(locale);
    if (user?.id) setUserItem(STORAGE_KEY, locale, user.id);
  }, [locale, user?.id]);

  useEffect(() => {
    if (profile?.language && profile.language !== locale) {
      setLocaleState(profile.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.language]);

  const setLanguage = useCallback((next: Language) => {
    setLocaleState(next);
    void persistLanguage(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLocaleState((prev) => {
      const next: Language = prev === 'en' ? 'th' : 'en';
      void persistLanguage(next);
      return next;
    });
  }, []);

  const dict = useMemo(() => getDict(locale), [locale]);

  const tValue = useMemo<TContextValue>(
    () => ({
      locale,
      dict,
      t: (path, params) => translate(dict, path, params),
    }),
    [locale, dict],
  );

  const langValue = useMemo<LanguageContextValue>(
    () => ({ locale, setLanguage, toggleLanguage }),
    [locale, setLanguage, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={langValue}>
      <TContext.Provider value={tValue}>{children}</TContext.Provider>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

export function useT(): TContextValue {
  const ctx = useContext(TContext);
  if (!ctx) throw new Error('useT must be used within a LanguageProvider');
  return ctx;
}

/** Level view with rank title localized to the current language. */
export function useLocalizedLevel(): LevelView | undefined {
  const level = useLevelBase();
  const { locale } = useLanguage();
  if (!level) return undefined;
  return { ...level, rank: localizeRankTitle(level.rank, locale) };
}

export interface NavItemTranslated {
  to: string;
  label: string;
  icon: import('lucide-react').LucideIcon;
  end?: boolean;
  core?: boolean;
}

/** Navigation items with labels translated for the current locale. */
export function useNavItems(): NavItemTranslated[] {
  const { t } = useT();
  return NAV_ITEMS.map((item) => ({
    ...item,
    label: t(`nav.${item.labelKey}`),
  }));
}
