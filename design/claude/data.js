// data.js — mock content for Chazarah prototype.
// Hebrew is canonical; English appears as marginal ref.

window.CHAZARAH_DATA = (function () {
  // Maps that exist in the catalog. Each one has:
  //   corpus, book, location (number for talmud daf),
  //   hebrew title, latin ref, topic, langs, updated date.
  const MAPS = [
    { corpus: 'talmud',  book: 'megillah',  location: 26, hebrewBook: 'מגילה',  hebrewLoc: 'כ״ו', latin: 'Megillah 26', topicHe: 'מקרא מגילה בלילה וביום',     topicEn: 'Reading the Megillah at night and by day', langs: ['he','en'], updated: '2026-05-12' },
    { corpus: 'talmud',  book: 'megillah',  location: 28, hebrewBook: 'מגילה',  hebrewLoc: 'כ״ח', latin: 'Megillah 28', topicHe: 'בית הכנסת שחרב',               topicEn: 'A synagogue that has fallen into ruin',     langs: ['he'],      updated: '2026-05-09' },
    { corpus: 'talmud',  book: 'megillah',  location:  4, hebrewBook: 'מגילה',  hebrewLoc: 'ד׳',   latin: 'Megillah 4',  topicHe: 'חיוב נשים במקרא מגילה',         topicEn: 'Womens obligation in Megillah',           langs: ['he','en'], updated: '2026-04-30' },
    { corpus: 'talmud',  book: 'megillah',  location: 31, hebrewBook: 'מגילה',  hebrewLoc: 'ל״א', latin: 'Megillah 31', topicHe: 'קריאת התורה בציבור',           topicEn: 'Public Torah reading',                    langs: ['he','en','yi'], updated: '2026-04-22' },
    { corpus: 'talmud',  book: 'berakhot',  location: 17, hebrewBook: 'ברכות',  hebrewLoc: 'י״ז', latin: 'Berakhot 17', topicHe: 'תפילת הדרך',                   topicEn: 'The wayfarers prayer',                    langs: ['he','en'], updated: '2026-05-18' },
    { corpus: 'mishnah', book: 'berakhot',  location:  2, hebrewBook: 'ברכות',  hebrewLoc: 'ב׳',   latin: 'Berakhot 2',  topicHe: 'זמן קריאת שמע של ערבית',       topicEn: 'The time for the evening Shema',          langs: ['he'],      updated: '2026-05-02' },
    { corpus: 'tanakh',  book: 'genesis',   location: 12, hebrewBook: 'בראשית', hebrewLoc: 'י״ב', latin: 'Genesis 12',  topicHe: 'לך לך — קריאת אברהם',           topicEn: 'Lekh Lekha — the calling of Abraham',     langs: ['he'],      updated: '2026-03-28' },
  ];

  // Browse data for Megillah — all dapim 2..32, with whichever have maps.
  function buildBrowse(book) {
    const HE_NUM = ['','א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳','י״א','י״ב','י״ג','י״ד','ט״ו','ט״ז','י״ז','י״ח','י״ט','כ׳','כ״א','כ״ב','כ״ג','כ״ד','כ״ה','כ״ו','כ״ז','כ״ח','כ״ט','ל׳','ל״א','ל״ב'];
    const dapim = [];
    for (let n = 2; n <= 32; n++) {
      const map = MAPS.find(m => m.book === book && m.location === n);
      dapim.push({
        n,
        hebrewNum: HE_NUM[n] || String(n),
        latin: `${n}a—${n}b`,
        map: map || null,
      });
    }
    return dapim;
  }

  // Adjacent dapim for the info page
  function adjacent(book, n) {
    return {
      prev: n > 2  ? { n: n-1, hebrewNum: HE_NUM_FOR(n-1) } : null,
      next: n < 32 ? { n: n+1, hebrewNum: HE_NUM_FOR(n+1) } : null,
    };
  }
  function HE_NUM_FOR(n){
    const HE_NUM = ['','א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳','י״א','י״ב','י״ג','י״ד','ט״ו','ט״ז','י״ז','י״ח','י״ט','כ׳','כ״א','כ״ב','כ״ג','כ״ד','כ״ה','כ״ו','כ״ז','כ״ח','כ״ט','ל׳','ל״א','ל״ב'];
    return HE_NUM[n] || String(n);
  }

  // Recent visitor maps (simulated localStorage seed)
  const VISITOR_RECENTS_SEED = [
    { latin: 'Megillah 26', hebrewRef: 'מגילה כ״ו', book: 'megillah', location: 26, topicHe: 'מקרא מגילה בלילה וביום', topicEn: 'Reading the Megillah at night and by day', hash: '#/map/talmud/megillah/26', when: '2026-05-26' },
    { latin: 'Berakhot 17', hebrewRef: 'ברכות י״ז',  book: 'berakhot', location: 17, topicHe: 'תפילת הדרך',             topicEn: 'The wayfarer\u2019s prayer',                    hash: '#/map/talmud/berakhot/17', when: '2026-05-24' },
  ];

  // Featured maps on landing
  const FEATURED = ['Megillah 26', 'Megillah 4', 'Berakhot 17', 'Megillah 31']
    .map(ref => MAPS.find(m => m.latin === ref));

  // Site-wide recents (static, same for everyone)
  const SITE_RECENTS = MAPS
    .slice()
    .sort((a,b) => b.updated.localeCompare(a.updated))
    .slice(0, 5);

  // Sefaria-lookup simulator: matches a small set of known refs.
  const SEFARIA_KNOWN = {
    'megillah 26':    { ok: true, ref: 'Megillah 26', heRef: 'מסכת מגילה דף כ״ו' },
    'megillah 26a':   { ok: true, ref: 'Megillah 26a', heRef: 'מסכת מגילה דף כ״ו עמוד א׳' },
    'megillah 4':     { ok: true, ref: 'Megillah 4',  heRef: 'מסכת מגילה דף ד׳' },
    'berakhot 17':    { ok: true, ref: 'Berakhot 17', heRef: 'מסכת ברכות דף י״ז' },
    'genesis 12':     { ok: true, ref: 'Genesis 12',  heRef: 'בראשית פרק י״ב' },
    'shabbat 31a':    { ok: true, ref: 'Shabbat 31a', heRef: 'מסכת שבת דף ל״א עמוד א׳' },
  };
  function sefariaLookup(query) {
    const k = (query || '').trim().toLowerCase();
    if (!k) return { ok: false, reason: 'empty' };
    if (SEFARIA_KNOWN[k]) return SEFARIA_KNOWN[k];
    // Fuzzy: if it starts with a known book name, accept and echo
    const bookMatch = ['megillah','berakhot','shabbat','genesis','exodus','sanhedrin','pesachim'].find(b => k.startsWith(b));
    if (bookMatch) return { ok: true, ref: query.trim(), heRef: query.trim() + ' (resolved)' };
    return { ok: false, reason: 'not-found' };
  }

  return { MAPS, buildBrowse, adjacent, VISITOR_RECENTS_SEED, FEATURED, SITE_RECENTS, sefariaLookup, localRef, bookName, localTopic };

  // Localized reference helpers — used everywhere we display a citation.
  function localRef(m, lang) {
    if (!m) return '';
    if (lang === 'he') return `${m.hebrewBook} ${m.hebrewLoc}`;
    return m.latin;
  }
  function bookName(book, lang) {
    const HE = { megillah: 'מגילה', berakhot: 'ברכות', genesis: 'בראשית', shabbat: 'שבת' };
    if (lang === 'he') return HE[book] || book;
    return book.charAt(0).toUpperCase() + book.slice(1);
  }
  function localTopic(m, lang) {
    if (!m) return '';
    if (lang === 'he') return m.topicHe || m.topicEn || '';
    return m.topicEn || m.topicHe || '';
  }
})();
