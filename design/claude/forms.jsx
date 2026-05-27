// forms.jsx — /request and /feedback forms.

function RequestForm({ t, lang, nav, query }) {
  const D = window.CHAZARAH_DATA;
  const [ref, setRef] = React.useState(query.ref || '');
  const [resolved, setResolved] = React.useState(null); // null | {ok, ref, heRef, reason}
  const [targetLang, setTargetLang] = React.useState('he');
  const [note, setNote] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const lookup = () => {
    const r = D.sefariaLookup(ref);
    setResolved(r);
  };

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const isHe = lang === 'he';

  if (submitted) {
    return (
      <main className="shell-main">
        <section className="page-section first">
          <div className="container narrow">
            <SuccessCard t={t} lang={lang} nav={nav} message={t.submitted} ref_={ref} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell-main">
      <section className="page-section first">
        <div className="container narrow">
          <div className="kicker" style={{ marginBottom: 6 }}>{isHe ? 'טופס' : 'Form'}</div>
          <h1 className="display h1" style={{ marginBottom: 8 }}>{t.reqTitle}</h1>
          <p className="lead" style={{ marginBottom: 36 }}>{t.reqIntro}</p>

          <form onSubmit={submit} className="stack-8">
            {/* Sefaria reference */}
            <div className="field">
              <label htmlFor="ref">{t.reqRefLabel}</label>
              <div className="field-row">
                <div className="field" style={{ flex: 1 }}>
                  <input id="ref" type="text" value={ref}
                    onChange={(e) => { setRef(e.target.value); setResolved(null); }}
                    placeholder={t.reqRefPh} />
                </div>
                <button type="button" className="btn ghost" onClick={lookup}>{t.reqLookup}</button>
              </div>
              {resolved && resolved.ok && (
                <div className="resolved" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <span className="dot" />
                  <span>{t.reqResolved}: <strong>{resolved.ref}</strong></span>
                  <span style={{ color: 'var(--ink-3)', marginInlineStart: 4 }}>· {resolved.heRef}</span>
                </div>
              )}
              {resolved && !resolved.ok && (
                <div className="resolved bad" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <span className="dot" />
                  <span>{t.reqNotFound}</span>
                </div>
              )}
              <div className="hint">
                {isHe
                  ? 'נסו Megillah 26, או מגילה כו, או Berakhot 17.'
                  : 'Try Megillah 26, מגילה כו, or Berakhot 17.'}
              </div>
            </div>

            {/* Target language */}
            <div className="field">
              <label>{t.reqLangLabel}</label>
              <div className="pills">
                <button type="button" className={'pill' + (targetLang==='he'?' on':'')} onClick={() => setTargetLang('he')}>עברית · HE</button>
                <button type="button" className={'pill' + (targetLang==='en'?' on':'')} onClick={() => setTargetLang('en')}>English · EN</button>
                <button type="button" className={'pill' + (targetLang==='yi'?' on':'')} onClick={() => setTargetLang('yi')}>יידיש · YI</button>
              </div>
            </div>

            {/* Note */}
            <div className="field">
              <label htmlFor="note">{t.reqNoteLabel}</label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder={t.reqNotePh}></textarea>
            </div>

            {/* Email */}
            <div className="field">
              <label htmlFor="email">{t.reqEmailLabel}</label>
              <input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.reqEmailPh} />
            </div>

            {/* Turnstile placeholder */}
            <div className="turnstile">[ Cloudflare Turnstile ] {t.reqTurnstile}</div>

            <div className="row" style={{ marginTop: 8 }}>
              <button type="submit" className="btn accent">{t.reqSubmit}</button>
              <button type="button" className="btn ghost" onClick={() => nav('/')}>{t.backHome}</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function FeedbackForm({ t, lang, nav, query }) {
  const refParam = query.ref || '';
  const [node, setNode] = React.useState('');
  const [obs, setObs] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const isHe = lang === 'he';

  const submit = (e) => {
    e.preventDefault();
    if (!obs.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="shell-main">
        <section className="page-section first">
          <div className="container narrow">
            <SuccessCard t={t} lang={lang} nav={nav} message={t.fbSubmitted} ref_={refParam} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell-main">
      <section className="page-section first">
        <div className="container narrow">
          <div className="kicker" style={{ marginBottom: 6 }}>{isHe ? 'טופס' : 'Form'}</div>
          <h1 className="display h1" style={{ marginBottom: 8 }}>{t.fbTitle}</h1>
          <p className="lead" style={{ marginBottom: 28 }}>{t.fbIntro}</p>

          {/* About banner — pre-filled, non-editable */}
          <div style={{
            background: 'var(--paper-warm)',
            border: '1px solid var(--rule)',
            borderInlineStart: '3px solid var(--accent)',
            padding: '16px 20px',
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
          }}>
            <div>
              <div className="kicker" style={{ marginBottom: 4 }}>{t.fbAbout}</div>
              <div className="display" style={{ fontSize: 22 }}>
                {refParam || (isHe ? '(לא צוין דף)' : '(no ref specified)')}
              </div>
            </div>
            <div className="latin">{refParam}</div>
          </div>

          <form onSubmit={submit} className="stack-8">
            <div className="field">
              <label htmlFor="node">{t.fbNodeLabel}</label>
              <input id="node" type="text" value={node}
                onChange={(e) => setNode(e.target.value)} placeholder={t.fbNodePh} />
            </div>
            <div className="field">
              <label htmlFor="obs">{t.fbObsLabel} <span style={{ color: 'var(--accent)' }}>*</span></label>
              <textarea id="obs" required value={obs}
                onChange={(e) => setObs(e.target.value)} placeholder={t.fbObsPh}></textarea>
            </div>
            <div className="field">
              <label htmlFor="fbemail">{t.fbEmailLabel}</label>
              <input id="fbemail" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder={t.reqEmailPh} />
            </div>
            <div className="turnstile">[ Cloudflare Turnstile ] {t.reqTurnstile}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <button type="submit" className="btn accent">{t.fbSubmit}</button>
              <button type="button" className="btn ghost" onClick={() => nav('/')}>{t.backHome}</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function SuccessCard({ t, lang, nav, message, ref_ }) {
  const isHe = lang === 'he';
  return (
    <div style={{
      background: 'var(--paper-card)',
      border: '1px solid var(--rule)',
      borderInlineStart: '3px solid var(--accent)',
      padding: '40px 36px',
    }}>
      <div className="kicker accent" style={{ marginBottom: 8 }}>{isHe ? 'תודה' : 'Thank you'}</div>
      <div className="display h2" style={{ marginBottom: 16 }}>{message}</div>
      {ref_ && (
        <div className="latin" style={{ marginBottom: 24 }}>
          {isHe ? 'התייחס ל-' : 'About: '}{ref_}
        </div>
      )}
      <p className="muted" style={{ marginBottom: 24 }}>
        {isHe
          ? 'הבקשה נכנסה לתור הפנימי שלנו. אם השארתם אימייל, נכתוב לכם.'
          : 'Your submission entered our internal queue. If you left an email, we will write to you.'}
      </p>
      <div className="row">
        <button className="btn ghost" onClick={() => nav('/')}>{t.backHome}</button>
        <button className="btn ghost" onClick={() => nav('/map/talmud/megillah/')}>{t.landingBrowseCta}</button>
      </div>
    </div>
  );
}

Object.assign(window, { RequestForm, FeedbackForm });
