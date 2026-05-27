import { describe, it, expect } from 'vitest';
import { parseRequestPrefill, buildRequestPayload, TARGET_LANGS } from './request-form';

describe('parseRequestPrefill()', () => {
  it('returns empty defaults when no params are present', () => {
    const result = parseRequestPrefill(new URLSearchParams(''));
    expect(result).toEqual({ ref: '', lang: 'he' });
  });

  it('reads ref and lang from search params', () => {
    const result = parseRequestPrefill(new URLSearchParams('ref=Megillah+26&lang=en'));
    expect(result).toEqual({ ref: 'Megillah 26', lang: 'en' });
  });

  it('preserves Hebrew refs through URL decoding', () => {
    const params = new URLSearchParams();
    params.set('ref', 'מגילה כו');
    const result = parseRequestPrefill(params);
    expect(result.ref).toBe('מגילה כו');
  });

  it('accepts each known target language', () => {
    for (const lang of TARGET_LANGS) {
      const result = parseRequestPrefill(new URLSearchParams(`lang=${lang}`));
      expect(result.lang).toBe(lang);
    }
  });

  it('falls back to he when lang is unrecognized', () => {
    const result = parseRequestPrefill(new URLSearchParams('lang=fr'));
    expect(result.lang).toBe('he');
  });

  it('falls back to he when lang is uppercase or padded', () => {
    expect(parseRequestPrefill(new URLSearchParams('lang=EN')).lang).toBe('en');
    expect(parseRequestPrefill(new URLSearchParams('lang=%20yi%20')).lang).toBe('yi');
  });

  it('trims whitespace from the ref', () => {
    const result = parseRequestPrefill(new URLSearchParams('ref=%20%20Megillah+26%20%20'));
    expect(result.ref).toBe('Megillah 26');
  });
});

describe('buildRequestPayload()', () => {
  it('builds a map-request payload matching the PRD JSON shape', () => {
    const payload = buildRequestPayload({
      rawRef: 'מגילה כו',
      resolvedRef: 'Megillah 26',
      resolvedOk: true,
      targetLanguage: 'he',
      note: 'please add Rashi',
      email: 'reader@example.com',
      submittedAt: '2026-05-27T12:00:00.000Z',
    });

    expect(payload).toEqual({
      kind: 'map-request',
      schemaVersion: 1,
      ref: { raw: 'מגילה כו', resolved: 'Megillah 26', resolvedOk: true },
      targetLanguage: 'he',
      note: 'please add Rashi',
      email: 'reader@example.com',
      submittedAt: '2026-05-27T12:00:00.000Z',
    });
  });

  it('records resolvedOk:false and a null resolved ref when lookup failed', () => {
    const payload = buildRequestPayload({
      rawRef: 'zzznotathing',
      resolvedRef: null,
      resolvedOk: false,
      targetLanguage: 'en',
      note: '',
      email: '',
      submittedAt: '2026-05-27T12:00:00.000Z',
    });

    expect(payload.ref).toEqual({ raw: 'zzznotathing', resolved: null, resolvedOk: false });
    expect(payload.note).toBe('');
    expect(payload.email).toBe('');
    expect(payload.targetLanguage).toBe('en');
  });
});
