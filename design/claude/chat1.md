# Prototype Design Specification

_Started 2026-05-27 07:48 UTC_

---

## User

Let's build a prototype.  I have attached a spec.  Ask me questions to hone in on the design.\

## Assistant

_[tool: read_file]_

_[tool: questions_v2]_

## User

Questions answered:
- visual_direction: Modern bet midrash — warmer paper tones, generous type, subtle structural lines
- type_system: SHow me exmples of each
- palette: Explore a few options
- surfaces: All
- router: Decide for me
- variations: Color palette swaps via Tweaks, Browse grid layout (cards vs list vs daf-spread metaphor), Map Info Page composition, Type pairing swaps via Tweaks, Landing page hero (a few different opening gestures)
- browse_metaphor: Decide for me
- empty_states: Decide for me
- imagery: Decide for me
- tweaks: Do you mean for me during this design or for the actual end user?
- content_realism: Yes — use plausible Hebrew topic strings (e.g., 'מקרא מגילה בלילה וביום')
- sefaria_lookup: Simulate it client-side (fake resolved state for common refs)
- anything_else: I alo want it to be localized with a language selector - let's start with Hebrew and English versions of the site.

## Assistant

_[tool: write_file]_

Quick clarifications before I dive in:

**On Tweaks** — they're a design-review aid for *you* (the designer/reviewer) during this exploration. You toggle on Tweaks from the toolbar to swap palettes, type pairings, layout variants, etc. and pick what works. They're not meant to ship to end users. The language selector you want is different — that's a real product feature and will live in the site chrome.

**On type** — let me show you samples rendered with real Hebrew so you can pick from feel, not from font names. Building that now.

_[tool: done]_

Type samples are up. Take a look and tell me which pairing feels right — I can also carry two of them into the prototype and let you toggle via Tweaks.

A few other things I'm assuming so we can move quickly when you reply (push back on any):

- **Language selector** lives in the site chrome (top-right) and switches the whole UI between Hebrew/RTL and English/LTR — independent of which language *variants* exist for a given map.
- **Router**: I'll wire a real internal hash router so every link in the spec works (`#/`, `#/map/talmud/megillah/`, `#/map/talmud/megillah/26`, `#/request`, `#/feedback?ref=…`).
- **Tweaks panel** will expose: palette, type pairing, landing hero variant, browse layout variant. (Reviewer tool, not shipped.)
- **Map Info Page composition** — I'll build two compositions and switch via Tweaks (your earlier pick).
- **Visitor Recents** — I'll seed localStorage with a couple items so the block is visible by default; empty-state is one Tweak toggle away.

End your turn — waiting on your type pick.

## User

Option 2

## Assistant

_[tool: update_todos]_

_[tool: copy_starter_component]_

Locked in: David Libre + Assistant. Now building the full prototype.

_[tool: read_file]_

_[tool: write_file]_

_[tool: write_file]_

Good — I have what I need. Building all the files now.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: write_file]_

_[tool: show_html]_

_[tool: done]_

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

Chazarah prototype is up. **Type pairing:** David Libre + Assistant (with Frank Ruhl Libre + Heebo as a Tweak swap).

**Five surfaces, all wired:**
- `/` Landing — three hero variants (editorial · map-spread · featured-first), Site Recents grid, Visitor Recents (seeded into localStorage), request banner
- `/map/talmud/megillah/` Browse — three layouts (spread · grid · list), filter chips, dashed empty states with per-daf request CTA
- `/map/talmud/megillah/26` Map Info — two compositions (two-col · centered), language variants (grayed-out missing → "בקשו תרגום"), prev/next as daf-spread, never-404 fallback for unmapped dapim
- `/request` — Sefaria lookup simulator (try `Megillah 26`, `Berakhot 17`), target-language pills, Turnstile placeholder
- `/feedback?ref=…` — pre-filled ref banner, required observation field

**Tweaks panel** (toolbar toggle): palette swap (parchment · bone · slate), type pair, hero variant, browse layout, map-info composition, visitor-recents on/off, plus quick-jump buttons to every surface.

**Language switcher** (top right) flips the entire UI between Hebrew/RTL and English/LTR — independent of which map variants exist.

A few notes:
- The "Open map" link inside Language Variants just alerts a stub — the real product would link to the standalone map HTML.
- The brand mark is a small three-bar abstract glyph (layered text / structural lines), not a Hebrew letter or Magen David.
- Visitor Recents is seeded so the block shows by default. Clear `localStorage` or toggle the Tweak to see the empty state.

Tell me which directions to push deeper — palette, hero, browse layout, or anything that feels off.

## User

Verifier agent check completed

## Assistant

_[tool: str_replace_edit]_

_[tool: done]_

Fixed — Hebrew nav labels now stay on one line.

## User

I like the middle theme palette, but the secondary color should be the navy blue from the third palette...

## Assistant

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Bone palette is now the default, with the navy accent swapped in. Tweaks panel updated to match.

One small note: there's a stray inline `background-color: rgb(243, 236, 217)` on `<body>` from your earlier direct edit — it slightly overrides the new bone paper. Want me to remove it?

## User

I messed up the direct edit - you can fix this.

## Assistant

_[tool: str_replace_edit]_

_[tool: grep]_

Cleaned up — body now picks up the bone paper from the palette variable.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

Root node now reads משנה.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Done.

## User

OK - now I believe the "Recently Added" section can be collapsed into (i.e. it should replace) the "Exmaples" section.  I was to keep the format and location / style of the "Examples" - but instead, change the header to "Recently Added" and list the recently added pages. Then get rid of the Recently added section altogether.

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Done — "Examples" is now "Recently Added" with the recently-added maps (and an updated-date column), and the standalone Recently Added section below is gone.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

Feedback link now fills its cell as a prominent block — header dropped, navy accent rule on the leading edge, hover lifts to the card paper.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

Done.

## User

Apply comment

## Assistant

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Removed from the headline and from the landing intro paragraph in both languages.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

Done.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

Done.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: done]_

Localized everywhere — refs now render as `מגילה כ״ו` / `ברכות י״ז` on the Hebrew site, breadcrumbs and titles match, and Latin refs only appear on the English site. Also stripped Browse down to the List layout (and removed the Browse Tweak).

## User

Let's keep visitor recents

## Assistant

Already there — Visitor Recents shows by default below "Recently Added." Want me to drop the Tweak toggle for it (since it should always be on)?

## User

Map info two-col (side my side) is good

## Assistant

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Locked in two-col, removed the variant tweak.

## User

Landing - Hero variant = Editorial Only, but underneath it should be a feature map that presents the map for the daf-yomi.
"Recently Added should be renamed "Most Popular" because this is how it will be used...

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Editorial hero locked in; below it now sits a Daf Yomi feature block with the map preview and today's daf. "Recently Added" is now "Most Popular" (הפופולריים ביותר). Hero-variant tweak removed.

## User

Now just make sure that everything on the English page is in English, and the Hebrew Page is in Hebrew

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

## User

Apply comment

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

Fixed. Now back to the broader Hebrew/English audit I started:

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Done. All map topics now switch with the language: English page shows English topics, Hebrew page shows Hebrew. References (`Megillah 26` ↔ `מגילה כ״ו`), book names, breadcrumbs, daf numbers, and form copy all already follow the language too.

## User

BTW - we will stick with Type David, and the selecetd palette

## Assistant

_[tool: str_replace_edit]_

Done — palette and type tweaks removed. Bone palette + David Libre locked in.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

Done — section is now a single full-width "Most Popular" table. Left the landing intro paragraph as-is; it already covers the "flowchart beside the source" idea.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

The issue is the seeded `localStorage` from earlier — it was written before I added `topicEn`. I'll bump the storage key so it re-seeds with the new schema.Visitor Recents will now re-seed with English topics on the English page.

## User

We'll keep visitor recents

## Assistant

Visitor Recents stays on by default — kept the toggle in the Tweaks panel in case you want to preview the empty state, but no behavior change needed.

