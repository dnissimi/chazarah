import { describe, expect, it } from 'vitest';
import { normalise, TaxonomySchema } from './snapshot-sefaria-taxonomy';

const sefariaIndexFixture = [
  {
    category: 'Tanakh',
    heCategory: 'תנ״ך',
    contents: [
      {
        category: 'Torah',
        heCategory: 'תורה',
        contents: [
          { title: 'Genesis', heTitle: 'בראשית' },
          { title: 'Exodus', heTitle: 'שמות' },
        ],
      },
    ],
  },
  {
    category: 'Talmud',
    heCategory: 'תלמוד',
    contents: [
      {
        category: 'Bavli',
        heCategory: 'בבלי',
        contents: [
          {
            category: 'Seder Moed',
            heCategory: 'סדר מועד',
            contents: [
              { title: 'Megillah', heTitle: 'מגילה' },
            ],
          },
        ],
      },
    ],
  },
  {
    category: 'EmptyCorpus',
    heCategory: 'ריק',
    contents: [],
  },
  {
    title: 'Stray leaf at top level',
    heTitle: 'עלה תועה',
  },
];

describe('normalise()', () => {
  it('flattens the index into corpora with breadcrumb paths', () => {
    const corpora = normalise(sefariaIndexFixture);

    expect(corpora.map((c) => c.slug)).toEqual(['tanakh', 'talmud']);

    const tanakh = corpora.find((c) => c.slug === 'tanakh');
    expect(tanakh).toBeDefined();
    expect(tanakh?.title).toEqual({ en: 'Tanakh', he: 'תנ״ך' });
    expect(tanakh?.books).toEqual([
      { title: 'Genesis', heTitle: 'בראשית', categoryPath: ['Tanakh', 'Torah'] },
      { title: 'Exodus', heTitle: 'שמות', categoryPath: ['Tanakh', 'Torah'] },
    ]);

    const talmud = corpora.find((c) => c.slug === 'talmud');
    expect(talmud?.books).toEqual([
      {
        title: 'Megillah',
        heTitle: 'מגילה',
        categoryPath: ['Talmud', 'Bavli', 'Seder Moed'],
      },
    ]);
  });

  it('skips corpora that have no books and stray top-level leaves', () => {
    const corpora = normalise(sefariaIndexFixture);
    expect(corpora.find((c) => c.slug === 'emptycorpus')).toBeUndefined();
    // A top-level entry with only a `title` (no `category`) is not a corpus.
    expect(corpora).toHaveLength(2);
  });

  it('falls back to the Latin title when heTitle is missing', () => {
    const corpora = normalise([
      {
        category: 'Mishnah',
        heCategory: 'משנה',
        contents: [{ title: 'Avot' }],
      },
    ]);
    expect(corpora[0]?.books[0]).toEqual({
      title: 'Avot',
      heTitle: 'Avot',
      categoryPath: ['Mishnah'],
    });
  });

  it('produces output that validates against TaxonomySchema', () => {
    const corpora = normalise(sefariaIndexFixture);
    const taxonomy = {
      snapshotAt: '2026-05-27T00:00:00.000Z',
      source: 'https://www.sefaria.org/api/index/',
      corpora,
    };
    expect(() => TaxonomySchema.parse(taxonomy)).not.toThrow();
  });
});
