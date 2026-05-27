import { describe, it, expect } from 'vitest';
import {
  DISPLAY_LANGS,
  adjacentLocationLabels,
  buildRequestUrl,
  buildFeedbackUrl,
  findEntryByLocation,
  deriveAdjacents,
  bookSlugToTitle,
  syntheticRefFromUrl,
} from './map-info';

describe('DISPLAY_LANGS', () => {
  it('exposes HE, EN, YI in the documented order', () => {
    expect(DISPLAY_LANGS).toEqual(['he', 'en', 'yi']);
  });
});

describe('adjacentLocationLabels()', () => {
  it('returns numeric previous and next for an integer location', () => {
    expect(adjacentLocationLabels('26')).toEqual({ previous: '25', next: '27' });
  });

  it('returns null previous when the location is 1', () => {
    expect(adjacentLocationLabels('1')).toEqual({ previous: null, next: '2' });
  });

  it('returns both null for non-numeric locations', () => {
    expect(adjacentLocationLabels('2.3')).toEqual({ previous: null, next: null });
    expect(adjacentLocationLabels('2a-3b')).toEqual({ previous: null, next: null });
  });
});

describe('buildRequestUrl()', () => {
  it('encodes a Latin ref and a target language into the request URL', () => {
    expect(buildRequestUrl('Megillah 26', 'en')).toBe(
      '/request?ref=Megillah+26&lang=en',
    );
  });

  it('URL-encodes Hebrew refs', () => {
    const url = buildRequestUrl('מגילה כו', 'he');
    expect(url.startsWith('/request?ref=')).toBe(true);
    expect(url).toContain('lang=he');
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('ref')).toBe('מגילה כו');
    expect(params.get('lang')).toBe('he');
  });
});

describe('buildFeedbackUrl()', () => {
  it('URL-encodes the canonical Latin ref', () => {
    expect(buildFeedbackUrl('Megillah 26')).toBe('/feedback?ref=Megillah+26');
  });
});

describe('bookSlugToTitle()', () => {
  it('capitalizes a single-word slug', () => {
    expect(bookSlugToTitle('megillah')).toBe('Megillah');
  });

  it('title-cases a hyphenated slug', () => {
    expect(bookSlugToTitle('jerusalem-talmud-megillah')).toBe('Jerusalem Talmud Megillah');
  });
});

describe('syntheticRefFromUrl()', () => {
  it('combines a title-cased book slug with the location', () => {
    expect(syntheticRefFromUrl('megillah', '15')).toBe('Megillah 15');
  });
});

describe('findEntryByLocation()', () => {
  const entries = [
    { location: '26', book: 'megillah', corpus: 'talmud' as const },
    { location: '2', book: 'megillah', corpus: 'talmud' as const },
  ];

  it('returns the matching entry', () => {
    expect(findEntryByLocation(entries, 'megillah', '26')?.location).toBe('26');
  });

  it('returns undefined when no entry matches', () => {
    expect(findEntryByLocation(entries, 'megillah', '15')).toBeUndefined();
  });

  it('does not match a different book', () => {
    expect(findEntryByLocation(entries, 'shabbat', '26')).toBeUndefined();
  });
});

describe('deriveAdjacents()', () => {
  const entries = [
    {
      location: '26',
      book: 'megillah',
      corpus: 'talmud' as const,
      topic: { he: 'מקרא מגילה', en: 'Reading the Megillah' },
    },
    {
      location: '2',
      book: 'megillah',
      corpus: 'talmud' as const,
      topic: { he: 'זמני קריאה', en: 'Times of reading' },
    },
  ];

  it('returns dashed prev/next labels with no entry when adjacents do not exist', () => {
    const { previous, next } = deriveAdjacents(entries, 'megillah', '26');
    expect(previous).toEqual({ location: '25', entry: null });
    expect(next).toEqual({ location: '27', entry: null });
  });

  it('returns the entry when an adjacent location has a map', () => {
    const { previous, next } = deriveAdjacents(entries, 'megillah', '3');
    expect(previous?.location).toBe('2');
    expect(previous?.entry?.topic?.he).toBe('זמני קריאה');
    expect(next).toEqual({ location: '4', entry: null });
  });

  it('omits previous when location is 1', () => {
    const { previous, next } = deriveAdjacents(entries, 'megillah', '1');
    expect(previous).toBeNull();
    expect(next?.location).toBe('2');
    expect(next?.entry?.topic?.en).toBe('Times of reading');
  });

  it('returns both null when location is not numeric', () => {
    expect(deriveAdjacents(entries, 'megillah', '2.3')).toEqual({
      previous: null,
      next: null,
    });
  });
});
