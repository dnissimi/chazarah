// chrome.jsx — Header, Footer, Layout (the things that wrap every page).

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// Tiny abstract mark for the brand: three stacked horizontal bars
// suggesting layered text / structure. Not a Star of David, not a Hebrew
// letter. Decorative only.
function BrandMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square">
        <line x1="3" y1="6"  x2="21" y2="6" />
        <line x1="6" y1="12" x2="18" y2="12" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </g>
    </svg>
  );
}

function LanguageSwitcher({ lang, setLang }) {
  return (
    <div className="lang-switcher" role="group" aria-label="Site language">
      <button className={lang === 'he' ? 'active' : ''} onClick={() => setLang('he')}>עברית</button>
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
    </div>
  );
}

function SiteHeader({ lang, setLang, t, route, nav }) {
  const isActive = (prefix) => {
    if (prefix === '/') return route.path === '/';
    return route.path.startsWith(prefix);
  };
  return (
    <header className="site-header">
      <div className="container">
        <div className="row">
          <div className="brand" onClick={() => nav('/')}>
            <span style={{ color: 'var(--ink)', display: 'inline-flex', alignItems: 'center' }}>
              <BrandMark />
            </span>
            <span className="mark">{t.brand}</span>
            <span className="markSub">{t.brandSub}</span>
          </div>
          <nav className="site-nav">
            <a className={isActive('/') && route.path === '/' ? 'active' : ''}
               href="#/" onClick={(e) => { e.preventDefault(); nav('/'); }}>{t.navHome}</a>
            <a className={isActive('/map') ? 'active' : ''}
               href="#/map/talmud/megillah/" onClick={(e) => { e.preventDefault(); nav('/map/talmud/megillah/'); }}>{t.navBrowse}</a>
            <a className={isActive('/request') ? 'active' : ''}
               href="#/request" onClick={(e) => { e.preventDefault(); nav('/request'); }}>{t.navRequest}</a>
          </nav>
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
      </div>
      <div className="editorial-rule" />
    </header>
  );
}

function SiteFooter({ t }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row between">
          <div>{t.sefariaFooter}</div>
          <div style={{ direction: 'ltr', letterSpacing: '0.08em' }}>© 2026 Chazarah · חזרה</div>
        </div>
      </div>
    </footer>
  );
}

// MiniMap — a small decorative flowchart preview. Used inline in the
// landing hero (one variant) and as a small accent on info pages. Not a
// real map; just visual rhythm.
function MiniMap({ width = 240, height = 160, palette = 'accent' }) {
  const c = palette === 'ink' ? 'var(--ink)' : 'var(--accent)';
  const r = 'var(--rule-strong)';
  const node = (x, y, w, h, fill) => (
    <rect x={x} y={y} width={w} height={h} fill={fill || 'var(--paper-warm)'} stroke={r} strokeWidth="1" />
  );
  const line = (x1, y1, x2, y2) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={r} strokeWidth="1" />
  );
  return (
    <svg className="minimap" width={width} height={height} viewBox="0 0 240 160" aria-hidden="true">
      {/* root */}
      {node(96, 12, 48, 18, c)}
      {/* connectors down */}
      {line(120, 30, 60, 50)}
      {line(120, 30, 120, 50)}
      {line(120, 30, 180, 50)}
      {/* second row */}
      {node(36, 50, 48, 18)}
      {node(96, 50, 48, 18)}
      {node(156, 50, 48, 18)}
      {/* connectors */}
      {line(60, 68, 60, 86)}
      {line(120, 68, 120, 86)}
      {line(180, 68, 180, 86)}
      {/* leaf */}
      {node(36, 86, 48, 18)}
      {node(96, 86, 48, 18)}
      {node(156, 86, 48, 18)}
      {/* connect to bottom */}
      {line(60, 104, 60, 122)}
      {line(180, 104, 180, 122)}
      {/* terminal nodes */}
      {node(36, 122, 48, 18, 'var(--paper-2)')}
      {node(156, 122, 48, 18, 'var(--paper-2)')}
    </svg>
  );
}

// Big mini-map — same idea but proportionally larger for a hero
function HeroMap({ lang = 'he' }) {
  const L = lang === 'en'
    ? { root: 'Mishna', q: 'Kushya', d: 'Drasha', a: 'Teshuva',
        n1: 'Tanya Nami', n2: 'Hashlacha', n3: 'Diyuk',
        t1: 'Halacha', t2: 'Maskana' }
    : { root: 'משנה', q: 'קושיא', d: 'דרשה', a: 'תשובה',
        n1: 'תניא נמי', n2: 'השלכה', n3: 'דיוק',
        t1: 'הלכה', t2: 'מסקנא' };
  return (
    <svg viewBox="0 0 480 340" width="100%" style={{ display: 'block', maxWidth: 480 }} aria-hidden="true">
      <defs>
        <pattern id="dots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="var(--rule-strong)" opacity="0.35" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="480" height="340" fill="url(#dots)" />
      {/* root */}
      <rect x="190" y="20" width="100" height="34" fill="var(--accent)" />
      <text x="240" y="42" fontFamily="var(--font-display)" fontSize="14" fill="var(--paper-card)" textAnchor="middle">{L.root}</text>
      {/* level 2 */}
      <line x1="240" y1="54" x2="90" y2="100" stroke="var(--rule-strong)" />
      <line x1="240" y1="54" x2="240" y2="100" stroke="var(--rule-strong)" />
      <line x1="240" y1="54" x2="390" y2="100" stroke="var(--rule-strong)" />
      <rect x="40"  y="100" width="100" height="34" fill="var(--paper-card)" stroke="var(--rule-strong)" />
      <text x="90"  y="122" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">{L.q}</text>
      <rect x="190" y="100" width="100" height="34" fill="var(--paper-card)" stroke="var(--rule-strong)" />
      <text x="240" y="122" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">{L.d}</text>
      <rect x="340" y="100" width="100" height="34" fill="var(--paper-card)" stroke="var(--rule-strong)" />
      <text x="390" y="122" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">{L.a}</text>
      {/* level 3 */}
      <line x1="90"  y1="134" x2="90"  y2="180" stroke="var(--rule-strong)" />
      <line x1="240" y1="134" x2="240" y2="180" stroke="var(--rule-strong)" />
      <line x1="390" y1="134" x2="390" y2="180" stroke="var(--rule-strong)" />
      <rect x="40"  y="180" width="100" height="34" fill="var(--paper-warm)" stroke="var(--rule-strong)" />
      <text x="90"  y="202" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">{L.n1}</text>
      <rect x="190" y="180" width="100" height="34" fill="var(--paper-warm)" stroke="var(--rule-strong)" />
      <text x="240" y="202" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">{L.n2}</text>
      <rect x="340" y="180" width="100" height="34" fill="var(--paper-warm)" stroke="var(--rule-strong)" />
      <text x="390" y="202" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">{L.n3}</text>
      {/* level 4 */}
      <line x1="90"  y1="214" x2="90"  y2="260" stroke="var(--rule-strong)" />
      <line x1="390" y1="214" x2="390" y2="260" stroke="var(--rule-strong)" />
      <rect x="40"  y="260" width="100" height="34" fill="var(--paper-card)" stroke="var(--rule-strong)" strokeDasharray="3 3" />
      <text x="90"  y="282" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink-2)" textAnchor="middle">{L.t1}</text>
      <rect x="340" y="260" width="100" height="34" fill="var(--paper-card)" stroke="var(--rule-strong)" strokeDasharray="3 3" />
      <text x="390" y="282" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink-2)" textAnchor="middle">{L.t2}</text>
    </svg>
  );
}

Object.assign(window, { SiteHeader, SiteFooter, BrandMark, MiniMap, HeroMap, LanguageSwitcher });
