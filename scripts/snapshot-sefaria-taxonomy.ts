/**
 * Build-time snapshot of Sefaria's corpus → book taxonomy.
 *
 * Fetches https://www.sefaria.org/api/index/, walks the tree, and writes
 * src/data/sefaria-taxonomy.json — a flattened view of every book under each
 * top-level corpus, keeping both Latin and Hebrew titles plus the full
 * category breadcrumb. Refresh manually with `pnpm snapshot:sefaria` (or
 * `npm run snapshot:sefaria`); see scripts/README.md for cadence.
 *
 * The pure `normalise()` function is unit-tested with a fixture; `main()` does
 * the live fetch + write and only runs when this file is invoked directly.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

export const SEFARIA_INDEX_ENDPOINT = 'https://www.sefaria.org/api/index/';

export type TaxonomyBook = {
  title: string;
  heTitle: string;
  categoryPath: string[];
};

export type TaxonomyCorpus = {
  slug: string;
  title: { en: string; he: string };
  books: TaxonomyBook[];
};

export type Taxonomy = {
  snapshotAt: string;
  source: string;
  corpora: TaxonomyCorpus[];
};

type SefariaIndexNode = {
  category?: string;
  heCategory?: string;
  title?: string;
  heTitle?: string;
  contents?: SefariaIndexNode[];
};

const BookSchema = z.object({
  title: z.string().min(1),
  heTitle: z.string().min(1),
  categoryPath: z.array(z.string()),
});

const CorpusSchema = z.object({
  slug: z.string().min(1),
  title: z.object({ en: z.string().min(1), he: z.string().min(1) }),
  books: z.array(BookSchema),
});

export const TaxonomySchema = z.object({
  snapshotAt: z.string().min(1),
  source: z.string().url(),
  corpora: z.array(CorpusSchema).min(1),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function walk(node: SefariaIndexNode, path: string[], out: TaxonomyBook[]): void {
  if (typeof node.title === 'string' && !Array.isArray(node.contents)) {
    out.push({
      title: node.title,
      heTitle: typeof node.heTitle === 'string' && node.heTitle.length > 0
        ? node.heTitle
        : node.title,
      categoryPath: path,
    });
    return;
  }
  if (typeof node.category === 'string') {
    const nextPath = [...path, node.category];
    for (const child of node.contents ?? []) {
      walk(child, nextPath, out);
    }
  }
}

export function normalise(index: SefariaIndexNode[]): TaxonomyCorpus[] {
  const corpora: TaxonomyCorpus[] = [];
  for (const root of index) {
    if (typeof root.category !== 'string') continue;
    const books: TaxonomyBook[] = [];
    for (const child of root.contents ?? []) {
      walk(child, [root.category], books);
    }
    if (books.length === 0) continue;
    corpora.push({
      slug: slugify(root.category),
      title: {
        en: root.category,
        he: root.heCategory ?? root.category,
      },
      books,
    });
  }
  return corpora;
}

async function main(): Promise<void> {
  const res = await fetch(SEFARIA_INDEX_ENDPOINT);
  if (!res.ok) {
    throw new Error(
      `Sefaria index fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  const index = (await res.json()) as SefariaIndexNode[];
  if (!Array.isArray(index)) {
    throw new Error('Sefaria index response was not an array');
  }

  const corpora = normalise(index);
  const taxonomy: Taxonomy = {
    snapshotAt: new Date().toISOString(),
    source: SEFARIA_INDEX_ENDPOINT,
    corpora,
  };
  TaxonomySchema.parse(taxonomy);

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = `${here}/../src/data/sefaria-taxonomy.json`;
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(taxonomy, null, 2) + '\n', 'utf8');

  const bookCount = corpora.reduce((n, c) => n + c.books.length, 0);
  console.log(
    `Wrote ${outPath} — ${corpora.length} corpora, ${bookCount} books.`,
  );
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
