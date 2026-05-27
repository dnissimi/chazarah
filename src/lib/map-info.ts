import type { TargetLang } from './request-form';

export const DISPLAY_LANGS: readonly TargetLang[] = ['he', 'en', 'yi'] as const;

export type LocalizedString = { he: string; en: string };

export type Corpus = 'talmud' | 'mishnah' | 'tanakh' | 'halakhah' | 'midrash';

export type MapEntrySummary = {
  corpus: Corpus;
  book: string;
  location: string;
  topic?: LocalizedString;
};

export type AdjacentSlot = {
  location: string;
  entry: MapEntrySummary | null;
};

function parseIntegerLocation(location: string): number | null {
  if (!/^\d+$/.test(location)) return null;
  return Number.parseInt(location, 10);
}

export function adjacentLocationLabels(location: string): {
  previous: string | null;
  next: string | null;
} {
  const n = parseIntegerLocation(location);
  if (n === null) return { previous: null, next: null };
  return {
    previous: n > 1 ? String(n - 1) : null,
    next: String(n + 1),
  };
}

export function buildRequestUrl(sefariaRef: string, lang: TargetLang): string {
  const params = new URLSearchParams({ ref: sefariaRef, lang });
  return `/request?${params.toString()}`;
}

export function bookSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function syntheticRefFromUrl(book: string, location: string): string {
  return `${bookSlugToTitle(book)} ${location}`;
}

export function buildFeedbackUrl(sefariaRef: string): string {
  const params = new URLSearchParams({ ref: sefariaRef });
  return `/feedback?${params.toString()}`;
}

export function findEntryByLocation<T extends { book: string; location: string }>(
  entries: readonly T[],
  book: string,
  location: string,
): T | undefined {
  return entries.find((e) => e.book === book && e.location === location);
}

export function deriveAdjacents<T extends MapEntrySummary>(
  entries: readonly T[],
  book: string,
  location: string,
): { previous: AdjacentSlot | null; next: AdjacentSlot | null } {
  const labels = adjacentLocationLabels(location);
  const previous: AdjacentSlot | null =
    labels.previous === null
      ? null
      : {
          location: labels.previous,
          entry: findEntryByLocation(entries, book, labels.previous) ?? null,
        };
  const next: AdjacentSlot | null =
    labels.next === null
      ? null
      : {
          location: labels.next,
          entry: findEntryByLocation(entries, book, labels.next) ?? null,
        };
  return { previous, next };
}
