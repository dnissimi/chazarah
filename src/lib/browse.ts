/**
 * Pure helpers for the browse page at /map/<corpus>/<book>/.
 *
 * The Astro page adapts content-collection entries to BrowseMapEntry and
 * delegates to buildDapim() — that way these helpers are unit-testable
 * without needing the `astro:content` runtime.
 */

const HE_ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'] as const;
const HE_TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'] as const;

const GERESH = '׳';
const GERSHAYIM = '״';

export function hebrewNumeral(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 99) {
    throw new RangeError(`hebrewNumeral: out of range (1..99): ${n}`);
  }
  // 15 → ט״ו, 16 → ט״ז: the י״ה / י״ו forms collide with the divine name.
  if (n === 15) return 'ט' + GERSHAYIM + 'ו';
  if (n === 16) return 'ט' + GERSHAYIM + 'ז';

  const tens = Math.floor(n / 10);
  const ones = n % 10;
  if (tens === 0) return HE_ONES[ones] + GERESH;
  if (ones === 0) return HE_TENS[tens] + GERESH;
  return HE_TENS[tens] + GERSHAYIM + HE_ONES[ones];
}

export type VariantLang = 'he' | 'en' | 'yi';

export interface BrowseMapEntry {
  location: string;
  topic: { he: string; en: string };
  languages: VariantLang[];
}

export interface DafRow {
  n: number;
  hebrewNum: string;
  latin: string;
  map: BrowseMapEntry | null;
}

export interface DafBounds {
  firstDaf: number;
  lastDaf: number;
}

export function buildDapim(bounds: DafBounds, maps: BrowseMapEntry[]): DafRow[] {
  const rows: DafRow[] = [];
  for (let n = bounds.firstDaf; n <= bounds.lastDaf; n++) {
    const map = maps.find((m) => m.location === String(n)) ?? null;
    rows.push({
      n,
      hebrewNum: hebrewNumeral(n),
      latin: `${n}a—${n}b`,
      map,
    });
  }
  return rows;
}

export interface MasechetInfo {
  corpus: 'talmud';
  book: string;
  bounds: DafBounds;
  name: { he: string; en: string };
  summary: { he: string; en: string };
}

export const MASECHTOT: readonly MasechetInfo[] = [
  {
    corpus: 'talmud',
    book: 'megillah',
    bounds: { firstDaf: 2, lastDaf: 32 },
    name: { he: 'מגילה', en: 'Megillah' },
    summary: {
      he: 'כל דפי מסכת מגילה (ב׳ עד ל״ב). אפשר לסקור מה כבר מופה, או לבקש מה שעדיין לא.',
      en: "All folios of Tractate Megillah (2 through 32). Browse what's mapped, request what isn't.",
    },
  },
];
