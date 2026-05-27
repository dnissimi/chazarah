import { defineCollection, z } from 'astro:content';

const localizedString = z.object({
  he: z.string().min(1),
  en: z.string().min(1),
});

const maps = defineCollection({
  type: 'data',
  schema: z.object({
    corpus: z.enum(['talmud', 'mishnah', 'tanakh', 'halakhah', 'midrash']),
    book: z.string().min(1),
    location: z.string().min(1),
    title: localizedString,
    blurb: localizedString,
    topic: localizedString,
    sefariaRef: z.string().min(1),
    languages: z.array(z.enum(['he', 'en', 'yi'])).min(1),
    sugyaCount: z.number().int().positive().optional(),
    updated: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date (YYYY-MM-DD)'),
  }),
});

export const collections = { maps };
