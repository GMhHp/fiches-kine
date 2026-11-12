/* Fiches Kiné — génération des questions du quiz et des cartes */
// ════════════════════════════════════════════════════════════
//  GÉNÉRATION QUIZ & FLASHCARDS
// ════════════════════════════════════════════════════════════
function makeOptions(good, pool, fallback, keepOrder) {
  if (!good || typeof good !== 'string' || !good.trim()) return null;
  var norm = function(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); };
  var seen = new Set([norm(good)]);
  var out = [], L = good.length;
  var lists = [pool, fallback].map(function(list) { return Array.isArray(list) ? shuffle(list.filter(function(x) { return typeof x === 'string' && x.trim().length > 0; })) : []; });
  // Réponses longues : distracteurs de longueur comparable d'abord (sauf noms, valeurs et grades : ordre conservé)
  var close = function(x) { var r = x.length / L; return r >= 0.5 && r <= 2; };
  var seq = keepOrder || L < 20 ? lists[0].concat(lists[1])
    : lists[0].filter(close).concat(lists[1].filter(close), lists[0].filter(function(x) { return !close(x); }), lists[1].filter(function(x) { return !close(x); }));
  // Pas deux distracteurs quasi identiques (« Lésion de Hoffa / plica » et « Plica synoviale, Hoffa »)
  // (même intitulé avant « : » ou « , », ou mêmes mots) ; second passage sans ce filtre si les options manquent
  var lab = function(x) { var k = x.indexOf(' : '); if (k < 0) { k = x.indexOf(', '); if (k > 25) k = -1; } return k > 0 ? norm(x.slice(0, k)) : ''; };
  var twin = function(x) { if (keepOrder) return false; var a = qStems(x), la = lab(x); return out.some(function(y) { if (la && la === lab(y)) return true; var b = qStems(y), n = 0; a.forEach(function(k) { if (b.has(k)) n++; }); var m = Math.min(a.size, b.size); return m > 0 && n / m >= 0.66; }); };
  [true, false].forEach(function(strict) {
    seq.forEach(function(x) {
      if (out.length >= 3) return;
      var n = norm(x);
      if (seen.has(n) || (strict && twin(x))) return;
      seen.add(n);
      out.push(x);
    });
  });
  if (out.length < 3) return null;
  return shuffle([good].concat(out));
}
// Une fiche appartient-elle à une zone ? (zone principale, zone secondaire, ou filtres transversaux Pédiatrie et Sport)
function ficheInZone(f, z) {
  if (!f) return false;
  if (!z || z === 'Toutes') return true;
  if (z === 'Pédiatrie') return !!f.pediatrie || f.zone === 'Pédiatrie';
  if (z === 'Sport') return !!f.sport || f.zone === 'Sport';
  return f.zone === z || f.secondaryZone === z;
}

// ════════════════════════════════════════════════════════════
//  QUIZ — garde-fous pour qu'une seule réponse soit défendable
// ════════════════════════════════════════════════════════════
var _qNormCache = new Map();
function qNorm(s) {
  s = String(s || '');
  var v = _qNormCache.get(s);
  if (v === undefined) { v = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); _qNormCache.set(s, v); }
  return v;
}
var Q_STOP = new Set('syndrome douleur douleurs lesion lesions maladie trouble troubles atteinte pathologie chronique aigue commune simple signe signes bilan sujet patient patients cause causes origine forme formes grade rupture partielle totale complete severe associee associe diagnostic differentiel clinique cliniques mecanique urgence urgent urgente suspicion evoquant orientation apres avant pendant entre autre autres selon sans avec moins elevee faible moderee progressive progressif recherche rechercher eliminer importante possible frequent frequente classique typique atypique isole isolee brutale brutal region locale membre membres inferieur inferieurs superieur superieurs droite gauche bilateral bilaterale unilateral unilaterale interne externe anterieur anterieure posterieur posterieure laterale lateral mediale medial profonde profond'.split(' '));
var _qStemCache = new Map();
function qStems(s) {
  s = String(s || '');
  var v = _qStemCache.get(s);
  if (!v) {
    v = new Set();
    (qNorm(clean(s)).match(/[a-z]{5,}/g) || []).forEach(function(w) { if (!Q_STOP.has(w)) v.add(w.slice(0, 5)); });
    _qStemCache.set(s, v);
  }
  return v;
}
function qStemSet(list) { var out = new Set(); list.forEach(function(s) { qStems(s).forEach(function(k) { out.add(k); }); }); return out; }
function qOverlap(s, set) { var hit = false; qStems(s).forEach(function(k) { if (set.has(k)) hit = true; }); return hit; }
// Zones voisines : douleurs projetées et bilans croisés (ex. rachis cervical ↔ épaule)
var Q_NEIGHBORS = { 'Rachis': ['ATM', 'Épaule', 'Coude', 'Poignet / Main', 'Hanche', 'Neurologie'], 'ATM': ['Rachis'], 'Épaule': ['Rachis', 'Coude'], 'Coude': ['Épaule', 'Poignet / Main', 'Rachis'], 'Poignet / Main': ['Coude', 'Rachis'], 'Hanche': ['Rachis', 'Genou'], 'Genou': ['Hanche', 'Cheville'], 'Cheville': ['Genou', 'Pied'], 'Pied': ['Cheville'], 'Neurologie': ['Rachis', 'Pédiatrie'], 'Pédiatrie': ['Neurologie'], 'Sport': [] };
function qNear(f, x) {
  if (!!f.pediatrie && !!x.pediatrie) return true;
  if (!!f.sport && !!x.sport) return true;   // fiches du sport : voisines entre elles (diagnostics et tests qui se recoupent)
  var zf = [f.zone, f.secondaryZone].filter(Boolean), zx = [x.zone, x.secondaryZone].filter(Boolean);
  return zf.some(function(z) { return zx.indexOf(z) > -1 || zx.some(function(y) { return (Q_NEIGHBORS[z] || []).indexOf(y) > -1; }); });
}
function qCut(s, n) {
  s = String(s || '').trim();
  if (s.length <= n) return s;
  var c = s.slice(0, n), sp = c.lastIndexOf(' ');
  return (sp > n * 0.6 ? c.slice(0, sp) : c).replace(/[\s,;:—–\-]+$/, '') + '…';
}
// Pool de questions mis en cache : le compteur de l'accueil du quiz ne recalcule pas tout à chaque clic
var _quizPoolCache = null;
function quizPool() { if (!_quizPoolCache) _quizPoolCache = buildQuiz(ALL_FICHES); return _quizPoolCache; }
function qNums(s) { return (String(s).replace(/(\d),(\d)/g, '$1.$2').match(/\d+(?:\.\d+)?/g) || []).map(Number); }
function qRangeOverlap(a, b) {
  var x = qRange(a), y = qRange(b);
  if (!x || !y) return false;
  return x[0] <= y[1] && y[0] <= x[1];
}
function qUnit(s) {
  var n = qNorm(s).trim();
  if (/\bvs\b/.test(n)) return 'vs';
  if (/^\d+\s*\/\s*\d{3,}/.test(n)) return 'frac';
  if (/^\d+\s*[\/:]\s*\d{1,2}$/.test(n)) return 'ratio';
  if (n.indexOf('%') > -1) return '%';
  if (/sem/.test(n)) return 'sem';
  if (/mois/.test(n)) return 'mois';
  if (/\bans?\b/.test(n)) return 'ans';
  if (/\bj\b|jour/.test(n)) return 'j';
  if (/\d\s*h\b|heure/.test(n)) return 'h';
  if (n.indexOf('°') > -1) return 'deg';
  if (/^\d+\s*(?:e|er|ere|eme)\b/.test(n)) return 'ord';
  if (/\d\s*(?:mm|cm)\b/.test(n)) return 'mm';
  if (/\d\s*min\b|minute/.test(n)) return 'min';
  return '';
}
function qIsNeg(s) { return /^(pas |ne |n'|eviter|jamais|aucun|arret|stop|non |proscri|interdi|contre-indi)/.test(qNorm(clean(s))); }
var RX_Q_UNIVERSAL_RED = /fievre|febril|\baeg\b|etat general|amaigr|perte de poids|neoplas|cancer|tumeu|metasta|nocturne|non mecanique|infect|septi|immunod|cortico|osteopor|traumat|haute energie|deficit|paralys|parapar|tetrapar|sphinct|selle|perine|incontin|retention|queue de cheval|suicid|thrombo|embol|\btvp\b|dyspn|syncope|lipothym|thorac|cardia|vascul|ischem|\bavc\b|myelopath|medull|fractur|chute|hemorrag|anticoag|\bage\b|progressi|rapide|brutal|aggravation/;
var RX_Q_UNIVERSAL_DDX = /tumeu|neoplas|metasta|cancer|infect|septi|spondylodisc|osteomyel|fibromyalg|spondylarthr|polyarthr|rhumat|goutte|chondrocalc|psycho|psychiatr|depress|central|nociplast|sensibilis|refer|projet|viscer|vascul|thrombo|\btvp\b|arteri|diabet|neuropath|radicul|sciati|cervic|lomba|coxarthr|stenose|fractur|contusion|hematome/;
var RX_Q_GENERIC_TEST = /\beva\b|\ben\b|numerique|fabq|tampa|\btsk\b|\bhad|\bpcs\b|catastroph|dn4|sf-?36|eq-?5d|qualite de vie|barthel|\bmif\b|\btug\b|timed up|berg|6mwt|6 ?min|test de marche|dynamom|force|goniom|amplitude|mobilite|palpation|inspection|radio|irm|echo|scanner|biolog|testing|reflex|\brot\b|sensibilit|neurolog|lasegue|slump|ulnt|neurodyn|psfs|groc|\bcsi\b|inventaire|questionnaire|score|echelle|enmg|\bemg\b|electromyo|\bvcn\b|conduction nerveuse/;
var RX_Q_GENERIC_PEC = /exercic|activite|educat|reassur|maintien|charge|conservat|intention|progress|autonom|objectif|centre|antalg|cryo|glace|froid|chaleur|thermo|\btens\b|\bains\b|repos|marche|cardio|aerob|reprise|sport|physique|informat|explic|pronostic|favorable|kinesiophob|psycho|sommeil|poids|hygiene|ergonom|postur|etirem|souplesse|global|gainage|proprioc|equilibre|mobilis|massage|manuel|douleur|chronique|disciplin|orthese|attelle|contention|taping|strapping|immobilis|renforcement|surveill|suivi|lombo|pelvi|tronc|chaine|cinetique|controle|aides? tech|etape|chauss|podolog|semelle|post-?op|operatoire|apres chirurgie|isometr|excentr|concentr|\bhsr\b|pliometr|apprentissage|moteur|amplitude|facteurs? (?:favorisant|causal|contributif|declenchant)|technique de course/;
var RX_Q_GENERIC_SCALE = /^(eva|en|ens|evn|had|hads|pcs|tsk|fabq|sf-?36|sf-?12|eq-?5d|mif|psfs|groc|csi|dn4|pgic|tug|bbs|berg|irm|rx|echo|emg|enmg|tdm|scanner)$/;
// Échelle générique = toutes ses composantes (« EVA / EN ») sont génériques
function qGenericScale(s) { return qNorm(s).split(/[\/,+]/).every(function(p) { return RX_Q_GENERIC_SCALE.test(p.trim()); }); }
// Valeur chiffrée exploitable (« 30 % », « ≈ 7-8 sem », « 24h ») — exclut « SOFMER 2023 », « 3D »
function qNumericValue(v) { return /^[~≈<>≥≤±]?\s*\d/.test(v) && !/[A-Z]{2,}/.test(v) && !/^\d+\s*[A-Z]$/.test(v.trim()); }
var RX_Q_URGENT = /urgen|samu|\b15\b|\b112\b|immediat|sans delai|reanimation|hospitalis/;
var RX_Q_AVOID_BLOC = /eviter|ne fait pas|ne fait jamais|ne pas faire|a ne pas|n'est pas recommand|non recommand/;

// ── Révision 2026-10 : options de forme neutre (pas d'indice de mise en forme, de longueur ni de nom) ──
var Q_ABBR = /(?:^|\s)(?:cf|ex|p|env|vs|etc|min|max|sem|réf|ref|coll|al|n°|fig|tab|vol|art)$/i;
// Première proposition de niveau 0 (hors parenthèses) : coupe à « , » « ; » « . » « → » « — »
function qClause(s) {
  s = String(s || '');
  var d = 0;
  for (var i = 1; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === '(' || ch === '[' || ch === '«') d++;
    else if ((ch === ')' || ch === ']' || ch === '»') && d > 0) d--;
    else if (d === 0) {
      if ((ch === ',' || ch === ';') && s.charAt(i + 1) === ' ') return s.slice(0, i);
      if (ch === '.' && (s.charAt(i + 1) === ' ' || i === s.length - 1) && !Q_ABBR.test(s.slice(0, i))) return s.slice(0, i);
      if (ch === ' ' && /[→—–]/.test(s.charAt(i + 1)) && s.charAt(i + 2) === ' ') return s.slice(0, i);
    }
  }
  return s;
}
// Première phrase (coupe seulement au point final de niveau 0)
function qSentence(s) {
  s = String(s || '');
  var d = 0;
  for (var i = 1; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === '(' || ch === '[' || ch === '«') d++;
    else if ((ch === ')' || ch === ']' || ch === '»') && d > 0) d--;
    else if (d === 0 && ch === '.' && s.charAt(i + 1) === ' ' && !Q_ABBR.test(s.slice(0, i))) return s.slice(0, i);
  }
  return s.replace(/\.$/, '');
}
// Intitulé court d'une consigne (« Écharpe antébrachiale : 1-3 semaines, puis… » → « Écharpe antébrachiale : 1-3 semaines »)
// sans le jugement qui suit les deux-points (« : efficace », « : grade B », « : traitement de référence »)
var RX_Q_JUDGE = /^(?:tres |plutot |souvent |surtout |le plus souvent )?(?:efficace|efficacite|recommand|non recommand|traitement de reference|de reference|reference|en 1(?:ere|re) intention|1(?:ere|re) intention|premiere intention|grade|preuve|niveau de preuve|deletere|inutile|utile|benefique|indispensable|prioritaire|priorite|essentiel|incontournable|pilier|socle|adapte|indique|conseille|privilegie|interessant|sure? et efficace|donnees (?:positives|favorables|encourageantes|emergentes|limitees|contradictoires)|aucune? (?:efficacite|benefice|interet|effet)|pas (?:de |d')(?:efficacite|benefice|interet|effet)|peu (?:efficace|d'interet|de benefice)|sans (?:efficacite|benefice|interet)|pierre angulaire)/;
// Justification après les deux-points (« : améliore le contrôle », « : peut accélérer l'antalgie ») : on garde l'intitulé
var RX_Q_WHY = /^(?:peu?t|peuvent|perme|amelio|redui|soulag|acceler|diminu|augment|favoris|limit|evite|aide|apport|donne|montre|prouv|demontr|effets?\b|resultats?\b|antalg|entretien|aggrav|delete)/;
// Intitulés qui ne sont qu'une étiquette (« Phase douloureuse : … », « Après chirurgie : … ») : on garde la consigne qui suit
var RX_Q_LABEL = /^(?:phase|niveau|bloc|etape|stade|semaines?\b|j\d|apres|avant|si |en cas|chez|forme|cas |post|pre-|pre |a partir)/;
// Position du premier « : » hors parenthèses
function qColon(s) {
  var d = 0;
  for (var i = 1; i < s.length - 2; i++) {
    var ch = s.charAt(i);
    if (ch === '(' || ch === '[' || ch === '«') d++;
    else if ((ch === ')' || ch === ']' || ch === '»') && d > 0) d--;
    else if (d === 0 && ch === ' ' && s.charAt(i + 1) === ':' && s.charAt(i + 2) === ' ') return i;
  }
  return -1;
}
// Propositions successives tant que l'intitulé est trop court (« Protection » → « Protection, Élévation »)
function qClauses(s, max) {
  var out = qClause(s), rest = s.slice(out.length);
  while (out.length < 15 && rest) {
    var m = rest.match(/^[,;]\s*/); if (!m) break;
    var next = qClause(rest.slice(m[0].length));
    if (!next || (out + ', ' + next).length > max) break;
    out += ', ' + next; rest = rest.slice(m[0].length + next.length);
  }
  return out;
}
function qHead(s) {
  var c = clean(s).replace(/\s*\((?:grade\s*[ABC]|AE\b|accord d['’]\s*experts?)[^)]*\)/gi, '');
  var k = qColon(c);
  var h = c.split(/\s[:→—–]\s|\s\(|\.\s/)[0].replace(/[.;,:]+$/, '').trim(), nw = h.split(/\s+/).length;
  var label = k > 0 && k <= 80 && (nw <= 3 || RX_Q_LABEL.test(qNorm(h)));
  if (!label && h.length >= 12 && nw >= 3) return h.length > 90 ? qCut(qClause(h), 90) : h;
  if (k > 0 && k <= 80) {
    var head = c.slice(0, k).trim(), rest = c.slice(k + 3).trim();
    if (!RX_Q_LABEL.test(qNorm(head)) && (RX_Q_JUDGE.test(qNorm(rest)) || RX_Q_WHY.test(qNorm(rest))) && head.length >= 8) return qCut(head, 90);
    return qCut((head + ' : ' + qClauses(rest, 50)).replace(/[.;,:]+$/, '').trim(), 90);
  }
  return qCut(qClause(c).replace(/[.;,:]+$/, '').trim(), 90);
}
// Drapeau sans sa conséquence : « … → URGENCE », « … — urgence », « (… → avis chir.) »
// sinon la flèche ou le mot « urgence » désigne la bonne réponse
function qFlag(s) {
  var c = clean(s), d = 0, cut = -1;
  for (var i = 1; i < c.length; i++) {
    var ch = c.charAt(i);
    if (ch === '(') d++;
    else if (ch === ')' && d > 0) d--;
    else if (d === 0 && (ch === '→' || ((ch === '—' || ch === '–') && c.charAt(i - 1) === ' ' && c.charAt(i + 1) === ' '))) { cut = i; break; }
  }
  if (cut > 0) { if (c.slice(0, cut).trim().length < 12) return ''; c = c.slice(0, cut); }   // « CV < 50% → … » : intitulé trop court, écarté
  c = c.replace(/\s*→[^()]*\)/g, ')').replace(/\s*\(\s*urgen[^)]*\)/gi, '');
  return c.replace(/[\s,;:—–\-]+$/, '').trim();
}
// Élément « à éviter » formulé positivement : « Pas de traction cervicale » → « Traction cervicale »
// (dans une question « À ÉVITER », pas de double négation ; dans « RECOMMANDÉE », pas de distracteur vrai)
function qPositive(s) {
  var c = clean(s);
  c = c.replace(/^(?:pas d['’]\s*|pas de |ne pas |ne jamais |jamais (?:de |d['’]\s*)?|aucune? |[ée]viter (?:de |d['’]\s*)?)/i, '');
  c = c.replace(/,\s*pas (?:de |d['’]\s*)/gi, ', ');
  return c.charAt(0).toUpperCase() + c.slice(1);
}
// Intitulé d'un élément « à éviter », sans le jugement qui le trahit (« délétères », « non recommandé »)
function qAvoidHead(s) {
  // Ce qui précède les deux-points est la pratique à éviter, la suite en est la justification
  var c = qPositive(s).replace(/\s*\((?:grade\s*[ABC]|AE\b|accord d['’]\s*experts?)[^)]*\)/gi, ''), k = qColon(c);
  var h = k >= 8 ? qCut(c.slice(0, k).trim(), 90) : qHead(c);
  h = h.replace(/\s*(?:[:—–-]\s*)?(?:non recommand[ée]e?s?|d[ée]l[ée]t[èe]re?s?|inutiles?|contre-productif|[àa] (?:é|e)viter)(?:\s+en routine)?\s*\.?$/i, '');
  h = h.replace(/\s*\((?:AE|grade\s*[ABC])\)\s*$/i, '');
  // Parenthèse finale explicative (« Immobilisation complète (entretient la raideur) ») : elle trahit le jugement
  var p = h.match(/^(.*\S)\s*\([^()]*\)$/);
  if (p && p[1].length >= 12) h = p[1];
  return h.replace(/[\s.;,:]+$/, '').trim();
}
// Sigles d'un texte (SDRC, LCA, SLA, VPPB…)
function qAcr(s) {
  var out = [];
  (String(s || '').match(/(?:^|[^A-Za-zÀ-ÿ])([A-Z]{2,6})(?=[^A-Za-zÀ-ÿ]|$)/g) || []).forEach(function(m) { var a = m.replace(/[^A-Z]/g, ''); if (out.indexOf(a) < 0) out.push(a); });
  return out;
}
// Mots de localisation (« lombaire », « cervical », « genou »…) : partagés par plusieurs fiches, ils ne trahissent rien
// et restent visibles dans le résumé ; ce sont les autres mots du nom qui sont masqués
var Q_LOC_ADJ = /^(?:lombaires?|lombo|cervic(?:al|ale|ales|aux)|cervico|dors(?:al|ale|ales|aux)|thoraciques?|thoraco|genoux?|hanches?|epaules?|poignets?|chevilles?|coudes?|rachis|rachidien(?:ne)?s?|nuques?|cuisses?|jambes?|talons?|pieds?|mains?|doigts?|orteils?|brachi(?:al|ale|ales|aux))$/;
function qStemsNoAdj(s) {
  var v = new Set();
  (qNorm(clean(s)).match(/[a-z]{5,}/g) || []).forEach(function(w) { if (!Q_STOP.has(w) && !Q_LOC_ADJ.test(w)) v.add(w.slice(0, 5)); });
  return v;
}
var Q_LOC_WORDS = /^(?:lombalgies?|cervicalgies?|dorsalgies?|lombaires?|lombo|cervic(?:al|ale|ales|aux)|cervico|dors(?:al|ale|ales|aux)|thoraciques?|thoraco|genoux?|hanches?|epaules?|poignets?|chevilles?|coudes?|rachis|rachidien(?:ne)?s?|nuques?|cuisses?|jambes?|talons?|pieds?|mains?|doigts?|orteils?|brachi(?:al|ale|ales|aux))$/;
function qStemsNoLoc(s) {
  var v = new Set();
  (qNorm(clean(s)).match(/[a-z]{5,}/g) || []).forEach(function(w) { if (!Q_STOP.has(w) && !Q_LOC_WORDS.test(w)) v.add(w.slice(0, 5)); });
  return v;
}
// Paires dont les résumés se recouvrent trop pour une question d'identification
var Q_ID_EXCL = [['parkinson-suivi-liberal', 'syndrome-extrapyramidal'], ['lombalgie-chronique', 'fibromyalgie'], ['lombalgie-chronique', 'lombalgie-commune']];
function qIdExcluded(a, b) { return Q_ID_EXCL.some(function(p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); }); }
// Résumé sans les mots du nom de la pathologie : les distracteurs n'ayant jamais ces mots, ils trahiraient la réponse
// (on garde les qualificatifs génériques : « traitement conservateur », « enfant », « suivi libéral »…)
var Q_MASK_SKIP = new Set(['trait', 'conse', 'suivi', 'liber', 'enfan', 'adole', 'adult', 'grand', 'acqui', 'commu', 'chron']);
// Sigle formé des initiales du nom (« Syndrome de la queue de cheval » → « SQC »)
function qInitials(nom) {
  var w = String(nom || '').replace(/\(.*?\)/g, ' ').split(/[\s\/'’-]+/).filter(function(x) { return x && !/^(?:de|du|des|la|le|les|l|d|et|en|a|à|au|aux)$/i.test(x); });
  return w.length >= 3 ? w.map(function(x) { return x.charAt(0).toUpperCase(); }).join('') : '';
}
function qMaskName(text, f) {
  var stems = new Set(), acr = qAcr(f.nom), ini = qInitials(f.nom);
  if (ini) acr.push(ini);
  qStemsNoLoc(f.nom).forEach(function(k) { if (!Q_MASK_SKIP.has(k)) stems.add(k); });
  var t = String(text || '').replace(/\*\*/g, '').replace(/^[^0-9A-Za-zÀ-ɏ«"'(]+/, '');
  t = t.replace(/[A-Za-zÀ-ÿŒœÆæ][A-Za-zÀ-ÿŒœÆæ\-]*/g, function(w) {
    var hit = w.split('-').some(function(p) {
      if (acr.indexOf(p) > -1) return true;
      var n = qNorm(p);
      return n.length >= 5 && !Q_STOP.has(n) && !Q_LOC_WORDS.test(n) && stems.has(n.slice(0, 5));
    });
    return hit ? '[…]' : w;
  });
  return t.replace(/\[…\](?:\s*(?:\s(?:de la|des|du|de|la|le|les|et|ou)\s|\sde l['’]|\s|\/)\s*\[…\])+/g, '[…]');
}
// Intervalle numérique, bornes ouvertes pour « > 1 an », « ≥ 6 mois », « < 90° »
function qRange(s) {
  var t = String(s || ''), n = qNums(t);
  if (!n.length) return null;
  var lo = Math.min.apply(null, n), hi = Math.max.apply(null, n), h = qNorm(t).trim();
  if (/^[~≈]?\s*(?:>|≥|plus de|au moins|sup)/.test(h) || /\+\s*$/.test(h)) hi = Infinity;   // « 12 sem+ » = au moins 12 sem
  else if (/^[~≈]?\s*(?:<|≤|moins de|jusqu)/.test(h)) lo = -Infinity;
  return [lo, hi];
}
// Durée en jours (pour comparer « 1 an » et « 12 mois »)
function qDays(s) {
  var k = { j: 1, sem: 7, mois: 30.4, ans: 365, h: 1 / 24 }[qUnit(s)];
  var r = k ? qRange(s) : null;
  return r ? [r[0] * k, r[1] * k] : null;
}
// Pourcentages cités dans une note (« Hegedus : Se 70 % ») : jamais proposés comme distracteur
function qNotePct(s) { return String(s || '').match(/\d+(?:[.,]\d+)?(?:\s*(?:-|–|à)\s*\d+(?:[.,]\d+)?)?\s*%/g) || []; }

function buildQuiz(fiches) {
  var Q = [];
  var F = fiches.filter(function(f) { return !f.stub; });
  var ZONES_ANAT = ['Rachis', 'Épaule', 'Coude', 'Poignet / Main', 'Hanche', 'Genou', 'Cheville', 'Pied'];
  var GRADES = ['Grade A', 'Grade B', 'Grade C', 'AE'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  // Pas de sensibilité / spécificité (ni valeur, ni rapport de vraisemblance) dans les QCM : elles restent dans les fiches
  var RX_SESP = /\b(?:Se|Sp)\b\s*(?:[:=]|de|d')?\s*[<>≥≤~]?\s*\d|\bSe\s*(?:\/|et)\s*Sp\b|\b(?:Se|Sp)\s+(?:élevée|faible|modérée|excellente|bonne|médiocre|variable|basse|haute)|sensibilit[ée]s?\s+(?:de\s+\d|élevée|faible|modérée|excellente|bonne|médiocre|et\s+(?:la\s+)?sp[ée]cificit)|sp[ée]cificit[ée]|\b(?:très|peu|plus|moins|assez|trop)\s+(?:sensible|spécifique)s?\b(?!\s+(?:au|aux|à)\b)|\ble\s+plus\s+(?:sensible|spécifique)\b|\bVPP\b|\bVPN\b|\b(?:RV|LR)\s*[+−-]|rapport de vraisemblance|valeur prédictive|exactitude|probabilité post-test|\ble\s+plus\s+performant|\bles\s+plus\s+performants/i;
  // Texte affiché sans ce qui parle de Se/Sp : parenthèses concernées retirées, puis phrases concernées
  function noSeSp(t) {
    var s = String(t || '').replace(/\s*\([^()]*\)/g, function(p) { return RX_SESP.test(p) ? '' : p; });
    if (!RX_SESP.test(s)) return s;
    var ph = s.match(/[^.!?]+(?:[.!?]+|$)\s*/g) || [s];
    return ph.filter(function(x) { return !RX_SESP.test(x); }).join('').replace(/\s{2,}/g, ' ').trim();
  }
  function add(type, f, q, good, pool, fallback, keepOrder) {
    if (RX_SESP.test(q) || RX_SESP.test(good)) return;
    var noSp = function(list) { return Array.isArray(list) ? list.filter(function(x) { return !RX_SESP.test(x); }) : list; };
    var o = makeOptions(good, noSp(pool), noSp(fallback), keepOrder);
    if (o) Q.push({ type: type, ficheId: f.id, zone: f.zone, niveau: f.niveau, q: q, options: o, answer: good });
  }
  function reds(f) { var fl = f.onglets.flags; return fl && fl.red && fl.red[0] !== 'À compléter' ? fl.red.map(clean).filter(Boolean) : []; }
  function yellows(f) { var fl = f.onglets.flags; return fl && fl.yellow && fl.yellow[0] !== 'À compléter' ? fl.yellow.map(clean).filter(Boolean) : []; }
  function tests(f) { return f.onglets.tests && f.onglets.tests.items ? f.onglets.tests.items : []; }
  function ddx(f) { return f.onglets.ddx && f.onglets.ddx.items ? f.onglets.ddx.items : []; }
  function blocs(f) { return f.onglets.pec && f.onglets.pec.blocs ? f.onglets.pec.blocs : []; }
  function avoidBloc(f) { return blocs(f).find(function(b) { return RX_Q_AVOID_BLOC.test(qNorm(b.titre)); }); }
  function isSideBloc(b) { return /nuanc|precaution|detaill|critere|evolution|pronostic/.test(qNorm(b.titre)); }
  // Élément de longueur comparable à des références (la bonne réponse ne doit pas se repérer à sa taille)
  function pickClose(items, refs) {
    if (!refs.length) return pick(items);
    var m = refs.reduce(function(a, r) { return a + r.length; }, 0) / refs.length;
    var ok = items.filter(function(x) { return x.length >= m * 0.5 && x.length <= m * 2; });
    return pick(ok.length ? ok : items);
  }
  // Recoupement de deux valeurs, avec une marge (« 71 % » et « 72 % » ne se distinguent pas)
  function overlapTol(a, b, tol) {
    var x = qRange(a), y = qRange(b);
    if (!x || !y) return false;
    return x[0] - tol <= y[1] + tol && y[0] - tol <= x[1] + tol;
  }
  // Éléments « à éviter » reformulés positivement, sans la consigne d'alerte (« STOP + appel 15 » n'est pas à éviter)
  function avoidList(f) {
    var av = avoidBloc(f); if (!av) return [];
    return av.items.filter(function(i) { return !/\bstop\b|appel(?:er)? (?:le )?15|samu/.test(qNorm(i)); }).map(qAvoidHead).filter(function(h) { return h.length >= 8; });
  }
  function recoItems(f) {
    var av = avoidBloc(f), out = [];
    blocs(f).forEach(function(b) {
      if (b === av || isSideBloc(b)) return;
      b.items.forEach(function(i) { if (!qIsNeg(i)) out.push(clean(i)); });
    });
    return out;
  }
  // Consignes utilisables comme options : ni négation, ni renvoi, ni constat (« … est le traitement de référence »),
  // ni mention du nom de la pathologie (« Programme le mieux décrit pour Osgood-Schlatter »)
  function recoHeads(list, f) {
    var self = f ? qStemsNoLoc(f.nom) : new Set();
    return list.map(qHead).filter(function(h) {
      var n = qNorm(h);
      if (h.length < 12 || qIsNeg(h) || /eviter|delet|meme logique|identique|\bcf\b|voir l'onglet|voir la fiche/.test(n)) return false;
      if (/\b(?:est|sont) (?:le|la|les|un|une|des|du|souvent|toujours|plus|moins|tres|habituellement|rarement)\b|a remplace|n'est pas|ne sont pas|se resolvent|\btaux de\b|\d+ ?% de|bons resultats|resolution spontanee|^souvent\b|^generalement\b/.test(n)) return false;
      var hit = false; qStems(h).forEach(function(k) { if (self.has(k)) hit = true; });
      return !hit;
    });
  }
  function scoreBloc(f) { var b = f.onglets.bilan && f.onglets.bilan.blocs; return b ? b.find(function(x) { var t = qNorm(x.titre); return t.indexOf('echelle') > -1 || t.indexOf('score') > -1; }) : null; }
  function scoreNames(b) { var out = []; (b ? b.items : []).forEach(function(i) { var m = i.match(/\*\*([A-Z][A-Z0-9\-\/ ]{1,20})\*\*/); if (m) out.push(m[1].trim()); }); return out; }
  function len(a, b) { return function(s) { return s.length >= a && s.length <= b; }; }
  function safe(label, fn) { try { fn(); } catch (e) { if (window.console) console.warn('Quiz — type « ' + label + ' » ignoré :', e); } }
  function sameZone(f, x) {
    if (!!f.pediatrie && !!x.pediatrie) return true;
    var zx = [x.zone, x.secondaryZone];
    return [f.zone, f.secondaryZone].some(function(z) { return z && zx.indexOf(z) > -1; });
  }
  // Liens de diagnostic différentiel entre fiches, dans les deux sens
  var LINKS = {};
  F.forEach(function(x) { LINKS[x.id] = new Set(); });
  F.forEach(function(x) { ddx(x).forEach(function(d) { if (d.fiche && LINKS[d.fiche]) { LINKS[x.id].add(d.fiche); LINKS[d.fiche].add(x.id); } }); });
  // Sigle → racines du nom de la fiche qui le porte (« SDRC » ↔ « Syndrome douloureux régional complexe »)
  var ACR_STEMS = {};
  F.forEach(function(x) { qAcr(x.nom).forEach(function(a) { var s = ACR_STEMS[a] = ACR_STEMS[a] || new Set(); qStems(x.nom).forEach(function(k) { s.add(k); }); }); });
  function acrHit(s, acrs, own) {
    return qAcr(s).some(function(a) {
      if (acrs.has(a)) return true;
      var hit = false; (ACR_STEMS[a] || new Set()).forEach(function(k) { if (own.has(k)) hit = true; });
      return hit;
    });
  }
  // Drapeaux jaunes d'autres fiches : seulement les facteurs psychosociaux génériques (pas « peur de casser le ménisque »)
  var RX_Q_PSY = /kinesiophob|catastroph|croyance|anxi|depress|stress|peur|attente|auto-efficacite|isolement|professionnel|travail|observance|adhesion|motivation|detresse|sommeil|pression|evitement|litige|conflit|insatisfaction|humeur|frustration|social|passi/;
  var RX_Q_SPECIFIC = /tendon|hernie|disque|menisq|prothese|greffe|rupture|luxe|luxat|epaule|genou|cheville|hanche|poignet|doigt|pied|cervic|lomba|rotul|achill|ligament|articulation|cartilage|chirurg|operation|post-op|irm|corset|orthese|attelle|methotrexate|ponseti|chaussage|bandelette|ballon|club|competition|saison|contact|enfant|parent|nourrisson|\bado|scolaire|aidant|demence|parkinson|grossesse|post-partum|allaitement|portage|steppage|fertilit|ecran|sdrc|\btete\b|\bcou\b|dos\b|main\b|kilometr|course|sport/;
  var ALL_YELLOWS = [];
  F.forEach(function(x) { yellows(x).map(qFlag).forEach(function(y) { var n = qNorm(y); if (y.length >= 12 && y.length <= 120 && !RX_Q_UNIVERSAL_RED.test(n) && RX_Q_PSY.test(n) && !RX_Q_SPECIFIC.test(n)) ALL_YELLOWS.push({ id: x.id, t: y }); }); });

  // ── A : Identification (résumé sans le nom → pathologie ; distracteurs de la même région d'abord) ──
  // Fiches « connaissance » (theme : retour au sport, charge…) : ni question, ni distracteur — ce ne sont pas des pathologies
  safe('Identification', function() {
    F.forEach(function(f) {
      if (f.theme) return;
      var own = qStemsNoLoc(f.nom), acrs = new Set(qAcr(f.nom));
      ddx(f).forEach(function(d) { qStemsNoLoc(d.dx).forEach(function(k) { own.add(k); }); qAcr(d.dx).forEach(function(a) { acrs.add(a); }); });
      var qual = (qNorm(f.nom).match(/\b(commune|chronique|aigue)\b/) || [])[1];
      // Pathologie citée dans le résumé affiché (« … racines de la queue de cheval », « Chirurgie (PTH) ») : jamais distracteur
      var shown = noSeSp(qMaskName(f.resume, f)), seen = qStemsNoAdj(shown);
      var cited = function(x) {
        var hit = false; qStemsNoAdj(x.nom).forEach(function(k) { if (!Q_MASK_SKIP.has(k) && seen.has(k)) hit = true; });
        var ini = qInitials(x.nom);
        return hit || qAcr(x.nom).concat(ini ? [ini] : []).some(function(a) { return new RegExp('(^|[^A-Za-z])' + a + '([^A-Za-z]|$)').test(shown); });
      };
      var ok = F.filter(function(x) {
        if (x.theme || x.id === f.id || LINKS[f.id].has(x.id) || qIdExcluded(f.id, x.id)) return false;
        if (qual && qNorm(x.nom).indexOf(qual) > -1) return false;
        var hit = false; qStemsNoLoc(x.nom).forEach(function(k) { if (own.has(k)) hit = true; });
        return !hit && !acrHit(x.nom, acrs, own) && !cited(x);
      });
      var nom = function(x) { return x.nom; };
      var near = ok.filter(function(x) { return sameZone(f, x); }).map(nom);
      var nb = shuffle(ok.filter(function(x) { return !sameZone(f, x) && qNear(f, x); }).map(nom));
      var far = ok.filter(function(x) { return !sameZone(f, x) && !qNear(f, x); }).map(nom);
      // Même région d'abord, complétée par les régions voisines, puis le reste
      if (near.length < 3) near = near.concat(nb.slice(0, 3 - near.length));
      add('Identification', f, 'À quelle pathologie correspond cette description ?\n\n« ' + shown + ' »', f.nom, near, far.concat(nb), true);
    });
  });

  // ── B : Diagnostic différentiel ──────────────────────────────
  safe('Diagnostic différentiel', function() {
    F.forEach(function(f) {
      var items = ddx(f); if (!items.length) return;
      var good = pick(items).dx;
      var texts = items.map(function(d) { return d.dx; }).concat([f.nom]);
      var own = qStemSet(texts), acrs = new Set();
      texts.forEach(function(t) { qAcr(t).forEach(function(a) { acrs.add(a); (ACR_STEMS[a] || new Set()).forEach(function(k) { own.add(k); }); }); });
      var area = qStemSet(F.filter(function(x) { return qNear(f, x); }).map(function(x) { return x.nom; }));
      var pool = [];
      F.forEach(function(x) {
        if (x.id === f.id || qNear(f, x)) return;
        ddx(x).forEach(function(d) { if (RX_Q_UNIVERSAL_DDX.test(qNorm(d.dx)) || qOverlap(d.dx, own) || qOverlap(d.dx, area) || acrHit(d.dx, acrs, own)) return; pool.push(d.dx); });
      });
      add('Diagnostic différentiel', f, 'Parmi ces propositions, laquelle est un diagnostic différentiel pertinent de : ' + f.nom + ' ?', good, pool);
    });
  });

  // ── C : Test clinique (ou outil d'évaluation du bilan) ───────
  safe('Test clinique', function() {
    F.forEach(function(f) {
      var ts = tests(f); if (!ts.length) return;
      var good = pick(ts).nom;
      var own = qStemSet(ts.map(function(t) { return t.nom; }).concat([f.nom]));
      var pool = [];
      F.forEach(function(x) {
        if (x.id === f.id || qNear(f, x)) return;
        tests(x).forEach(function(t) { if (RX_Q_GENERIC_TEST.test(qNorm(t.nom)) || qOverlap(t.nom, own)) return; pool.push(t.nom); });
      });
      add('Test clinique', f, 'Quel test ou outil d\'évaluation fait partie du bilan de : ' + f.nom + ' ?', good, pool);
    });
  });

  // ── D : Drapeau rouge (distracteurs = drapeaux jaunes, jamais rouges ; conséquences retirées) ──
  safe('Drapeau rouge', function() {
    F.forEach(function(f) {
      var r = reds(f).map(qFlag).filter(len(12, 120)); if (!r.length) return;
      var own = qStemSet(reds(f).concat([f.nom]));
      var others = ALL_YELLOWS.filter(function(y) { return y.id !== f.id && !qOverlap(y.t, own); }).map(function(y) { return y.t; });
      add('Drapeau rouge', f, 'Lequel de ces signes est un DRAPEAU ROUGE pour : ' + f.nom + ' ?', pick(r), yellows(f).map(qFlag).filter(len(12, 120)), others);
    });
  });

  // ── E : Prise en charge recommandée ──────────────────────────
  safe('Prise en charge', function() {
    F.forEach(function(f) {
      var av = avoidBloc(f);
      var b0 = blocs(f).find(function(b) { return b !== av && !isSideBloc(b); });
      if (!b0) return;
      var items = recoHeads(b0.items.filter(function(i) { return !qIsNeg(i); }), f);
      if (!items.length) return;
      var avoid = avoidList(f);
      var good = avoid.length >= 3 ? pickClose(items, avoid) : pick(items);
      if (avoid.length >= 3) {
        add('Prise en charge', f, 'Parmi ces propositions, laquelle est RECOMMANDÉE dans la prise en charge de : ' + f.nom + ' ?', good, avoid);
        return;
      }
      // Tout traitement cité ailleurs dans la fiche (pronostic, orientation, recos) exclut le distracteur
      var ownTexts = blocs(f).reduce(function(a, b) { return a.concat(b.items); }, [])
        .concat(((f.onglets.pronostic && f.onglets.pronostic.blocs) || []).reduce(function(a, b) { return a.concat(b.items); }, []))
        .concat((f.onglets.orientation && f.onglets.orientation.items) || [])
        .concat(((f.onglets.has && f.onglets.has.grades) || []).map(function(g) { return g.t; }))
        .concat([f.nom]);
      var own = qStemSet(ownTexts);
      var fb = [];
      F.forEach(function(x) {
        if (x.id === f.id || qNear(f, x)) return;
        recoHeads(recoItems(x), x).forEach(function(h) { if (RX_Q_GENERIC_PEC.test(qNorm(h)) || qOverlap(h, own)) return; fb.push(h); });
      });
      add('Prise en charge', f, 'Parmi ces propositions, laquelle correspond à la prise en charge de : ' + f.nom + ' ?', good, avoid, fb);
    });
  });

  // ── F : Score / échelle de référence ─────────────────────────
  safe('Score de référence', function() {
    F.forEach(function(f) {
      var names = scoreNames(scoreBloc(f)).filter(function(s) { return !qGenericScale(s); });
      if (!names.length) return;
      var good = names[0];
      var ownTxt = qNorm(JSON.stringify([f.onglets.bilan, f.onglets.tests || {}, f.onglets.has || {}]));
      var pool = [];
      F.forEach(function(x) {
        if (x.id === f.id || qNear(f, x)) return;
        scoreNames(scoreBloc(x)).forEach(function(s) { if (qGenericScale(s) || ownTxt.indexOf(qNorm(s)) > -1) return; pool.push(s); });
      });
      add('Score de référence', f, 'Quel score / quelle échelle est utilisé(e) pour évaluer : ' + f.nom + ' ?', good, pool, null, true);
    });
  });

  // ── H : Orientation urgente ──────────────────────────────────
  safe('Orientation urgente', function() {
    // « URGENCE → queue de cheval » : la situation est après la flèche ; « Régression des acquis → réévaluation urgente » : avant
    var strip = function(s) {
      var c = clean(s), k = c.indexOf('→');
      if (k < 0) return c;
      var pre = qNorm(c.slice(0, k));
      return (RX_Q_URGENT.test(pre) || /orthop|chirurg|neurolog|medecin|avis|specialis|irm|radio|imagerie|pediatr|kine|pneumo|cardio|rhumato|ophtalm|\borl\b|psych|centre|consult|mpr|equipe/.test(pre)) ? c.slice(k + 1).trim() : c;
    };
    var isUrg = function(i) { return i.indexOf('🚨') > -1 || RX_Q_URGENT.test(qNorm(i)); };
    var cap = function(s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    // Options = situations (« échec… », « suspicion de… »), jamais des actes ou des intervenants (« Ig IV… », « ECG → … »)
    var RX_ACT = /^(?:ig iv|toxine|tetrabenazine|chirurgie|orthese|infiltration|neuromodulation|programme|traitement|approche|coordination|bilan|controle|confirmation|diagnostic|pas d'imagerie|imagerie|desencombrement|cv annuelle|suivi|surveillance|radiographie|radio\b|enmg|ecg|orientation|dietetique|ergotherapeute|podologue|immobilisation|phase|cataracte|kine|reeducation|appel|samu|j0|type iii|des la|en 2e|2e intention|1ere intention|indication|epilepsie|ne jamais|scoliose,)/;
    var RX_SIT = /^(?:echec|doute|absence|pas d'amelioration|persistance|douleur|limitation|recidive|si |forme|lesion|deformation|retentissement|plafonnement|instabilite|suspicion|atteinte|aggravation|signes?|spasticite|poussee|deficit|tout |toute )/;
    F.forEach(function(f) {
      var its = (f.onglets.orientation && f.onglets.orientation.items) || [];
      // « Radio bassin en urgence si suspicion d'avulsion » → la situation est « suspicion d'avulsion »
      var situ = function(i) { var c = strip(i), m = c.match(/\bsi (.{12,})$/); return RX_ACT.test(qNorm(c)) && m ? m[1] : c; };
      var urg = its.filter(function(i) { return isUrg(i) && !RX_ACT.test(qNorm(situ(i))); });
      if (!urg.length) return;
      var good = cap(qCut(situ(pick(urg)), 110));
      if (good.length < 15) return;
      var own = [], others = [];
      // Motif non urgent qui reprend un drapeau rouge de la fiche (« sciatique hyperalgique ») : écarté
      var redStems = reds(f).map(function(r) { return qStems(r); });
      var likeRed = function(c) { var a = qStems(c); return redStems.some(function(b) { var n = 0; a.forEach(function(k) { if (b.has(k)) n++; }); return n >= 2; }); };
      F.forEach(function(x) {
        ((x.onglets.orientation && x.onglets.orientation.items) || []).forEach(function(i) {
          // Un motif d'orientation qui évoque un drapeau rouge (fièvre, déficit…) pourrait être jugé urgent : exclu
          if (isUrg(i) || /drapeau|basilair|dissect|carotid|contre-indic|centra|bilateral/.test(qNorm(i)) || RX_Q_UNIVERSAL_RED.test(qNorm(clean(i)))) return;
          var c = cap(qCut(strip(i), 110)), n = qNorm(c);
          if (c.length < 15 || RX_ACT.test(n)) return;
          if (x.id === f.id) { if (!likeRed(c)) own.push(c); }
          else if (RX_SIT.test(n)) { c = c.replace(/\s*\([^()]*\)/g, '').replace(/\s+([.,;…])/g, '$1'); if (!likeRed(c)) others.push(c); }   // détails propres à une autre fiche retirés
        });
      });
      add('Orientation urgente', f, 'Quelle situation impose une orientation URGENTE pour : ' + f.nom + ' ?', good, own, others);
    });
  });

  // ── I : Zone anatomique (jamais pour une fiche pédiatrique : zone et spécialité seraient toutes deux justes) ──
  safe('Zone anatomique', function() {
    F.filter(function(f) { return (f.zone === 'Neurologie' || f.zone === 'Hanche') && !f.pediatrie; }).forEach(function(f) {
      var pool = ZONES_ANAT.filter(function(z) { return z !== f.zone && z !== f.secondaryZone && (Q_NEIGHBORS[f.zone] || []).indexOf(z) < 0; });
      add('Zone anatomique', f, 'Dans quelle région anatomique / spécialité se localise principalement : ' + f.nom + ' ?', f.zone, pool, null, true);
    });
  });

  // Valeur de sensibilité / spécificité (ou rapport de vraisemblance) : pas de question de pur rappel de pourcentage
  function qIsSeSpValue(s) {
    var lbl = String(s.lbl || ''), val = String(s.val || '');
    var sesp = /(?:^|[\s(,;])(?:Se|Sp|RV[+−-]?|VPP|VPN)(?=[\s:=),]|$)/.test(lbl + ' ' + val) || /sensibilit|sp[ée]cificit|valeur pr[ée]dictive/i.test(lbl);
    return sesp && /%/.test(val);
  }
  // ── J : Chiffre clé (valeurs qui se recoupent ou se ressemblent exclues) ──
  safe('Chiffre clé', function() {
    F.forEach(function(f) {
      var st = (f.stats || []).filter(function(s) { return s.val && qNumericValue(s.val) && s.val.length <= 20 && !qIsSeSpValue(s); });
      if (!st.length) return;
      var s0 = pick(st), good = s0.val, u = qUnit(good), gd = good.replace(/\D/g, ''), da = qDays(good);
      var rg = qRange(good), closedGood = !!rg && isFinite(rg[0]) && isFinite(rg[1]);
      var ownVals = (f.stats || []).map(function(s) { return qNorm(s.val); });
      var same = [], other = [];
      F.forEach(function(x) {
        if (x.id === f.id) return;
        (x.stats || []).forEach(function(s) {
          if (!s.val || !qNumericValue(s.val) || s.val.length > 20 || qIsSeSpValue(s) || ownVals.indexOf(qNorm(s.val)) > -1) return;
          var sd = s.val.replace(/\D/g, ''); if (gd && sd && (gd.indexOf(sd) === 0 || sd.indexOf(gd) === 0)) return;   // « 1-4 % » et « ~14 % », « 24h » et « 2 / 4 »
          var db = qDays(s.val);
          if (da && db) { if (da[0] * 0.9 <= db[1] * 1.1 && db[0] * 0.9 <= da[1] * 1.1) return; same.push(s.val); return; }   // « 1 an » / « 12 mois », « 3 mois » / « 12 sem »
          var su = qUnit(s.val);
          if (su === u && (u === '%' && closedGood ? overlapTol(s.val, good, 3) : qRangeOverlap(s.val, good))) return;   // « ~14 % » / « ≈ 15 % »
          (su === u ? same : other).push(s.val);
        });
      });
      var lbl = noSeSp(s0.lbl); if (lbl.length < 10) return;
      add('Chiffre clé', f, 'Quelle valeur correspond à ce repère pour : ' + f.nom + ' ?\n\n« ' + lbl + ' »', good, same, other, true);
    });
  });

  // ── K : À éviter (distracteurs = recommandations de la même fiche) ──
  safe('À éviter (piège)', function() {
    F.forEach(function(f) {
      var avoid = avoidList(f); if (!avoid.length) return;
      var reco = recoHeads(recoItems(f), f);
      var fb = [];
      if (reco.length < 3) {
        var own = qStemSet(avoidBloc(f).items.concat([f.nom]));
        F.forEach(function(x) {
          if (x.id === f.id || qNear(f, x)) return;
          recoHeads(recoItems(x), x).forEach(function(h) { if (qOverlap(h, own)) return; fb.push(h); });
        });
      }
      add('À éviter (piège)', f, 'Parmi ces propositions, laquelle est À ÉVITER dans la prise en charge de : ' + f.nom + ' ?', pick(avoid), reco, fb);
    });
  });

  // ── L : Piège — n'est PAS un drapeau rouge (3 rouges de la fiche + 1 jaune, conséquences retirées) ──
  safe("Piège — N'est PAS un 🚩", function() {
    F.forEach(function(f) {
      var r = reds(f).map(qFlag).filter(len(12, 110)), y = yellows(f).map(qFlag).filter(len(12, 110));
      if (r.length < 3 || !y.length) return;
      add("Piège — N'est PAS un 🚩", f, "⚠️ Lequel de ces signes N'EST PAS un drapeau rouge pour : " + f.nom + " ?\n(3 vrais drapeaux rouges, 1 drapeau jaune)", pickClose(y, r), r);
    });
  });

  // ── N : Grade de recommandation (texte qui n'annonce ni ne mélange les grades) ──
  safe('Grade de recommandation', function() {
    var RX_AE = /\bAE\b|accord\s+d['’]?\s*experts?/i;
    F.forEach(function(f) {
      var gs = ((f.onglets.has && f.onglets.has.grades) || []).map(function(g) {
        var G = String(g.g || ''), m = G.match(/\bGrade\s*([ABC])\b/i);
        var grade = m ? 'Grade ' + m[1].toUpperCase() : (RX_AE.test(G) ? 'AE' : null);
        if (!grade) return null;
        var src = G.replace(/\bGrade\s*[ABC]\b/ig, '').replace(/\bAE\b/g, '').replace(/accord\s+d['’]?\s*experts?/ig, '')
          .replace(/\(\s*[—–\-,;:]*\s*\)/g, '').replace(/\s*[—–\-,;:]+\s*\)/g, ')').replace(/\(\s*[—–\-,;:]+\s*/g, '(')
          .replace(/\s{2,}/g, ' ').replace(/^[\s\/,;:—–-]+|[\s\/,;:—–-]+$/g, '').trim();
        var t = noSeSp(clean(g.t));
        if (t.length < 20 || /\bgrade\s*[ABC]\b|\(\s*[ABC]\s*\)/i.test(t) || RX_AE.test(t)) return null;
        return { grade: grade, src: src, t: t };
      }).filter(Boolean);
      if (!gs.length) return;
      var p = pick(gs);
      add('Grade de recommandation', f, (p.src ? 'Selon ' + p.src + ', quel' : 'Quel') + ' est le grade de cette recommandation pour : ' + f.nom + ' ?\n\n« ' + qCut(p.t, 160) + ' »', p.grade, GRADES.filter(function(g) { return g !== p.grade; }), null, true);
    });
  });

  // ── O : Série de tests du bilan ──────────────────────────────
  safe('Série de tests', function() {
    F.forEach(function(f) {
      var ts = tests(f); if (ts.length < 3) return;
      var note = qNorm((f.onglets.tests && f.onglets.tests.note) || '');
      if (!/cluster|combinaison|association|faisceau|convergence/.test(note)) return;
      var good = shuffle(ts).slice(0, 3).map(function(t) { return t.nom; }).join(', ');
      var own = qStemSet(ts.map(function(t) { return t.nom; }).concat([f.nom]));
      var all = [];
      F.forEach(function(x) {
        if (x.id === f.id || qNear(f, x)) return;
        tests(x).forEach(function(t) { if (RX_Q_GENERIC_TEST.test(qNorm(t.nom)) || qOverlap(t.nom, own)) return; all.push(t.nom); });
      });
      all = shuffle(Array.from(new Set(all)));
      if (all.length < 9) return;
      add('Série de tests', f, 'Quelle série de tests ou d\'outils d\'évaluation fait partie du bilan de : ' + f.nom + ' ?', good, [all.slice(0, 3).join(', '), all.slice(3, 6).join(', '), all.slice(6, 9).join(', ')], null, true);
    });
  });

  // ── P : Argument de diagnostic différentiel (ce qui oriente vers un DDx plutôt que vers les autres) ──
  safe('Argument de DDx', function() {
    F.forEach(function(f) {
      var arg = function(d) { return qCut(clean(d.pour), 110); };
      // Argument exploitable : ni négation, ni reprise des mots du diagnostic visé (sinon la question donne la réponse)
      var items = ddx(f).filter(function(d) { var p = arg(d); return p.length >= 12 && !qIsNeg(p) && !qOverlap(p, qStems(d.dx)); });
      if (items.length < 2) return;
      var d = pick(items), good = arg(d), gs = qStems(good), dxs = qStems(d.dx);
      // Arguments en faveur des AUTRES diagnostics de la fiche, sans mot commun avec la bonne réponse
      var pool = items.filter(function(x) { return x !== d && !qOverlap(x.dx, dxs); }).map(arg)
        .filter(function(t) { return !qOverlap(t, gs) && !qOverlap(t, dxs); });
      // Complément : arguments d'autres fiches de la même région, pour un autre diagnostic
      var fb = [];
      F.forEach(function(x) {
        if (x.id === f.id || !qNear(f, x)) return;
        ddx(x).forEach(function(y) { var t = arg(y); if (t.length < 12 || qIsNeg(t) || qOverlap(t, gs) || qOverlap(t, dxs) || qOverlap(y.dx, dxs)) return; fb.push(t); });
      });
      add('Argument de DDx', f, 'Chez un patient suivi pour : ' + f.nom + ', quel élément oriente plutôt vers : ' + d.dx + ' ?', good, pool, fb);
    });
  });

  // ── Q : Manœuvre → test (geste sans le résultat ; noms sans la structure entre parenthèses) ──
  safe('Manœuvre → test', function() {
    var RX_TECH = /decubitus|assis|debout|flexion|extension|rotation|compression|pression|abduction|adduction|percussion|elevation|traction|inclinaison|appui|bras|jambe|genou|hanche|epaule|coude|poignet|pouce|cheville|pied|tete|mollet|talon|main|doigt|orteil|marche|saut|squat/;
    var shortName = function(n) { return n.replace(/\s*\([^()]*\)\s*$/, '').replace(/\s+—\s+.*$/, '').trim(); };
    var gesture = function(t) {
      var s = qSentence(clean(t.note || '').replace(/^⚠️?\s*/, '')), k = s.indexOf('→');
      if (k < 15) return null;
      var m = s.slice(0, k).replace(/[\s,;:]+$/, '').trim();
      // flèche hors parenthèses ; pas une description d'échelle (« Niveaux I à V… », « 6 items… »)
      if ((m.match(/\(/g) || []).length !== (m.match(/\)/g) || []).length || /^(?:niveaux?|score|echelle|questionnaire|items?|\d)/.test(qNorm(m))) return null;
      return m.length >= 15 && m.length <= 150 && RX_TECH.test(qNorm(m)) ? m : null;
    };
    var share = function(a, b) { var n = 0; a.forEach(function(k) { if (b.has(k)) n++; }); return n / Math.max(1, Math.min(a.size, b.size)); };
    var ALL = [];
    F.forEach(function(x) {
      tests(x).forEach(function(t) {
        var m = gesture(t); if (!m) return;
        var n = shortName(t.nom); if (n.length < 3 || /^(?:palpation|mesure|inspection|observation)/.test(qNorm(n))) return;
        ALL.push({ f: x, n: n, m: m, ns: qStems(t.nom), ms: qStems(m) });
      });
    });
    F.forEach(function(f) {
      // Le geste ne doit contenir aucun mot du nom du test (sinon la réponse se lit dans la question)
      var mine = ALL.filter(function(a) { return a.f === f && !qOverlap(a.m, a.ns); });
      if (!mine.length) return;
      var a = pick(mine);
      var ok = function(b) { return b !== a && b.n !== a.n && !qOverlap(b.n, a.ns) && !qOverlap(a.n, b.ns) && !qOverlap(b.n, a.ms) && share(a.ms, b.ms) < 0.4; };
      var pool = ALL.filter(function(b) { return b.f === f && ok(b); }).map(function(b) { return b.n; });
      var fb = ALL.filter(function(b) { return b.f !== f && qNear(f, b.f) && ok(b); }).map(function(b) { return b.n; });
      add('Manœuvre → test', f, 'Quel test correspond à cette manœuvre (bilan de : ' + f.nom + ') ?\n\n« ' + a.m + ' »', a.n, pool, fb);
    });
  });

  // ── R : Outil d'évaluation (ce que mesure un score du bilan) ──
  safe("Outil d'évaluation", function() {
    var RX_BLOC = /echelle|score|outil|questionnaire/;
    var RX_VAGUE = /^(?:reference|score (?:specifique|de reference)|outil de reference|se |sp |tres specifique|tres sensible|indique|voir|cf\b|surtout|si |en cas)/;
    var tools = [];
    F.forEach(function(x) {
      ((x.onglets.bilan && x.onglets.bilan.blocs) || []).forEach(function(b) {
        if (!RX_BLOC.test(qNorm(b.titre))) return;
        b.items.forEach(function(i) {
          var m = i.match(/^\*\*([^*]{2,45})\*\*\s*(?:\([^)]{0,90}\))?\s*:\s*(.{8,})$/);
          if (!m) return;
          var name = m[1].trim(), desc = qCut(qSentence(clean(m[2])).replace(/\*\*/g, ''), 90).replace(/[\s.]+$/, '');
          if (desc.length < 10 || RX_SESP.test(desc) || RX_VAGUE.test(qNorm(desc)) || /^(?:\d|examen de reference)/.test(qNorm(desc)) || qOverlap(desc, qStems(name)) || qGenericScale(name)) return;
          if (/\b(?:irm|radio|radiographie|scanner|echo|echographie|imagerie|enmg|emg|biolog|eva|en)\b|numerique/.test(qNorm(name))) return;
          tools.push({ f: x, name: name, desc: desc });
        });
      });
    });
    F.forEach(function(f) {
      var mine = tools.filter(function(t) { return t.f === f; });
      if (!mine.length) return;
      var t = pick(mine), ds = qStems(t.desc);
      // Outils interchangeables (même construit) : jamais l'un comme distracteur de l'autre
      var GROUPS = [/ashworth|tardieu/, /oswestry|\bodi\b|quebec|eifel|roland/, /dash|constant|spadi|wosi|woos|\bases\b|\bsst\b|simple shoulder|oxford shoulder/, /kujala|akps|koos|womac|lysholm|ikdc|visa|oxford knee/, /tsk|tampa|fabq|\bpcs\b|catastroph|acl-rsi/, /6mwt|6 ?min|\btug\b|timed up|t25fw|10 ?m|30 ?s|chair|lever de chaise|40 ?m|stair|escalier/, /hoehn|updrs/, /barthel|\bmif\b/, /gmfm|gmfcs/, /ihot|hagos|hoos|harris|oxford hip/, /koos|hoos|womac/, /oxford|\boks\b|\bohs\b|\boss\b/];
      var grp = GROUPS.filter(function(g) { return g.test(qNorm(t.name)); });
      var ownTxt = qNorm(JSON.stringify([f.onglets.bilan || {}, f.onglets.tests || {}, f.onglets.has || {}]));
      var keep = function(u) { return u.f !== f && !qOverlap(u.desc, ds) && ownTxt.indexOf(qNorm(u.name)) < 0 && u.name !== t.name && !grp.some(function(g) { return g.test(qNorm(u.name)); }); };
      var pool = tools.filter(function(u) { return keep(u) && qNear(f, u.f); }).map(function(u) { return u.name; });
      var fb = tools.filter(function(u) { return keep(u) && !qNear(f, u.f); }).map(function(u) { return u.name; });
      add("Outil d'évaluation", f, 'Dans le bilan de : ' + f.nom + ', quel outil évalue : « ' + t.desc + ' » ?', t.name, pool, fb);
    });
  });

  return Q;
}
// Première phrase d'une note de test, sans pictogramme (coupée à une virgule si elle est très longue)
function fcNote(n) {
  var s = qSentence(clean(n).replace(/^⚠️?\s*/, ''));
  if (s.length <= 200) return s;
  var c = s.slice(0, 200), k = Math.max(c.lastIndexOf(', '), c.lastIndexOf(' ; '), c.lastIndexOf(' ('));
  return (k > 80 ? c.slice(0, k) : qCut(s, 200).replace(/…$/, '')).replace(/[\s,;:]+$/, '') + '…';
}
// Toutes les phrases d'une note (carte détaillée d'un test), sans pictogramme
function fcSentences(n) {
  var s = clean(n).replace(/^⚠️?\s*/, ''), out = [], guard = 0;
  while (s && guard++ < 20) {
    var p = qSentence(s);
    if (!p) break;
    out.push(clean(p.trim()));
    s = s.slice(p.length).replace(/^[\s.]+/, '');
  }
  return out.filter(Boolean);
}
// La note cite-t-elle déjà les valeurs Se / Sp du test ? (évite une ligne en double)
function fcCites(note, t) {
  var n = String(note || ''), c = n.replace(/\s/g, ''), v = function(x) { return String(x || '').replace(/[—–]/g, '').replace(/\s/g, ''); };
  var se = v(t.se), sp = v(t.sp);
  if (/\bSe\b[^.;]*\d/.test(n) && (!sp || /\bSp\b[^.;]*\d/.test(n))) return true;
  return (!se || c.indexOf(se) > -1) && (!sp || c.indexOf(sp) > -1);
}
// Se / Sp lisibles (« — » ou vide = pas de valeur)
function fcSeSp(t) {
  var v = [t.se && String(t.se).replace(/[—–-]/g, "").trim() ? "Se " + t.se : "", t.sp && String(t.sp).replace(/[—–-]/g, "").trim() ? "Sp " + t.sp : ""].filter(Boolean);
  return v.join(", ");
}
var FC_CATS = ['Définition', 'Drapeaux rouges', 'Drapeaux jaunes', 'Bilan', 'Tests cliniques', 'Diagnostics différentiels', 'Prise en charge', 'À éviter', 'Orientation', 'Chiffres clés', 'Pronostic'];
function buildFlashcards(fiches) {
  const C = [];
  fiches.forEach(f => {
    const O = f.onglets;
    const card = (cat, q, a, sub) => { a = a.filter(Boolean); if (a.length) C.push({ ficheId: f.id, fiche: f.nom, zone: f.zone, cat: cat, q: q, a: a, sub: sub || "" }); };
    // Définition : une carte par bloc (définition, mécanisme, facteurs de risque, classification…)
    (O.definition?.blocs || []).forEach(b => {
      if (b.items?.length && !/^À compléter/.test(b.items[0])) card("Définition", "Que faut-il retenir sur : " + f.nom + " ?", b.items.map(clean), b.titre);
    });
    if (O.flags?.red?.length && O.flags.red[0] !== "À compléter")
      card("Drapeaux rouges", "Quels sont les principaux drapeaux rouges de : " + f.nom + " ?", O.flags.red.map(clean));
    if (O.flags?.yellow?.length && O.flags.yellow[0] !== "À compléter")
      card("Drapeaux jaunes", "Quels drapeaux jaunes et points de vigilance pour : " + f.nom + " ?", O.flags.yellow.map(clean));
    // Bilan : une carte par bloc (interrogatoire, examen, scores…) ; les blocs « Tests » ont leurs propres cartes
    (O.bilan?.blocs || []).forEach(b => {
      if (b.items?.length && !/^À compléter/.test(b.items[0]) && !/^test(?:s|ing)\b/i.test(b.titre)) card("Bilan", "Que rechercher au bilan de : " + f.nom + " ?", b.items.map(clean), b.titre);
    });
    // Tests : la liste de la fiche (nom + Se/Sp), puis une carte détaillée par test
    const T = O.tests?.items || [];
    if (T.length) {
      card("Tests cliniques", "Quels tests cliniques pour : " + f.nom + " ?", T.map(t => { const v = fcSeSp(t); return t.nom + (v ? " (" + v + ")" : ""); }));
      T.forEach(t => {
        const v = fcSeSp(t), ph = fcSentences(t.note || "");
        if (ph.length || v) card("Tests cliniques", "À quoi sert et comment interpréter : " + t.nom + " ?", ph.concat(v && !fcCites(t.note, t) ? [v] : []));
      });
    }
    // Diagnostics différentiels : la liste, puis une carte « comment le reconnaître » par diagnostic
    const D = O.ddx?.items || [];
    if (D.length) {
      card("Diagnostics différentiels", "Cite les principaux diagnostics différentiels de : " + f.nom, D.map(d => d.dx + " — en faveur : " + clean(d.pour)));
      D.forEach(d => card("Diagnostics différentiels", "Comment reconnaître : " + d.dx + " ?", [clean(d.pour) ? "En faveur : " + clean(d.pour) : "", clean(d.contre) ? "Contre : " + clean(d.contre) : ""], "Diagnostic différentiel de : " + f.nom));
    }
    // Prise en charge : une carte par bloc (principes, modalités, phases…), le titre du bloc est rappelé sur la carte
    const B = (O.pec?.blocs || []).filter(b => b.items?.length && b.items[0] !== "Principes EBP, modalités, à éviter.");
    B.filter(b => !RX_Q_AVOID_BLOC.test(qNorm(b.titre))).slice(0, 5).forEach(b =>
      card("Prise en charge", "Quels sont les points clés de la prise en charge de : " + f.nom + " ?", b.items.map(clean), b.titre));
    const av = B.find(b => RX_Q_AVOID_BLOC.test(qNorm(b.titre)));
    if (av) card("À éviter", "Qu'est-ce qui est à éviter (ou à ne pas faire) dans la prise en charge de : " + f.nom + " ?", av.items.filter(i => !/\bstop\b|appel(?:er)? (?:le )?15|samu/.test(qNorm(i))).map(clean), av.titre);
    if (O.orientation?.items?.length && !O.orientation.items[0].startsWith("À compléter"))
      card("Orientation", "Quels sont les critères d'orientation médicale pour : " + f.nom + " ?", O.orientation.items.map(clean));
    const st = (f.stats || []).filter(s => s.val && s.lbl);
    // Valeur réduite à un pictogramme (« 🚫 ») : on garde seulement le repère
    if (st.length) card("Chiffres clés", "Quels sont les chiffres et repères clés de : " + f.nom + " ?", st.map(s => /[0-9A-Za-zÀ-ÿ]/.test(s.val) ? s.val + " — " + clean(s.lbl) : clean(s.lbl).charAt(0).toUpperCase() + clean(s.lbl).slice(1)));
    const pr = (O.pronostic?.blocs || []).reduce((a, b) => a.concat(b.items || []), []).map(clean).filter(x => x && !/^À compléter/.test(x));
    if (pr.length) card("Pronostic", "Quel est le pronostic (évolution, délais) de : " + f.nom + " ?", pr.slice(0, 8));
  });
  return C;
}
// Cartes retenues par les filtres (zone + type de carte)
function flashPool() {
  let pool = allCards().slice();
  const z = state.flashZone || "Toutes", c = state.flashCat || "Toutes";
  if (z !== "Toutes") pool = pool.filter(x => ficheInZone(ALL_FICHES.find(f => f.id === x.ficheId), z));
  if (c !== "Toutes") pool = pool.filter(x => x.cat === c);
  return pool;
}

