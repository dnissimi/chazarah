// map-info.jsx — Map Info Page with 2 composition variants.

function isHebrewLang(l) { return l === 'he'; }

function MapInfo({ t, lang, nav, tweaks, corpus, book, location }) {
  const D = window.CHAZARAH_DATA;
  const n = parseInt(location, 10);
  const map = D.MAPS.find(m => m.corpus === corpus && m.book === book && m.location === n);

  // Synthesize a placeholder info page even if no map exists yet (per spec — never 404).
  const HE_NUM = ['','א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳','י״א','י״ב','י״ג','י״ד','ט״ו','ט״ז','י״ז','י״ח','י״ט','כ׳','כ״א','כ״ב','כ״ג','כ״ד','כ״ה','כ״ו','כ״ז','כ״ח','כ״ט','ל׳','ל״א','ל״ב'];
  const hebrewLoc = HE_NUM[n] || String(n);
  const hebrewBook = D.bookName(book, 'he');
  const bookEn = D.bookName(book, 'en');
  const localizedBook = isHebrewLang(lang) ? hebrewBook : bookEn;
  const localizedRef = isHebrewLang(lang) ? `${hebrewBook} ${hebrewLoc}` : `${bookEn} ${n}`;
  const latin = `${bookEn} ${n}`;
  const topicLocal = map ? D.localTopic(map, lang) : '—';
  const langs = map ? map.langs : [];
  const updated = map ? map.updated : '—';

  // Adjacent
  const prevN = n - 1 >= 2 ? n - 1 : null;
  const nextN = n + 1 <= 32 ? n + 1 : null;

  const isHe = lang === 'he';
  const title = isHe ? `מפת הסוגיא — ${hebrewBook} ${hebrewLoc}` : `Map of the sugya — ${bookEn} ${n}`;

  const composition = 'two-col';

  // Two-column composition (sole variant).
  return (
    <main className="shell-main">
      <section className="page-section first">
        <div className="container">
          {/* Breadcrumb */}
          <div className="latin" style={{ marginBottom: 12, direction: isHe ? 'rtl' : 'ltr' }}>
            <a className="link" style={{ borderBottom: 'none' }} href="#/" onClick={(e)=>{e.preventDefault();nav('/');}}>{t.brand}</a>
            <span style={{ margin: '0 6px', color: 'var(--ink-3)' }}>/</span>
            <a className="link" style={{ borderBottom: 'none' }} href={`#/map/${corpus}/${book}/`} onClick={(e)=>{e.preventDefault();nav(`/map/${corpus}/${book}/`);}}>{localizedBook}</a>
            <span style={{ margin: '0 6px', color: 'var(--ink-3)' }}>/</span>
            <span>{isHe ? hebrewLoc : n}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 64,
            alignItems: 'start',
          }}>
            <div>
              <div className="kicker" style={{ marginBottom: 6 }}>{isHe ? 'מפת חזרה' : 'Chazarah Map'}</div>
              <h1 className="display h1" style={{ marginBottom: 6 }}>{title}</h1>
              {!isHe && <div className="latin" style={{ marginBottom: 24 }}>{latin}</div>}
              {map ? (
                <>
                  <div className="display" style={{ fontSize: 28, color: 'var(--accent)', marginBottom: 12 }}>
                    {topicLocal}
                  </div>
                  <p className="lead" style={{ marginBottom: 24 }}>{t.miBlurb}</p>
                  <div style={{ marginTop: 24 }}>
                    <MiniMap width={280} height={180} />
                  </div>
                </>
              ) : (
                <p className="lead" style={{ marginBottom: 24 }}>
                  {isHe
                    ? 'עדיין לא נוצרה מפה לדף זה. אפשר לבקש שיתווסף.'
                    : 'No map has been made for this daf yet. You can request one.'}
                </p>
              )}
            </div>

            <aside style={{
              borderInlineStart: '1px solid var(--rule)',
              paddingInlineStart: 36,
              display: 'flex',
              flexDirection: 'column',
              gap: 36,
            }}>
              <LanguageVariants t={t} lang={lang} langs={langs} corpus={corpus} book={book} n={n} nav={nav} />
              <FeedbackLink t={t} lang={lang} nav={nav} latin={latin} />
              <AdjacentNav t={t} lang={lang} nav={nav} corpus={corpus} book={book} bookEn={bookEn} prevN={prevN} nextN={nextN} HE_NUM={HE_NUM} />
            </aside>
          </div>

          <hr className="rule" style={{ margin: '56px 0 16px' }} />
          <div className="latin row between" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            <span>{t.miSefariaCredit}</span>
            <span>{t.miUpdated}: {updated}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function LanguageVariants({ t, lang, langs, corpus, book, n, nav }) {
  const isHe = lang === 'he';
  // All possible language variants we care to display; show available + grayed-out missing.
  const ALL = [
    { code: 'he', label: t.miLangHebrew,  always: true },
    { code: 'en', label: t.miLangEnglish, always: true },
    { code: 'yi', label: t.miLangYiddish, always: false },
  ];
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 14 }}>
        <span>{t.miLanguages}</span>
        <span className="bar" />
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {ALL.map(L => {
          const present = langs.includes(L.code);
          return (
            <li key={L.code} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'baseline',
              padding: '12px 0',
              borderBottom: '1px solid var(--rule)',
              opacity: present ? 1 : 0.6,
            }}>
              <div>
                <span className="display" style={{ fontSize: 19 }}>{L.label}</span>
                <span className="chip" style={{ marginInlineStart: 18 }}>{L.code.toUpperCase()}</span>
              </div>
              {present ? (
                <a className="link"
                   style={{ fontSize: 13, borderBottom: 'none', color: 'var(--accent)' }}
                   href={`#/map/${corpus}/${book}/${n}/${L.code}`}
                   onClick={(e) => {
                     e.preventDefault();
                     alert(`Would open the standalone map HTML for ${book} ${n} (${L.code})`);
                   }}>
                  {t.miOpenMap} →
                </a>
              ) : (
                <a className="link"
                   style={{ fontSize: 13, borderBottom: 'none', color: 'var(--ink-3)', borderBottom: '1px dashed var(--ink-3)' }}
                   href="#/request"
                   onClick={(e) => { e.preventDefault(); nav('/request'); }}>
                  {t.miRequestTranslation} →
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeedbackLink({ t, lang, nav, latin }) {
  return (
    <a
      href={`#/feedback?ref=${encodeURIComponent(latin)}`}
      onClick={(e) => { e.preventDefault(); nav(`/feedback?ref=${encodeURIComponent(latin)}`); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '22px 24px',
        background: 'var(--paper-warm)',
        border: '1px solid var(--rule)',
        borderInlineStart: '3px solid var(--accent)',
        color: 'var(--ink)',
        cursor: 'pointer',
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-card)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--paper-warm)'; }}
    >
      <span className="display" style={{ fontSize: 20, lineHeight: 1.25 }}>{t.miFeedback}</span>
      <span style={{ color: 'var(--accent)', fontSize: 20, lineHeight: 1 }}>→</span>
    </a>
  );
}

function AdjacentNav({ t, lang, nav, corpus, book, bookEn, prevN, nextN, HE_NUM }) {
  const isHe = lang === 'he';
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 14 }}>
        <span>{t.miAdjacent}</span>
        <span className="bar" />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        background: 'var(--rule)',
        border: '1px solid var(--rule)',
      }}>
        {/* In RTL, "previous" (smaller daf number) sits on the right; "next" on the left. */}
        {/* But because the page is dir=rtl, source-order right→left already does this. */}
        <AdjLink t={t} lang={lang} nav={nav} corpus={corpus} book={book} bookEn={bookEn}
                 n={prevN} kind="prev" HE_NUM={HE_NUM} />
        <AdjLink t={t} lang={lang} nav={nav} corpus={corpus} book={book} bookEn={bookEn}
                 n={nextN} kind="next" HE_NUM={HE_NUM} />
      </div>
    </div>
  );
}

function AdjLink({ t, lang, nav, corpus, book, bookEn, n, kind, HE_NUM }) {
  const isHe = lang === 'he';
  const D = window.CHAZARAH_DATA;
  const exists = n != null;
  const map = exists ? D.MAPS.find(m => m.book === book && m.location === n) : null;
  const label = kind === 'prev' ? t.miPrev : t.miNext;
  // RTL: prev arrow is →, next arrow is ←. LTR: opposite.
  const arrow = (isHe ? (kind === 'prev' ? '→' : '←') : (kind === 'prev' ? '←' : '→'));
  return (
    <a
      onClick={(e) => { e.preventDefault(); if (exists) nav(`/map/${corpus}/${book}/${n}`); }}
      href={exists ? `#/map/${corpus}/${book}/${n}` : '#'}
      style={{
        background: 'var(--paper-card)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minHeight: 100,
        opacity: exists ? 1 : 0.4,
        pointerEvents: exists ? 'auto' : 'none',
        cursor: exists ? 'pointer' : 'default',
      }}
    >
      <div className="kicker" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ direction: 'ltr' }}>{arrow}</span>
      </div>
      <div className="display" style={{ fontSize: 22 }}>
        {exists ? (HE_NUM[n] || String(n)) : '—'}
      </div>
      <div className="latin" style={{ fontSize: 11 }}>
        {exists ? (isHe ? `${D.bookName(book, 'he')} ${HE_NUM[n]}` : `${bookEn} ${n}`) : ''}
      </div>
      {map && (
        <div style={{ marginTop: 'auto', fontSize: 13, color: 'var(--ink-2)' }}>
          {D.localTopic(map, lang)}
        </div>
      )}
    </a>
  );
}

Object.assign(window, { MapInfo });
