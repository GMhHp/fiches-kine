/* Fiches Kiné — recherche et actions de navigation */
// ════════════════════════════════════════════════════════════
//  RECHERCHE PROFONDE
// ════════════════════════════════════════════════════════════
// ── Recherche tolérante : sans accents, mots dans n'importe quel ordre, pluriels ──
var S_STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'un', 'une', 'et', 'a', 'au', 'aux', 'en', 'pour', 'par', 'sur', 'avec', 'sans', 'dans', 'ou']);
var S_SYN = { tendinite: ['tendinite', 'tendinopathie'], algodystrophie: ['algodystrophie', 'algoneurodystrophie', 'sdrc'], lumbago: ['lumbago', 'lombalgie'] };
function sNorm(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function sTokens(q) {
  var out = [];
  sNorm(q).split(' ').forEach(function (w) {
    if (!w || S_STOP.has(w)) return;
    if (w.length > 3 && /[sx]$/.test(w)) w = w.slice(0, -1);
    if (out.indexOf(w) < 0) out.push(w);
  });
  return out;
}
function sAlts(t) { return S_SYN[t] || [t]; }
// Mot court (≤ 3 lettres, ex. « SLA », « LCA ») : seulement en début de mot, pour éviter « tran-sla-tion »
function sFind(n, w) { return w.length <= 3 ? n.indexOf(' ' + w) : n.indexOf(w); }
function sTabLabel(k) { var t = ONGLETS_DEF.find(function (x) { return x.key === k; }); return t ? t.label : ''; }
var _sIdx = null;
function sIndex() {
  if (_sIdx) return _sIdx;
  _sIdx = new Map();
  ALL_FICHES.forEach(function (f) {
    var E = [], O = f.onglets || {};
    var add = function (tab, text, w) { if (text) E.push({ tab: tab, raw: String(text), n: ' ' + sNorm(text) + ' ', w: w }); };
    add('_nom', f.nom, 100);
    add('_zone', f.zone + (f.secondaryZone ? ' ' + f.secondaryZone : '') + (f.sport && f.zone !== 'Sport' ? ' Sport' : ''), 40);
    add('_resume', f.resume, 30);
    (f.stats || []).forEach(function (s) { add('_resume', s.val + ' ' + s.lbl, 15); });
    ['definition', 'bilan', 'pec', 'pronostic'].forEach(function (k) { ((O[k] && O[k].blocs) || []).forEach(function (b) { add(k, b.titre, 12); (b.items || []).forEach(function (i) { add(k, i, 10); }); }); });
    if (O.flags) { (O.flags.red || []).forEach(function (r) { add('flags', r, 12); }); (O.flags.yellow || []).forEach(function (y) { add('flags', y, 10); }); add('flags', O.flags.note, 8); }
    if (O.ddx) (O.ddx.items || []).forEach(function (d) { add('ddx', d.dx, 20); add('ddx', d.dx + ' — pour : ' + d.pour + ' ; contre : ' + d.contre, 8); });
    if (O.tests) { (O.tests.items || []).forEach(function (t) { add('tests', t.nom, 25); add('tests', t.nom + ' — ' + (t.note || ''), 8); }); add('tests', O.tests.note, 8); }
    if (O.orientation) (O.orientation.items || []).forEach(function (i) { add('orientation', i, 10); });
    if (O.has) { (O.has.grades || []).forEach(function (g) { add('has', g.t, 8); }); (O.has.sources || []).forEach(function (s) { add('has', s, 6); }); }
    _sIdx.set(f.id, E);
  });
  return _sIdx;
}
// Mots trouvés dans la fiche → { n: nombre de mots trouvés, score, hit: passage à montrer }, sinon null
function sMatch(f, toks) {
  var E = sIndex().get(f.id);
  if (!E || !toks.length) return null;
  var score = 0, found = 0, inHead = 0, i, j, a;
  for (i = 0; i < toks.length; i++) {
    var alts = sAlts(toks[i]), best = 0, head = false;
    for (j = 0; j < E.length; j++) {
      for (a = 0; a < alts.length; a++) {
        var p = sFind(E[j].n, alts[a]);
        if (p > -1) {
          var w = E[j].w * (alts[a].length <= 3 || E[j].n.charAt(p - 1) === ' ' ? 1 : 0.5);
          if (w > best) best = w;
          if (E[j].tab === '_nom' || E[j].tab === '_zone') head = true;
        }
      }
    }
    if (best) { found++; score += best; if (head) inHead++; }
  }
  if (!found) return null;
  // Tous les mots dans le nom ou la zone → haut de la fiche ; sinon le passage d'un onglet qui en contient le plus
  var hit = null, hitN = 0, hitP = -1;
  if (inHead === toks.length) { hit = E[0]; score += 30; }
  else {
    for (j = 0; j < E.length; j++) {
      var n = 0;
      for (i = 0; i < toks.length; i++) { var al = sAlts(toks[i]); for (a = 0; a < al.length; a++) { if (sFind(E[j].n, al[a]) > -1) { n++; break; } } }
      if (!n) continue;
      var pr = E[j].tab === '_nom' ? 1000 : (E[j].tab.charAt(0) === '_' ? 1 : E[j].w);
      if (n > hitN || (n === hitN && pr > hitP)) { hit = E[j]; hitN = n; hitP = pr; }
    }
    if (hitN === toks.length) score += 20;
  }
  return { n: found, score: score, hit: hit };
}
function matchesDeep(f, q) { var t = sTokens(q); if (!t.length) return true; var m = sMatch(f, t); return !!m && m.n === t.length; }
// Expression régulière qui retrouve les mots cherchés dans le texte d'origine (accents compris)
var S_ACC = { a: 'aàâäáãå', e: 'eéèêë', i: 'iîïíì', o: 'oôöóòõ', u: 'uùûüú', c: 'cç', y: 'yÿý', n: 'nñ' };
function sRegex(toks) {
  var pats = [];
  (toks || []).forEach(function (t) { if (t.length < 2) return; sAlts(t).forEach(function (w) {
    var p = '';
    for (var k = 0; k < w.length; k++) {
      var ch = w.charAt(k), nx = w.charAt(k + 1);
      if (ch === 'o' && nx === 'e') { p += '(?:[oôöóòõ][eéèêë]|œ)'; k++; continue; }
      if (ch === 'a' && nx === 'e') { p += '(?:[aàâäáãå][eéèêë]|æ)'; k++; continue; }
      p += S_ACC[ch] ? '[' + S_ACC[ch] + ']' : ch.replace(/[-.*+?^$(){}|[\]\\]/g, '\\$&');
    }
    if (p) pats.push((w.length <= 3 ? '\\b' : '') + p);
  }); });
  if (!pats.length) return null;
  pats.sort(function (x, y) { return y.length - x.length; });
  return new RegExp('(' + pats.join('|') + ')', 'gi');
}
// Extrait autour du premier mot trouvé
function sSnippet(raw, toks) {
  var txt = clean(raw), re = sRegex(toks), start = 0, MAX = 150, m = re ? re.exec(txt) : null;
  if (m && m.index > 60) { var s0 = txt.lastIndexOf(' ', m.index - 40); start = s0 > 0 ? s0 + 1 : 0; }
  var s = txt.slice(start, start + MAX);
  if (start + MAX < txt.length) s = s.replace(/\s+\S*$/, '') + ' …';
  if (start > 0) s = '… ' + s;
  return '<span class="pcard-hit-txt">' + rich(s, toks) + '</span>';
}
// Ouvre la fiche sur l'onglet où le mot a été trouvé, et montre le premier passage surligné
function openFicheAt(id, tab) {
  detailTab = tab || null;
  openFiche(id);
  setTimeout(function () {
    var mk = document.querySelector('.section mark.hl');
    if (mk) { mk.scrollIntoView({ block: 'center', behavior: 'smooth' }); mk.classList.add('hl-pulse'); }
  }, 160);
}

// ════════════════════════════════════════════════════════════
//  ACTIONS
// ════════════════════════════════════════════════════════════
function setView(v) { state.view = v; state.openId = null; state.ficheHistory = []; if (v !== "quiz") state.quiz = null; if (v !== "flash") state.flash = null; render(); window.scrollTo(0, 0); }
// Fiche ouverte depuis Tests ou depuis le guide du bilan : on y reste (le bouton retour y ramène)
function inSubView() { return state.view === "tests" || state.view === "bilan"; }
function openFiche(id, keepHistory) { if (!keepHistory) state.ficheHistory = []; if (!(keepHistory && inSubView())) state.view = "fiches"; state.openId = id; render(); window.scrollTo(0, 0); }
function goFiche(id) {
  if (!ALL_FICHES.some(function (x) { return x.id === id; })) return;
  if (state.openId) state.ficheHistory.push({ id: state.openId, tab: detailTab, y: window.scrollY });
  detailTab = null;
  openFiche(id, true);
}
function backFiche() {
  var prev = state.ficheHistory.pop();
  if (!prev) { closeFiche(); return; }
  if (!inSubView()) state.view = "fiches"; state.openId = prev.id; detailTab = prev.tab; render();
  window.scrollTo(0, prev.y || 0);
}
// Fermer la fiche : retour à l'écran d'où on vient (pathologies, tests ou guide du bilan, à la même position)
function closeFiche() {
  state.ficheHistory = []; state.openId = null; render();
  if (state.view === "tests" && state.tests) window.scrollTo(0, state.tests.y || 0);
  else if (state.view === "bilan") window.scrollTo(0, state.bilanY || 0);
}
// ════════════════════════════════════════════════════════════
//  ADRESSES (#/…) : bouton retour Android / geste retour iPhone, lien direct, rechargement
// ════════════════════════════════════════════════════════════
// #/fiches · #/fiches/<id>/<onglet> · #/tests · #/tests/<id> · #/quiz · #/cartes · #/cas · #/progression
// #/bilan/<section> · #/bilan/<section>/<id>/<onglet> (fiche ouverte depuis le guide du bilan)
var ROUTE_VIEWS = { aujourdhui: 'today', fiches: 'fiches', tests: 'tests', bilan: 'bilan', quiz: 'quiz', cartes: 'flash', cas: 'cas', entrainer: 'train', progression: 'prog' };
var _routing = false, _lastRoute = null;
function routeOf() {
  var name = Object.keys(ROUTE_VIEWS).find(function (k) { return ROUTE_VIEWS[k] === state.view; }) || 'aujourdhui';
  if (name === 'bilan') name += '/' + (state.bilanTab || 'apercu');
  return '#/' + name + (state.openId ? '/' + state.openId + (detailTab ? '/' + detailTab : '') : '');
}
// Partie de l'adresse qui désigne l'écran, sans l'onglet affiché
function routeScreen(r) {
  var p = r.split('/');
  if (p[1] === 'bilan') return p.length > 3 ? p.slice(0, 4).join('/') : '#/bilan';
  return p.slice(0, 3).join('/');
}
function syncRoute() {
  if (_routing) return;
  var r = routeOf();
  if (r !== location.hash) {
    // Premier écran, ou simple changement d'onglet dans la même fiche (ou dans le guide du bilan) :
    // on remplace l'adresse (sinon le bouton retour repasserait par chaque onglet)
    var same = _lastRoute && (state.openId || state.view === 'bilan') && routeScreen(_lastRoute) === routeScreen(r);
    try { history[!_lastRoute || same ? 'replaceState' : 'pushState'](null, '', r); } catch (e) {}
  }
  _lastRoute = r;
}
function applyRoute() {
  var p = (location.hash || '').replace(/^#\/?/, '').split('/').map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
  var v = ROUTE_VIEWS[p[0]] || 'today';
  // Guide du bilan : la section, puis éventuellement la fiche ouverte depuis le guide
  if (v === 'bilan') { state.bilanTab = p[1] || 'apercu'; p.splice(1, 1); }
  var id = (v === 'fiches' || v === 'tests' || v === 'bilan') && ALL_FICHES.some(function (f) { return f.id === p[1]; }) ? p[1] : null;
  // Retour d'une fiche ouverte depuis le guide du bilan : on revient au même endroit du guide
  var backToGuide = v === 'bilan' && !id && !!_lastRoute && routeScreen(_lastRoute).split('/').length === 4 && _lastRoute.indexOf('#/bilan/' + state.bilanTab + '/') === 0;
  var H = state.ficheHistory;
  if (!id) state.ficheHistory = [];
  else if (H.length && H[H.length - 1].id === id) H.pop();   // retour vers la fiche précédente
  state.view = v; state.openId = id;
  if (id) detailTab = p[2] || null;
  if (v !== 'quiz') state.quiz = null;
  if (v !== 'flash') state.flash = null;
  _routing = true;
  try { renderView(); } finally { _routing = false; }
  _lastRoute = routeOf();
  window.scrollTo(0, backToGuide ? state.bilanY || 0 : 0);
}
window.addEventListener('popstate', applyRoute);

function ficheNom(id) { var f = ALL_FICHES.find(function (x) { return x.id === id; }); return f ? f.nom : ''; }
function toggleDark() { document.body.classList.toggle("dark"); STORE.dark = document.body.classList.contains("dark"); document.getElementById("darkbtn").textContent = document.body.classList.contains("dark") ? "☀" : "🌙"; syncDarkBtn(); syncThemeColor(); }
function syncDarkBtn() { var b = document.getElementById("darkbtn"); if (!b) return; var t = document.body.classList.contains("dark") ? "Passer en mode clair" : "Passer en mode sombre"; b.setAttribute("aria-label", t); b.title = t; }
function toggleFav(id, ev) {
  if (ev) ev.stopPropagation();
  state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id); STORE.favs = state.favs; render();
  // Le focus revient sur l'étoile (sinon il retombe en haut de page après le nouveau rendu)
  var b = document.querySelector('[data-fav="' + id + '"]'); if (b) b.focus({ preventScroll: true });
}
function toggleMastered(id) { state.mastered.has(id) ? state.mastered.delete(id) : state.mastered.add(id); STORE.mastered = state.mastered; render(); }
function setZone(z) { state.zone = z; render(); }
function setQuery(v) { state.query = v; var c = document.querySelector('.search-clear'); if (c) c.hidden = !v; renderFichesBody(); }
function toggleFavsOnly() { state.favsOnly = !state.favsOnly; render(); }
function resetFilters() { state.query = ""; state.zone = "Toutes"; state.favsOnly = false; render(); }

