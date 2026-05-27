import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookup } from './sefaria';

const mockJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('lookup()', () => {
  it('resolves a known canonical Latin ref to ok with ref + heRef', async () => {
    const fetchMock = vi.fn(async () =>
      mockJson({
        lang: 'en',
        is_ref: true,
        ref: 'Megillah 26',
        heRef: 'מגילה כ״ו',
        completions: [],
        completion_objects: [],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookup('Megillah 26');

    expect(result).toEqual({ ok: true, ref: 'Megillah 26', heRef: 'מגילה כ״ו' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/name?name=${encodeURIComponent('Megillah 26')}`),
    );
  });

  it('resolves a known Hebrew ref (RTL input is sent through)', async () => {
    const fetchMock = vi.fn(async () =>
      mockJson({
        lang: 'he',
        is_ref: true,
        ref: 'Megillah 26',
        heRef: 'מגילה כ״ו',
        completions: [],
        completion_objects: [],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookup('מגילה כו');

    expect(result).toEqual({ ok: true, ref: 'Megillah 26', heRef: 'מגילה כ״ו' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('מגילה כו')),
    );
  });

  it('returns not-found when Sefaria has no completions', async () => {
    const fetchMock = vi.fn(async () =>
      mockJson({
        lang: 'en',
        is_ref: false,
        completions: [],
        completion_objects: [],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookup('zzznotathing');

    expect(result).toEqual({ ok: false, reason: 'not-found' });
  });

  it('returns ambiguous with options when Sefaria offers multiple completions', async () => {
    const fetchMock = vi.fn(async () =>
      mockJson({
        lang: 'en',
        is_ref: false,
        completions: ['Bava Kamma', 'Bava Metzia', 'Bava Batra'],
        completion_objects: [
          { title: 'Bava Kamma', key: 'Bava Kamma', type: 'Index' },
          { title: 'Bava Metzia', key: 'Bava Metzia', type: 'Index' },
          { title: 'Bava Batra', key: 'Bava Batra', type: 'Index' },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookup('Bava');

    expect(result).toEqual({
      ok: false,
      reason: 'ambiguous',
      options: [
        { ref: 'Bava Kamma' },
        { ref: 'Bava Metzia' },
        { ref: 'Bava Batra' },
      ],
    });
  });

  it('returns empty without making a network call for empty or whitespace input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    for (const q of ['', '   ', '\t\n']) {
      const result = await lookup(q);
      expect(result).toEqual({ ok: false, reason: 'empty' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns network when fetch rejects', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookup('Megillah 26');

    expect(result).toEqual({ ok: false, reason: 'network' });
  });

  it('returns network when the response is non-2xx', async () => {
    const fetchMock = vi.fn(
      async () => new Response('upstream down', { status: 502 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookup('Megillah 26');

    expect(result).toEqual({ ok: false, reason: 'network' });
  });
});
