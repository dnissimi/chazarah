/**
 * Shared getStaticPaths builder for the per-masechet browse index, used by both
 * the Hebrew route (/map/:corpus/:book) and its English mirror
 * (/en/map/:corpus/:book). Astro requires getStaticPaths to be exported from
 * each prerendered page, so both files call this rather than duplicating the
 * collection→dapim logic. Lives apart from browse.ts (which stays free of the
 * astro:content runtime so it can be unit-tested under vitest).
 */

import { getCollection } from 'astro:content';
import { buildDapim, MASECHTOT, type BrowseMapEntry } from './browse';

export async function buildMapBookStaticPaths() {
  const allMaps = await getCollection('maps');
  return MASECHTOT.map((masechet) => {
    const entries: BrowseMapEntry[] = allMaps
      .filter(
        (entry) =>
          entry.data.corpus === masechet.corpus && entry.data.book === masechet.book,
      )
      .map((entry) => ({
        location: entry.data.location,
        topic: entry.data.topic,
        languages: entry.data.languages,
      }));
    const dapim = buildDapim(masechet.bounds, entries);
    return {
      params: { corpus: masechet.corpus, book: masechet.book },
      props: { masechet, dapim },
    };
  });
}
