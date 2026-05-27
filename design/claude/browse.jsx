// browse.jsx — Library page: list of all dapim in a masechet.

function Browse({ t, lang, nav, tweaks, corpus = 'talmud', book = 'megillah' }) {
  const D = window.CHAZARAH_DATA;
  const dapim = D.buildBrowse(book);
  const [filter, setFilter] = React.useState('all');

  const visible = dapim.filter(d => {
    if (filter === 'with')    return !!d.map;
    if (filter === 'without') return !d.map;
    return true;
  });

  const isHe = lang === 'he';
  const bookHe = D.bookName(book, 'he');
  const bookEn = D.bookName(book, 'en');

  return (
    <main className="shell-main">
      <section className="page-section first">
        <div className="container">
          {/* Breadcrumb */}
          <div className="latin" style={{ marginBottom: 8, direction: isHe ? 'rtl' : 'ltr' }}>
            <a className="link" href="#/" onClick={(e) => { e.preventDefault(); nav('/'); }}
               style={{ borderBottom: 'none' }}>{t.brand}</a>
            <span style={{ margin: '0 6px', color: 'var(--ink-3)' }}>/</span>
            <span>{isHe ? `תלמוד / ${bookHe}` : `${corpus} / ${bookEn}`}</span>
          </div>
          <h1 className="display h1" style={{ marginBottom: 6 }}>
            {isHe ? `מסכת ${bookHe}` : `Masechet ${bookEn}`}
          </h1>
          {!isHe && (
            <div className="latin" style={{ marginBottom: 18 }}>{bookEn} · Talmud Bavli</div>
          )}
          <p className="lead">{t.browseSummary(isHe ? bookHe : bookEn)}</p>

          {/* Filter chips */}
          <div className="row" style={{ marginTop: 24 }}>
            <div className="kicker">{isHe ? 'סינון' : 'Filter'}</div>
            <div className="pills">
              <button className={'pill' + (filter==='all'?' on':'')} onClick={() => setFilter('all')}>{t.browseAll} <span className="latin" style={{ marginInlineStart: 6 }}>{dapim.length}</span></button>
              <button className={'pill' + (filter==='with'?' on':'')} onClick={() => setFilter('with')}>{t.browseWithMap} <span className="latin" style={{ marginInlineStart: 6 }}>{dapim.filter(d=>d.map).length}</span></button>
              <button className={'pill' + (filter==='without'?' on':'')} onClick={() => setFilter('without')}>{t.browseWithoutMap} <span className="latin" style={{ marginInlineStart: 6 }}>{dapim.filter(d=>!d.map).length}</span></button>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section tight">
        <div className="container">
          <BrowseList dapim={visible} t={t} lang={lang} nav={nav} book={book} />
        </div>
      </section>
    </main>
  );
}

function BrowseList({ dapim, t, lang, nav, book }) {
  const isHe = lang === 'he';
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--rule)' }}>
      {dapim.map(d => (
        <li key={d.n} style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto',
          gap: 24,
          alignItems: 'baseline',
          padding: '18px 0',
          borderBottom: '1px solid var(--rule)',
          opacity: d.map ? 1 : 0.55,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 80 }}>
            <span className="display" style={{ fontSize: 26, lineHeight: 1 }}>{d.hebrewNum}</span>
            {!isHe && <span className="latin">{d.latin}</span>}
          </div>
          <div>
            {d.map ? (
              <a className="link" style={{ borderBottom: 'none' }}
                 href={`#/map/talmud/${book}/${d.n}`}
                 onClick={(e) => { e.preventDefault(); nav(`/map/talmud/${book}/${d.n}`); }}>
                <span className="display" style={{ fontSize: 18 }}>{lang === 'he' ? d.map.topicHe : (d.map.topicEn || d.map.topicHe)}</span>
              </a>
            ) : (
              <span className="muted" style={{ fontStyle: 'italic' }}>{t.browseEmpty}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {d.map
              ? d.map.langs.map(l => <span key={l} className="chip">{l.toUpperCase()}</span>)
              : <span className="chip empty">—</span>}
          </div>
          <div>
            {d.map
              ? <a className="link" style={{ fontSize: 13 }} href={`#/map/talmud/${book}/${d.n}`}
                   onClick={(e) => { e.preventDefault(); nav(`/map/talmud/${book}/${d.n}`); }}>{t.miOpenMap} →</a>
              : <a className="link" style={{ fontSize: 13 }} href="#/request"
                   onClick={(e) => { e.preventDefault(); nav('/request'); }}>{t.browseRequestThis} →</a>}
          </div>
        </li>
      ))}
    </ul>
  );
}

Object.assign(window, { Browse });
