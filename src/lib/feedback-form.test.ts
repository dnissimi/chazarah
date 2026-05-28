import { describe, it, expect } from 'vitest';
import { parseFeedbackPrefill, buildFeedbackPayload } from './feedback-form';
import { TARGET_LANGS } from './request-form';

describe('parseFeedbackPrefill()', () => {
  it('returns an empty ref and null variant when no params are present', () => {
    const result = parseFeedbackPrefill(new URLSearchParams(''));
    expect(result).toEqual({ ref: '', lang: null });
  });

  it('reads ref and lang from search params', () => {
    const result = parseFeedbackPrefill(new URLSearchParams('ref=Megillah+26&lang=he'));
    expect(result).toEqual({ ref: 'Megillah 26', lang: 'he' });
  });

  it('preserves Hebrew refs through URL decoding', () => {
    const params = new URLSearchParams();
    params.set('ref', 'מגילה כו');
    const result = parseFeedbackPrefill(params);
    expect(result.ref).toBe('מגילה כו');
  });

  it('accepts each known language variant', () => {
    for (const lang of TARGET_LANGS) {
      const result = parseFeedbackPrefill(new URLSearchParams(`ref=Megillah+26&lang=${lang}`));
      expect(result.lang).toBe(lang);
    }
  });

  it('leaves the variant null when lang is absent', () => {
    const result = parseFeedbackPrefill(new URLSearchParams('ref=Megillah+26'));
    expect(result.lang).toBeNull();
  });

  it('leaves the variant null when lang is unrecognized', () => {
    expect(parseFeedbackPrefill(new URLSearchParams('lang=fr')).lang).toBeNull();
  });

  it('normalizes an uppercase or padded lang', () => {
    expect(parseFeedbackPrefill(new URLSearchParams('lang=EN')).lang).toBe('en');
    expect(parseFeedbackPrefill(new URLSearchParams('lang=%20yi%20')).lang).toBe('yi');
  });

  it('trims whitespace from the ref', () => {
    const result = parseFeedbackPrefill(new URLSearchParams('ref=%20%20Megillah+26%20%20'));
    expect(result.ref).toBe('Megillah 26');
  });
});

describe('buildFeedbackPayload()', () => {
  it('builds a map-feedback payload matching the PRD JSON shape', () => {
    const payload = buildFeedbackPayload({
      ref: 'Megillah 26',
      languageVariant: 'he',
      nodeOrQuote: 'node 3',
      observation: 'the arrow from sugya 2 to 3 is reversed',
      email: 'reader@example.com',
      submittedAt: '2026-05-28T12:00:00.000Z',
    });

    expect(payload).toEqual({
      kind: 'map-feedback',
      schemaVersion: 1,
      ref: 'Megillah 26',
      languageVariant: 'he',
      nodeOrQuote: 'node 3',
      observation: 'the arrow from sugya 2 to 3 is reversed',
      email: 'reader@example.com',
      submittedAt: '2026-05-28T12:00:00.000Z',
    });
  });

  it('keeps languageVariant null when no variant was supplied', () => {
    const payload = buildFeedbackPayload({
      ref: 'Megillah 26',
      languageVariant: null,
      nodeOrQuote: '',
      observation: 'typo in the title',
      email: '',
      submittedAt: '2026-05-28T12:00:00.000Z',
    });

    expect(payload.languageVariant).toBeNull();
    expect(payload.nodeOrQuote).toBe('');
    expect(payload.email).toBe('');
    expect(payload.kind).toBe('map-feedback');
    expect(payload.schemaVersion).toBe(1);
  });
});
