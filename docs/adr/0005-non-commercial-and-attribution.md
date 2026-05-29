# ADR 0005 — Non-commercial site; minimal-compliance attribution; the "no Davidson English" discipline is load-bearing

- Status: Accepted — "never show Davidson" amended by [ADR 0006](./0006-bilingual-map-files-and-per-variant-language-policy.md) (the English variant shows Davidson under a per-variant IP policy; the Hebrew side and the non-commercial posture are unchanged)
- Date: 2026-05-26

## Context

[[Chazarah]] depends on Sefaria for source text. Sefaria's content is a mix:
- The Hebrew/Aramaic text of the Talmud (and most other classical works) is
  in the public domain.
- The William Davidson Talmud English translation is licensed CC BY-NC 4.0.

The `gemara-map` skill fetches both via the Sefaria API. Its discipline (per
the SKILL.md): the Davidson English is used **only** to verify understanding
of the Aramaic, and is **never copied into** the output map.

## Decision

1. **Chazarah is and remains a non-commercial site.** No ads, no paywalls,
   no commercial sponsorships, no subscription tiers. A donation button is
   permitted; commercial reuse of the site or its content is not.
2. **Attribution is minimal-compliance, not maximal.** Per-map attribution
   already exists inside each map's subtitle ("מקור: ספריא (William
   Davidson)"). The site adds a one-line footer credit on every page
   pointing to Sefaria. No dedicated `/credits` page is required for v0.
3. **The owner's IP claim over [[Chazarah Map]]s rests on the skill's
   discipline of never copying the Davidson English into the output.** Maps
   contain (a) the public-domain Hebrew/Aramaic source, and (b) fresh Hebrew
   translation written by the skill from the Aramaic — both of which are
   either public domain or the owner's original work.
4. **No license is declared on Chazarah Maps themselves in v0.** They are
   treated as the owner's work product. (This is a downstream choice; if we
   ever want the corpus to be openly reusable, we revisit and pick a
   share-alike license.)

## Consequences

**Good**
- The site can launch without entanglement in Sefaria's BY-NC obligations
  beyond a one-line credit, because the BY-NC content (Davidson English)
  doesn't appear in any output.
- The non-commercial commitment is design-time, not retrofit. Every page
  is built knowing that ads/paywall integrations are out of scope.
- Owner retains creative control over the corpus.

**Bad / accepted trade-offs**
- The IP position **depends entirely on the skill staying disciplined**
  about not copying Davidson English. If the skill ever drifts on this
  rule (intentionally or by accident), the CC BY-NC obligations kick in
  retroactively for any map that included Davidson text, and the IP
  claim weakens.
- "No license on the maps in v0" means others cannot confidently reuse
  them. We accept this; it's better to commit to a license once, on
  purpose, than to default to one accidentally.

## Operational implication: this discipline must be guarded

- The `gemara-map` skill's "never copy or show the Davidson English" rule
  is a load-bearing piece of [[Chazarah]]'s legal/IP posture. Treat
  changes to that rule as architectural changes, not skill polish.
- The `/chazarah-fulfill` flow should not bring Davidson English into
  generated maps as a fallback or shortcut, ever.

## Alternatives considered

- **CC BY-NC-SA on Chazarah Maps from day one.** Cleanest open-source
  posture; keeps the corpus open to reuse. Rejected for v0 because the
  owner wants to retain IP control; revisitable later.
- **Pursue a commercial license from Sefaria.** Would unlock ads /
  subscription tiers. Out of scope; the non-commercial posture is
  preferred regardless.
- **Maximal attribution (dedicated `/credits` page, page-level metadata).**
  Good citizenship, but the owner explicitly chose minimal compliance.
