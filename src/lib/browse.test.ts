import { describe, expect, it } from 'vitest';
import {
  buildDapim,
  hebrewNumeral,
  MASECHTOT,
  type BrowseMapEntry,
} from './browse';

describe('hebrewNumeral()', () => {
  it('renders single-digit numerals with a geresh', () => {
    expect(hebrewNumeral(1)).toBe('א׳');
    expect(hebrewNumeral(2)).toBe('ב׳');
    expect(hebrewNumeral(3)).toBe('ג׳');
    expect(hebrewNumeral(9)).toBe('ט׳');
  });

  it('renders the tens with a geresh', () => {
    expect(hebrewNumeral(10)).toBe('י׳');
    expect(hebrewNumeral(20)).toBe('כ׳');
    expect(hebrewNumeral(30)).toBe('ל׳');
  });

  it('renders teens with gershayim between tens and ones', () => {
    expect(hebrewNumeral(11)).toBe('י״א');
    expect(hebrewNumeral(12)).toBe('י״ב');
    expect(hebrewNumeral(14)).toBe('י״ד');
    expect(hebrewNumeral(17)).toBe('י״ז');
    expect(hebrewNumeral(18)).toBe('י״ח');
    expect(hebrewNumeral(19)).toBe('י״ט');
  });

  it('uses the special forms ט״ו and ט״ז for 15 and 16 (not the divine name)', () => {
    expect(hebrewNumeral(15)).toBe('ט״ו');
    expect(hebrewNumeral(16)).toBe('ט״ז');
  });

  it('renders 21-32 (the upper Megillah range) correctly', () => {
    expect(hebrewNumeral(21)).toBe('כ״א');
    expect(hebrewNumeral(25)).toBe('כ״ה');
    expect(hebrewNumeral(26)).toBe('כ״ו');
    expect(hebrewNumeral(28)).toBe('כ״ח');
    expect(hebrewNumeral(31)).toBe('ל״א');
    expect(hebrewNumeral(32)).toBe('ל״ב');
  });
});

describe('buildDapim()', () => {
  const megillah26: BrowseMapEntry = {
    location: '26',
    topic: { he: 'מקרא מגילה בלילה וביום', en: 'Reading the Megillah at night and by day' },
    languages: ['he'],
  };

  it('produces a row per daf in [firstDaf, lastDaf]', () => {
    const rows = buildDapim({ firstDaf: 2, lastDaf: 32 }, [megillah26]);
    expect(rows).toHaveLength(31);
    expect(rows[0].n).toBe(2);
    expect(rows[rows.length - 1].n).toBe(32);
  });

  it('labels each row with the Hebrew numeral and a "Na—Nb" Latin range', () => {
    const [row2, row26] = buildDapim({ firstDaf: 2, lastDaf: 32 }, [megillah26])
      .filter((r) => r.n === 2 || r.n === 26)
      .sort((a, b) => a.n - b.n);
    expect(row2.hebrewNum).toBe('ב׳');
    expect(row2.latin).toBe('2a—2b');
    expect(row26.hebrewNum).toBe('כ״ו');
    expect(row26.latin).toBe('26a—26b');
  });

  it('attaches the map entry to the matching daf row', () => {
    const rows = buildDapim({ firstDaf: 2, lastDaf: 32 }, [megillah26]);
    const row26 = rows.find((r) => r.n === 26);
    expect(row26?.map).toEqual(megillah26);
  });

  it('returns null for the .map field on dapim with no matching entry', () => {
    const rows = buildDapim({ firstDaf: 2, lastDaf: 32 }, [megillah26]);
    const empties = rows.filter((r) => r.map === null);
    expect(empties).toHaveLength(30);
    expect(empties.every((r) => r.n !== 26)).toBe(true);
  });

  it('ignores entries whose location is outside the bounds (defensive)', () => {
    const rogue: BrowseMapEntry = {
      location: '99',
      topic: { he: 'x', en: 'x' },
      languages: ['he'],
    };
    const rows = buildDapim({ firstDaf: 2, lastDaf: 32 }, [megillah26, rogue]);
    expect(rows).toHaveLength(31);
    expect(rows.every((r) => r.map?.location !== '99')).toBe(true);
  });
});

describe('MASECHTOT registry', () => {
  it('includes talmud/megillah with bounds 2-32', () => {
    const m = MASECHTOT.find((x) => x.corpus === 'talmud' && x.book === 'megillah');
    expect(m).toBeDefined();
    expect(m?.bounds).toEqual({ firstDaf: 2, lastDaf: 32 });
    expect(m?.name.he).toBe('מגילה');
    expect(m?.name.en).toBe('Megillah');
  });

  it('every entry has a bilingual summary string', () => {
    for (const m of MASECHTOT) {
      expect(m.summary.he.length).toBeGreaterThan(0);
      expect(m.summary.en.length).toBeGreaterThan(0);
    }
  });
});
