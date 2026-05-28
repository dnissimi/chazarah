/**
 * Submission validation + GitHub-issue templating.
 *
 * This is the server-side contract for the /api/submit endpoint (issue #13).
 * It validates the payloads frozen by request-form.ts / feedback-form.ts and
 * renders each into a GitHub issue (a machine-parseable JSON block followed by
 * a human-readable summary, per PRD 0001 "Issue body templates").
 *
 * The JSON block is what a future /chazarah-fulfill run parses; the prose is
 * for the owner triaging in GitHub's UI. `schemaVersion` lets the parser
 * reject payload shapes it doesn't understand.
 */

import { z } from 'zod';
import { TARGET_LANGS } from './request-form';

const targetLang = z.enum(TARGET_LANGS);

export const requestSchema = z.object({
  kind: z.literal('map-request'),
  schemaVersion: z.literal(1),
  ref: z.object({
    raw: z.string().min(1).max(200),
    resolved: z.string().max(200).nullable(),
    resolvedOk: z.boolean(),
  }),
  targetLanguage: targetLang,
  note: z.string().max(2000),
  email: z.string().max(320),
  submittedAt: z.string().min(1),
});

export const feedbackSchema = z.object({
  kind: z.literal('map-feedback'),
  schemaVersion: z.literal(1),
  ref: z.string().min(1).max(200),
  languageVariant: targetLang.nullable(),
  nodeOrQuote: z.string().max(200),
  observation: z.string().min(1).max(5000),
  email: z.string().max(320),
  submittedAt: z.string().min(1),
});

export const submissionSchema = z.discriminatedUnion('kind', [
  requestSchema,
  feedbackSchema,
]);

export type Submission = z.infer<typeof submissionSchema>;

export type ParsedSubmission =
  | { ok: true; data: Submission }
  | { ok: false; error: string };

export function parseSubmission(raw: unknown): ParsedSubmission {
  const result = submissionSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const error = result.error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  return { ok: false, error };
}

export type IssueSpec = { title: string; labels: string[]; body: string };

function jsonBlock(value: unknown): string {
  return ['```json', JSON.stringify(value, null, 2), '```'].join('\n');
}

export function buildIssue(s: Submission): IssueSpec {
  if (s.kind === 'map-request') {
    const refLabel = s.ref.resolved ?? s.ref.raw;
    return {
      title: `[Request] ${refLabel} — ${s.targetLanguage.toUpperCase()}`,
      labels: ['map-request', 'needs-triage'],
      body: [
        jsonBlock(s),
        '',
        '## Map Request',
        `- **Reference (raw):** ${s.ref.raw}`,
        `- **Reference (resolved):** ${s.ref.resolved ?? '_not resolved_'}`,
        `- **Resolved OK:** ${s.ref.resolvedOk ? 'yes' : 'no — needs manual check'}`,
        `- **Target language:** ${s.targetLanguage}`,
        `- **Note:** ${s.note || '_none_'}`,
        `- **Email:** ${s.email || '_none_'}`,
        `- **Submitted:** ${s.submittedAt}`,
      ].join('\n'),
    };
  }

  const variant = s.languageVariant ? ` / ${s.languageVariant.toUpperCase()}` : '';
  return {
    title: `[Feedback] ${s.ref}${variant}`,
    labels: ['map-feedback', 'needs-triage'],
    body: [
      jsonBlock(s),
      '',
      '## Map Feedback',
      `- **Map:** ${s.ref}`,
      `- **Language variant:** ${s.languageVariant ?? '_unspecified_'}`,
      `- **Node / quote:** ${s.nodeOrQuote || '_none_'}`,
      `- **Email:** ${s.email || '_none_'}`,
      `- **Submitted:** ${s.submittedAt}`,
      '',
      '### Observation',
      '',
      s.observation,
    ].join('\n'),
  };
}
