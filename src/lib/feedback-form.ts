/**
 * Pure helpers for the /feedback form.
 *
 * Like /request (slice 10), v0 only console.logs the payload — but the shape
 * is the PRD-locked contract the Submission Worker (slice/issue #13) will
 * consume, so we freeze it here and test it now. See PRD 0001 — "Issue body
 * templates", Map Feedback block.
 */

import { TARGET_LANGS, type TargetLang } from './request-form';

function isTargetLang(value: string): value is TargetLang {
  return (TARGET_LANGS as readonly string[]).includes(value);
}

export type FeedbackPrefill = {
  ref: string;
  lang: TargetLang | null;
};

export function parseFeedbackPrefill(params: URLSearchParams): FeedbackPrefill {
  const rawRef = params.get('ref') ?? '';
  const rawLang = (params.get('lang') ?? '').trim().toLowerCase();
  const lang: TargetLang | null = isTargetLang(rawLang) ? rawLang : null;
  return { ref: rawRef.trim(), lang };
}

export type FeedbackFormInput = {
  ref: string;
  languageVariant: TargetLang | null;
  nodeOrQuote: string;
  observation: string;
  email: string;
  submittedAt: string;
};

export type FeedbackPayload = {
  kind: 'map-feedback';
  schemaVersion: 1;
  ref: string;
  languageVariant: TargetLang | null;
  nodeOrQuote: string;
  observation: string;
  email: string;
  submittedAt: string;
};

export function buildFeedbackPayload(input: FeedbackFormInput): FeedbackPayload {
  return {
    kind: 'map-feedback',
    schemaVersion: 1,
    ref: input.ref,
    languageVariant: input.languageVariant,
    nodeOrQuote: input.nodeOrQuote,
    observation: input.observation,
    email: input.email,
    submittedAt: input.submittedAt,
  };
}
