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

  requestTitle: 'בקשת מפה',
  requestIntro:
    'הציעו סוגיא, פרק, או פרשה למפה חדשה. נבדוק את הבקשה ידנית — לא כל בקשה תיענה, ואין מועד יעד.',
  requestRefLabel: 'מקור בספריא',
  requestRefHint: 'אפשר בעברית (״מגילה כו״) או באנגלית (״Megillah 26״).',
  requestRefPlaceholder: 'למשל: מגילה כו',
  requestLookupBtn: 'אימות מול ספריא',
  requestLookupResolved: 'אומת:',
  requestLookupNotFound: 'לא נמצא — אפשר להגיש בכל זאת, נבדוק ידנית.',
  requestLookupAmbiguous: 'יש כמה התאמות אפשריות — אפשר לבחור, או להגיש כפי שכתבתם.',
  requestLookupNetwork: 'התקלה ברשת. אפשר להגיש בכל זאת — נבדוק ידנית.',
  requestLookupEmpty: 'נא להזין מקור לבדיקה.',
  requestLookupLoading: 'בודק…',
  requestTargetLangLabel: 'שפת היעד',
  requestTargetLangHe: 'עברית',
  requestTargetLangEn: 'English',
  requestTargetLangYi: 'יידיש',
  requestNoteLabel: 'הערה (לא חובה)',
  requestNotePlaceholder: 'הקשר, סוגיא מסוימת, מה חשוב שייכנס למפה.',
  requestEmailLabel: 'דוא״ל (לא חובה)',
  requestEmailPlaceholder: 'name@example.com',
  requestEmailHint: 'נשלח עדכון כשהמפה מוכנה. לא נשתמש בכתובת לשום דבר אחר.',
  requestSubmitBtn: 'שליחת בקשה',
  requestBackHomeBtn: 'חזרה לדף הבית',
  requestRefRequired: 'נא להזין מקור לפני השליחה.',
  requestSuccessKicker: 'נשלח',
  requestSuccessTitle: 'הבקשה התקבלה',
  requestSuccessBody:
    'הבקשה נכנסה לתור הבדיקה הידנית. אם הוספתם דוא״ל, ניצור קשר כשתהיה מפה. אין הבטחה ואין SLA — תודה על הסבלנות.',
  requestSubmitAnother: 'בקשה נוספת',

  mapInfoSefariaRefLabel: 'מקור בספריא',
  mapInfoVariantsHeading: 'גרסאות זמינות',
  mapInfoOpenVariant: 'פתיחה',
  mapInfoVariantLangHe: 'עברית',
  mapInfoVariantLangEn: 'אנגלית',
  mapInfoVariantLangYi: 'יידיש',
  mapInfoVariantMissingNote: 'הגרסה הזו עדיין לא קיימת',
  mapInfoVariantRequest: 'בקשת תרגום',
  mapInfoAdjacentHeading: 'מפות סמוכות',
  mapInfoAdjacentPrev: 'הקודם',
  mapInfoAdjacentNext: 'הבא',
  mapInfoAdjacentNoMap: 'אין מפה לדף הזה',
  mapInfoAdjacentRequest: 'בקשת הדף',
  mapInfoFeedbackHeading: 'מצאתם טעות או יש לכם הערה?',
  mapInfoFeedbackBody: 'אפשר לשלוח משוב על המפה — נקרא ידנית כל פנייה.',
  mapInfoFeedbackBtn: 'שליחת משוב על המפה',
  mapInfoUpdated: 'עודכן',
  mapInfoEmptyTitle: 'אין עדיין מפה לדף הזה',
  mapInfoEmptyBody:
    'הקישור תקין, אבל עדיין לא נכתבה מפה לסוגיא הזו. אפשר להציע את הדף לבדיקה ידנית — לא כל בקשה תיענה, ואין מועד יעד.',
  mapInfoEmptyRequestBtn: 'בקשת הדף',
  mapInfoEmptyRefLabel: 'הדף המבוקש',
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

  requestTitle: 'Request a map',
  requestIntro:
    "Propose a sugya, perek, or parsha for a new map. We review every request manually — not all requests get fulfilled, and there's no SLA.",
  requestRefLabel: 'Sefaria reference',
  requestRefHint: 'Hebrew ("מגילה כו") or Latin ("Megillah 26") both work.',
  requestRefPlaceholder: 'e.g. Megillah 26',
  requestLookupBtn: 'Lookup',
  requestLookupResolved: 'Resolved:',
  requestLookupNotFound: "Not found — you can still submit, we'll check manually.",
  requestLookupAmbiguous: 'Several possible matches — pick one, or submit as-is.',
  requestLookupNetwork: "Network hiccup. You can still submit — we'll check manually.",
  requestLookupEmpty: 'Enter a reference to look up.',
  requestLookupLoading: 'Looking up…',
  requestTargetLangLabel: 'Target language',
  requestTargetLangHe: 'Hebrew',
  requestTargetLangEn: 'English',
  requestTargetLangYi: 'Yiddish',
  requestNoteLabel: 'Note (optional)',
  requestNotePlaceholder: "Context, a specific sugya, what's important to include.",
  requestEmailLabel: 'Email (optional)',
  requestEmailPlaceholder: 'name@example.com',
  requestEmailHint: "We'll let you know when the map is ready. No other use.",
  requestSubmitBtn: 'Submit request',
  requestBackHomeBtn: 'Back to home',
  requestRefRequired: 'Please enter a reference before submitting.',
  requestSuccessKicker: 'Submitted',
  requestSuccessTitle: 'Request received',
  requestSuccessBody:
    "Your request has joined the manual review queue. If you added an email, we'll be in touch when a map is ready. There's no SLA — thank you for your patience.",
  requestSubmitAnother: 'Submit another',

  mapInfoSefariaRefLabel: 'Sefaria reference',
  mapInfoVariantsHeading: 'Available variants',
  mapInfoOpenVariant: 'Open',
  mapInfoVariantLangHe: 'Hebrew',
  mapInfoVariantLangEn: 'English',
  mapInfoVariantLangYi: 'Yiddish',
  mapInfoVariantMissingNote: 'This variant does not exist yet',
  mapInfoVariantRequest: 'Request translation',
  mapInfoAdjacentHeading: 'Adjacent maps',
  mapInfoAdjacentPrev: 'Previous',
  mapInfoAdjacentNext: 'Next',
  mapInfoAdjacentNoMap: 'No map for this daf',
  mapInfoAdjacentRequest: 'Request this daf',
  mapInfoFeedbackHeading: 'Found a mistake or have a note?',
  mapInfoFeedbackBody: 'Send feedback on this map — every submission is read manually.',
  mapInfoFeedbackBtn: 'Submit feedback on this map',
  mapInfoUpdated: 'Updated',
  mapInfoEmptyTitle: 'No map for this daf yet',
  mapInfoEmptyBody:
    "The link is valid, but no map has been written for this passage yet. You can request it for manual review — not every request gets fulfilled, and there's no SLA.",
  mapInfoEmptyRequestBtn: 'Request this daf',
  mapInfoEmptyRefLabel: 'Requested daf',
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
