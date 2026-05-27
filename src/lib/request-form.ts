/**
 * Pure helpers for the /request form.
 *
 * Slice 10 only console.logs the payload, but the shape is the PRD-locked
 * contract the Worker (slice 11) will consume — so we freeze it here and test
 * the round-trip now.
 */

export const TARGET_LANGS = ['he', 'en', 'yi'] as const;
export type TargetLang = (typeof TARGET_LANGS)[number];

export const DEFAULT_TARGET_LANG: TargetLang = 'he';

export type RequestPrefill = {
  ref: string;
  lang: TargetLang;
};

function isTargetLang(value: string): value is TargetLang {
  return (TARGET_LANGS as readonly string[]).includes(value);
}

export function parseRequestPrefill(params: URLSearchParams): RequestPrefill {
  const rawRef = params.get('ref') ?? '';
  const rawLang = (params.get('lang') ?? '').trim().toLowerCase();
  const lang: TargetLang = isTargetLang(rawLang) ? rawLang : DEFAULT_TARGET_LANG;
  return { ref: rawRef.trim(), lang };
}

export type RequestFormInput = {
  rawRef: string;
  resolvedRef: string | null;
  resolvedOk: boolean;
  targetLanguage: TargetLang;
  note: string;
  email: string;
  submittedAt: string;
};

export type RequestPayload = {
  kind: 'map-request';
  schemaVersion: 1;
  ref: { raw: string; resolved: string | null; resolvedOk: boolean };
  targetLanguage: TargetLang;
  note: string;
  email: string;
  submittedAt: string;
};

export function buildRequestPayload(input: RequestFormInput): RequestPayload {
  return {
    kind: 'map-request',
    schemaVersion: 1,
    ref: {
      raw: input.rawRef,
      resolved: input.resolvedRef,
      resolvedOk: input.resolvedOk,
    },
    targetLanguage: input.targetLanguage,
    note: input.note,
    email: input.email,
    submittedAt: input.submittedAt,
  };
}
