/* Fiches Kiné — vue Tests cliniques */
// ════════════════════════════════════════════════════════════
//  TESTS CLINIQUES : tous les tests des fiches, regroupés par test
// ════════════════════════════════════════════════════════════
var T_TYPES = [
  { k: 'dx', label: 'Tests diagnostiques', short: 'Diagnostic', ico: '🔎' },
  { k: 'mes', label: 'Mesures et tests fonctionnels', short: 'Mesures', ico: '📏' },
  { k: 'score', label: 'Scores, échelles et critères', short: 'Scores', ico: '📝' },
  { k: 'exam', label: 'Examens complémentaires', short: 'Examens', ico: '🧪' }
];
// Un même test sous plusieurs noms → un seul groupe ; une entrée peut nourrir deux groupes (« TUG + Berg »)
var T_ALIAS = {
  'apley compression': ['apley'],
  'apprehension patellaire laterale': ['apprehension'],
  'appui unipodal': ['trendelenburg'],
  'berg balance scale bestest': ['berg balance scale'],
  'tug berg': ['tug', 'berg balance scale'],
  'timed up and go': ['tug'],
  'tug vitesse de marche': ['tug', '10 metres de marche'],
  'perimetre de marche tug': ['mesure du perimetre de marche', 'tug'],
  'marche': ['mesure du perimetre de marche'],
  'marche 10 metres': ['10 metres de marche'],
  'marche 1 minute 6 minutes': ['6mwt'],
  'capacite vitale': ['cv'],
  'clonus achilleen': ['clonus'],
  'constant score': ['constant murley'],
  'questionnaire dn4': ['dn4'],
  'faber patrick': ['faber'],
  'patrick faber': ['faber'],
  'freezing of gait questionnaire': ['fog q'],
  'force de pince prehension': ['force de pince'],
  'force en rotation externe et interne': ['force de re'],
  'saut vertical hop tests': ['hop tests'],
  'lasegue slr': ['lasegue'],
  'leri lasegue inverse': ['leri'],
  'mcmurray en flexion': ['mcmurray'],
  'mesure de la dorsiflexion residuelle': ['mesure de la dorsiflexion de cheville'],
  'mesure de la re passive': ['rotation externe passive coude au corps'],
  'rotation externe passive': ['rotation externe passive coude au corps'],
  'montee sur la pointe d un pied': ['montee sur pointe'],
  'montee sur pointe serviette': ['montee sur pointe'],
  'montees sur pointe unipodales': ['montee sur pointe'],
  'mrc distal': ['bilan musculaire mrc'],
  'mrc sum score': ['bilan musculaire mrc'],
  'neer a la xylocaine': ['neer'],
  'neer hawkins': ['neer', 'hawkins kennedy'],
  'ober test': ['ober'],
  'oswestry disability index': ['odi'],
  'palpation pole inferieur rotule': ['palpation pole inferieur de la rotule'],
  'palpation interlignes medial et lateral': ['palpation de l interligne'],
  'rot membres inferieurs': ['rot'],
  'hyper reflexie osteo tendineuse': ['rot'],
  'areflexie': ['rot'],
  'schober modifie': ['schober'],
  'flexion du tronc': ['schober'],
  'squatting test': ['single leg squat'],
  'thessaly a 20': ['thessaly test'],
  'tinel au coude': ['tinel'],
  'tinel retro epicondylien medial': ['tinel'],
  'valgus varus stress': ['valgus force', 'varus force'],
  'windlass test en decharge': ['windlass test en charge'],
  'examen neurologique segmentaire l4 s1': ['examen neurologique l3 s1'],
  'decalage de la coiffe': ['lag signs'],
  'ulnt2': ['ulnt1'],
  'ulnt3': ['ulnt1'],
  'ultt': ['ulnt1'],
  'mesure des amplitudes cervicales': ['mobilites cervicales actives']
};
// Homonymes : même nom, test différent selon la région
var T_BY_ZONE = { 'tiroir anterieur': 1, 'tiroir posterieur': 1 };
// Noms affichés quand un test regroupe plusieurs intitulés (ou porte un contexte propre à une fiche)
var T_NAMES = {
  'apley': 'Apley (compression méniscale)',
  'apprehension': 'Appréhension patellaire (Smillie)',
  'trendelenburg': 'Signe de Trendelenburg (appui unipodal)',
  'berg balance scale': 'Berg Balance Scale (BBS)',
  'tug': 'TUG (Timed Up and Go)',
  'mesure du perimetre de marche': 'Périmètre de marche',
  '10 metres de marche': '10MWT (vitesse de marche sur 10 m)',
  '6mwt': '6MWT (marche de 6 minutes)',
  'cv': 'Capacité vitale (CV)',
  'clonus': 'Clonus',
  'constant murley': 'Score de Constant-Murley',
  'dn4': 'DN4 (douleur neuropathique)',
  'faber': 'FABER / Patrick',
  'fog q': 'FOG-Q (Freezing of Gait Questionnaire)',
  'force de pince': 'Force de pince (pinch-gauge)',
  'force de re': "Force des rotateurs de l'épaule (dynamomètre)",
  'hop tests': 'Hop tests (LSI)',
  'lasegue': 'Lasègue (SLR)',
  'lasegue controlateral': 'Lasègue controlatéral (crossed SLR)',
  'leri': 'Test de Léri (Lasègue inversé)',
  'mcmurray': 'Test de McMurray',
  'mesure de la dorsiflexion de cheville': 'Dorsiflexion de cheville (mesure)',
  'rotation externe passive coude au corps': 'Rotation externe passive coude au corps',
  'montee sur pointe': 'Montée sur pointe unipodale (heel rise)',
  'bilan musculaire mrc': 'MRC (cotation de la force musculaire)',
  'neer': 'Test de Neer',
  'hawkins kennedy': 'Test de Hawkins-Kennedy',
  'ober': "Test d'Ober (TFL, bandelette ilio-tibiale)",
  'odi': 'Oswestry Disability Index (ODI)',
  'palpation pole inferieur de la rotule': 'Palpation du pôle inférieur de la rotule',
  'palpation de l interligne': "Palpation de l'interligne fémoro-tibial",
  'rot': 'Réflexes ostéo-tendineux (ROT)',
  'schober': 'Test de Schober',
  'single leg squat': 'Squat unipodal (single leg squat)',
  'thessaly test': 'Test de Thessaly',
  'tinel': 'Signe de Tinel',
  'valgus force': 'Valgus forcé du genou (LLI)',
  'varus force': 'Varus forcé du genou (LLE)',
  'windlass test en charge': 'Windlass test',
  'examen neurologique l3 s1': 'Examen neurologique des membres inférieurs',
  'lag signs': 'Lag signs (signes de décalage de la coiffe)',
  'ulnt1': 'ULNT (tests neurodynamiques du membre supérieur)',
  'mobilites cervicales actives': 'Amplitudes cervicales',
  'tiroir anterieur|Genou': 'Tiroir antérieur du genou',
  'tiroir anterieur|Épaule': "Tiroir antérieur de l'épaule (Load and Shift)",
  'tiroir posterieur|Genou': 'Tiroir postérieur du genou',
  'tiroir posterieur|Épaule': "Tiroir postérieur de l'épaule",
  'combinaison de tests': 'Combinaison de tests (défilé thoraco-brachial)',
  'thompson': 'Test de Thompson',
  'fadir': 'FADIR (flexion, adduction, rotation interne)',
  'grind test': 'Grind test (rhizarthrose)',
  'caddie': 'Signe du caddie',
  'waddell': 'Signes de Waddell (non organiques)',
  'sacro iliaques': 'Cluster de Laslett (sacro-iliaques)',
  'romberg': 'Signe de Romberg',
  'mds updrs iii': 'MDS-UPDRS III (examen moteur)',
  'ashworth modifiee': "Échelle d'Ashworth modifiée (spasticité)",
  'koos': 'KOOS (Knee Injury and Osteoarthritis Outcome Score)',
  'patte': 'Test de Patte (infra-épineux)',
  'j sign': 'J-sign (trajet rotulien)',
  'squeeze test calcaneen': 'Squeeze test calcanéen',
  'enmg': 'ENMG (électroneuromyographie)',
  'eva douleur lombaire radiculaire': 'EVA douleur lombaire et radiculaire',
  'thomas': 'Test de Thomas (psoas-iliaque)'
};
// Type corrigé quand le nom induit en erreur (ex. « Appui monopodal 30 secondes » est un test diagnostique)
var T_TYPE_FIX = {
  'tmd pain screener': 'score', 'regles d ottawa': 'dx', 'trendelenburg': 'dx', 'appui monopodal 30 secondes': 'dx', 'rotation interne passive': 'dx',
  'rotation interne active': 'dx', 'saut unipodal': 'dx', 'waddell': 'dx', 'contraction du deltoide et sensibilite axillaire': 'dx',
  'mesure de l epanchement': 'dx', 'evaluation de la deglutition': 'score', 'bilan musculaire mrc': 'mes', 'attelle': 'mes',
  'douleur a la pression': 'mes', 'repositionnement actif': 'mes'
};

// Clé d'un test : nom sans parenthèses ni précision après « — », sans « Test de », « Signe de »…
function tKey(nom) {
  return sNorm(String(nom).replace(/\([^)]*\)/g, ' ').replace(/\s[—–-]\s.*$/, ''))
    .replace(/^(tests?|signes?|manoeuvre|score|echelle|index|indice)\s+(de la |de l |des |du |de |d )?/, '').trim();
}
var T_RX_EXAM = /\b(radio\w*|incidence|irm|echograph\w*|scanner|enmg|emg|ecg|genetique|infiltration|bloc anesthesique|cobb|risser|meyerding|zanca|lauenstein)\b/;
var T_RX_SCORE = /\b(score|echelle|scale|questionnaire|inventory|assessment|measure|classification|criteres|stade|tool|koos|hoos|womac|dash|quickdash|spadi|ases|woos|visa|cait|atrs|ffi|faam|lefs|odi|ndi|fabq|tampa|pcs|dn4|phq|gad|hit|fiq|basdai|basfi|asdas|mjoa|edss|mfis|fss|msws|updrs|sara|uhdrs|alsfrs|cmtns|qmg|nihss|hoehn|fog|berg|bestest|fugl|barthel|mif|dhi|ashworth|tardieu|gmfcs|gmfm|macs|edacs|tom|pirani|dimeglio|kapandji|fihoa|vignos|nsaa|eva|ioc|fihoa)\b/;
var T_RX_MES = /^(force|endurance|mesure|amplitudes?|mobilites?)\b|\b(goniometr\w*|dynamometr\w*|schober|distance|perimetre|marche|tug|timed|mwt|walk|t25fw|chaise|chair|hop|squat|step|montee|tandem|box and block|peg|capacite vitale|cv|peak flow|pression arterielle|scoliometre|fil a plomb|souplesse|reposition|longueur|plagiocephalie|deficit d extension|epanchement|deglutition|soulever|stabilisation|controle|sdmt|elevation passive|rotation externe passive)\b/;
function tGuessType(g) {
  var n = [sNorm(g.nom), g.key.split('|')[0]], has = function (rx) { return rx.test(n[0]) || rx.test(n[1]); };
  if (has(T_RX_EXAM)) return 'exam';
  if (has(T_RX_SCORE)) return 'score';
  if (has(T_RX_MES)) return 'mes';
  var notes = sNorm(g.items.map(function (x) { return x.t.note || ''; }).join(' '));
  if (/se sp sans objet/.test(notes)) return /\b(items?|questionnaire|score|points)\b/.test(notes) ? 'score' : 'mes';
  return 'dx';
}
// Nom affiché : le plus fréquent, sinon le plus long sans précision de contexte (« DDx », « éliminer »…)
function tPickName(g) {
  var c = {};
  g.items.forEach(function (x) { c[x.t.nom] = (c[x.t.nom] || 0) + 1; });
  return Object.keys(c).sort(function (a, b) {
    var pa = /\b(DDx|éliminer|si |souvent)\b/i.test(a), pb = /\b(DDx|éliminer|si |souvent)\b/i.test(b);
    return (c[b] - c[a]) || (pa - pb) || (b.length - a.length);
  })[0];
}
var _tIdx = null;
function tIndex() {
  if (_tIdx) return _tIdx;
  var map = new Map();
  ALL_FICHES.forEach(function (f) {
    var T = f.onglets && f.onglets.tests;
    ((T && T.items) || []).forEach(function (t, i) {
      var k = tKey(t.nom);
      if (T_BY_ZONE[k]) k += '|' + f.zone;
      (T_ALIAS[k] || [k]).forEach(function (c) {
        var g = map.get(c);
        if (!g) { g = { key: c, items: [] }; map.set(c, g); }
        g.items.push({ f: f, t: t, i: i });
      });
    });
  });
  var list = [];
  map.forEach(function (g) {
    g.nom = T_NAMES[g.key] || tPickName(g);
    g.type = T_TYPE_FIX[g.key] || tGuessType(g);
    var fz = [];
    g.items.forEach(function (x) { [x.f.zone, x.f.secondaryZone].forEach(function (z) { if (z && fz.indexOf(z) < 0) fz.push(z); }); });
    g.zones = fz;
    g.fiches = [];
    g.items.forEach(function (x) { if (g.fiches.indexOf(x.f) < 0) g.fiches.push(x.f); });
    g.sortKey = tKey(g.nom) || sNorm(g.nom);
    list.push(g);
  });
  list.sort(function (a, b) { return a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0; });
  list.forEach(function (g, i) { g._uid = i; });
  _tIdx = list;
  return list;
}

// ── Vue « Tests » : filtres, recherche, cartes dépliables ──
function tState() {
  if (!state.tests) state.tests = { q: '', zone: 'Toutes', type: 'all', mode: 'patho', open: {}, openP: {}, openT: {}, y: 0 };
  return state.tests;
}
function tTypeOf(k) { for (var i = 0; i < T_TYPES.length; i++) if (T_TYPES[i].k === k) return T_TYPES[i]; return T_TYPES[0]; }
function tInZone(g, z) { return !z || z === 'Toutes' || g.fiches.some(function (f) { return ficheInZone(f, z); }); }
function tSeSp(v) { return v && !/^[—–-]$/.test(String(v).trim()) ? String(v) : ''; }
// Texte d'un test sans la mention « … : Se/Sp sans objet. », sans intérêt ici
function tNote(note, toks) {
  var t = String(note || '').replace(/\s*(?:[^.:]*:\s*)?Se\/Sp sans objet\.?/g, '').trim();
  return rich(t, toks).replace(/→/g, '<span class="tc-arrow">→</span>');
}
// Champs de recherche d'un test : nom, intitulés dans les fiches, fiches, région, type, textes
function tEntries(g) {
  if (g._E) return g._E;
  var E = [], add = function (k, raw, w) { if (raw) E.push({ k: k, raw: String(raw), n: ' ' + sNorm(raw) + ' ', w: w }); };
  add('nom', g.nom, 100);
  g.items.forEach(function (x) { add('var', x.t.nom, 60); });
  g.fiches.forEach(function (f) { add('fiche', f.nom, 25); });
  add('zone', g.zones.join(' '), 20);
  add('type', tTypeOf(g.type).label, 15);
  g.items.forEach(function (x) { add('note', x.t.note, 8); });
  g._E = E;
  return E;
}
function tHas(e, t) { var al = sAlts(t); for (var a = 0; a < al.length; a++) if (sFind(e.n, al[a]) > -1) return true; return false; }
// Tous les mots doivent être trouvés ; score selon l'endroit (nom > intitulé > fiche > région > texte)
function tMatch(g, toks) {
  var E = tEntries(g), score = 0, i, j, a;
  for (i = 0; i < toks.length; i++) {
    var al = sAlts(toks[i]), best = 0;
    for (j = 0; j < E.length; j++) {
      for (a = 0; a < al.length; a++) {
        var p = sFind(E[j].n, al[a]);
        if (p > -1) { var w = E[j].w * (al[a].length <= 3 || E[j].n.charAt(p - 1) === ' ' ? 1 : 0.5); if (w > best) best = w; }
      }
    }
    if (!best) return null;
    score += best;
  }
  var inName = toks.every(function (t) { return tHas(E[0], t) || E.some(function (e) { return e.k === 'var' && tHas(e, t); }); });
  var hit = null;
  if (inName) score += 30;
  else {
    var bn = 0;
    E.forEach(function (e) {
      if (e.k !== 'fiche' && e.k !== 'note') return;
      var n = toks.filter(function (t) { return tHas(e, t); }).length;
      if (n > bn || (n === bn && n && hit && hit.k === 'note' && e.k === 'fiche')) { bn = n; hit = e; }
    });
  }
  return { score: score, hit: hit };
}
function tImgBtn(g) {
  if (g.type !== 'dx' && g.type !== 'mes') return '';
  var term = g.nom.replace(/\([^)]*\)/g, ' ').replace(/'/g, ' ').replace(/\s+/g, ' ').trim();
  return '<button class="chip tc-img" type="button" ' + act('searchImg', term + ' test clinique') + '>🖼 Voir des images</button>';
}
// Fiches d'un test, celles de la région affichée d'abord
function tOrder(g, sid) {
  if (!sid || sid === 'q') return g.fiches.slice();
  var a = [], b = [];
  g.fiches.forEach(function (f) { (f.zone === sid || f.secondaryZone === sid ? a : b).push(f); });
  return a.concat(b);
}
// Intitulé propre à une fiche, affiché s'il apporte des mots absents du nom du test
function tVariant(t, g) {
  var w = {}; sNorm(g.nom).split(' ').forEach(function (x) { w[x] = 1; });
  return sNorm(t.nom).split(' ').some(function (x) { return x && !w[x] && !S_STOP.has(x) && !/^(test|signe|manoeuvre)s?$/.test(x); });
}
function tDomId(sid, g) { return 'tcb-' + (sid === 'q' ? 'q' : ZONE_ORDER_DISPLAY.indexOf(sid)) + '-' + g._uid; }
function tBody(g, toks, did, sid) {
  var h = '<div class="tc-body" id="' + did + '">';
  var byF = tOrder(g, sid).map(function (f) { return { f: f, items: g.items.filter(function (x) { return x.f === f; }) }; });
  var sesp = function (t) {
    var se = tSeSp(t.se), sp = tSeSp(t.sp);
    return se || sp ? '<span class="tc-sesp">' + (se ? '<span class="test-se">Se ' + esc(se) + '</span>' : '') + (sp ? '<span class="test-sp">Sp ' + esc(sp) + '</span>' : '') + '</span>' : '';
  };
  var variant = function (t) { return tVariant(t, g) ? '<span class="tc-var">' + rich(t.nom, toks) + '</span>' : ''; };
  byF.forEach(function (e) {
    var one = e.items.length === 1, t0 = e.items[0].t;
    h += '<div class="tc-entry"><div class="tc-etop">' +
      '<button class="tc-fiche" type="button" ' + act('tOpenFiche', e.f.id, e.items[0].i) + '>' + esc(e.f.nom) + ' <span class="ddx-go">Voir la fiche ›</span></button>' +
      (one ? sesp(t0) : '') + '</div>';
    e.items.forEach(function (x) {
      var top = one ? variant(x.t) : variant(x.t) + sesp(x.t);
      h += '<div class="tc-item">' + (top ? '<div class="tc-itop">' + top + '</div>' : '') + '<div class="tc-note">' + tNote(x.t.note, toks) + '</div></div>';
    });
    h += '</div>';
  });
  var img = tImgBtn(g);
  return h + (img ? '<div class="tc-foot">' + img + '</div>' : '') + '</div>';
}
function tCard(g, sid, toks, m) {
  var S = tState(), id = sid + '|' + g.key, open = !!S.open[id], ty = tTypeOf(g.type);
  var names = tOrder(g, sid).map(function (f) { return f.nom; }).join(' · ');
  var sub;
  if (m && m.hit && m.hit.k === 'note') sub = '<span class="tc-sub tc-sub-hit">' + sSnippet(m.hit.raw, toks) + '</span>';
  else sub = '<span class="tc-sub">' + (toks ? rich(names, toks) : esc(names)) + '</span>';
  return '<div class="tc' + (open ? ' open' : '') + '" data-tid="' + esc(id) + '">' +
    '<button class="tc-head" type="button" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="' + tDomId(sid, g) + '" ' + act('tToggle', '$el') + '>' +
    '<span class="tc-main"><span class="tc-name">' + (toks ? rich(g.nom, toks) : esc(g.nom)) + '</span>' +
    (sid === 'q' ? '<span class="tc-meta"><span aria-hidden="true">' + ty.ico + '</span> ' + ty.short + ' · ' + esc(g.zones.join(', ')) + '</span>' : '') +
    sub + '</span>' +
    (g.fiches.length > 1 ? '<span class="tc-nb">' + g.fiches.length + ' fiches</span>' : '') +
    '<svg class="icon tc-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
    (open ? tBody(g, toks, tDomId(sid, g), sid) : '') + '</div>';
}
function tToggle(btn) {
  var el = btn.closest('.tc'), id = el.getAttribute('data-tid'), S = tState(), open = !S.open[id];
  if (open) S.open[id] = 1; else delete S.open[id];
  el.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  var old = el.querySelector('.tc-body');
  if (old) el.removeChild(old);
  if (!open) return;
  var cut = id.indexOf('|'), sid = id.slice(0, cut), key = id.slice(cut + 1);
  var g = tIndex().find(function (x) { return x.key === key; });
  if (g) el.insertAdjacentHTML('beforeend', tBody(g, sid === 'q' ? sTokens(S.q.trim()) : null, tDomId(sid, g), sid));
}
// Ouvre la fiche sur l'onglet Tests, au niveau du test choisi ; le bouton retour ramène ici
function tOpenFiche(id, i) {
  var S = tState();
  S.y = window.scrollY;
  state.ficheHistory = [];
  state.openId = id;
  detailTab = 'tests';
  render();
  window.scrollTo(0, 0);
  setTimeout(function () {
    var c = document.querySelectorAll('.section .test-card')[i];
    if (!c) return;
    c.scrollIntoView({ block: 'center', behavior: 'smooth' });
    c.classList.add('tc-flash');
  }, 160);
}
// Cartes « Tests cliniques » de la région choisie (écran de départ des cartes, filtres déjà posés)
function tToFlash() { state.flashZone = tState().zone; state.flashCat = 'Tests cliniques'; setView('flash'); }

// ── Classement par pathologie : région → pathologie (fiche) → tests dans l'ordre de la fiche ──
var _tItemTypes = null;
function tItemTypes() {
  if (_tItemTypes) return _tItemTypes;
  var m = {};
  tIndex().forEach(function (g) { g.items.forEach(function (x) { var k = x.f.id + '|' + x.i; if (!m[k]) m[k] = []; if (m[k].indexOf(g.type) < 0) m[k].push(g.type); }); });
  _tItemTypes = m;
  return m;
}
function tPathoItems(f, type) {
  var T = f.onglets && f.onglets.tests, ty = tItemTypes();
  return ((T && T.items) || []).map(function (t, i) { return { f: f, t: t, i: i }; })
    .filter(function (x) { return type === 'all' || (ty[x.f.id + '|' + x.i] || []).indexOf(type) > -1; });
}
function tPid(z, f) { return 'tp-' + ZONE_ORDER_DISPLAY.indexOf(z) + '-' + f.id; }
function tPathoHTML(S) {
  var h = '';
  (S.zone === 'Toutes' ? ZONE_ORDER_DISPLAY : [S.zone]).forEach(function (z) {
    var fs = ALL_FICHES.filter(function (f) { return !f.stub && ficheInZone(f, z); })
      .map(function (f) { return { f: f, items: tPathoItems(f, S.type) }; })
      .filter(function (e) { return e.items.length; })
      .sort(function (a, b) { return a.f.nom.localeCompare(b.f.nom, 'fr', { sensitivity: 'base' }); });
    if (!fs.length) return;
    h += '<section class="tt-zone"><div class="zone-head"><span class="zone-icon" aria-hidden="true">' + (ZONE_ICONS[z] || '📌') + '</span><h2 class="zone-name">' + esc(z) + '</h2><span class="zone-count">' + fs.length + ' pathologie' + (fs.length > 1 ? 's' : '') + '</span><span class="lvl-line"></span></div><div class="tp-list">';
    fs.forEach(function (e) {
      var id = z + '|' + e.f.id, open = !!S.openP[id], did = tPid(z, e.f);
      h += '<div class="tp' + (open ? ' open' : '') + '" data-pid="' + esc(id) + '">' +
        '<button class="tp-head" type="button" aria-expanded="' + open + '" aria-controls="' + did + '" ' + act('tpToggle', '$el') + '>' +
        '<span class="tp-main"><span class="tp-name">' + esc(e.f.nom) + '</span><span class="tp-sub">' + esc(e.items.map(function (x) { return x.t.nom; }).join(' · ')) + '</span></span>' +
        '<span class="tp-nb">' + e.items.length + ' test' + (e.items.length > 1 ? 's' : '') + '</span>' +
        '<svg class="icon tc-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
        (open ? tpBody(e.f, e.items, did) : '') + '</div>';
    });
    h += '</div></section>';
  });
  return h;
}
function tpBody(f, items, did) {
  var S = tState();
  return '<div class="tp-body" id="' + did + '"><ul class="tr-list">' + items.map(function (x) {
    var rid = f.id + '|' + x.i, open = !!S.openT[rid], se = tSeSp(x.t.se), sp = tSeSp(x.t.sp), bid = 'tr-' + f.id + '-' + x.i;
    return '<li class="tr' + (open ? ' open' : '') + '" data-rid="' + esc(rid) + '"><button class="tr-head" type="button" aria-expanded="' + open + '" aria-controls="' + bid + '" ' + act('trToggle', '$el') + '>' +
      '<span class="tr-main"><span class="tr-name">' + esc(x.t.nom) + '</span>' +
      (se || sp ? '<span class="tr-sesp">' + (se ? 'Se <b>' + esc(se) + '</b>' : '') + (se && sp ? ' · ' : '') + (sp ? 'Sp <b>' + esc(sp) + '</b>' : '') + '</span>' : '') + '</span>' +
      '<svg class="icon tc-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
      (open ? trBody(f, x, bid) : '') + '</li>';
  }).join('') + '</ul></div>';
}
function trBody(f, x, bid) {
  var ty = tItemTypes()[f.id + '|' + x.i] || [], img = ty.indexOf('dx') > -1 || ty.indexOf('mes') > -1;
  var term = String(x.t.nom).replace(/\([^)]*\)/g, ' ').replace(/'/g, ' ').replace(/\s+/g, ' ').trim();
  var note = String(x.t.note || '').trim();
  return '<div class="tr-body" id="' + bid + '">' + (note ? '<div class="tc-note">' + tNote(note, null) + '</div>' : '') +
    '<div class="tr-acts"><button class="chip" type="button" ' + act('tOpenFiche', f.id, x.i) + '>Voir dans la fiche ›</button>' +
    (img ? '<button class="chip tc-img" type="button" ' + act('searchImg', term + ' test clinique') + '>🖼 Voir des images</button>' : '') + '</div></div>';
}
function tpToggle(btn) {
  var el = btn.closest('.tp'), id = el.getAttribute('data-pid'), S = tState(), open = !S.openP[id];
  if (open) S.openP[id] = 1; else delete S.openP[id];
  el.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  var old = el.querySelector('.tp-body');
  if (old) el.removeChild(old);
  if (!open) return;
  var cut = id.indexOf('|'), z = id.slice(0, cut), fid = id.slice(cut + 1);
  var f = ALL_FICHES.find(function (x) { return x.id === fid; });
  if (f) el.insertAdjacentHTML('beforeend', tpBody(f, tPathoItems(f, S.type), tPid(z, f)));
}
function trToggle(btn) {
  var el = btn.closest('.tr'), id = el.getAttribute('data-rid'), S = tState(), open = !S.openT[id];
  if (open) S.openT[id] = 1; else delete S.openT[id];
  el.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  var old = el.querySelector('.tr-body');
  if (old) el.removeChild(old);
  if (!open) return;
  var cut = id.lastIndexOf('|'), fid = id.slice(0, cut), i = +id.slice(cut + 1);
  var f = ALL_FICHES.find(function (x) { return x.id === fid; });
  if (f) el.insertAdjacentHTML('beforeend', trBody(f, { f: f, t: f.onglets.tests.items[i], i: i }, 'tr-' + fid + '-' + i));
}
function tSetMode(m) { var S = tState(); S.mode = m; renderTestsFilters(); renderTestsBody(); }
function tSetZone(z) { tState().zone = z; renderTestsFilters(); renderTestsBody(); }
function tSetType(k) { tState().type = k; renderTestsFilters(); renderTestsBody(); }
function tSetQuery(v) { tState().q = v; var c = document.querySelector('.search-clear'); if (c) c.hidden = !v; renderTestsBody(); }
function tReset() { var S = tState(); S.q = ''; S.zone = 'Toutes'; S.type = 'all'; render(); }
function renderTests(app) {
  var S = tState(), L = tIndex(), nF = 0;
  ALL_FICHES.forEach(function (f) { var T = f.onglets && f.onglets.tests; if (T && T.items && T.items.length) nF++; });
  app.innerHTML =
    '<div class="topbar"><div class="eyebrow">Examen clinique</div>' +
    '<h1 class="h1">Tests <em>cliniques</em></h1>' +
    '<p class="sub">Les ' + L.length + ' tests, mesures et scores de ' + nF + ' fiches, rangés par région puis par pathologie : touche une pathologie, puis un test pour voir comment le faire.</p></div>' +
    // Carte « Méthode du bilan » (js/bilan.js + data/bilan.js) ; absente si ces fichiers manquent
    (typeof bilanEntryHTML === 'function' && typeof BILAN_GUIDE !== 'undefined' ? bilanEntryHTML() : '') +
    '<div class="controls tt-controls"><div class="searchbox"><svg class="icon si" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
    '<input type="text" id="searchInput" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Rechercher un test" placeholder="Test, manœuvre, structure, pathologie…" value="' + esc(S.q) + '">' +
    '<button class="search-clear" type="button" aria-label="Effacer la recherche" ' + act('tClearSearch') + '' + (S.q ? '' : ' hidden') + '>✕</button>' +
    '</div><div class="tt-mode" id="ttMode" role="group" aria-label="Classement des tests"></div><div class="filter-row tt-types" id="ttTypes" role="group" aria-label="Type de test"></div>' +
    '<div class="filter-row" id="ttZones" role="group" aria-label="Région"></div></div><div id="testsBody"></div>';
  var si = document.getElementById('searchInput');
  si.addEventListener('input', function (e) { tSetQuery(e.target.value); });
  si.addEventListener('keydown', function (e) { if (e.key === 'Enter') si.blur(); });
  renderTestsFilters();
  renderTestsBody();
}
function renderTestsFilters() {
  var S = tState(), L = tIndex();
  var inZ = L.filter(function (g) { return tInZone(g, S.zone); });
  var tr = document.getElementById('ttTypes'), zr = document.getElementById('ttZones'), mr = document.getElementById('ttMode');
  if (mr) mr.innerHTML = [['patho', 'Par pathologie'], ['test', 'Par test']].map(function (m) {
    var on = (S.mode || 'patho') === m[0];
    return '<button type="button" class="tt-mode-btn' + (on ? ' on' : '') + '" aria-pressed="' + on + '" ' + act('tSetMode', m[0]) + '>' + m[1] + '</button>';
  }).join('');
  if (tr) tr.innerHTML = [{ k: 'all', short: 'Tous', ico: '' }].concat(T_TYPES).map(function (t) {
    var n = t.k === 'all' ? inZ.length : inZ.filter(function (g) { return g.type === t.k; }).length;
    return '<button class="chip' + (S.type === t.k ? ' on' : '') + '" aria-pressed="' + (S.type === t.k ? 'true' : 'false') + '" ' + act('tSetType', t.k) + '' + (!n && S.type !== t.k ? ' disabled' : '') + (t.label ? ' title="' + esc(t.label) + '"' : '') + '>' + (t.ico ? '<span aria-hidden="true">' + t.ico + '</span> ' : '') + t.short + ' <span class="tt-n">' + n + '</span></button>';
  }).join('');
  if (zr) zr.innerHTML = ZONES.filter(function (z) { return z === 'Toutes' || L.some(function (g) { return tInZone(g, z); }); }).map(function (z) {
    return '<button class="chip' + (S.zone === z ? ' on' : '') + '" aria-pressed="' + (S.zone === z ? 'true' : 'false') + '" ' + act('tSetZone', z) + '>' + esc(z) + '</button>';
  }).join('');
}
function renderTestsBody() {
  var body = document.getElementById('testsBody');
  if (!body) return;
  var S = tState(), q = S.q.trim(), toks = sTokens(q);
  var pool = tIndex().filter(function (g) { return (S.type === 'all' || g.type === S.type) && tInZone(g, S.zone); });
  var active = S.zone !== 'Toutes' || S.type !== 'all';
  var reset = (active || toks.length) ? ' <button class="chip" style="padding:3px 10px;margin-left:4px" ' + act('tReset') + '>✕ Réinitialiser</button>' : '';
  var html = '';
  if (toks.length) {
    var res = [];
    pool.forEach(function (g) { var m = tMatch(g, toks); if (m) res.push({ g: g, m: m }); });
    res.sort(function (a, b) { return (b.m.score - a.m.score) || (a.g.sortKey < b.g.sortKey ? -1 : 1); });
    html += '<div class="count" role="status"><span aria-hidden="true">🔍</span> ' + res.length + ' test' + (res.length > 1 ? 's' : '') + ' pour « ' + esc(q) + ' »' + (active ? '<span class="count-deep"> · filtre actif</span>' : '') + reset + '</div>';
    if (!res.length) html += '<div class="empty"><p>Aucun test pour « ' + esc(q) + ' ».</p><p class="empty-tip">Essaie le nom d\'une manœuvre, d\'une structure ou d\'une pathologie' + (active ? ', ou retire le filtre' : '') + '.</p></div>';
    else html += '<div class="tt-grid">' + res.map(function (r) { return tCard(r.g, 'q', toks, r.m); }).join('') + '</div>';
  } else {
    html += '<div class="count"><span aria-hidden="true">🩺</span> ' + pool.length + ' test' + (pool.length > 1 ? 's' : '') + reset + '<button class="chip tt-flash" ' + act('tToFlash') + '><span aria-hidden="true">🗂</span> Réviser en cartes</button></div>';
    if (!pool.length) html += '<div class="empty"><p>Aucun test ne correspond.</p></div>';
    if (S.mode !== 'test') html += tPathoHTML(S);
    else (S.zone === 'Toutes' ? ZONE_ORDER_DISPLAY : [S.zone]).forEach(function (z) {
      var gs = S.zone === 'Toutes' ? pool.filter(function (g) { return g.zones.indexOf(z) > -1; }) : pool;
      if (!gs.length) return;
      html += '<section class="tt-zone"><div class="zone-head"><span class="zone-icon" aria-hidden="true">' + (ZONE_ICONS[z] || '📌') + '</span><h2 class="zone-name">' + esc(z) + '</h2><span class="zone-count">' + gs.length + ' test' + (gs.length > 1 ? 's' : '') + '</span><span class="lvl-line"></span></div>';
      T_TYPES.forEach(function (t) {
        var sub = gs.filter(function (g) { return g.type === t.k; });
        if (!sub.length) return;
        if (S.type === 'all') html += '<h3 class="tt-sub"><span aria-hidden="true">' + t.ico + '</span> ' + t.label + ' <span class="tt-subn">' + sub.length + '</span></h3>';
        html += '<div class="tt-grid">' + sub.map(function (g) { return tCard(g, z, null, null); }).join('') + '</div>';
      });
      html += '</section>';
    });
  }
  html += '<div class="foot-note">Valeurs de Se/Sp indicatives : le détail et les sources sont dans chaque fiche.</div>';
  body.innerHTML = html;
}

