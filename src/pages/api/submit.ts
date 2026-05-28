import type { APIRoute } from 'astro';
import { parseSubmission, buildIssue, type IssueSpec } from '../../lib/submission';

// Server route — must not be prerendered (hybrid output).
export const prerender = false;

const SUBMISSIONS_REPO = 'dnissimi/chazarah-submissions';
const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 3600;

// Minimal KV shape (avoids a hard dependency on @cloudflare/workers-types).
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

interface SubmitEnv {
  TURNSTILE_SECRET?: string;
  GITHUB_TOKEN?: string;
  RATE_LIMIT_KV?: KVNamespace;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function underRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / RATE_WINDOW_SEC);
  const key = `rl:${ip}:${bucket}`;
  const current = Number.parseInt((await kv.get(key)) ?? '0', 10) || 0;
  if (current >= RATE_LIMIT) return false;
  await kv.put(key, String(current + 1), { expirationTtl: RATE_WINDOW_SEC });
  return true;
}

async function createIssue(token: string, spec: IssueSpec): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${SUBMISSIONS_REPO}/issues`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'user-agent': 'chazarah-submission-worker',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: spec.title,
        body: spec.body,
        labels: spec.labels,
      }),
    },
  );
  if (!res.ok) throw new Error(`github ${res.status}`);
  const data = (await res.json()) as { html_url: string };
  return data.html_url;
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = (locals as { runtime?: { env?: SubmitEnv } }).runtime?.env;
  if (!env?.TURNSTILE_SECRET || !env?.GITHUB_TOKEN || !env?.RATE_LIMIT_KV) {
    return json({ ok: false, error: 'server-misconfigured' }, 500);
  }

  let envelope: { payload?: unknown; turnstileToken?: unknown };
  try {
    envelope = (await request.json()) as typeof envelope;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  const token =
    typeof envelope?.turnstileToken === 'string' ? envelope.turnstileToken : '';
  if (!token) return json({ ok: false, error: 'missing-turnstile' }, 403);

  const parsed = parseSubmission(envelope?.payload);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  const ip =
    request.headers.get('CF-Connecting-IP') ?? clientAddress ?? 'unknown';

  if (!(await verifyTurnstile(env.TURNSTILE_SECRET, token, ip))) {
    return json({ ok: false, error: 'turnstile-failed' }, 403);
  }

  if (!(await underRateLimit(env.RATE_LIMIT_KV, ip))) {
    return json({ ok: false, error: 'rate-limited' }, 429);
  }

  try {
    const issueUrl = await createIssue(env.GITHUB_TOKEN, buildIssue(parsed.data));
    return json({ ok: true, issueUrl });
  } catch {
    return json({ ok: false, error: 'github-unavailable' }, 502);
  }
};
