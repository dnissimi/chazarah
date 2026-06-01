/**
 * Pure helpers for the browse page at /map/<corpus>/<book>/.
 *
 * The Astro page adapts content-collection entries to BrowseMapEntry and
 * delegates to buildDapim() — that way these helpers are unit-testable
 * without needing the `astro:content` runtime.
 */

const HE_ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'] as const;
const HE_TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'] as const;
const HE_HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'] as const;

const GERESH = '׳';
const GERSHAYIM = '״';

// Covers 1..499 — enough for every Talmud daf (the longest, Bava Batra, ends
// at 176). Builds the bare letter sequence, then punctuates: gershayim before
// the final letter, or a trailing geresh for a single letter.
export function hebrewNumeral(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 499) {
    throw new RangeError(`hebrewNumeral: out of range (1..499): ${n}`);
  }
  const hundreds = Math.floor(n / 100);
  const rem = n % 100;

  let letters = HE_HUNDREDS[hundreds];
  // 15 → ט״ו, 16 → ט״ז: the י-ה / י-ו forms collide with the divine name.
  if (rem === 15) letters += 'טו';
  else if (rem === 16) letters += 'טז';
  else letters += HE_TENS[Math.floor(rem / 10)] + HE_ONES[rem % 10];

  if (letters.length === 1) return letters + GERESH;
  return letters.slice(0, -1) + GERSHAYIM + letters.slice(-1);
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
  {
    corpus: 'talmud',
    book: 'chullin',
    bounds: { firstDaf: 2, lastDaf: 142 },
    name: { he: 'חולין', en: 'Chullin' },
    summary: {
      he: 'כל דפי מסכת חולין (ב׳ עד קמ״ב). אפשר לסקור מה כבר מופה, או לבקש מה שעדיין לא.',
      en: "All folios of Tractate Chullin (2 through 142). Browse what's mapped, request what isn't.",
    },
  },
  {
    corpus: 'talmud',
    book: 'shabbat',
    bounds: { firstDaf: 2, lastDaf: 157 },
    name: { he: 'שבת', en: 'Shabbat' },
    summary: {
      he: 'כל דפי מסכת שבת (ב׳ עד קנ״ז). אפשר לסקור מה כבר מופה, או לבקש מה שעדיין לא.',
      en: "All folios of Tractate Shabbat (2 through 157). Browse what's mapped, request what isn't.",
    },
  },
  {
    corpus: 'talmud',
    book: 'bava-kamma',
    bounds: { firstDaf: 2, lastDaf: 119 },
    name: { he: 'בבא קמא', en: 'Bava Kamma' },
    summary: {
      he: 'כל דפי מסכת בבא קמא (ב׳ עד קי״ט). אפשר לסקור מה כבר מופה, או לבקש מה שעדיין לא.',
      en: "All folios of Tractate Bava Kamma (2 through 119). Browse what's mapped, request what isn't.",
    },
  },
];
