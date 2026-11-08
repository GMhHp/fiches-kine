/* Fiches Kiné — guide « Faire un bilan » (contenu : data/bilan.js) */
// ════════════════════════════════════════════════════════════
//  GUIDE DU BILAN : ouvert depuis l'écran Tests (carte « Méthode du bilan »)
// ════════════════════════════════════════════════════════════
// Adresses : #/bilan/<section> · fiche ouverte depuis le guide : #/bilan/<section>/<fiche>/<onglet>
// state.bilanTab = section affichée · state.bilanY = position dans le guide avant d'ouvrir une fiche
function bTab(key) {
  for (var i = 0; i < BILAN_GUIDE.tabs.length; i++) if (BILAN_GUIDE.tabs[i].key === key) return BILAN_GUIDE.tabs[i];
  return null;
}
function bFicheOk(id) { return ALL_FICHES.some(function (f) { return f.id === id; }); }

// Carte d'entrée, en haut de l'écran Tests
function bilanEntryHTML() {
  var n = BILAN_GUIDE.tabs.filter(function (t) { return t.num; }).length;
  return '<button class="train-tile bm-entry" type="button"' + act('openBilan') + '>' +
    '<span class="train-ico" aria-hidden="true">🧭</span>' +
    '<span class="train-txt"><span class="train-t">Méthode du bilan</span>' +
    '<span class="train-s">Faire un bilan pas à pas : ' + n + ' étapes, un exemple et une trame à copier</span></span>' +
    F1_ICO.chevR + '</button>';
}
function openBilan(key) {
  tState().y = window.scrollY;   // retour aux Tests à la même position
  state.view = 'bilan'; state.openId = null; state.ficheHistory = [];
  if (key && bTab(key)) state.bilanTab = key;
  render();
  window.scrollTo(0, 0);
}
function closeBilan() {
  state.view = 'tests'; state.openId = null; state.ficheHistory = [];
  render();
  window.scrollTo(0, tState().y || 0);
}

// ── Blocs du guide ──
function bList(items, cls) {
  return '<ul class="items">' + items.map(function (i) { return '<li class="item' + (cls ? ' ' + cls : '') + '"><span>' + rich(i) + '</span></li>'; }).join('') + '</ul>';
}
function bPart(p) {
  switch (p.t) {
    case 'callout': return '<p class="t-callout">' + rich(p.text) + '</p>';
    case 'bloc': return '<div class="block"><h2 class="block-title">' + esc(p.titre) + '</h2>' + bList(p.items) + '</div>';
    case 'quotes': return '<div class="block"><h2 class="block-title">' + esc(p.titre) + '</h2>' + bList(p.items.map(function (q) { return '« ' + q + ' »'; }), 'b-quote') + '</div>';
    case 'steps': return '<ol class="b-steps">' + p.items.map(function (s, i) {
      return '<li><button class="b-step" type="button"' + act('bNext', s.key) + '><span class="b-step-n" aria-hidden="true">' + (i + 1) + '</span>' +
        '<span class="b-step-main"><span class="b-step-t">' + esc(s.titre) + '</span><span class="b-step-d">' + rich(s.txt) + '</span></span>' + F1_ICO.chevR + '</button></li>';
    }).join('') + '</ol>';
    case 'tools': return '<div class="block"><h2 class="block-title">' + esc(p.titre) + '</h2><dl class="b-tools">' +
      p.items.map(function (x) { return '<div class="b-tool"><dt>' + esc(x.nom) + '</dt><dd>' + rich(x.txt) + '</dd></div>'; }).join('') + '</dl></div>';
    case 'cif': return '<div class="block"><h2 class="block-title">' + esc(p.titre) + '</h2><div class="b-cif">' +
      p.rows.map(function (r) { return '<div class="b-cif-row"><div class="b-cif-k">' + esc(r.k) + '<span class="b-cif-d">' + esc(r.d) + '</span></div><div class="b-cif-ex">' + rich(r.ex) + '</div></div>'; }).join('') + '</div></div>';
    case 'cards': return '<div class="b-cards">' + p.items.map(function (c) { return '<div class="block"><h2 class="block-title">' + esc(c.titre) + '</h2>' + bList(c.items) + '</div>'; }).join('') + '</div>';
    case 'links': return '<div class="b-links">' + p.items.map(function (l) {
      var id = l.action.indexOf('fiche:') === 0 ? l.action.slice(6) : '';
      var a = l.action === 'tests' ? act('closeBilan') : id && bFicheOk(id) ? act('bOpenFiche', id) : '';
      return a ? '<button class="chip" type="button"' + a + '>' + esc(l.label) + ' ›</button>' : '';
    }).join('') + '</div>';
    case 'template': return '<div class="block b-tpl"><div class="b-tpl-head"><h2 class="block-title">' + esc(p.titre) + '</h2>' +
      '<button class="chip" type="button" id="bCopyBtn"' + act('bCopy') + '>Copier la trame</button></div><pre class="b-pre" id="bTpl">' + esc(p.text) + '</pre></div>';
    case 'sources': return '<div class="src-card"><h2 class="src-title">Sources officielles &amp; références</h2><ul class="b-src">' + p.items.map(function (s) {
      return '<li><span>' + esc(s.txt) + '</span>' + (s.url
        ? '<a class="src-link" href="' + esc(s.url) + '" target="_blank" rel="noopener">↗ ouvrir</a>'
        : '<button class="src-link" type="button"' + act('askURL', s.txt) + '>↗ rechercher</button>') + '</li>';
    }).join('') + '</ul></div>';
  }
  return '';
}

// ── Écran du guide (même mise en page qu'une fiche : onglets, section suivante) ──
function renderBilan(app) {
  var tabs = BILAN_GUIDE.tabs, T = bTab(state.bilanTab) || tabs[0], idx = tabs.indexOf(T);
  state.bilanTab = T.key;
  var html = '<div class="detail f1 bilan">' +
    '<div class="d-top"><div class="d-nav"><button class="back" type="button"' + act('closeBilan') + '>' + F1_ICO.chevL + '<span class="back-lbl">Tests cliniques</span></button></div></div>' +
    '<div class="d-head"><div class="eyebrow">Méthode</div><h1 class="d-title">Faire un <em>bilan</em></h1>' +
    '<p class="d-resume">La démarche pas à pas, de la prescription au compte rendu : anamnèse, drapeaux, hypothèses, examen, diagnostic kiné, objectifs et suivi. Une trame commune, à adapter à chaque patient.</p></div>' +
    '<div id="tabsAnchor"></div><div class="tabs-wrap"><div class="tabs" role="tablist" aria-label="Étapes du bilan">' +
    tabs.map(function (t) {
      var on = t === T;
      return '<button class="tab' + (on ? ' on' : '') + '" type="button" role="tab" id="btab-' + t.key + '" data-tab="' + t.key + '" aria-selected="' + on + '" aria-controls="bilanPanel"' + act('bSwitch', t.key) + '>' +
        (t.num ? '<span class="tab-num">' + t.num + '</span> ' : '') + esc(t.label) + '</button>';
    }).join('') + '</div></div>' +
    '<div class="section" id="bilanPanel" role="tabpanel" aria-labelledby="btab-' + T.key + '">' + T.parts.map(bPart).join('') + '</div>';
  if (idx < tabs.length - 1) {
    var nx = tabs[idx + 1];
    html += '<button class="d-next" type="button"' + act('bNext', nx.key) + '><span class="d-next-txt"><span class="d-next-k">' + (nx.num ? 'Étape suivante' : 'Section suivante') + '</span>' +
      '<span class="d-next-l">' + (nx.num ? nx.num + '. ' : '') + esc(nx.label) + '</span></span>' + F1_ICO.chevR + '</button>';
  }
  html += '<div class="disclaimer">' + F1_ICO.alert + '<div>Outil de révision personnel. Les textes et les recommandations évoluent : <strong>revérifie les sources officielles à jour</strong> avant toute application clinique.</div></div></div>';
  app.innerHTML = html;
  var bar = app.querySelector('.tabs');
  if (bar) bar.addEventListener('scroll', updateTabsFades, { passive: true });
  setNavH();
  updateTabsFades();
  setTimeout(scrollActiveTab, 60);
}
function bSwitch(key, dir) {
  var tabs = BILAN_GUIDE.tabs, T = bTab(key), from = tabs.indexOf(bTab(state.bilanTab));
  if (!T) return;
  state.bilanTab = key;
  render();
  tabsToTop();
  applySlide(dir || (tabs.indexOf(T) >= from ? 'right' : 'left'));
  setTimeout(scrollActiveTab, 50);
}
// Étape cliquée ou « Étape suivante » : le focus va sur l'onglet (lecteur d'écran, clavier)
function bNext(key) {
  bSwitch(key);
  var t = document.querySelector('.bilan .tab.on');
  if (t) t.focus({ preventScroll: true });
}
// Fiche ouverte depuis le guide : son bouton retour ramène ici, au même endroit
function bOpenFiche(id) {
  if (!bFicheOk(id)) return;
  state.bilanY = window.scrollY;
  state.ficheHistory = [];
  state.openId = id;
  detailTab = null;
  // Nouvelle adresse avant de redessiner : le navigateur garde la position du guide pour le bouton retour
  syncRoute();
  render();
  window.scrollTo(0, 0);
}
function bCopy() {
  var part = null;
  BILAN_GUIDE.tabs.forEach(function (t) { t.parts.forEach(function (p) { if (p.t === 'template') part = p; }); });
  if (!part) return;
  var btn = document.getElementById('bCopyBtn');
  var done = function (ok) {
    if (ok) toast('✓ Trame copiée : colle-la dans ton logiciel ou tes notes.');
    else toast('Copie impossible ici : sélectionne le texte de la trame pour le copier.', 'err');
    if (!btn || !ok) return;
    btn.textContent = 'Copiée ✓';
    setTimeout(function () { if (btn) btn.textContent = 'Copier la trame'; }, 2200);
  };
  var fallback = function () {
    try {
      var ta = document.createElement('textarea');
      ta.value = part.text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta); done(ok);
    } catch (e) { done(false); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(part.text).then(function () { done(true); }, fallback);
  else fallback();
}

// ── Balayage horizontal entre les sections du guide (les fiches ont le leur, dans vues.js) ──
(function () {
  var x0 = 0, y0 = 0, t0 = 0, el0 = null;
  document.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); el0 = e.target;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (state.view !== 'bilan' || state.openId) return;
    // Pas depuis la barre d'onglets (elle défile) ni depuis la trame (sélection du texte)
    if (el0 && el0.closest && el0.closest('.tabs, .b-pre')) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Date.now() - t0 > 400 || Math.abs(dy) > 80 || Math.abs(dx) < 50) return;
    var keys = BILAN_GUIDE.tabs.map(function (t) { return t.key; }), i = keys.indexOf(state.bilanTab);
    var j = dx < 0 ? Math.min(i + 1, keys.length - 1) : Math.max(i - 1, 0);
    if (i < 0 || j === i) return;
    bSwitch(keys[j], dx < 0 ? 'right' : 'left');
  }, { passive: true });
})();
window.addEventListener('resize', function () { if (state.view === 'bilan' && !state.openId) { setNavH(); updateTabsFades(); } });
