/**
 * Sefaria name resolver.
 *
 * Wraps Sefaria's public `/api/name?name=<query>` endpoint with a small typed
 * result shape. CORS is open on api.sefaria.org so this runs in the browser
 * (used by the Request form's "Lookup" button). See PRD 0001 — "Sefaria
 * integration — hybrid".
 */

const SEFARIA_NAME_ENDPOINT = 'https://www.sefaria.org/api/name';

export type LookupOption = {
  ref: string;
};

export type LookupResult =
  | { ok: true; ref: string; heRef: string }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'not-found' }
  | { ok: false; reason: 'ambiguous'; options: LookupOption[] }
  | { ok: false; reason: 'network' };

type SefariaCompletionObject = {
  title?: string;
  key?: string;
  type?: string;
};

type SefariaNameResponse = {
  is_ref?: boolean;
  ref?: string;
  heRef?: string;
  completions?: string[];
  completion_objects?: SefariaCompletionObject[];
};

export async function lookup(query: string): Promise<LookupResult> {
  if (query.trim() === '') {
    return { ok: false, reason: 'empty' };
  }

  const url = `${SEFARIA_NAME_ENDPOINT}?name=${encodeURIComponent(query)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (!response.ok) {
    return { ok: false, reason: 'network' };
  }

  let data: SefariaNameResponse;
  try {
    data = (await response.json()) as SefariaNameResponse;
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (data.is_ref && typeof data.ref === 'string') {
    return {
      ok: true,
      ref: data.ref,
      heRef: typeof data.heRef === 'string' ? data.heRef : '',
    };
  }

  const completions = Array.isArray(data.completions) ? data.completions : [];
  if (completions.length === 0) {
    return { ok: false, reason: 'not-found' };
  }

  return {
    ok: false,
    reason: 'ambiguous',
    options: completions.map((ref) => ({ ref })),
  };
}
