import { create } from 'zustand';

type Language = 'EN' | 'UZ' | 'RU';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  EN: {
    'nav.dashboard': 'Dashboard',
    'nav.translate': 'Quick Translate',
    'nav.document': 'Document Translation',
    'nav.materials': 'Materials',
    'nav.history': 'History',
    'nav.login': 'Log In',
  },
  UZ: {
    'nav.dashboard': 'Asosiy',
    'nav.translate': 'Tezkor Tarjima',
    'nav.document': 'Hujjat Tarjimasi',
    'nav.materials': 'Materiallar',
    'nav.history': 'Tarix',
    'nav.login': 'Kirish',
  },
  RU: {
    'nav.dashboard': 'Главная',
    'nav.translate': 'Быстрый Перевод',
    'nav.document': 'Перевод Документов',
    'nav.materials': 'Материалы',
    'nav.history': 'История',
    'nav.login': 'Войти',
  }
};

export const useI18n = create<I18nStore>((set, get) => ({
  language: (localStorage.getItem('language') as Language) || 'EN',
  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },
  t: (key) => {
    const lang = get().language;
    return translations[lang][key] || key;
  }
}));
