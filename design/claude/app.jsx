// app.jsx — Router, tweaks state, top-level App.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "bone",
  "typePair": "david",
  "showVisitorRecents": true
}/*EDITMODE-END*/;

// Hash router. URLs we handle:
//   #/                                  → landing
//   #/map/<corpus>/<book>/              → browse
//   #/map/<corpus>/<book>/<n>           → map info
//   #/request                           → request form
//   #/feedback?ref=…                    → feedback form
function parseRoute() {
  let hash = window.location.hash || '#/';
  if (hash.startsWith('#')) hash = hash.slice(1);
  const [pathPart, queryPart] = hash.split('?');
  const path = pathPart || '/';
  const query = {};
  if (queryPart) {
    queryPart.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { path, query };
}

function navigate(path) {
  window.location.hash = path.startsWith('/') ? path : '/' + path;
  window.scrollTo(0, 0);
}

// Visitor Recents — persisted in localStorage. Seeded once.
function useVisitorRecents(enabled) {
  const KEY = 'chazarah.visitorRecents.v2';
  const [recents, setRecents] = React.useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
      // Seed
      const seed = window.CHAZARAH_DATA.VISITOR_RECENTS_SEED;
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    } catch {
      return [];
    }
  });
  return enabled ? recents : [];
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = React.useState(() => {
    return localStorage.getItem('chazarah.lang') || 'he';
  });
  const [route, setRoute] = React.useState(parseRoute());

  React.useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('chazarah.lang', lang);
    const t = window.CHAZARAH_I18N[lang];
    document.documentElement.setAttribute('dir', t.dir);
    document.documentElement.setAttribute('lang', t.lang);
  }, [lang]);

  // Apply palette + type pairing via root attrs so CSS variables swap.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-palette', tweaks.palette);
    document.documentElement.setAttribute('data-type', tweaks.typePair);
  }, [tweaks.palette, tweaks.typePair]);

  const t = window.CHAZARAH_I18N[lang];
  const visitorRecents = useVisitorRecents(tweaks.showVisitorRecents);

  // Route resolution
  function renderScreen() {
    const p = route.path;
    if (p === '/' || p === '') return <Landing t={t} lang={lang} nav={navigate} tweaks={tweaks} visitorRecents={visitorRecents} />;
    if (p === '/request') return <RequestForm t={t} lang={lang} nav={navigate} query={route.query} />;
    if (p === '/feedback') return <FeedbackForm t={t} lang={lang} nav={navigate} query={route.query} />;

    // /map/<corpus>/<book>/  or  /map/<corpus>/<book>/<location>
    const mapMatch = p.match(/^\/map\/([^\/]+)\/([^\/]+)\/?([^\/]*)\/?$/);
    if (mapMatch) {
      const [, corpus, book, location] = mapMatch;
      if (!location) {
        return <Browse t={t} lang={lang} nav={navigate} tweaks={tweaks} corpus={corpus} book={book} />;
      } else {
        return <MapInfo t={t} lang={lang} nav={navigate} tweaks={tweaks} corpus={corpus} book={book} location={location} />;
      }
    }

    return <NotFound t={t} lang={lang} nav={navigate} />;
  }

  return (
    <div className="shell">
      <SiteHeader lang={lang} setLang={setLang} t={t} route={route} nav={navigate} />
      {renderScreen()}
      <SiteFooter t={t} />

      <TweaksPanel>
        <TweakSection label="Landing" />
        <TweakToggle label="Visitor Recents" value={tweaks.showVisitorRecents}
          onChange={(v) => setTweak('showVisitorRecents', v)} />

        <TweakSection label="Jump to" />
        <TweakButton label="Landing"        onClick={() => navigate('/')} />
        <TweakButton label="Browse"         onClick={() => navigate('/map/talmud/megillah/')} />
        <TweakButton label="Map Info"       onClick={() => navigate('/map/talmud/megillah/26')} />
        <TweakButton label="Map Info empty" onClick={() => navigate('/map/talmud/megillah/15')} />
        <TweakButton label="Request"        onClick={() => navigate('/request')} />
        <TweakButton label="Feedback"       onClick={() => navigate('/feedback?ref=Megillah%2026')} />
      </TweaksPanel>
    </div>
  );
}

// Tweak colors are stored by name; the picker uses palette swatches.
function paletteToColor(name) {
  return ({
    parchment: ['#f3ecd9', '#2a3a6b', '#1a1814'],
    bone:      ['#f1ece2', '#2a3a6b', '#1c1815'],
    slate:     ['#e8e6e1', '#8a5a2a', '#1a1c1f'],
  }[name]);
}
function colorToPalette(v) {
  const key = JSON.stringify(v);
  if (key === JSON.stringify(['#f3ecd9', '#2a3a6b', '#1a1814'])) return 'parchment';
  if (key === JSON.stringify(['#f1ece2', '#2a3a6b', '#1c1815'])) return 'bone';
  if (key === JSON.stringify(['#e8e6e1', '#8a5a2a', '#1a1c1f'])) return 'slate';
  return 'bone';
}

function NotFound({ t, lang, nav }) {
  return (
    <main className="shell-main">
      <section className="page-section first">
        <div className="container narrow">
          <h1 className="display h1">404</h1>
          <p className="lead">{lang === 'he' ? 'הדף לא נמצא.' : 'Page not found.'}</p>
          <button className="btn ghost" onClick={() => nav('/')} style={{ marginTop: 16 }}>{t.backHome}</button>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
