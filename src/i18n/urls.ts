/**
 * Canonical / hreflang URL construction for the bilingual site.
 *
 * Hebrew is the default locale at the site root; English lives under `/en`.
 * Given the *language-neutral* path of a logical page (`/`, `/library`,
 * `/map/talmud/megillah/26`), this derives the absolute Hebrew and English URLs
 * and the self-referencing canonical for a given language. SITE is the absolute
 * origin (kept in sync with `site` in astro.config.mjs) so the URLs are correct
 * on Cloudflare regardless of the request host.
 */

import type { Lang } from './strings';

export const SITE = 'https://hazara.co.il';

/** Normalize a path to a leading-slash, no-trailing-slash form ('' → '/'). */
export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  const withLead = path.startsWith('/') ? path : `/${path}`;
  return withLead.length > 1 && withLead.endsWith('/')
    ? withLead.slice(0, -1)
    : withLead;
}

/** Absolute Hebrew URL for a language-neutral path (root, no /en prefix). */
export function heUrl(path: string): string {
  const p = normalizePath(path);
  return p === '/' ? `${SITE}/` : `${SITE}${p}`;
}

/** Absolute English URL for a language-neutral path (under /en). */
export function enUrl(path: string): string {
  const p = normalizePath(path);
  return p === '/' ? `${SITE}/en` : `${SITE}/en${p}`;
}

export interface Alternates {
  he: string;
  en: string;
  /** x-default points at the Hebrew (default-locale) URL. */
  xDefault: string;
  /** The self-referencing canonical for the page's own language. */
  canonical: string;
}

export function alternates(path: string, lang: Lang): Alternates {
  const he = heUrl(path);
  const en = enUrl(path);
  return { he, en, xDefault: he, canonical: lang === 'en' ? en : he };
}
