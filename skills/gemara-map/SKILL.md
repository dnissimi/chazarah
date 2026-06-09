---
name: gemara-map
description: >-
  Map a page, sugya, or multi-daf stretch of Talmud (Gemara) into a visual,
  bilingual (Hebrew/English) flowchart that follows the give-and-take of the
  discussion. Use this skill whenever the user asks to map, diagram, visualize,
  outline, chart, "break down", or "make sense of" a gemara / sugya / daf /
  Talmud passage, or whenever they give a Talmud reference (e.g. "Berakhot 2a",
  "Bava Metzia 2a-3b", "Megillah 26-29", a perek, or a named sugya) and want to
  see its structure or flow. Also trigger on "help me follow the back-and-forth
  of this gemara", "summarize this sugya as a chart", "talmud map", or "sugya
  flowchart". Fetches the text from Sefaria (and uses only that text) and
  produces one self-contained, self-describing HTML page.
---

# Gemara Map (מפת הסוגיא)

Turn a requested Talmud passage into a single self-contained HTML page: color-coded
flowchart(s) that trace how the gemara moves — question, answer, objection, proof,
dispute, conclusion — with a paired source-and-translation panel under each chart.

The goal is **understanding the flow**. A reader who opens the page should see at a
glance where it starts, where it branches, where it hits a difficulty, and how it
resolves — pitched so a motivated middle/high-schooler can follow it.

A short request is one sugya → one flowchart. A multi-daf range is many sugyot → an
**overview map** (each sugya is a node) followed by a **detailed section per sugya**.

## The output is one bilingual file

Each map is **one HTML file containing both Hebrew and English**. The same file serves
both `…/he` and `…/en`: the bundled JS reads the URL's trailing `/he` or `/en` at load,
sets `<html lang>`/`dir`, shows the matching authored layer (meaning labels, citation
translation column, all chrome), and stays there. There is **no on-page language
button** — once a reader is on `/he` or `/en` they're unlikely to switch mid-page; if
they want the other language they navigate to the other URL. Local file:// or any path
without `/he`/`/en` falls back to `he`.

What *does* have a UI control is each chart: a small, low-contrast **meaning⇄original**
toggle in the corner that flips that chart's node labels to the verbatim Aramaic
(opacity ~0.4 until hover). Independent of page language; available in either view.

**The template (`assets/template.html`) already implements all the toggle/feedback JS
and styling** — your job is to supply the content for the three label sets (Hebrew
meaning, English meaning, Aramaic original) and the bilingual chrome + citations.

## The rule that matters most: two layers, two rules

Keep the **authored** layer and the **verbatim** layer cleanly separate.

- **Authored layer** — node "meaning" labels, the `topic`, the takeaway/`blurb`,
  titles, headings. You write these in **both Hebrew and English**, from your
  understanding of the source. This is curation — where you make the sugya
  followable. (English meaning labels are *short authored summaries*, not a
  translation of Davidson.)
- **Verbatim layer** — the **original text itself** (the gemara/Mishnah; we call it
  "Aramaic" for short, though the Mishnah is often Hebrew) and, on the English side,
  **Sefaria's Davidson translation**. This is **never authored, reworded, or
  paraphrased** — it appears only as exact source:
  - In a chart node (the *original* view) the Aramaic may be shortened **only** by
    splicing contiguous verbatim fragments with `…` (e.g. `תָּנוּ רַבָּנַן … שַׁפִּיר דָּמֵי`).
    **Never freestyle or reword Aramaic.**
  - In the **citation panel the original appears in full** — no `…`.
  - The **English citation text is Davidson, shown verbatim** — never an LLM translation.

And the umbrella still holds: map **only** the fetched text — no Rashi, Tosafot,
outside commentary, or memory of how the sugya "usually" goes, unless the user asks.
A faithful map is the whole value; a plausible map that drifts from the text is worse
than useless because the reader trusts it.

## Workflow

### 1. Fetch the text

```bash
python3 scripts/fetch_sugya.py "Megillah 26-29" --segment --context --out sugya.json
```

**Never cut a sugya mid-thought** — a map (and each file/section) must begin and end
at a *natural* sugya break. The fetcher snaps to whole sugyot (Sefaria's passages
data) and, by default (`--expand both`), completes the sugyot at *both* ends; you are
the final judge — read the whole fetch as one context.

- `--expand both` (**default**) snaps both ends to full sugya boundaries (a sugya that
  began on the previous amud is pulled back to its start; one that spills onto the next
  is completed). Use `--expand none` only for a literal slice, `--expand end` for end-only.
- `--segment` partitions the range into `sugyot`. Always pass it.
- `--context` adds a read-only `context` (`before`/`after` sugya). Sanity-check
  boundaries: if `before`/`after` reads like a continuation of your first/last sugya,
  re-fetch wider. Never map the context sugyot.
- Read `sugya.json`: `final_ref`, `heRef`, `expanded`, `segments`, `sugyot`, `context`.
  Each segment has `n`, `ref`, `he` (the original) and `en` (**Davidson English — now
  shown verbatim in the English citation column**). Each sugya has `index`, `ref`,
  `start_n`/`end_n` (1-based slice into `segments`), `starts_before`.
- **Judgment over the mechanical split**: if two adjacent sugyot are plainly one
  continuous discussion, present them as one section; keep genuinely distinct topics
  separate. Each section should stand as a complete unit of reasoning.

**Multi-daf ranges → one file per daf.** Partition the sugyot by the daf on which each
one *begins*, keeping every sugya **whole** (a sugya crossing into the next daf stays
in its start-daf's file; one beginning before the first requested daf folds into the
first file). Run the fetch once over the whole range with `--expand both --segment`,
group `sugyot` by start daf, build one file per group from its first sugya's start to
its last sugya's end (`--expand none --segment` per file). Name files
`sugya_<book>_<daf>.html`. For a huge request, confirm scope with the user first.

**Build the dapim in parallel subagents — one per daf.** Once the range is
partitioned, hand each daf to its own subagent (dispatched together, in a single
message, so they run concurrently); each one runs this whole workflow for its daf
and writes its artifact to the workspace. Do the boundary planning (the partition
above) *once* up front so each subagent gets a precise, non-overlapping scope, and
verify each returned file independently (render → no Mermaid errors, node↔citation
alignment, verbatim audit) before relying on it.

### 2. Read each sugya and identify its moves

For each sugya (`segments[start_n-1 : end_n]`), read the `he` and decide what each move
is *doing*. Use this "grammar of the gemara" — but lean on understanding, not just
keyword-matching. Markers point you to the move; the meaning confirms it.

| Move (node type) | What it does | Typical markers |
|---|---|---|
| **משנה / מתניתין** | the Mishnah the sugya is built on (before `גמ׳`) | starts the unit; `גמ׳` begins the gemara |
| **מימרא / דעה** | a statement or opinion of a sage | `אָמַר רַבִּי…`, `אָמַר רַב…`, `תָּנוּ רַבָּנַן` |
| **קושיא** | a difficulty / question | `מְנָא הָנֵי מִילֵּי`, `מַאי טַעְמָא`, `מַאי שְׁנָא`, `אַמַּאי`, `וְתוּ`, `לְמָה לִי` |
| **מיתיבי / איתיביה** | an objection *from a source* | `מֵיתִיבִי`, `אֵיתִיבֵיהּ`, `תְּנַן`, `תַּנְיָא` (as a challenge) |
| **ראיה / תא שמע** | a *proof* attempt from a source | `תָּא שְׁמַע`, `דִּתְנַן`, `דְּתַנְיָא` |
| **תירוץ / יישוב** | an answer that resolves | `לָא קַשְׁיָא`, `הָכָא בְּמַאי עָסְקִינַן`, `אֵימָא`, `מִי סָבְרַתְּ` |
| **דחייה** | rejection/refutation | `דִּלְמָא`, `אֶלָּא`, `לָא,…`, `מִידֵּי אִירְיָא`, `תְּיוּבְתָּא` |
| **מחלוקת** | a dispute → splits into two opinions | `…אוֹמֵר … וַחֲכָמִים אוֹמְרִים`, `פְּלִיגִי`, `אִיכָּא בֵּינַיְיהוּ` |
| **לישנא אחרינא / איכא דאמרי** | an alternate version → parallel branch | `אִיכָּא דְּאָמְרִי`, `לִישָּׁנָא אַחֲרִינָא` |
| **מסקנה** | the conclusion / where it settles (or stays open) | `שְׁמַע מִינַּהּ`, `הִלְכְתָא`, `קַשְׁיָא`, `תֵּיקוּ` |

The flow is rarely a straight line: a question opens a branch, an answer loops back, an
objection forces a detour, a dispute splits into paths that may rejoin. Capture that
shape — that *is* the sugya.

### 3. Build a flowchart per sugya — three label sources

Each sugya chart carries **three** `graph TD` sources with **identical node IDs,
shapes, classes, and edges** — only the label text differs:

- **`src-he`** — node labels in clear Hebrew **meaning** (authored). Short (2–6 words);
  prefix each with a number matching its citation entry; number within each sugya.
  Keep a genuinely useful term with a gloss (`הַזְמָנָה (ייעוד)`); structural move-tags
  (`קושיא:`, `תירוץ:`) are fine — the legend explains them.
- **`src-en`** — the same graph, node labels in clear English **meaning** (authored
  short summaries — curation, *not* a translation of Davidson). Same numbers, e.g.
  `Q1{"③ Question: on what is the Mishnah based?"}`.
- **`src-ar`** — the same graph, node labels = the **verbatim Aramaic original**.
  Lift exact words; to fit a node, elide contiguous fragments with `…` only — **never
  reworded** (per the faithfulness rule).

Write the `src-he` graph, then copy it twice and swap only the label text.

**Shapes encode the move; classes encode the color.** Paste this `classDef` at the top
of every graph (these are the *functional node colors* — keep them as-is; they match
the legend and are not site-themed):

```
classDef mishnah fill:#fde68a,stroke:#b45309,stroke-width:2px,color:#1f2937;
classDef statement fill:#e0e7ff,stroke:#3730a3,color:#1f2937;
classDef question fill:#fecaca,stroke:#b91c1c,color:#1f2937;
classDef answer fill:#bbf7d0,stroke:#15803d,color:#1f2937;
classDef proof fill:#ddd6fe,stroke:#6d28d9,color:#1f2937;
classDef conclusion fill:#fef08a,stroke:#a16207,stroke-width:3px,color:#1f2937;
```

- **Mishnah**: stadium `M1(["① …"]):::mishnah` · **Statement**: `S1["② …"]:::statement`
- **Question/objection**: diamond `Q1{"③ …"}:::question` · **Answer** `:::answer` ·
  **Proof** `:::proof` · **Conclusion** `:::conclusion`
- Label edges with the move; dotted for a rejection: `Q1 -->|תירוץ| A1` /
  `A1 -.->|דחייה| Q2` / `S1 -->|מחלוקת| O1`. (Edge labels can stay Hebrew in all three
  sources, or be translated in `src-en` — your call; keep them short.)

**Mermaid gotchas:** wrap every label in double quotes (`A1["…"]`); ASCII node IDs only
(Hebrew/English inside the quotes); `<br/>` for a line break; no literal `"` inside a
label (use Hebrew gershayim `״ ׳` or `&quot;`); avoid `#` and stray `()[]{}`; one class
per node. Graph text sits **raw** inside `<script type="text/plain">` — do not HTML-escape it.

### 4. Build the overview map (multi-sugya only)

When `sugyot` has more than one entry, build a top-level `graph TD` where **each sugya
is one node** (a short topic label + ref), linked in order, each a click-anchor to its
section. The overview is bilingual but has **no Aramaic original** — give it `src-he`
and `src-en` (no `src-ar`, no toggle):

```
graph TD
  classDef statement fill:#e0e7ff,stroke:#3730a3,color:#1f2937;
  classDef mishnah fill:#fde68a,stroke:#b45309,color:#1f2937;
  O1(["1 · מכירת רחוב העיר — קדושה?"]):::mishnah
  O2["2 · סדר הקדושה"]:::statement
  O1 --> O2
  click O1 "#sugya-1"
  click O2 "#sugya-2"
```

For a single sugya, skip the overview (`OVERVIEW` placeholder = empty).

### 5. Citations — one entry per Sefaria segment

Build the citation panel as **one entry per Sefaria segment** of the sugya (not per
node), tagged with the node number(s) that draw on it. Each entry carries the
**complete** text — no truncation:

```html
<div class="quote">
  <div><span class="num">3</span> <span class="ref">מגילה כ&quot;ו א — Megillah 26a:6</span></div>
  <div class="orig">בֵּית הַכְּנֶסֶת — לוֹקְחִין תֵּיבָה…</div>
  <div class="trans" data-when="he">בכסף ממכירת בית הכנסת מותר לקנות רק דבר קדוש יותר — תיבה…</div>
  <div class="trans" data-when="en">If they sold a synagogue, they may purchase an ark…</div>
</div>
```

- **`.orig`** — the segment's **full vocalized Aramaic original**, verbatim, **no `…`**.
- **`.trans[data-when="he"]`** — your clear Hebrew translation (the LLM authored layer).
  Unpack idioms (`מְנָא הָנֵי מִילֵּי` → "מניין לנו…"); keep technical terms and gloss once;
  for an already-Hebrew Mishnah segment, give a short paraphrase/gloss (don't translate
  Hebrew→Hebrew pointlessly).
- **`.trans[data-when="en"]`** — the segment's **`en` field = Sefaria's Davidson,
  verbatim**. Paste it as fetched; do not edit, trim, or rewrite it. (The `:before`
  label "Davidson (Sefaria):" is added by the template.)

The template shows the right `.trans` for the current page language; `.orig` is always
shown.

### 6. Metadata + bilingual chrome

The page is **self-describing** so downstream tooling needs zero hand-assembly. Fill
the `META` placeholder with this block (neutral `gemara-map:` namespace — site-agnostic):

```html
<meta name="description" content="…Hebrew blurb = the takeaway…">
<meta name="gemara-map:corpus" content="talmud">
<meta name="gemara-map:book" content="chullin">
<meta name="gemara-map:location" content="26">
<meta name="gemara-map:sefaria-ref" content="Chullin 26">
<meta name="gemara-map:topic-he" content="…short, ≤6 words…">
<meta name="gemara-map:topic-en" content="…short, ≤6 words…">
<meta name="gemara-map:title-he" content="מפת הסוגיא — חולין כ״ו">
<meta name="gemara-map:title-en" content="Sugya map — Chullin 26">
<meta name="gemara-map:blurb-he" content="…the takeaway…">
<meta name="gemara-map:blurb-en" content="…the takeaway, English…">
<meta name="gemara-map:sugya-count" content="9">
<meta name="gemara-map:languages" content="he,en">
```

- `sefaria-ref` is the **daf-level** ref (`Chullin 26`), *not* the expanded range.
- `corpus`/`book`/`location` are lowercase/slug; `location` is the daf (e.g. `26`).
- `topic` is a short discrete phrase (≤6 words) — distinct from the structural `<title>`.
- `sugya-count` = number of `<section class="sugya">`.
- Do **not** emit a URL path — the skill stays site-agnostic.

Then fill the bilingual chrome placeholders, each with both languages:
`TITLE` (structural `<title>`, Hebrew), `TITLE_HE`/`TITLE_EN` (the `<h1>`),
`SUBTITLE_HE`/`SUBTITLE_EN` (source line: heRef · final_ref · "מקור: ספריא (William
Davidson)"; note if `expanded`), `TAKEAWAY_HE`/`TAKEAWAY_EN` (1–2 sentences: what this
stretch is about / how it lands).

### 7. Assemble, add feedback, save

Read `assets/template.html` and fill: `META`, `TITLE`, `TITLE_HE`/`TITLE_EN`,
`SUBTITLE_HE`/`SUBTITLE_EN`, `TAKEAWAY_HE`/`TAKEAWAY_EN`, `OVERVIEW`, `SECTIONS`,
`FEEDBACK`.

**Sugya section markup** (3-source chart + bilingual citations; matching `id` for the
overview links):

```html
<section class="sugya" id="sugya-1">
  <h2><span class="badge"><span data-when="he">סוגיה 1</span><span data-when="en">Sugya 1</span></span>
      <span data-when="he">נושא הסוגיה</span><span data-when="en">Topic</span>
      <span class="ref">Megillah 25b:20-26a:3</span></h2>
  <div class="lead"><span data-when="he">משפט הסבר.</span><span data-when="en">One-line gloss.</span></div>
  <div class="chart">
    <button class="lang-toggle" type="button"></button>
    <div class="mermaid-target"></div>
    <script type="text/plain" class="src-he">…Hebrew-meaning graph…</script>
    <script type="text/plain" class="src-en">…English-meaning graph…</script>
    <script type="text/plain" class="src-ar">…verbatim-Aramaic graph…</script>
  </div>
  <h3><span data-when="he">מקורות ותרגום</span><span data-when="en">Sources &amp; translation</span></h3>
  … citation divs (step 5) …
</section>
```

The overview section is the same minus the toggle and `src-ar` (step 4). The
`.lang-toggle` button text is set by the template's JS — leave it empty.

**Feedback affordance (opt-in).** If a feedback endpoint is wanted (e.g. for the
Chazarah site), set `FEEDBACK` to the block below (it's the standard "report a
correction" pill + modal; the template wires the click, builds the iframe URL
`<data-feedback-path>?ref=<gemara-map:sefaria-ref>&lang=<page-lang>&embed=1`, and
lazy-loads it). The `&embed=1` is a signal to the host site to render its form in a
chrome-free embed mode so it fits the modal. The `data-feedback-path` is
**root-relative** (the map is served same-origin as the form):

```html
<button class="report-pill" type="button" data-feedback-path="/feedback"></button>
<div class="report-modal" role="dialog" aria-modal="true">
  <div class="report-dialog">
    <button class="report-close" type="button" aria-label="close">×</button>
    <iframe title="report a correction" src="about:blank"></iframe>
  </div>
</div>
```

If no feedback endpoint is wanted (standalone use), set `FEEDBACK` to empty — the map
has no pill and stays fully self-contained.

Save under `./gemara-map-workspace/<range-slug>/sugya_<book>_<daf>.html` — relative
to the agent's cwd; create the dirs if missing. `<range-slug>` is the request range in
kebab-case (e.g. `chullin-26-30`, `megillah-26-29`, `shabbat-112`); a single-daf request
gets its own slug too. The workspace path stays cwd-relative so the skill is portable —
in the chazarah repo the dir is gitignored, but the skill itself doesn't know or care
which repo it's running in. Tell the user the path(s). Then **sanity-check**: skim
the Mermaid for the gotchas; every node number has a matching citation and vice-versa;
every authored element has **both** `he` and `en`; the Aramaic in `src-ar`/`.orig` is
**verbatim** (ellipsis-spliced only in nodes, full in citations); the English citation
column is **Davidson verbatim**; the metadata block is present and `sefaria-ref` is
daf-level; the first section starts at a sugya start and the last ends at a sugya end.

## Mini-example (opening of Berakhot 2a)

The Mishnah asks from when one recites the evening Shema; the gemara opens by asking
what the Mishnah is based on. The three graph sources differ only in labels:

```
# src-he
graph TD
  classDef mishnah fill:#fde68a,stroke:#b45309,stroke-width:2px,color:#1f2937;
  classDef question fill:#fecaca,stroke:#b91c1c,color:#1f2937;
  M1(["① משנה: מאיזו שעה קוראים שמע בערב?"]):::mishnah
  Q1{"② קושיא: על מה נסמכת המשנה?"}:::question
  M1 -->|פתיחת הגמרא| Q1
# src-en (same graph, English meaning)
  M1(["① Mishnah: from when is the evening Shema recited?"]):::mishnah
  Q1{"② Question: on what is the Mishnah based?"}:::question
# src-ar (same graph, verbatim original)
  M1(["① מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בָּעֲרָבִין"]):::mishnah
  Q1{"② תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי?"}:::question
```

Citation (one per segment; original full, both translations):

```html
<div class="quote">
  <div><span class="num">2</span> <span class="ref">Berakhot 2a:6</span></div>
  <div class="orig">גְּמָ׳ תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי?</div>
  <div class="trans" data-when="he">על מה מסתמך התַנָּא, שכבר פותח בשאלה "מאימתי קוראים"?</div>
  <div class="trans" data-when="en">The Gemara asks: Where does the tanna stand that he teaches: From when?…</div>
</div>
```

## Files

- `scripts/fetch_sugya.py` — Sefaria fetcher: resolves the ref, snaps to sugya
  boundaries (`--expand`), partitions a range (`--segment`), neighbor context
  (`--context`), returns aligned `he` + `en` (Davidson) per segment. Run it; don't
  re-implement it.
- `assets/template.html` — the bilingual, site-aligned page shell: metadata block,
  path-driven page language (`/he`|`/en`, no on-page button), subtle per-chart
  meaning⇄original toggle (3 sources), bilingual citations, feedback pill/modal (passes
  `lang` + `embed=1` for chrome-free embedding), the bone palette + David Libre/Frank
  Ruhl Libre/Heebo fonts, and
  all the JS. Fill the placeholders; don't re-implement the JS.
  - It also includes a self-contained **shape⇄citation cross-link** block
    (`<script id="xref-crosslink">`): clicking a chart shape smooth-scrolls to its
    citation below, and clicking a citation's head line (number badge + ref) scrolls
    back up to its shape (each with a brief highlight). It keys off the existing
    circled-numeral ① ↔ `.num` correspondence (scoped per `section.sugya`) via event
    delegation on the stable `.chart`/`section` (so it survives the toggle and
    `/he`↔`/en` with no re-binding), and uses pointer events with a tap test so it
    works with **touch** as well as mouse (plain `click` doesn't fire on SVG nodes in
    iOS Safari). The same block also makes the faint meaning⇄original toggle full
    opacity on touch devices (which have no `:hover` to reveal it). Needs **no change
    to your authored content** — just keep node numerals and citation `.num` badges
    matching, as you already do.
