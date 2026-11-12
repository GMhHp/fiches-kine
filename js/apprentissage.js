/* Fiches Kiné — apprentissage : répétition espacée, carnet d'erreurs, historique, série,
   accueil « Aujourd'hui », écran « S'entraîner », mode examen, cas suivis.
   Tout est enregistré sur l'appareil (clés kine_*), inclus dans « Exporter un fichier ».
   Le contenu médical n'est jamais modifié : on ne garde que des identifiants et des résultats. */

// ════════════════════════════════════════════════════════════
//  STOCKAGE
// ════════════════════════════════════════════════════════════
var LEARN_SCHEMA = 2;
function ljGet(k, def) { try { var v = JSON.parse(lsGet(k, null) || 'null'); return v === null || v === undefined ? def : v; } catch (e) { return def; } }
function ljSet(k, v) { lsSet(k, JSON.stringify(v)); }
if (ljGet('kine_schema', 0) < LEARN_SCHEMA) ljSet('kine_schema', LEARN_SCHEMA);

// Jour local (numéro de jour), pour les échéances et la série
function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
// Petite empreinte de texte (identifiant stable d'une carte ou d'une question)
function hashStr(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function ficheById(id) { return ALL_FICHES.find(function (f) { return f.id === id; }); }

// ════════════════════════════════════════════════════════════
//  ACTIVITÉ DU JOUR, SÉRIE
// ════════════════════════════════════════════════════════════
function dayLog() { var d = ljGet('kine_day', null); return d && d.d === today() ? d : { d: today(), cards: 0, qs: 0, news: 0 }; }
function logActivity(kind, n) {
  var d = dayLog(); d[kind] = (d[kind] || 0) + (n || 1); ljSet('kine_day', d);
  var days = ljGet('kine_days', []);
  if (days[days.length - 1] !== d.d) { days.push(d.d); if (days.length > 400) days = days.slice(-400); ljSet('kine_days', days); }
}
// Jours consécutifs d'activité (aujourd'hui compris, ou jusqu'à hier si rien encore aujourd'hui)
function streak() {
  var days = ljGet('kine_days', []), set = {}, t = today(), n = 0;
  days.forEach(function (x) { set[x] = 1; });
  var d = set[t] ? t : t - 1;
  while (set[d]) { n++; d--; }
  return n;
}

// ════════════════════════════════════════════════════════════
//  RÉPÉTITION ESPACÉE DES CARTES (SM-2 simplifié)
// ════════════════════════════════════════════════════════════
// kine_srs : { clé de carte : { d: jour d'échéance, i: intervalle (jours), e: facilité, r: réussites, l: oublis } }
var NEW_PER_DAY = 20;
var SRS_GRADES = [
  { k: 0, l: 'À revoir', cls: 'g-again' }, { k: 1, l: 'Difficile', cls: 'g-hard' },
  { k: 2, l: 'Bien', cls: 'g-good' }, { k: 3, l: 'Facile', cls: 'g-easy' }
];
function cardKey(c) { return c.ficheId + '|' + c.cat + '|' + hashStr(c.q + '|' + (c.sub || '')); }
var _allCards = null;
function allCards() { if (!_allCards) _allCards = buildFlashcards(ALL_FICHES.filter(function (f) { return !f.stub; })); return _allCards; }
function srsAll() { return ljGet('kine_srs', {}); }
// Prochaine échéance après une note (0 à revoir · 1 difficile · 2 bien · 3 facile)
function srsNext(s, g) {
  s = s ? { d: s.d, i: s.i, e: s.e, r: s.r, l: s.l } : { d: today(), i: 0, e: 2.5, r: 0, l: 0 };
  if (g === 0) { s.i = 0; s.r = 0; s.l++; s.e = Math.max(1.3, s.e - 0.2); }
  else if (g === 1) { s.i = Math.max(1, Math.round(s.i * 1.2)); s.e = Math.max(1.3, s.e - 0.15); s.r++; }
  else if (g === 2) { s.i = s.i < 1 ? 1 : s.i < 3 ? 3 : Math.round(s.i * s.e); s.r++; }
  else { s.i = s.i < 1 ? 3 : Math.round(Math.max(s.i, 2) * s.e * 1.3); s.e = Math.min(3, s.e + 0.15); s.r++; }
  s.i = Math.min(s.i, 365);
  s.d = today() + s.i;
  return s;
}
function srsGrade(c, g) {
  var all = srsAll(), k = cardKey(c), isNew = !all[k];
  all[k] = srsNext(all[k], g); ljSet('kine_srs', all);
  logActivity('cards'); if (isNew) logActivity('news');
  return all[k];
}
// Cartes dues et nouvelles, selon un filtre facultatif (zone, type, fiche)
function srsCounts(filter) {
  var all = srsAll(), t = today(), due = 0, fresh = 0;
  allCards().forEach(function (c) { if (filter && !filter(c)) return; var s = all[cardKey(c)]; if (!s) fresh++; else if (s.d <= t) due++; });
  return { due: due, fresh: fresh, newLeft: Math.max(0, NEW_PER_DAY - (dayLog().news || 0)) };
}
// Paquet du jour : cartes dues (les plus en retard d'abord) puis nouvelles cartes dans la limite du jour
function srsDeck(filter) {
  var all = srsAll(), t = today(), due = [], fresh = [];
  allCards().forEach(function (c) { if (filter && !filter(c)) return; var s = all[cardKey(c)]; if (!s) fresh.push(c); else if (s.d <= t) due.push({ c: c, d: s.d }); });
  due.sort(function (a, b) { return a.d - b.d; });
  var left = Math.max(0, NEW_PER_DAY - (dayLog().news || 0));
  return due.map(function (x) { return x.c; }).concat(shuffle(fresh).slice(0, left));
}
function flashFilter() {
  var z = state.flashZone || 'Toutes', cat = state.flashCat || 'Toutes';
  return function (c) { return (z === 'Toutes' || ficheInZone(ficheById(c.ficheId), z)) && (cat === 'Toutes' || c.cat === cat); };
}
// Lance la révision espacée (filtres de l'écran Cartes, ou une fiche précise)
function startSrs(ficheId) {
  var filter = ficheId ? function (c) { return c.ficheId === ficheId; } : flashFilter();
  var deck = ficheId ? shuffle(allCards().filter(filter)) : srsDeck(filter);
  if (!deck.length) { toast('Aucune carte à revoir pour l\'instant : reviens demain, ou parcours toutes les cartes.'); return; }
  state.view = 'flash';
  state.flash = { cards: deck, idx: 0, flipped: false, srs: true, done: 0, again: 0 };
  render(); window.scrollTo(0, 0);
}
// Note donnée après avoir retourné la carte
function gradeCard(g) {
  var F = state.flash; if (!F || !F.cards.length) return;
  var c = F.cards[F.idx];
  srsGrade(c, g);
  F.done++;
  if (g === 0) { F.again++; F.cards.splice(Math.min(F.cards.length, F.idx + 4), 0, c); }   // revient quelques cartes plus loin
  if (F.idx + 1 >= F.cards.length) { F.finished = true; }
  else { F.idx++; F.flipped = false; }
  renderFlash(appEl());
  announce(F.finished ? 'Révision terminée.' : 'Carte suivante.');
  if (!F.finished) focusFlash();
}
// Boutons de note (affichés une fois la carte retournée)
function gradeButtonsHTML(c) {
  var cur = srsAll()[cardKey(c)];
  return '<div class="grade-row" role="group" aria-label="Comment tu t\'en es souvenu ?">' + SRS_GRADES.map(function (g) {
    var nx = srsNext(cur, g.k), when = g.k === 0 ? 'dans la séance' : nx.i <= 1 ? 'demain' : 'dans ' + nx.i + ' j';
    return '<button type="button" class="grade-btn ' + g.cls + '"' + act('gradeCard', g.k) + '><span class="grade-l">' + g.l + '</span><span class="grade-w">' + when + '</span></button>';
  }).join('') + '</div>';
}
function srsDoneHTML(F) {
  var c = srsCounts(), e = errorsDue().length;
  return '<div class="quiz-results"><div class="mode-icon" style="background:var(--green-bg);color:var(--green);margin:0 auto 12px">✓</div>' +
    '<h2 class="result-title">Révision terminée</h2>' +
    '<p class="result-score">' + F.done + ' carte' + (F.done > 1 ? 's' : '') + ' revue' + (F.done > 1 ? 's' : '') + (F.again ? ' · ' + F.again + ' à revoir pendant la séance' : '') + '</p>' +
    '<p class="result-best">🔥 Série : ' + streak() + ' jour' + (streak() > 1 ? 's' : '') + '</p>' +
    '<div class="result-actions">' +
    (e ? '<button class="btn-primary"' + act('startErrorQuiz') + '>Revoir mes erreurs (' + e + ')</button>' : '') +
    (c.due ? '<button class="btn-primary"' + act('startSrs') + '>Encore ' + c.due + ' carte' + (c.due > 1 ? 's' : '') + ' dues</button>' : '') +
    '<button class="chip"' + act('setView', 'today') + '>Retour à Aujourd\'hui</button></div></div>';
}

// ════════════════════════════════════════════════════════════
//  CARNET D'ERREURS (quiz, examen et cas cliniques)
// ════════════════════════════════════════════════════════════
// kine_err : { clé : { q: question (type, ficheId, zone, q, options, answer), n: erreurs, ok: réussites d'affilée, d: échéance, t: date } }
// Une question ratée revient le lendemain, puis 3 jours après une réussite ; elle sort du carnet après 2 réussites d'affilée.
function qKey(q) { return q.casId ? 'cas|' + q.casId + '|' + q.qi : q.ficheId + '|' + q.type + '|' + hashStr(q.answer); }
function errAll() { return ljGet('kine_err', {}); }
function errMiss(q) {
  var all = errAll(), k = qKey(q), e = all[k] || { n: 0 };
  all[k] = { q: { type: q.type, ficheId: q.ficheId, zone: q.zone, niveau: q.niveau, q: q.q, options: q.options, answer: q.answer, casId: q.casId, qi: q.qi }, n: e.n + 1, ok: 0, d: today() + 1, t: Date.now() };
  ljSet('kine_err', all);
}
function errHit(q) {
  var all = errAll(), k = qKey(q); if (!all[k]) return false;
  all[k].ok++;
  if (all[k].ok >= 2) delete all[k]; else all[k].d = today() + 3;
  ljSet('kine_err', all);
  return true;
}
function errorsDue() { var t = today(), all = errAll(); return Object.keys(all).filter(function (k) { return all[k].d <= t; }).map(function (k) { return all[k]; }); }
function errorsCount() { return Object.keys(errAll()).length; }
// Quiz des erreurs : dues d'abord ; s'il n'y en a pas (ou si on demande tout), tout le carnet
function startErrorQuiz(all) {
  var list = all ? Object.values(errAll()) : errorsDue();
  if (!list.length) list = Object.values(errAll());
  if (!list.length) { toast('Aucune erreur dans ton carnet. Bravo !'); return; }
  var qs = shuffle(list).slice(0, 30).map(function (e) { var q = Object.assign({}, e.q); q.options = shuffle(q.options); q.fromErrors = true; return q; });
  state.view = 'quiz';
  state.quiz = { questions: qs, idx: 0, picked: null, score: 0, answered: [], mode: 'errors' };
  render(); window.scrollTo(0, 0);
}

// ════════════════════════════════════════════════════════════
//  HISTORIQUE ET STATISTIQUES PAR ZONE
// ════════════════════════════════════════════════════════════
// kine_hist : [{ t, m (quiz·exam·errors·cas), s, n, z }] (200 dernières séances) · kine_zstats : { zone : { ok, n } }
function zoneStat(zone, ok) {
  if (!zone) return;
  var z = ljGet('kine_zstats', {}); var s = z[zone] || { ok: 0, n: 0 };
  s.n++; if (ok) s.ok++; z[zone] = s; ljSet('kine_zstats', z);
}
function histAdd(m, s, n, z) {
  var h = ljGet('kine_hist', []); h.push({ t: Date.now(), m: m, s: s, n: n, z: z || '' });
  if (h.length > 200) h = h.slice(-200); ljSet('kine_hist', h);
}
// Zones les plus faibles (au moins 5 réponses)
function weakZones(max) {
  var z = ljGet('kine_zstats', {});
  return Object.keys(z).filter(function (k) { return z[k].n >= 5; })
    .map(function (k) { return { z: k, pct: Math.round(100 * z[k].ok / z[k].n), n: z[k].n }; })
    .sort(function (a, b) { return a.pct - b.pct; }).slice(0, max || 3);
}
function quizZoneLabel(Q) { var zs = {}; Q.questions.forEach(function (q) { if (q.zone) zs[q.zone] = 1; }); var k = Object.keys(zs); return k.length === 1 ? k[0] : k.length + ' zones'; }

// Appelé à chaque réponse au quiz (quiz, examen, erreurs)
function learnQuizAnswer(q, correct) {
  logActivity('qs');
  zoneStat(q.zone, correct);
  if (correct) errHit(q); else errMiss(q);
}
// Appelé à la fin d'un quiz
function learnQuizEnd(Q) { histAdd(Q.mode || 'quiz', Q.score, Q.questions.length, quizZoneLabel(Q)); }

// ════════════════════════════════════════════════════════════
//  MODE EXAMEN (chronométré, correction à la fin)
// ════════════════════════════════════════════════════════════
var EXAM_SIZES = [{ n: 20, min: 20 }, { n: 40, min: 40 }];
var _examTimer = null;
function startExam(n, min) {
  var pool = quizPool();
  if (state.quizZones && state.quizZones.size) pool = pool.filter(function (q) { var f = ficheById(q.ficheId); return Array.from(state.quizZones).some(function (z) { return ficheInZone(f, z); }); });
  if (state.quizNiveaux && state.quizNiveaux.size) pool = pool.filter(function (q) { return state.quizNiveaux.has(q.niveau); });
  if (!pool.length) { toast('Aucune question avec ces filtres.', 'err'); return; }
  state.view = 'quiz';
  state.quiz = { questions: shuffle(pool).slice(0, n), idx: 0, picked: null, score: 0, answered: [], mode: 'exam', end: Date.now() + min * 60000 };
  render(); window.scrollTo(0, 0);
  examTick();
}
function examLeft() { var Q = state.quiz; return Q && Q.mode === 'exam' ? Math.max(0, Q.end - Date.now()) : 0; }
function examClock(ms) { var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function examTick() {
  clearInterval(_examTimer);
  _examTimer = setInterval(function () {
    var Q = state.quiz;
    if (!Q || Q.mode !== 'exam' || Q.idx >= Q.questions.length) { clearInterval(_examTimer); return; }
    var left = examLeft(), el = document.getElementById('examClock');
    if (el) { el.textContent = examClock(left); el.classList.toggle('late', left < 60000); }
    if (left <= 0) { clearInterval(_examTimer); examFinish(true); }
  }, 1000);
}
// Fin de l'examen (toutes les questions, ou temps écoulé : les questions sans réponse comptent fausses)
function examFinish(timeUp) {
  var Q = state.quiz; if (!Q) return;
  Q.timeUp = !!timeUp;
  Q.unanswered = Q.questions.length - Q.answered.length;
  Q.idx = Q.questions.length;
  learnQuizEnd(Q);
  var pct = Math.round(100 * Q.score / Q.questions.length), best = STORE.bestScore;
  if (!best || pct > best.pct) STORE.bestScore = { pct: pct, score: Q.score, total: Q.questions.length };
  if (state.view === 'quiz') renderQuiz(appEl());
  if (timeUp) announce('Temps écoulé.');
}

// ════════════════════════════════════════════════════════════
//  CAS CLINIQUES SUIVIS
// ════════════════════════════════════════════════════════════
// kine_cas : { id du cas : { best, last, n (questions), d (date), tries } }
function casAll() { return ljGet('kine_cas', {}); }
function learnCasAnswer(c, qi, oi) {
  var q = c.questions[qi], ok = oi === q.answer;
  logActivity('qs'); zoneStat(c.zone, ok);
  var asQ = { type: 'Cas clinique', casId: c.id, qi: qi, ficheId: '', zone: c.zone, q: 'Cas « ' + c.titre + ' »\n\n' + q.q, options: q.options, answer: q.options[q.answer] };
  if (ok) errHit(asQ); else errMiss(asQ);
}
function learnCasEnd(c, score) {
  var all = casAll(), p = all[c.id] || { best: 0, tries: 0 };
  all[c.id] = { best: Math.max(p.best || 0, score), last: score, n: c.questions.length, d: Date.now(), tries: (p.tries || 0) + 1 };
  ljSet('kine_cas', all);
  histAdd('cas', score, c.questions.length, c.zone);
}
// Statut d'un cas : à faire · à refaire · réussi
function casStatus(c) {
  var s = casAll()[c.id];
  if (!s) return { k: 'todo', l: 'À faire' };
  return s.last === s.n ? { k: 'ok', l: '✓ ' + s.last + '/' + s.n } : { k: 'redo', l: '↻ ' + s.last + '/' + s.n };
}
function casToRedo() { var all = casAll(); return CAS_CLINIQUES.filter(function (c) { var s = all[c.id]; return s && s.last < s.n; }).length; }

// ════════════════════════════════════════════════════════════
//  S'ENTRAÎNER SUR UNE FICHE
// ════════════════════════════════════════════════════════════
function startFicheQuiz(id) {
  var qs = quizPool().filter(function (q) { return q.ficheId === id; });
  if (!qs.length) { toast('Pas encore de question pour cette fiche.', 'err'); return; }
  state.view = 'quiz';
  state.quiz = { questions: shuffle(qs), idx: 0, picked: null, score: 0, answered: [], mode: 'quiz' };
  render(); window.scrollTo(0, 0);
}
function ficheTrainHTML(f) {
  var nc = allCards().filter(function (c) { return c.ficheId === f.id; }).length;
  return '<div class="fiche-train"><div class="fiche-train-t">S\'entraîner sur cette fiche</div><div class="fiche-train-b">' +
    '<button class="chip"' + act('startSrs', f.id) + '>🗂 Cartes (' + nc + ')</button>' +
    '<button class="chip"' + act('startFicheQuiz', f.id) + '>❓ Quiz</button></div></div>';
}

// Onglet de la fiche qui contient la réponse d'une question
var QTYPE_TAB = { 'Drapeau rouge': 'flags', "Piège — N'est PAS un 🚩": 'flags', 'Diagnostic différentiel': 'ddx', 'Argument de DDx': 'ddx', 'Test clinique': 'tests', 'Série de tests': 'tests', 'Manœuvre → test': 'tests', "Outil d'évaluation": 'bilan', 'Score de référence': 'bilan', 'Prise en charge': 'pec', 'À éviter (piège)': 'pec', 'Orientation urgente': 'orientation', 'Grade de recommandation': 'has', 'Identification': 'definition', 'Zone anatomique': 'definition', 'Chiffre clé': 'definition' };
function quizTab(q) { return QTYPE_TAB[q.type] || null; }
function quizTabLabel(q) { var k = quizTab(q), t = k && ONGLETS_DEF.find(function (x) { return x.key === k; }); return t ? t.short : ''; }

// ════════════════════════════════════════════════════════════
//  ÉCRAN « AUJOURD'HUI »
// ════════════════════════════════════════════════════════════
function renderToday(app) {
  var c = srsCounts(), newToday = Math.min(c.fresh, c.newLeft), errD = errorsDue().length, errN = errorsCount();
  var todo = c.due + newToday, redo = casToRedo();
  var mins = Math.max(1, Math.round((todo * 12 + errD * 25) / 60));
  var html = '<div class="today">';
  // Ni date ni salutation : la fiche du jour vient en premier (le titre reste pour les lecteurs d'écran)
  html += '<h1 class="sr-only" tabindex="-1">Aujourd\'hui</h1>';
  html += renderPathologieDuJour();
  // Révision du jour
  html += '<div class="today-main">';
  if (todo || errD) {
    html += '<div class="today-main-t">Révision du jour</div>' +
      '<ul class="today-list">' +
      (c.due ? '<li><strong>' + c.due + '</strong> carte' + (c.due > 1 ? 's' : '') + ' à revoir</li>' : '') +
      (newToday ? '<li><strong>' + newToday + '</strong> nouvelle' + (newToday > 1 ? 's' : '') + ' carte' + (newToday > 1 ? 's' : '') + '</li>' : '') +
      (errD ? '<li><strong>' + errD + '</strong> erreur' + (errD > 1 ? 's' : '') + ' à retravailler</li>' : '') + '</ul>' +
      '<button class="btn-primary btn-big"' + act(todo ? 'startSrs' : 'startErrorQuiz') + '>Commencer · ≈ ' + mins + ' min</button>' +
      (todo && errD ? '<button class="chip today-alt"' + act('startErrorQuiz') + '>Ou revoir d\'abord mes ' + errD + ' erreur' + (errD > 1 ? 's' : '') + '</button>' : '');
  } else {
    html += '<div class="today-main-t">✓ Tout est à jour</div><p class="today-txt">Plus de carte à revoir aujourd\'hui. Un petit quiz pour la route ?</p>' +
      '<button class="btn-primary btn-big"' + act('startQuiz', 10) + '>Quiz rapide · 10 questions</button>';
  }
  html += '</div>';
  // Zones faibles
  var wz = weakZones(3);
  if (wz.length) {
    html += '<div class="today-sec"><div class="today-sec-t">Tes zones à travailler</div><div class="today-weak">' + wz.map(function (w) {
      return '<button class="today-weak-b"' + act('quizOnZone', w.z) + '><span>' + esc(w.z) + '</span><span class="today-weak-p">' + w.pct + ' %</span></button>';
    }).join('') + '</div></div>';
  }
  // Raccourcis
  html += '<div class="today-sec"><div class="today-sec-t">Raccourcis</div><div class="today-grid">' +
    '<button class="today-tile"' + act('setView', 'quiz') + '><span class="tt-i" aria-hidden="true">❓</span><span>Quiz</span></button>' +
    '<button class="today-tile"' + act('setView', 'cas') + '><span class="tt-i" aria-hidden="true">📋</span><span>Cas cliniques' + (redo ? ' · ' + redo + ' à refaire' : '') + '</span></button>' +
    '<button class="today-tile"' + act('startErrorQuiz', true) + '><span class="tt-i" aria-hidden="true">📕</span><span>Carnet d\'erreurs · ' + errN + '</span></button>' +
    '<button class="today-tile"' + act('setView', 'train') + '><span class="tt-i" aria-hidden="true">🎓</span><span>Mode examen</span></button>' +
    '</div></div>';
  html += '</div>';
  app.innerHTML = html;
}
function quizOnZone(z) { state.quizZones = new Set([z]); state.quizNiveaux = new Set(); state.view = 'quiz'; startQuiz(10); }

// ════════════════════════════════════════════════════════════
//  ÉCRAN « S'ENTRAÎNER »
// ════════════════════════════════════════════════════════════
function renderTrain(app) {
  var c = srsCounts(), errN = errorsCount(), errD = errorsDue().length, redo = casToRedo(), casDone = Object.keys(casAll()).length;
  var tile = function (a, ico, t, sub) { return '<button class="train-tile"' + a + '><span class="train-ico" aria-hidden="true">' + ico + '</span><span class="train-txt"><span class="train-t">' + t + '</span><span class="train-s">' + sub + '</span></span></button>'; };
  var html = '<div class="topbar"><div class="eyebrow">Révision active</div><h1 class="h1" tabindex="-1">S\'entraîner</h1>' +
    '<p class="sub">Cartes à répétition espacée, quiz, cas cliniques et examen blanc. Tes erreurs reviennent automatiquement jusqu\'à ce que tu les maîtrises.</p></div>';
  html += '<div class="train-grid">' +
    tile(act('setView', 'flash'), '🗂', 'Cartes', (c.due ? c.due + ' à revoir · ' : '') + Math.min(c.fresh, c.newLeft) + ' nouvelles aujourd\'hui') +
    tile(act('setView', 'quiz'), '❓', 'Quiz', 'QCM par zone et par niveau') +
    tile(act('setView', 'cas'), '📋', 'Cas cliniques', casDone + '/' + CAS_CLINIQUES.length + ' faits' + (redo ? ' · ' + redo + ' à refaire' : '')) +
    tile(act('startErrorQuiz', true), '📕', 'Carnet d\'erreurs', errN ? errN + ' question' + (errN > 1 ? 's' : '') + (errD ? ' · ' + errD + ' à revoir' : '') : 'Vide pour l\'instant') +
    '</div>';
  html += '<div class="quiz-config"><label class="cfg-label">🎓 Mode examen</label>' +
    '<p class="prog-txt">Chronométré, sans correction pendant l\'épreuve : tu découvres ton score à la fin. Les filtres de zone et de niveau du Quiz s\'appliquent.</p>' +
    '<div class="prog-actions">' + EXAM_SIZES.map(function (e) { return '<button class="btn-primary"' + act('startExam', e.n, e.min) + '>' + e.n + ' questions · ' + e.min + ' min</button>'; }).join('') + '</div></div>';
  app.innerHTML = html;
}

// ════════════════════════════════════════════════════════════
//  PROGRESSION : statistiques
// ════════════════════════════════════════════════════════════
function learnStatsHTML() {
  var z = ljGet('kine_zstats', {}), hist = ljGet('kine_hist', []), srs = srsAll();
  var known = 0; Object.keys(srs).forEach(function (k) { if (srs[k].i >= 21) known++; });
  var h = '<div class="quiz-config prog-card"><label class="cfg-label">📊 Mes statistiques</label>';
  h += '<div class="stats prog-stats">' +
    '<div class="stat"><div class="stat-val">🔥 ' + streak() + '</div><div class="stat-lbl">jours d\'affilée</div></div>' +
    '<div class="stat"><div class="stat-val">' + known + '<small>/' + allCards().length + '</small></div><div class="stat-lbl">cartes bien ancrées (≥ 3 sem.)</div></div>' +
    '<div class="stat"><div class="stat-val">' + errorsCount() + '</div><div class="stat-lbl">erreurs dans le carnet</div></div></div>';
  var zones = ZONE_ORDER_DISPLAY.filter(function (k) { return z[k] && z[k].n; });
  if (zones.length) {
    h += '<div class="zbars">' + zones.map(function (k) {
      var p = Math.round(100 * z[k].ok / z[k].n);
      return '<div class="zbar"><span class="zbar-n">' + esc(k) + '</span><span class="zbar-t" role="img" aria-label="' + p + ' % de bonnes réponses"><i style="width:' + p + '%"></i></span><span class="zbar-p">' + p + ' %<small> · ' + z[k].n + '</small></span></div>';
    }).join('') + '</div>';
  } else h += '<p class="prog-txt">Réponds à quelques questions de quiz ou de cas : tes résultats par zone s\'afficheront ici.</p>';
  if (hist.length) {
    var M = { quiz: 'Quiz', exam: 'Examen', errors: 'Erreurs', cas: 'Cas' };
    h += '<label class="cfg-label" style="margin-top:16px">Dernières séances</label><ul class="hist">' + hist.slice(-8).reverse().map(function (x) {
      var d = new Date(x.t), p = x.n ? Math.round(100 * x.s / x.n) : 0;
      return '<li><span class="hist-d">' + d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + '</span><span class="hist-m">' + (M[x.m] || x.m) + (x.z ? ' · ' + esc(x.z) : '') + '</span><span class="hist-s">' + x.s + '/' + x.n + ' · ' + p + ' %</span></li>';
    }).join('') + '</ul>';
  }
  h += '</div>';
  return h;
}

// Ouvre un cas clinique depuis le carnet d'erreurs ou les résultats
function openCasById(id) {
  var i = CAS_CLINIQUES.findIndex(function (c) { return c.id === id; });
  if (i < 0) return;
  state.view = 'cas'; render(); startCas(i); window.scrollTo(0, 0);
}
// Bloc « Révision espacée » de l'écran Cartes (selon les filtres choisis)
function srsHomeHTML() {
  var c = srsCounts(flashFilter()), nw = Math.min(c.fresh, c.newLeft), n = c.due + nw;
  return '<div class="srs-home"><div class="srs-home-t">Révision espacée</div>' +
    '<p class="prog-txt">Tu notes chaque carte (À revoir · Difficile · Bien · Facile) : l\'app te la représente juste avant que tu l\'oublies.</p>' +
    '<div class="srs-home-n"><span><strong>' + c.due + '</strong> à revoir</span><span><strong>' + nw + '</strong> nouvelle' + (nw > 1 ? 's' : '') + ' aujourd\'hui</span></div>' +
    '<button class="btn-primary btn-big"' + act('startSrs') + (n ? '' : ' disabled') + '>' + (n ? 'Réviser · ' + n + ' carte' + (n > 1 ? 's' : '') : '✓ À jour pour aujourd\'hui') + '</button></div>';
}
