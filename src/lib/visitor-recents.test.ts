import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VISITOR_RECENTS_KEY,
  VISITOR_RECENTS_MAX,
  record,
  list,
  clear,
  type VisitorRecentEntry,
  type VisitorRecentInput,
} from './visitor-recents';

function makeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    key(i: number) {
      return Array.from(data.keys())[i] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  } satisfies Storage;
}

const baseInput = (overrides: Partial<VisitorRecentInput> = {}): VisitorRecentInput => ({
  corpus: 'talmud',
  book: 'megillah',
  location: '26',
  topic: { he: 'מקרא מגילה בלילה וביום', en: 'Reading the Megillah at night and by day' },
  ref: 'Megillah 26',
  ...overrides,
});

let storage: Storage;

beforeEach(() => {
  storage = makeStorage();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));
});

describe('VISITOR_RECENTS_KEY', () => {
  it('uses the versioned localStorage key the PRD locks', () => {
    expect(VISITOR_RECENTS_KEY).toBe('chazarah.visitorRecents.v2');
  });
});

describe('list()', () => {
  it('returns an empty array when there are no entries', () => {
    expect(list(storage)).toEqual([]);
  });

  it('returns an empty array when storage is missing', () => {
    expect(list(null)).toEqual([]);
  });

  it('returns an empty array when the stored value is malformed JSON', () => {
    storage.setItem(VISITOR_RECENTS_KEY, '{nope');
    expect(list(storage)).toEqual([]);
  });

  it('returns an empty array when the stored value is not an array', () => {
    storage.setItem(VISITOR_RECENTS_KEY, JSON.stringify({ foo: 'bar' }));
    expect(list(storage)).toEqual([]);
  });

  it('filters out entries that are missing required fields', () => {
    storage.setItem(
      VISITOR_RECENTS_KEY,
      JSON.stringify([
        { corpus: 'talmud', book: 'megillah' }, // missing fields
        {
          corpus: 'talmud',
          book: 'megillah',
          location: '26',
          topic: { he: 'x', en: 'y' },
          ref: 'Megillah 26',
          openedAt: '2026-05-27T12:00:00.000Z',
        },
      ]),
    );
    const entries = list(storage);
    expect(entries).toHaveLength(1);
    expect(entries[0].location).toBe('26');
  });
});

describe('record()', () => {
  it('writes an entry to localStorage with an ISO openedAt', () => {
    record(baseInput(), storage);
    const entries = list(storage);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      corpus: 'talmud',
      book: 'megillah',
      location: '26',
      ref: 'Megillah 26',
    });
    expect(entries[0].openedAt).toBe('2026-05-27T12:00:00.000Z');
  });

  it('places the newest entry first', () => {
    record(baseInput({ location: '25' }), storage);
    vi.setSystemTime(new Date('2026-05-27T13:00:00.000Z'));
    record(baseInput({ location: '26' }), storage);
    const entries = list(storage);
    expect(entries.map((e) => e.location)).toEqual(['26', '25']);
  });

  it('collapses duplicates (same corpus+book+location) and updates openedAt', () => {
    record(baseInput({ location: '26' }), storage);
    record(baseInput({ location: '25' }), storage);
    vi.setSystemTime(new Date('2026-05-27T13:00:00.000Z'));
    record(baseInput({ location: '26' }), storage);

    const entries = list(storage);
    expect(entries).toHaveLength(2);
    expect(entries[0].location).toBe('26');
    expect(entries[0].openedAt).toBe('2026-05-27T13:00:00.000Z');
    expect(entries[1].location).toBe('25');
  });

  it(`bounds the list to ${VISITOR_RECENTS_MAX} entries, dropping the oldest`, () => {
    for (let i = 1; i <= VISITOR_RECENTS_MAX + 3; i++) {
      vi.setSystemTime(new Date(`2026-05-27T12:${String(i).padStart(2, '0')}:00.000Z`));
      record(baseInput({ location: String(i) }), storage);
    }
    const entries = list(storage);
    expect(entries).toHaveLength(VISITOR_RECENTS_MAX);
    // Newest first; the first three locations should have been dropped.
    expect(entries[0].location).toBe(String(VISITOR_RECENTS_MAX + 3));
    expect(entries[entries.length - 1].location).toBe('4');
  });

  it('is a no-op when storage is null', () => {
    expect(() => record(baseInput(), null)).not.toThrow();
  });

  it('swallows storage errors silently (quota exceeded, private mode, etc.)', () => {
    const broken: Storage = {
      get length() {
        return 0;
      },
      clear() {},
      getItem() {
        return null;
      },
      key() {
        return null;
      },
      removeItem() {},
      setItem() {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => record(baseInput(), broken)).not.toThrow();
  });
});

describe('clear()', () => {
  it('removes the entries from localStorage', () => {
    record(baseInput(), storage);
    expect(list(storage)).toHaveLength(1);
    clear(storage);
    expect(list(storage)).toEqual([]);
    expect(storage.getItem(VISITOR_RECENTS_KEY)).toBeNull();
  });

  it('is a no-op when storage is null', () => {
    expect(() => clear(null)).not.toThrow();
  });
});

describe('entry shape', () => {
  it('round-trips topic.he and topic.en', () => {
    record(
      baseInput({
        topic: { he: 'נושא בעברית', en: 'A topic in English' },
      }),
      storage,
    );
    const [entry] = list(storage);
    const e: VisitorRecentEntry = entry;
    expect(e.topic.he).toBe('נושא בעברית');
    expect(e.topic.en).toBe('A topic in English');
  });
});
