import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { extractMapMetadata } from './map-metadata.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, '../../test/fixtures');
const readFixture = (name: string) => readFileSync(resolve(fixturesDir, name), 'utf8');

describe('extractMapMetadata — Megillah 26 (Hebrew)', () => {
  const html = readFixture('megillah-26-he.html');
  const meta = extractMapMetadata(html);

  it('extracts the exact title from <title>', () => {
    expect(meta.title).toBe('מפת הסוגיא — מגילה כ״ו: מקרא מגילה בלילה וביום');
  });

  it('extracts the takeaway/blurb from <meta name="description">', () => {
    expect(meta.blurb).toBe(
      'חיוב מקרא מגילה חל גם בלילה וגם ביום; הברייתות והאמוראים מבררים את היחס בין שני הזמנים ואת הברכות שבכל אחד מהם.',
    );
  });

  it('extracts the canonical Sefaria ref', () => {
    expect(meta.sefariaRef).toBe('Megillah 26');
  });

  it('counts sugya sections via [data-sugya]', () => {
    expect(meta.sugyaCount).toBe(4);
  });

  it('infers language from <html lang>', () => {
    expect(meta.language).toBe('he');
  });

  it('flags the result as complete (incomplete=false, no missing fields)', () => {
    expect(meta.incomplete).toBe(false);
    expect(meta.missing).toEqual([]);
  });

  it('accepts a Buffer as input', () => {
    const buf = readFileSync(resolve(fixturesDir, 'megillah-26-he.html'));
    expect(extractMapMetadata(buf).sefariaRef).toBe('Megillah 26');
  });
});

describe('extractMapMetadata — missing <title>', () => {
  const html = `<!doctype html>
<html lang="he">
<head>
  <meta name="description" content="blurb here" />
  <meta name="chazarah:sefaria-ref" content="Megillah 26" />
</head>
<body><section data-sugya="1"></section></body>
</html>`;

  it('returns title as undefined and marks the result incomplete', () => {
    const meta = extractMapMetadata(html);
    expect(meta.title).toBeUndefined();
    expect(meta.incomplete).toBe(true);
    expect(meta.missing).toContain('title');
  });

  it('still extracts the other available fields', () => {
    const meta = extractMapMetadata(html);
    expect(meta.blurb).toBe('blurb here');
    expect(meta.sefariaRef).toBe('Megillah 26');
    expect(meta.sugyaCount).toBe(1);
    expect(meta.language).toBe('he');
  });
});

describe('extractMapMetadata — missing takeaway/blurb', () => {
  const html = `<!doctype html>
<html lang="he">
<head>
  <title>מגילה כ״ו</title>
  <meta name="chazarah:sefaria-ref" content="Megillah 26" />
</head>
<body></body>
</html>`;

  it('returns blurb undefined, marks incomplete, lists blurb missing', () => {
    const meta = extractMapMetadata(html);
    expect(meta.blurb).toBeUndefined();
    expect(meta.incomplete).toBe(true);
    expect(meta.missing).toContain('blurb');
  });

  it('omits sugyaCount when no sugya markers are present', () => {
    const meta = extractMapMetadata(html);
    expect(meta.sugyaCount).toBeUndefined();
  });
});

describe('extractMapMetadata — English-language map', () => {
  const html = `<!doctype html>
<html lang="en">
<head>
  <title>Map of the sugya — Megillah 26: Reading the Megillah at night and by day</title>
  <meta name="description" content="The duty to read the Megillah applies both at night and by day; the gemara clarifies the relationship between the two readings and their blessings." />
  <meta name="chazarah:sefaria-ref" content="Megillah 26" />
</head>
<body>
  <section data-sugya="1"></section>
  <section data-sugya="2"></section>
</body>
</html>`;

  it('infers language as "en"', () => {
    expect(extractMapMetadata(html).language).toBe('en');
  });

  it('still extracts title, blurb, ref, and count', () => {
    const meta = extractMapMetadata(html);
    expect(meta.title).toBe(
      'Map of the sugya — Megillah 26: Reading the Megillah at night and by day',
    );
    expect(meta.blurb?.startsWith('The duty to read')).toBe(true);
    expect(meta.sefariaRef).toBe('Megillah 26');
    expect(meta.sugyaCount).toBe(2);
    expect(meta.incomplete).toBe(false);
  });
});

describe('extractMapMetadata — malformed input', () => {
  it('does not throw on garbage input; returns an incomplete result', () => {
    expect(() => extractMapMetadata('not html at all')).not.toThrow();
    const meta = extractMapMetadata('not html at all');
    expect(meta.incomplete).toBe(true);
    expect(meta.title).toBeUndefined();
  });

  it('does not throw on empty input', () => {
    expect(() => extractMapMetadata('')).not.toThrow();
    expect(extractMapMetadata('').incomplete).toBe(true);
  });
});

describe('extractMapMetadata — language fallback', () => {
  it('falls back to script detection in <title> when <html lang> is absent', () => {
    const html = `<!doctype html><html><head><title>מגילה כ״ו</title></head><body></body></html>`;
    expect(extractMapMetadata(html).language).toBe('he');
  });

  it('falls back to "en" when title is Latin-only and <html lang> is absent', () => {
    const html = `<!doctype html><html><head><title>Megillah 26</title></head><body></body></html>`;
    expect(extractMapMetadata(html).language).toBe('en');
  });
});
