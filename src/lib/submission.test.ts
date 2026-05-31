import { describe, it, expect } from 'vitest';
import { parseSubmission, buildIssue } from './submission';
import { buildRequestPayload } from './request-form';
import { buildFeedbackPayload } from './feedback-form';

describe('parseSubmission', () => {
  it('accepts a valid map-request built by the request form', () => {
    const payload = buildRequestPayload({
      rawRef: 'מגילה כו',
      resolvedRef: 'Megillah 26',
      resolvedOk: true,
      targetLanguage: 'he',
      note: 'for daf yomi',
      email: 'a@b.com',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    const parsed = parseSubmission(payload);
    expect(parsed.ok).toBe(true);
  });

  it('accepts a valid map-feedback built by the feedback form', () => {
    const payload = buildFeedbackPayload({
      ref: 'Megillah 26',
      languageVariant: 'he',
      nodeOrQuote: 'node 3',
      observation: 'The label should be מיתיבי, not קושיא.',
      email: '',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    const parsed = parseSubmission(payload);
    expect(parsed.ok).toBe(true);
  });

  it('rejects an unknown kind', () => {
    const parsed = parseSubmission({ kind: 'map-rumor', schemaVersion: 1 });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a feedback payload with an empty observation', () => {
    const parsed = parseSubmission({
      kind: 'map-feedback',
      schemaVersion: 1,
      ref: 'Megillah 26',
      languageVariant: null,
      nodeOrQuote: '',
      observation: '',
      email: '',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a request payload missing required fields', () => {
    const parsed = parseSubmission({ kind: 'map-request', schemaVersion: 1 });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.length).toBeGreaterThan(0);
  });

  it('rejects a wrong schemaVersion', () => {
    const parsed = parseSubmission({
      kind: 'map-request',
      schemaVersion: 2,
      ref: { raw: 'x', resolved: null, resolvedOk: false },
      targetLanguage: 'he',
      note: '',
      email: '',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    expect(parsed.ok).toBe(false);
  });
});

describe('buildIssue', () => {
  it('renders a map-request with correct title, labels, and a parseable JSON block', () => {
    const payload = buildRequestPayload({
      rawRef: 'מגילה כו',
      resolvedRef: 'Megillah 26',
      resolvedOk: true,
      targetLanguage: 'en',
      note: '',
      email: '',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    const parsed = parseSubmission(payload);
    if (!parsed.ok) throw new Error(parsed.error);
    const issue = buildIssue(parsed.data);

    expect(issue.title).toBe('[Request] Megillah 26 — EN');
    expect(issue.labels).toEqual(['map-request', 'ready-for-agent']);

    const json = issue.body.match(/```json\n([\s\S]*?)\n```/);
    expect(json).not.toBeNull();
    const roundTripped = JSON.parse(json![1]);
    expect(roundTripped.kind).toBe('map-request');
    expect(roundTripped.ref.resolved).toBe('Megillah 26');
  });

  it('uses the raw ref in the title when resolution failed', () => {
    const payload = buildRequestPayload({
      rawRef: 'Sukkah 2',
      resolvedRef: null,
      resolvedOk: false,
      targetLanguage: 'he',
      note: '',
      email: '',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    const parsed = parseSubmission(payload);
    if (!parsed.ok) throw new Error(parsed.error);
    const issue = buildIssue(parsed.data);
    expect(issue.title).toBe('[Request] Sukkah 2 — HE');
    expect(issue.body).toContain('needs manual check');
  });

  it('renders a map-feedback with the observation in the body', () => {
    const payload = buildFeedbackPayload({
      ref: 'Megillah 26',
      languageVariant: 'he',
      nodeOrQuote: 'node 3',
      observation: 'The label should be מיתיבי, not קושיא.',
      email: '',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    const parsed = parseSubmission(payload);
    if (!parsed.ok) throw new Error(parsed.error);
    const issue = buildIssue(parsed.data);

    expect(issue.title).toBe('[Feedback] Megillah 26 / HE');
    expect(issue.labels).toEqual(['map-feedback', 'needs-triage']);
    expect(issue.body).toContain('The label should be מיתיבי, not קושיא.');
  });

  it('omits the variant suffix when feedback has no language variant', () => {
    const payload = buildFeedbackPayload({
      ref: 'Berakhot 2',
      languageVariant: null,
      nodeOrQuote: '',
      observation: 'Missing the conclusion.',
      email: '',
      submittedAt: '2026-05-28T00:00:00.000Z',
    });
    const parsed = parseSubmission(payload);
    if (!parsed.ok) throw new Error(parsed.error);
    const issue = buildIssue(parsed.data);
    expect(issue.title).toBe('[Feedback] Berakhot 2');
  });
});
