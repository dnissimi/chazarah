// Site-chrome strings. Hebrew is canonical: every key must have a Hebrew value.
// English is partial in v0; `t()` falls back to Hebrew when a key is missing.

export type Lang = 'he' | 'en';

export const LANGS: readonly Lang[] = ['he', 'en'] as const;

export const DEFAULT_LANG: Lang = 'he';

export const LANG_STORAGE_KEY = 'chazarah.lang';

const he = {
  brand: 'חזרה',
  brandSub: 'מפות לימוד',
  navHome: 'דף הבית',
  navBrowse: 'הספרייה',
  navRequest: 'בקשת מפה',
  langLabelHe: 'עברית',
  langLabelEn: 'English',
  langGroupLabel: 'שפת האתר',
  sefariaFooter: 'הטקסט והאיזכורים באדיבות ספריא · Sefaria',
  copyright: '© 2026 חזרה · Chazarah',
  homeTagline: 'לחזור אל הסוגיא, לראות את המבנה',
  homeIntro:
    'חזרה היא אתר ללומדי תורה. כל מפה מראה סוגיא כתרשים זרימה, לצד הטקסט המקורי ותרגום בעברית בהירה — כדי שהחזרה תחשוף את המבנה.',
  notFoundKicker: 'שגיאה 404',
  notFoundTitle: 'הדף לא נמצא',
  notFoundBody:
    'הקישור שאליו הגעתם אינו קיים — אולי הוקלד לא נכון, או שהדף הוסר. אפשר לחזור הביתה ולנסות שוב.',
  notFoundHome: 'חזרה לדף הבית',
} as const;

export type StringKey = keyof typeof he;

const en: Partial<Record<StringKey, string>> = {
  brand: 'Chazarah',
  brandSub: 'Study maps',
  navHome: 'Home',
  navBrowse: 'Library',
  navRequest: 'Request a map',
  langLabelHe: 'עברית',
  langLabelEn: 'English',
  langGroupLabel: 'Site language',
  sefariaFooter: 'Text and references via Sefaria',
  copyright: '© 2026 Chazarah · חזרה',
  homeTagline: 'Come back to the sugya, see the structure',
  homeIntro:
    'Chazarah is for Torah learners. Each map renders a sugya as a flowchart alongside the original text and a clear translation — so that review reveals structure.',
  notFoundKicker: 'Error 404',
  notFoundTitle: 'Page not found',
  notFoundBody:
    "That link doesn't go anywhere — maybe a typo, or the page was removed. Head back home and try again.",
  notFoundHome: 'Back to home',
};

export const strings: { he: Record<StringKey, string>; en: Partial<Record<StringKey, string>> } = {
  he,
  en,
};

export function t(lang: Lang, key: StringKey): string {
  return strings[lang][key] ?? he[key];
}

export const DIR: Record<Lang, 'rtl' | 'ltr'> = {
  he: 'rtl',
  en: 'ltr',
};
