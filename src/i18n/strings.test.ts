import { describe, it, expect } from 'vitest';
import { DEFAULT_LANG, DIR, LANGS, strings, t } from './strings';

describe('i18n strings table', () => {
  it('has Hebrew as the default language', () => {
    expect(DEFAULT_LANG).toBe('he');
  });

  it('declares both he and en', () => {
    expect(LANGS).toContain('he');
    expect(LANGS).toContain('en');
  });

  it('Hebrew is the canonical table — every key has a non-empty Hebrew value', () => {
    for (const [key, value] of Object.entries(strings.he)) {
      expect(typeof value, `he.${key}`).toBe('string');
      expect(value.length, `he.${key}`).toBeGreaterThan(0);
    }
  });

  it('every English key (when present) corresponds to a Hebrew key', () => {
    const heKeys = new Set(Object.keys(strings.he));
    for (const enKey of Object.keys(strings.en)) {
      expect(heKeys.has(enKey), `en.${enKey} has no Hebrew counterpart`).toBe(true);
    }
  });

  it('t() returns the language-specific value when present', () => {
    expect(t('he', 'navHome')).toBe(strings.he.navHome);
    expect(t('en', 'navHome')).toBe(strings.en.navHome);
  });

  it('t() falls back to Hebrew when a key is missing in the requested language', () => {
    const original = strings.en.navHome;
    delete strings.en.navHome;
    try {
      expect(t('en', 'navHome')).toBe(strings.he.navHome);
    } finally {
      strings.en.navHome = original;
    }
  });

  it('maps each language to the correct text direction', () => {
    expect(DIR.he).toBe('rtl');
    expect(DIR.en).toBe('ltr');
  });
});
