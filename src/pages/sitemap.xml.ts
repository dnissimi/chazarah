/**
 * Hand-rolled sitemap covering all three kinds of indexable URL — chrome pages,
 * per-daf map-info pages, and the standalone map HTML files — each in both
 * languages with <xhtml:link hreflang> alternates (he / en / x-default→he).
 *
 * Hand-rolled rather than @astrojs/sitemap because the integration can't see
 * the SSR map-info route or the `_redirects`-served files under public/maps,
 * and its i18n mode assumes an all-prefixed layout (we keep Hebrew at root).
 * Prerendered so Cloudflare serves it as a static file.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { MASECHTOT } from '../lib/browse';
import { SITE } from '../i18n/urls';

export const prerender = true;

const heHref = (path: string) => (path === '/' ? `${SITE}/` : `${SITE}${path}`);
const enHref = (path: string) => (path === '/' ? `${SITE}/en` : `${SITE}/en${path}`);

/** A logical page that exists in both languages: emits a he <url> and an en
    <url>, each carrying the full hreflang alternate set. */
function bilingualUrls(path: string, lastmod?: string): string[] {
  const he = heHref(path);
  const en = enHref(path);
  const alts =
    `<xhtml:link rel="alternate" hreflang="he" href="${he}"/>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${en}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${he}"/>`;
  const mod = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return [
    `<url><loc>${he}</loc>${mod}${alts}</url>`,
    `<url><loc>${en}</loc>${mod}${alts}</url>`,
  ];
}

export const GET: APIRoute = async () => {
  const maps = await getCollection('maps');
  const urls: string[] = [];

  // 1. Chrome pages (he + en). /404 intentionally omitted.
  for (const p of ['/', '/library', '/request', '/feedback']) {
    urls.push(...bilingualUrls(p));
  }

  // 2a. Per-masechet browse indexes (prerendered, he + en).
  for (const m of MASECHTOT) {
    urls.push(...bilingualUrls(`/map/${m.corpus}/${m.book}`));
  }

  // 2b. Per-daf map-info pages (he + en).
  for (const m of maps) {
    urls.push(
      ...bilingualUrls(
        `/map/${m.data.corpus}/${m.data.book}/${m.data.location}`,
        m.data.updated,
      ),
    );
  }

  // 3. Standalone map HTML files — one <url> per language the map ships, with
  //    the he/en variants of the same map cross-linked as hreflang alternates.
  for (const m of maps) {
    const base = `/map/${m.data.corpus}/${m.data.book}/${m.data.location}`;
    const langs = m.data.languages.filter((l) => l === 'he' || l === 'en');
    const alts = langs
      .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${base}/${l}"/>`)
      .join('');
    for (const l of langs) {
      urls.push(
        `<url><loc>${SITE}${base}/${l}</loc><lastmod>${m.data.updated}</lastmod>${alts}</url>`,
      );
    }
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
