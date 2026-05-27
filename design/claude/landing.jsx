// landing.jsx — Landing page with 3 hero variants.

function Landing({ t, lang, nav, tweaks, visitorRecents }) {
  const D = window.CHAZARAH_DATA;
  return (
    <main className="shell-main">
      <HeroEditorial t={t} lang={lang} nav={nav} />

      {/* Daf Yomi feature */}
      <section className="page-section tight">
        <div className="container">
          <DafYomiFeature t={t} lang={lang} nav={nav} />
        </div>
      </section>

      {/* Featured product: Chazarah Map — now framed as "Most Popular" */}
      <section className="page-section">
        <div className="container">
          <FeaturedProduct t={t} lang={lang} nav={nav} />
        </div>
      </section>

      {/* Site Recents now lives inside FeaturedProduct above as "Recently Added" */}

      {/* Visitor Recents — only if present */}
      {visitorRecents && visitorRecents.length > 0 && (
        <section className="page-section tight">
          <div className="container">
            <VisitorRecents t={t} lang={lang} nav={nav} items={visitorRecents} />
          </div>
        </section>
      )}

      {/* Request banner */}
      <section className="page-section">
        <div className="container">
          <RequestBanner t={t} lang={lang} nav={nav} />
        </div>
      </section>
    </main>
  );
}

// Daf Yomi featured block — small kicker, sugya title, map preview, primary CTA.
function DafYomiFeature({ t, lang, nav }) {
  const D = window.CHAZARAH_DATA;
  const isHe = lang === 'he';
  const dafYomi = D.MAPS.find(m => m.book === 'megillah' && m.location === 26);
  const ref = D.localRef(dafYomi, lang);
  // Today's date — display only (mock)
  const today = isHe ? 'כ״ז באייר תשפ״ו' : 'May 27, 2026';
  return (
    <div style={{
      background: 'var(--paper-card)',
      border: '1px solid var(--rule)',
      borderInlineStart: '3px solid var(--accent)',
      padding: '36px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr 1.1fr',
      gap: 48,
      alignItems: 'center',
    }}>
      <div>
        <div className="kicker accent" style={{ marginBottom: 8 }}>{t.landingDafYomi}</div>
        <div className="latin" style={{ marginBottom: 14, color: 'var(--ink-3)' }}>{today} · {ref}</div>
        <h2 className="display" style={{ fontSize: 38, lineHeight: 1.15, marginBottom: 10 }}>
          {dafYomi.topicHe && (lang === 'he' ? dafYomi.topicHe : dafYomi.topicEn)}
        </h2>
        <p className="muted" style={{ marginTop: 4, marginBottom: 24, maxWidth: '32em' }}>
          {t.landingDafYomiSub}
        </p>
        <div className="row">
          <button className="btn accent" onClick={() => nav(`/map/talmud/megillah/${dafYomi.location}`)}>
            {t.miOpenMap}
          </button>
          <button className="btn ghost" onClick={() => nav('/map/talmud/megillah/')}>
            {t.landingBrowseCta}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <HeroMap lang={lang} />
      </div>
    </div>
  );
}

// HERO 1 — Editorial: huge Hebrew word, kicker, intro paragraph, no imagery.
function HeroEditorial({ t, lang, nav }) {
  const isHe = lang === 'he';
  return (
    <section className="page-section first">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div className="kicker accent">{isHe ? 'לחזור · לראות · לזכור' : 'review · see · remember'}</div>
          <h1 className="display h-hero" style={{ marginBottom: 8 }}>
            {t.landingTagline}
          </h1>
          <p className="lead" style={{ marginTop: 16 }}>{t.landingIntro}</p>
        </div>
      </div>
    </section>
  );
}

// HERO 2 — Map spread: intro on one side, decorative hero map on the other.
function HeroMapSpread({ t, lang, nav }) {
  const isHe = lang === 'he';
  return (
    <section className="page-section first">
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}>
          <div>
            <div className="kicker accent" style={{ marginBottom: 16 }}>
              {isHe ? 'לחזור · לראות · לזכור' : 'review · see · remember'}
            </div>
            <h1 className="display h1" style={{ marginBottom: 20 }}>{t.landingTagline}</h1>
            <p className="lead">{t.landingIntro}</p>
          </div>
          <div style={{ borderInlineStart: '1px solid var(--rule)', paddingInlineStart: 48 }}>
            <div className="kicker" style={{ marginBottom: 16 }}>
              {isHe ? 'דוגמה' : 'Example'}
            </div>
            <HeroMap lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}

// HERO 3 — Featured map first: a single map preview as the hero,
// with chazarah's value prop folded into a sidebar caption.
function HeroFeaturedFirst({ t, lang, nav }) {
  const isHe = lang === 'he';
  return (
    <section className="page-section first">
      <div className="container">
        <div style={{
          background: 'var(--paper-card)',
          border: '1px solid var(--rule)',
          padding: 48,
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: 56,
          alignItems: 'center',
        }}>
          <div>
            <div className="kicker accent">{isHe ? 'הסוגיא של השבוע' : 'Sugya of the week'}</div>
            <h1 className="display h1" style={{ margin: '8px 0 6px' }}>מקרא מגילה בלילה וביום</h1>
            <div className="latin" style={{ marginBottom: 18 }}>{isHe ? 'מגילה כ״ו · 4 רבדים, 22 צמתים' : 'Megillah 26a · 4 layers, 22 nodes'}</div>
            <p className="lead" style={{ marginBottom: 24 }}>{t.landingIntro}</p>
            <div className="row">
              <button className="btn accent" onClick={() => nav('/map/talmud/megillah/26')}>{t.miOpenMap}</button>
              <button className="btn ghost" onClick={() => nav('/map/talmud/megillah/')}>{t.landingBrowseCta}</button>
            </div>
          </div>
          <div>
            <HeroMap lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedProduct({ t, lang, nav }) {
  const D = window.CHAZARAH_DATA;
  return (
    <div>
      <div className="section-label">
        <span>{t.landingSiteRecents}</span>
        <span className="bar" />
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', borderTop: '1px solid var(--rule)' }}>
        {D.SITE_RECENTS.map(m => (
          <li key={m.latin} style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            gap: 24,
            alignItems: 'baseline',
            padding: '20px 0',
            borderBottom: '1px solid var(--rule)',
          }}>
            <a className="link" style={{ borderBottom: 'none' }}
               href={`#/map/talmud/${m.book}/${m.location}`}
               onClick={(e) => { e.preventDefault(); nav(`/map/talmud/${m.book}/${m.location}`); }}>
              <div className="display" style={{ fontSize: 24, lineHeight: 1.3 }}>{D.localTopic(m, lang)}</div>
            </a>
            <span className="latin" style={{ whiteSpace: 'nowrap' }}>{D.localRef(m, lang)}</span>
            <span className="latin" style={{ whiteSpace: 'nowrap', color: 'var(--ink-3)' }}>{m.updated}</span>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {m.langs.map(l => <span key={l} className="chip" style={{ direction: 'ltr' }}>{l.toUpperCase()}</span>)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteRecents({ t, lang, nav, items }) {
  return (
    <div>
      <div className="section-label">
        <span>{t.landingSiteRecents}</span>
        <span className="bar" />
      </div>
      <div style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 1,
        background: 'var(--rule)',
        border: '1px solid var(--rule)',
      }}>
        {items.map((m) => (
          <a key={m.latin}
             href={`#/map/talmud/${m.book}/${m.location}`}
             onClick={(e) => { e.preventDefault(); nav(`/map/${m.corpus}/${m.book}/${m.location}`); }}
             style={{
               background: 'var(--paper-card)',
               padding: '20px 22px',
               display: 'flex',
               flexDirection: 'column',
               gap: 6,
               minHeight: 120,
               cursor: 'pointer',
             }}>
            <div className="latin" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
              {D.localRef(m, lang)} · {m.updated}
            </div>
            <div className="display" style={{ fontSize: 20, lineHeight: 1.25 }}>{D.localTopic(m, lang)}</div>
            <div style={{ marginTop: 'auto', display: 'flex', gap: 4 }}>
              {m.langs.map(l => <span key={l} className="chip">{l.toUpperCase()}</span>)}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function VisitorRecents({ t, lang, nav, items }) {
  const refOf = (it) => lang === 'he' ? (it.hebrewRef || it.latin) : it.latin;
  return (
    <div>
      <div className="section-label">
        <span>{t.landingVisitorRecents}</span>
        <span className="bar" />
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
        {items.map(it => (
          <li key={it.hash} style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid var(--rule)',
            alignItems: 'baseline',
          }}>
            <a className="link" style={{ borderBottom: 'none' }}
               href={it.hash}
               onClick={(e) => { e.preventDefault(); nav(it.hash.replace('#', '')); }}>
              <span className="display" style={{ fontSize: 18 }}>{lang === 'he' ? it.topicHe : (it.topicEn || it.topicHe)}</span>
              <span className="latin" style={{ marginInlineStart: 12 }}>{refOf(it)}</span>
            </a>
            <span className="latin">{it.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequestBanner({ t, lang, nav }) {
  return (
    <div style={{
      background: 'var(--paper-warm)',
      border: '1px solid var(--rule)',
      borderInlineStart: '3px solid var(--accent)',
      padding: '24px 28px',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 24,
      alignItems: 'center',
    }}>
      <div>
        <div className="display" style={{ fontSize: 22, marginBottom: 4 }}>{t.landingRequestTitle}</div>
        <div className="muted">{t.landingRequestSub}</div>
      </div>
      <button className="btn" onClick={() => nav('/request')}>{t.landingRequestCta}</button>
    </div>
  );
}

Object.assign(window, { Landing });
