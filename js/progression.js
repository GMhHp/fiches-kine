/* Fiches Kiné — progression, sauvegarde, installation, démarrage */
// ════════════════════════════════════════════════════════════
//  PROGRESSION · SAUVEGARDE · INSTALLATION (app hors ligne)
// ════════════════════════════════════════════════════════════
var APP_VERSION = (document.querySelector('meta[name="app-version"]') || {}).content || '';
var installPromptEvt = null;

function isStandalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function syncThemeColor() { var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', document.body.classList.contains('dark') ? '#1a1815' : '#f4f1ea'); }

var _toastTimer = null;
function toast(text, kind) {
  var t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  t.className = 'toast ' + (kind || 'ok');
  t.textContent = text;
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { t.classList.remove('show'); }, kind === 'err' ? 6500 : 4500);
}

// Sauvegarde : toutes les données kine_* (sauf la préférence d'affichage)
function backupData() {
  var data = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf('kine_') !== 0 || k === 'kine_dark') continue;
      var v = localStorage.getItem(k);
      try { data[k] = JSON.parse(v); } catch (e) { data[k] = v; }
    }
  } catch (e) {}
  data.kine_favs = Array.from(state.favs);
  data.kine_mastered = Array.from(state.mastered);
  var best = STORE.bestScore;
  if (best) data.kine_best = best; else delete data.kine_best;
  return { app: 'fiches-kine', format: 1, version: APP_VERSION, date: new Date().toISOString(), data: data };
}
function backupFileName() { return 'fiches-kine-progression-' + new Date().toISOString().slice(0, 10) + '.json'; }

function exportProgress() {
  var json = JSON.stringify(backupData(), null, 1);
  var name = backupFileName();
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  try {
    var file = new File([json], name, { type: 'application/json' });
    if (coarse && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Sauvegarde Fiches Kiné' })
        .then(function () { toast('✓ Sauvegarde prête — choisis « Enregistrer dans Fichiers » pour la garder.'); })
        .catch(function (e) { if (!e || e.name !== 'AbortError') downloadBackup(json, name); });
      return;
    }
  } catch (e) {}
  downloadBackup(json, name);
}
function downloadBackup(json, name) {
  try {
    var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    toast('✓ Fichier « ' + name + ' » enregistré. Si rien ne s\'est passé, utilise « Copier le code ».');
  } catch (e) { toast('Export impossible ici : utilise « Copier le code ».', 'err'); }
}
function copyBackupCode() {
  var code = JSON.stringify(backupData());
  var ok = function () { toast('✓ Code copié — colle-le dans « Restaurer » sur l\'autre appareil, ou garde-le dans tes notes.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, function () { showCodeBox(code); });
  else showCodeBox(code);
}
function showCodeBox(code) {
  var box = document.getElementById('codeBox');
  if (!box) return;
  box.innerHTML = '<textarea class="prog-code" id="codeOut" readonly></textarea><p class="prog-txt">Sélectionne tout le code et copie-le.</p>';
  var ta = document.getElementById('codeOut'); ta.value = code; ta.focus(); ta.select();
}

// Restauration : fusion avec ce qui existe déjà, rien n'est effacé
function importProgressFile(inp) {
  var f = inp.files && inp.files[0];
  if (!f) return;
  inp.value = '';
  if (f.size > 1000000) { toast('Fichier trop volumineux : ce n\'est pas une sauvegarde Fiches Kiné.', 'err'); return; }
  var r = new FileReader();
  r.onload = function () { applyBackupText(String(r.result || '')); };
  r.onerror = function () { toast('Lecture du fichier impossible.', 'err'); };
  r.readAsText(f);
}
function togglePasteBox() {
  var b = document.getElementById('pasteBox'); if (!b) return;
  b.hidden = !b.hidden;
  if (!b.hidden) document.getElementById('pasteCode').focus();
}
function applyBackupText(txt) {
  txt = String(txt || '').trim();
  var a = txt.indexOf('{'), z = txt.lastIndexOf('}'), obj = null;
  if (a > -1 && z > a) { try { obj = JSON.parse(txt.slice(a, z + 1)); } catch (e) { obj = null; } }
  if (!obj || obj.app !== 'fiches-kine' || !obj.data || typeof obj.data !== 'object') { toast('Ce n\'est pas une sauvegarde Fiches Kiné valide.', 'err'); return; }
  var res = mergeBackup(obj.data);
  render();
  var parts = [];
  if (res.mastered) parts.push('+' + res.mastered + ' fiche' + (res.mastered > 1 ? 's' : '') + ' maîtrisée' + (res.mastered > 1 ? 's' : ''));
  if (res.favs) parts.push('+' + res.favs + ' favori' + (res.favs > 1 ? 's' : ''));
  if (res.best) parts.push('meilleur score mis à jour');
  toast(parts.length ? '✓ Progression restaurée : ' + parts.join(', ') + '.' : '✓ Sauvegarde lue : tout était déjà à jour sur cet appareil.');
}
function mergeBackup(d) {
  var known = {}; ALL_FICHES.forEach(function (f) { known[f.id] = true; });
  var ids = function (v) {
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return []; } }
    return Array.isArray(v) ? v.filter(function (id) { return typeof id === 'string' && known[id]; }) : [];
  };
  var res = { favs: 0, mastered: 0, best: false };
  var favs = new Set(state.favs), mast = new Set(state.mastered);
  ids(d.kine_favs).forEach(function (id) { if (!favs.has(id)) { favs.add(id); res.favs++; } });
  ids(d.kine_mastered).forEach(function (id) { if (!mast.has(id)) { mast.add(id); res.mastered++; } });
  state.favs = favs; STORE.favs = favs;
  state.mastered = mast; STORE.mastered = mast;
  var b = d.kine_best;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (b && typeof b.pct === 'number' && typeof b.score === 'number' && typeof b.total === 'number' && b.pct >= 0 && b.pct <= 100) {
    var cur = STORE.bestScore;
    if (!cur || b.pct > cur.pct) { STORE.bestScore = { pct: b.pct, score: b.score, total: b.total }; res.best = true; }
  }
  // Données ajoutées par de futures versions : copiées seulement si absentes ici
  Object.keys(d).forEach(function (k) {
    if (!/^kine_[a-z0-9_]+$/.test(k) || ['kine_favs', 'kine_mastered', 'kine_best', 'kine_dark'].indexOf(k) > -1) return;
    if (lsGet(k, null) === null) lsSet(k, typeof d[k] === 'string' ? d[k] : JSON.stringify(d[k]));
  });
  return res;
}

// Installation
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installPromptEvt = e; if (state.view === 'prog') render(); });
window.addEventListener('appinstalled', function () { installPromptEvt = null; toast('✓ App installée.'); if (state.view === 'prog') render(); });
function doInstall() {
  if (!installPromptEvt) return;
  var evt = installPromptEvt; installPromptEvt = null;
  evt.prompt();
  Promise.resolve(evt.userChoice).then(function () { render(); }, function () { render(); });
}
function installHTML() {
  if (!/^https?:$/.test(location.protocol)) return '<p class="prog-note">📁 L\'app est ouverte comme fichier local : l\'installation et le mode hors ligne fonctionneront une fois l\'app en ligne (GitHub Pages).</p>';
  if (isStandalone()) return '<p class="prog-ok">✓ App installée sur cet appareil' + (navigator.serviceWorker && navigator.serviceWorker.controller ? ' — utilisable hors ligne.' : '.') + '</p>';
  var h = '';
  if (installPromptEvt) h += '<div class="prog-actions" style="margin-bottom:14px"><button class="btn-primary" ' + act('doInstall') + '>📲 Installer l\'app</button></div>';
  h += '<ul class="prog-steps">' +
    '<li><strong>iPhone</strong> : dans Safari, bouton Partager (dans le menu « ⋯ » sur les iOS récents) → « Sur l\'écran d\'accueil ».</li>' +
    '<li><strong>Android</strong> : menu ⋮ de Chrome → « Installer l\'application ».</li>' +
    '<li><strong>Ordinateur</strong> : icône d\'installation dans la barre d\'adresse (Chrome, Edge).</li></ul>' +
    '<p class="prog-note">⚠️ Sur iPhone, l\'app installée a sa propre mémoire, séparée de Safari : <strong>exporte ta progression ici avant d\'installer</strong>, puis restaure-la dans l\'app.</p>';
  return h;
}
function offlineStatus() {
  if (!/^https?:$/.test(location.protocol)) return '';
  if (!('serviceWorker' in navigator)) return ' · hors ligne non pris en charge par ce navigateur';
  return navigator.serviceWorker.controller ? ' · ✓ disponible hors ligne' : ' · mode hors ligne en préparation…';
}

function renderProg(app) {
  var nF = ALL_FICHES.length;
  var nM = ALL_FICHES.filter(function (f) { return state.mastered.has(f.id); }).length;
  var nFav = ALL_FICHES.filter(function (f) { return state.favs.has(f.id); }).length;
  var best = STORE.bestScore;
  var v = APP_VERSION.slice(0, 10).split('-').reverse().join('/');
  app.innerHTML = '<div class="quiz-home">' +
    '<div class="mode-intro"><div class="mode-icon" style="background:var(--green-bg);color:var(--green)">📈</div>' +
    '<h2 class="mode-title">Ma progression</h2>' +
    '<p class="mode-sub">Tes fiches maîtrisées, tes favoris et ton meilleur score sont enregistrés sur cet appareil. Sauvegarde-les pour ne rien perdre si tu changes de téléphone ou de navigateur.</p></div>' +
    '<div class="stats prog-stats">' +
      '<div class="stat"><div class="stat-val">' + nM + '<small>/' + nF + '</small></div><div class="stat-lbl">fiches maîtrisées</div></div>' +
      '<div class="stat"><div class="stat-val">' + nFav + '</div><div class="stat-lbl">favoris</div></div>' +
      '<div class="stat"><div class="stat-val">' + (best ? best.pct + '%' : '—') + '</div><div class="stat-lbl">meilleur score au quiz</div></div>' +
    '</div>' +
    learnStatsHTML() +
    '<div class="quiz-config prog-card"><label class="cfg-label">💾 Sauvegarder</label>' +
      '<p class="prog-txt">Crée une copie de ta progression à garder dans Fichiers, tes notes ou un mail.</p>' +
      '<div class="prog-actions"><button class="btn-primary" ' + act('exportProgress') + '>Exporter un fichier</button>' +
      '<button class="chip" ' + act('copyBackupCode') + '>Copier le code</button></div><div id="codeBox"></div></div>' +
    '<div class="quiz-config prog-card"><label class="cfg-label">📂 Restaurer</label>' +
      '<p class="prog-txt">Ajoute une sauvegarde à ce qui est déjà sur cet appareil : rien n\'est effacé.</p>' +
      '<div class="prog-actions"><button class="btn-primary" ' + act('pickImportFile') + '>Importer un fichier</button>' +
      '<button class="chip" ' + act('togglePasteBox') + '>Coller un code</button></div>' +
      '<input type="file" id="importFile" class="sr-file" accept=".json,application/json,text/plain" data-change="importProgressFile" tabindex="-1" aria-hidden="true">' +
      '<div id="pasteBox" hidden><textarea id="pasteCode" class="prog-code" placeholder="Colle ici le code copié depuis l\'autre appareil"></textarea>' +
      '<button class="btn-primary" ' + act('applyPasteCode') + '>Restaurer ce code</button></div></div>' +
    '<div class="quiz-config prog-card"><label class="cfg-label">📲 Installer l\'app</label>' + installHTML() + '</div>' +
    '<p class="prog-version">Version du ' + v + offlineStatus() + '</p>' +
  '</div>';
}

// Mode hors ligne : service worker (uniquement quand l'app est servie en ligne)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  // Une nouvelle version vient de s'installer (il y avait déjà une version active) : bandeau « Recharger »
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (hadController) showUpdateBar(); hadController = true; if (state.view === 'prog') render(); });
}
function showUpdateBar() {
  if (document.getElementById('updateBar')) return;
  var b = document.createElement('div');
  b.id = 'updateBar'; b.className = 'update-bar'; b.setAttribute('role', 'status');
  b.innerHTML = '<span>Nouvelle version disponible</span><button type="button" class="update-go">Recharger</button><button type="button" class="update-x" aria-label="Plus tard">✕</button>';
  b.querySelector('.update-go').addEventListener('click', function () { location.reload(); });
  b.querySelector('.update-x').addEventListener('click', function () { b.remove(); });
  document.body.appendChild(b);
  // Disparaît seul après 10 s : la nouvelle version s'appliquera de toute façon à la prochaine ouverture
  setTimeout(function () { b.remove(); }, 10000);
}
if (isStandalone() && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});

if (STORE.dark) { document.body.classList.add('dark'); document.getElementById('darkbtn').textContent = '☀'; }
syncDarkBtn();
// Index de recherche préparé en arrière-plan (première frappe instantanée)
setTimeout(function () { (window.requestIdleCallback || function (cb) { setTimeout(cb, 0); })(function () { sIndex(); }); }, 300);
// Clavier ouvert (mobile) : la barre du bas s'efface pour laisser la place
document.addEventListener('focusin', function (e) { if (e.target && e.target.matches && e.target.matches('input:not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea')) document.body.classList.add('kb-open'); });
document.addEventListener('focusout', function (e) { if (e.target && e.target.matches && e.target.matches('input, textarea')) document.body.classList.remove('kb-open'); });
syncThemeColor();
document.addEventListener('DOMContentLoaded', function(){ setTimeout(scrollActiveTab, 200); });
try {
  // Adresse au démarrage (#/fiches/lombalgie-commune…) : on rouvre cet écran
  if (location.hash.length > 2) applyRoute(); else render();
} catch(e) {
  document.getElementById('app').innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif;color:#b5482a"><p style="font-size:18px;font-weight:600">Erreur de chargement</p><p style="font-size:14px;margin-top:8px;color:#666">Détail : ' + e.message + '</p></div>';
}

