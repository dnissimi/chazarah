import { describe, expect, it } from 'vitest';
import {
  BAVLI_TRACTATES,
  SEDARIM,
  groupBySeder,
  isRegisteredMasechet,
  parseHebrewNumeral,
  parseRefInput,
} from './library';

describe('BAVLI_TRACTATES', () => {
  it('lists exactly 37 direct Bavli tractates across the six sedarim', () => {
    // 1 Zeraim + 11 Moed + 7 Nashim + 8 Nezikin + 9 Kodashim + 1 Tohorot.
    expect(BAVLI_TRACTATES).toHaveLength(37);
  });

  it('includes the registered masechtot with the expected slugs and Hebrew names', () => {
    const byEn = new Map(BAVLI_TRACTATES.map((t) => [t.en, t]));
    expect(byEn.get('Berakhot')?.slug).toBe('berakhot');
    expect(byEn.get('Berakhot')?.he).toBe('ברכות');
    expect(byEn.get('Megillah')?.slug).toBe('megillah');
    expect(byEn.get('Chullin')?.slug).toBe('chullin');
    expect(byEn.get('Shabbat')?.slug).toBe('shabbat');
    expect(byEn.get('Bava Batra')?.slug).toBe('bava-batra');
  });

  it('tags each tractate with its seder', () => {
    const byEn = new Map(BAVLI_TRACTATES.map((t) => [t.en, t]));
    expect(byEn.get('Berakhot')?.sederSlug).toBe('zeraim');
    expect(byEn.get('Shabbat')?.sederSlug).toBe('moed');
    expect(byEn.get('Megillah')?.sederSlug).toBe('moed');
    expect(byEn.get('Chullin')?.sederSlug).toBe('kodashim');
    expect(byEn.get('Niddah')?.sederSlug).toBe('tohorot');
  });
});

describe('groupBySeder()', () => {
  it('returns all six sedarim in canonical order', () => {
    const groups = groupBySeder();
    expect(groups.map((g) => g.slug)).toEqual([
      'zeraim', 'moed', 'nashim', 'nezikin', 'kodashim', 'tohorot',
    ]);
  });

  it('partitions the tractates with the expected per-seder counts', () => {
    const counts = Object.fromEntries(
      groupBySeder().map((g) => [g.slug, g.tractates.length]),
    );
    expect(counts).toEqual({
      zeraim: 1, moed: 11, nashim: 7, nezikin: 8, kodashim: 9, tohorot: 1,
    });
  });

  it('preserves the seder he/en names from SEDARIM', () => {
    const groups = groupBySeder();
    const moed = groups.find((g) => g.slug === 'moed');
    const expected = SEDARIM.find((s) => s.slug === 'moed');
    expect(moed?.he).toBe(expected?.he);
    expect(moed?.en).toBe(expected?.en);
  });
});

describe('isRegisteredMasechet()', () => {
  it('returns true for masechtot already in MASECHTOT', () => {
    expect(isRegisteredMasechet('megillah')).toBe(true);
    expect(isRegisteredMasechet('chullin')).toBe(true);
    expect(isRegisteredMasechet('shabbat')).toBe(true);
  });

  it('returns false for tractates not yet registered', () => {
    expect(isRegisteredMasechet('berakhot')).toBe(false);
    expect(isRegisteredMasechet('bava-batra')).toBe(false);
    expect(isRegisteredMasechet('not-a-real-slug')).toBe(false);
  });
});

describe('parseHebrewNumeral()', () => {
  it('parses single letters', () => {
    expect(parseHebrewNumeral('א')).toBe(1);
    expect(parseHebrewNumeral('ב')).toBe(2);
    expect(parseHebrewNumeral('י')).toBe(10);
    expect(parseHebrewNumeral('כ')).toBe(20);
  });

  it('parses compound numerals', () => {
    expect(parseHebrewNumeral('יא')).toBe(11);
    expect(parseHebrewNumeral('כו')).toBe(26);
    expect(parseHebrewNumeral('לב')).toBe(32);
    expect(parseHebrewNumeral('קמב')).toBe(142);
  });

  it('handles the ט״ו / ט״ז forms', () => {
    expect(parseHebrewNumeral('טו')).toBe(15);
    expect(parseHebrewNumeral('טז')).toBe(16);
  });

  it('strips geresh and gershayim before parsing', () => {
    expect(parseHebrewNumeral('ב׳')).toBe(2);
    expect(parseHebrewNumeral('ל״ב')).toBe(32);
    expect(parseHebrewNumeral('ט״ו')).toBe(15);
  });

  it('returns null for empty or non-Hebrew input', () => {
    expect(parseHebrewNumeral('')).toBeNull();
    expect(parseHebrewNumeral('   ')).toBeNull();
    expect(parseHebrewNumeral('26')).toBeNull();
    expect(parseHebrewNumeral('abc')).toBeNull();
  });
});

describe('parseRefInput()', () => {
  it('parses an English ref with an Arabic daf', () => {
    const m = parseRefInput('Megillah 26');
    expect(m?.tractate.slug).toBe('megillah');
    expect(m?.daf).toBe(26);
  });

  it('is case-insensitive on the English book name', () => {
    expect(parseRefInput('megillah 26')?.tractate.slug).toBe('megillah');
    expect(parseRefInput('MEGILLAH 26')?.tractate.slug).toBe('megillah');
  });

  it('parses a Hebrew ref with an Arabic daf', () => {
    const m = parseRefInput('מגילה 26');
    expect(m?.tractate.slug).toBe('megillah');
    expect(m?.daf).toBe(26);
  });

  it('parses a Hebrew ref with a Hebrew-numeral daf', () => {
    const m = parseRefInput('מגילה כו');
    expect(m?.tractate.slug).toBe('megillah');
    expect(m?.daf).toBe(26);
  });

  it('parses just a masechet name (no daf)', () => {
    const m = parseRefInput('Berakhot');
    expect(m?.tractate.slug).toBe('berakhot');
    expect(m?.daf).toBeNull();

    const h = parseRefInput('ברכות');
    expect(h?.tractate.slug).toBe('berakhot');
    expect(h?.daf).toBeNull();
  });

  it('handles multi-word English tractates', () => {
    const m = parseRefInput('Bava Batra 100');
    expect(m?.tractate.slug).toBe('bava-batra');
    expect(m?.daf).toBe(100);
  });

  it('returns null for non-tractate input', () => {
    expect(parseRefInput('')).toBeNull();
    expect(parseRefInput('not a real ref')).toBeNull();
    expect(parseRefInput('xyz 26')).toBeNull();
  });

  it('handles leading "דף" before the daf number', () => {
    const m = parseRefInput('מגילה דף כו');
    expect(m?.tractate.slug).toBe('megillah');
    expect(m?.daf).toBe(26);
  });
});
