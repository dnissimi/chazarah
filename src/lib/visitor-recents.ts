/**
 * Visitor Recents — a tiny localStorage-backed store for the per-visitor
 * "Recently viewed" landing section. Versioned key so the schema can bump.
 *
 * Pure module: every operation takes a `Storage`-like object so the unit
 * tests can run without a DOM. The Map Info Page snippet and the landing
 * snippet pass `window.localStorage` (or `null` when unavailable).
 */

import type { Corpus } from './map-info';

export const VISITOR_RECENTS_KEY = 'chazarah.visitorRecents.v2';
export const VISITOR_RECENTS_MAX = 10;

export type VisitorRecentTopic = { he: string; en: string };

export type VisitorRecentInput = {
  corpus: Corpus;
  book: string;
  location: string;
  topic: VisitorRecentTopic;
  ref: string;
};

export type VisitorRecentEntry = VisitorRecentInput & {
  openedAt: string;
};

function isValidEntry(value: unknown): value is VisitorRecentEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  const topic = e.topic as Record<string, unknown> | undefined;
  return (
    typeof e.corpus === 'string' &&
    typeof e.book === 'string' &&
    typeof e.location === 'string' &&
    typeof e.ref === 'string' &&
    typeof e.openedAt === 'string' &&
    !!topic &&
    typeof topic.he === 'string' &&
    typeof topic.en === 'string'
  );
}

export function list(storage: Storage | null | undefined): VisitorRecentEntry[] {
  if (!storage) return [];
  let raw: string | null;
  try {
    raw = storage.getItem(VISITOR_RECENTS_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidEntry);
}

export function record(input: VisitorRecentInput, storage: Storage | null | undefined): void {
  if (!storage) return;
  const next: VisitorRecentEntry = {
    corpus: input.corpus,
    book: input.book,
    location: input.location,
    topic: { he: input.topic.he, en: input.topic.en },
    ref: input.ref,
    openedAt: new Date().toISOString(),
  };
  const existing = list(storage).filter(
    (e) => !(e.corpus === next.corpus && e.book === next.book && e.location === next.location),
  );
  const merged = [next, ...existing].slice(0, VISITOR_RECENTS_MAX);
  try {
    storage.setItem(VISITOR_RECENTS_KEY, JSON.stringify(merged));
  } catch {
    /* quota exceeded / private mode — drop silently */
  }
}

export function clear(storage: Storage | null | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(VISITOR_RECENTS_KEY);
  } catch {
    /* ignore */
  }
}
