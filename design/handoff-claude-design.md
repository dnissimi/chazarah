# Handoff — Design the Chazarah website (independent exploration)

You are receiving this handoff inside claude.ai. **Use artifacts** to produce a self-contained, working HTML mockup of the Chazarah website. Treat this as an *independent* design exploration — there is a separate mockup already in existence; do not ask about it, do not try to access it, do not let any guess about it constrain you. Your job is to produce a genuinely different, well-considered visual direction.

You have no filesystem access in this conversation; everything you need is inline below.

---

## 1. What Chazarah is

**Chazarah** (Hebrew: חזרה — "review") is a website / brand. The site exists to help learners *come back* to Torah material they've studied, in formats that make the structure of the learning visible. It will host multiple products over time.

The first product is **Chazarah Map**: a self-contained HTML page that visualizes a passage of Torah literature as a color-coded flowchart paired with the original text and a clear-Hebrew translation. Today Chazarah Map covers Talmud (sugya / daf), but it is *not* gemara-specific — it's designed to extend to any Sefaria corpus (Tanakh, Mishnah, Halakhah, Midrash, ...). The unit a map covers varies by corpus (sugya/daf in Talmud, perek in Mishnah, parsha in Tanakh, ...).

A map may exist in several **language variants** (separate files: Hebrew, English, ...). Hebrew is canonical. Coverage is uneven and will stay uneven — language is content metadata, not a top-level slice.

## 2. Audience and tone

- **Audience**: Talmud learners. Pitched so a motivated 14-year-old can follow, but useful to anyone — including someone reviewing the masechet for the third time.
- **Tone**: serious-but-warm. Reverent of the source material. **Not** academic-dry, **not** startup-cheerful, **not** modern-tech-flat, **not** playful.
- **Reading direction**: **Hebrew-first, RTL.** English appears as marginal annotation (Sefaria refs like "Megillah 26a"), not as primary text. Site UI is Hebrew. English chrome may be added later; keep strings extractable, but the v0 you design is Hebrew-only.
- **Cultural register**: think *thoughtfully designed Hebrew sefer*, *editorial Jewish-studies journal*, *contemporary bet midrash*. Avoid heavy Judaica-clipart aesthetics (no Stars of David, no Hebrew-letter logos that try too hard, no scroll-and-parchment cliché).


## 3. URL structure (so your page hierarchy reflects reality)

Locked-in URL shape:
```
/                                         → landing
/map/<corpus>/<book>/                     → browse a book's maps
/map/<corpus>/<book>/<location>           → Map Info Page (site-rendered)
/map/<corpus>/<book>/<location>/<lang>    → the standalone map HTML (verbatim from skill)
/request                                  → submit a Map Request
/feedback?ref=…                           → submit Map Feedback (ref auto-filled)
```

Examples: `/map/talmud/megillah/26`, `/map/talmud/megillah/26/he`, `/map/mishnah/berakhot/2/he`, `/map/tanakh/genesis/12/he`.

Language is the **leaf**, not a top-level slice. The bare URL (no language) is the **Map Info Page** rendered by the site — it never 404s, even before any language variant exists.

## 4. Surfaces to design

Produce all four in one artifact (self-contained HTML — internal route switcher is fine).

### Surface 1 — Landing page (`/`)
- Intro: short Hebrew headline + one-sentence explanation of what Chazarah is.
- Featured product card for **Chazarah Map** with 2–4 example map links (each is masechet + daf + a short Hebrew topic).
- "Browse the library" entry → `/map/talmud/`.
- **Site Recents**: recently added or updated maps across the site (static fact, same for everyone).
- **Visitor Recents** (optional separate block): maps *this visitor* has opened recently, sourced from `localStorage` — shown only if data exists. No accounts, no auth.
- Small "Request a map" CTA banner.
- Footer with Sefaria credit.

### Surface 2 — Map Info Page (e.g., `/map/talmud/megillah/26`)
- Title in Hebrew (e.g., *מפת הסוגיא — מגילה כ״ו*), with Latin ref underneath in muted tone (*Megillah 26*).
- Short 1–2 sentence Hebrew blurb describing what the map covers.
- **Language variants section**: list of available languages with links; languages that *don't* exist appear in a grayed-out / dashed state with a "בקשו תרגום" (Request translation) CTA → feeds the Map Request form.
- **"Submit feedback on this map"** link → feeds the Map Feedback form (pre-populated with this map's ref).
- **Adjacent maps**: previous/next within the same book (e.g., Megillah 25 ↔ Megillah 27). Feels like turning the daf.
- Sefaria credit + last-updated date.

### Surface 3 — Browse page (`/map/talmud/megillah/`)
- Header: masechet name in Hebrew + Latin ref + 1-sentence summary.
- Grid of daf cards covering the masechet. Each card shows:
  - The daf number (Hebrew letter form: ב׳, ג׳, ... + Latin "2a—2b" underneath).
  - Which language variants exist (small chips: HE / EN / YI ...).
- Dapim that **don't** have a map yet should still appear (dashed / empty state) with a per-daf "Request this daf" CTA. The library is a partial table-of-contents; absence is honest.

### Surface 4 — Submission forms (`/request` and `/feedback`)
- `/request` form fields:
  - **Sefaria reference** (free-text + "Lookup" button that calls Sefaria's `/api/name` — show a resolved-state confirmation when valid).
  - **Target language** (pills: עברית, English, ...).
  - **Note** (optional textarea).
  - **Email** (optional, for notification when ready).
  - Turnstile placeholder.
- `/feedback?ref=…` form fields:
  - Banner showing what map/language this feedback is about (pre-filled from URL params, non-editable).
  - **Specific node/quote number** (optional).
  - **Your observation** (required textarea).
  - **Email** (optional).
  - Turnstile placeholder.

Either design both forms or design `/request` thoroughly and stub `/feedback` — your call.

## 5. Architectural constraints (so design choices fit reality)

These are decided; design around them:
- **Static-first site**, built with Astro on Cloudflare Pages. Map HTML files are served **verbatim** — the site does not transform or wrap them.
- **No user accounts.** No auth, no login UI. Personalization (Visitor Recents, "mark as studied") is `localStorage` only.
- **Non-commercial** site. No ads, no paywall, no subscription tier. Donation button is fine to include.
- **Submissions go to a private GitHub repo as issues**; admin loop is owner-only via Claude Code. The site never shows an admin UI.
- **Sefaria attribution** is required, minimal-compliance: a one-line footer credit on every page. No `/credits` page is required.
