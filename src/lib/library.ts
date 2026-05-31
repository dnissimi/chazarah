/**
 * Pure helpers for the Library page at /library.
 *
 * The page needs three things this module provides:
 *   1. The full Bavli tractate list, grouped by Seder — drives the switcher.
 *   2. A check for which tractates have a registered per-masechet page yet,
 *      since /map/talmud/<book>/ is only generated for entries in MASECHTOT.
 *   3. A ref parser for the search box: turn "Megillah 26" / "מגילה כו" / "מגילה"
 *      into a routable {tractate, daf} target.
 *
 * Daf-yomi-of-today is intentionally NOT here — it's fetched client-side from
 * Sefaria's calendar API with a Berakhot fallback, so the static HTML stays
 * pure and reflects no specific date.
 */

import taxonomyJson from '../data/sefaria-taxonomy.json';
import { MASECHTOT, hebrewNumeral } from './browse';

export type SederSlug = 'zeraim' | 'moed' | 'nashim' | 'nezikin' | 'kodashim' | 'tohorot';

export interface SederInfo {
  slug: SederSlug;
  he: string;
  en: string;
}

export const SEDARIM: readonly SederInfo[] = [
  { slug: 'zeraim',   he: 'סדר זרעים',  en: 'Seder Zeraim' },
  { slug: 'moed',     he: 'סדר מועד',   en: 'Seder Moed' },
  { slug: 'nashim',   he: 'סדר נשים',   en: 'Seder Nashim' },
  { slug: 'nezikin',  he: 'סדר נזיקין', en: 'Seder Nezikin' },
  { slug: 'kodashim', he: 'סדר קודשים', en: 'Seder Kodashim' },
  { slug: 'tohorot',  he: 'סדר טהרות',  en: 'Seder Tahorot' },
] as const;

const SEDER_PATH_TO_SLUG: Record<string, SederSlug> = {
  'Seder Zeraim':   'zeraim',
  'Seder Moed':     'moed',
  'Seder Nashim':   'nashim',
  'Seder Nezikin':  'nezikin',
  'Seder Kodashim': 'kodashim',
  'Seder Tahorot':  'tohorot',
};

export interface TractateInfo {
  slug: string;     // 'megillah'
  he: string;       // 'מגילה'
  en: string;       // 'Megillah'
  sederSlug: SederSlug;
}

function slugify(en: string): string {
  return en.toLowerCase().replace(/\s+/g, '-');
}

interface TaxonomyBook {
  title: string;
  heTitle?: string;
  categoryPath?: string[];
}
interface TaxonomyCorpus {
  title?: { en?: string };
  books?: TaxonomyBook[];
}
interface Taxonomy {
  corpora?: TaxonomyCorpus[];
}

function buildBavliTractates(): TractateInfo[] {
  const tax = taxonomyJson as Taxonomy;
  const corp = tax.corpora?.find((c) => c.title?.en?.toLowerCase() === 'talmud');
  if (!corp?.books) return [];
  const out: TractateInfo[] = [];
  for (const b of corp.books) {
    const path = b.categoryPath;
    // Direct Bavli tractates only — three-segment path `Talmud / Bavli / Seder X`.
    // Skips commentaries ("Rashi on …"), minor tractates, modern commentary, etc.
    if (!path || path.length !== 3 || path[0] !== 'Talmud' || path[1] !== 'Bavli') continue;
    const sederSlug = SEDER_PATH_TO_SLUG[path[2]];
    if (!sederSlug) continue;
    out.push({
      slug: slugify(b.title),
      he: b.heTitle ?? b.title,
      en: b.title,
      sederSlug,
    });
  }
  return out;
}

export const BAVLI_TRACTATES: readonly TractateInfo[] = buildBavliTractates();

export interface SederWithTractates extends SederInfo {
  tractates: TractateInfo[];
}

export function groupBySeder(
  tractates: readonly TractateInfo[] = BAVLI_TRACTATES,
): SederWithTractates[] {
  return SEDARIM.map((s) => ({
    ...s,
    tractates: tractates.filter((t) => t.sederSlug === s.slug),
  }));
}

const REGISTERED_SLUGS = new Set(MASECHTOT.map((m) => m.book));

export function isRegisteredMasechet(slug: string): boolean {
  return REGISTERED_SLUGS.has(slug);
}

// ---------------------------------------------------------------------------
// Ref parsing for the search box
// ---------------------------------------------------------------------------

const HE_LETTER_TO_VAL: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
  'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90,
  'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
};

// Sum the letter values. "טו"=15 / "טז"=16 fall out naturally from the table
// (9+6, 9+7), so the special-case forms don't need extra handling.
export function parseHebrewNumeral(s: string): number | null {
  const cleaned = s.replace(/[׳״'"\s]/g, '').trim();
  if (!cleaned) return null;
  let total = 0;
  for (const ch of cleaned) {
    const v = HE_LETTER_TO_VAL[ch];
    if (v === undefined) return null;
    total += v;
  }
  return total > 0 ? total : null;
}

export interface RefMatch {
  tractate: TractateInfo;
  daf: number | null;  // null = just the masechet name, no daf part
}

/**
 * Format a {book, location} ref for display in the active site language.
 * The Sefaria ref baked into the YAML is always English ("Megillah 26"); we
 * synthesize the Hebrew form ("מגילה כ״ו") for any place that renders the
 * ref next to Hebrew copy.
 */
export function formatRef(
  bookSlug: string,
  location: string,
  lang: 'he' | 'en',
  tractates: readonly TractateInfo[] = BAVLI_TRACTATES,
): string {
  const tr = tractates.find((t) => t.slug === bookSlug);
  if (lang === 'en') {
    const en = tr ? tr.en : bookSlug;
    return location ? `${en} ${location}` : en;
  }
  const he = tr ? tr.he : bookSlug;
  if (!location) return he;
  const n = Number(location);
  return Number.isInteger(n) && n >= 1 && n <= 499
    ? `${he} ${hebrewNumeral(n)}`
    : `${he} ${location}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseRefInput(
  input: string,
  tractates: readonly TractateInfo[] = BAVLI_TRACTATES,
): RefMatch | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Sort by name length descending so "Bava Batra" wins over "Bava" if both
  // matched as prefixes — protects future ambiguous names.
  const sorted = [...tractates].sort(
    (a, b) => Math.max(b.en.length, b.he.length) - Math.max(a.en.length, a.he.length),
  );

  for (const t of sorted) {
    let rest: string | null = null;
    const enRe = new RegExp(`^${escapeRegex(t.en)}(?=\\s|$|\\d)`, 'i');
    if (enRe.test(trimmed)) {
      rest = trimmed.slice(t.en.length).trim();
    } else {
      const heRe = new RegExp(`^${escapeRegex(t.he)}(?=\\s|$|\\d|[\\u0590-\\u05FF])`);
      if (heRe.test(trimmed)) rest = trimmed.slice(t.he.length).trim();
    }
    if (rest === null) continue;
    if (rest === '') return { tractate: t, daf: null };

    // Arabic numeral (most common typed form)
    const arabic = rest.match(/^(\d+)/);
    if (arabic) {
      const n = Number(arabic[1]);
      if (Number.isInteger(n) && n > 0) return { tractate: t, daf: n };
    }
    // Hebrew numeral (e.g. "כו" or "ל״ב"), optional leading "דף"
    const heRest = rest.replace(/^דף\s*/, '');
    const heNum = parseHebrewNumeral(heRest);
    if (heNum !== null && heNum > 0) return { tractate: t, daf: heNum };

    return { tractate: t, daf: null };
  }

  return null;
}
