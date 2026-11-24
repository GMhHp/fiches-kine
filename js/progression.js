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

// Installation : l'invite du navigateur (Chrome, Edge, Samsung Internet) est gardée pour un bouton « Installer »
var INSTALL_VIEWS = ['prog', 'install', 'today'];
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installPromptEvt = e; if (INSTALL_VIEWS.indexOf(state.view) > -1) render(); });
window.addEventListener('appinstalled', function () { installPromptEvt = null; toast('✓ App installée.'); if (INSTALL_VIEWS.indexOf(state.view) > -1) render(); });
function doInstall() {
  if (!installPromptEvt) return;
  var evt = installPromptEvt; installPromptEvt = null;
  evt.prompt();
  Promise.resolve(evt.userChoice).then(function () { render(); }, function () { render(); });
}
function isOnline() { return /^https?:$/.test(location.protocol); }
// Safari sur Mac : l'app web n'y partage pas non plus ses données avec le navigateur
function isMacSafari() { var ua = navigator.userAgent || ''; return !isIOS() && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\/|OPR\/|Firefox/.test(ua); }
function installHTML() {
  if (!isOnline()) return '<p class="prog-note">📁 L\'app est ouverte comme fichier local : l\'installation et le mode hors ligne fonctionneront une fois l\'app en ligne (GitHub Pages).</p>';
  if (isStandalone()) return '<p class="prog-ok">✓ App installée sur cet appareil' + (navigator.serviceWorker && navigator.serviceWorker.controller ? ' — utilisable hors ligne.' : '.') + '</p>' +
    '<div class="prog-actions" style="margin-top:12px"><button class="chip" ' + act('setView', 'install') + '>Voir le tuto</button><button class="chip" ' + act('shareInstallLink') + '>🔗 Partager le tuto</button></div>';
  return '<p class="prog-txt">Une icône sur ton écran d\'accueil, l\'app en plein écran et utilisable hors ligne.</p>' +
    '<div class="prog-actions">' + (installPromptEvt ? '<button class="btn-primary" ' + act('doInstall') + '>📲 Installer l\'app</button>' : '') +
    '<button class="' + (installPromptEvt ? 'chip' : 'btn-primary') + '" ' + act('setView', 'install') + '>Voir le tuto pas à pas</button></div>' +
    (isIOS() || isMacSafari() ? '<p class="prog-note">⚠️ L\'app installée a sa propre mémoire, séparée du navigateur : <strong>exporte ta progression ici avant d\'installer</strong>, puis restaure-la dans l\'app.</p>' : '');
}

// ════════════════════════════════════════════════════════════
//  TUTO « INSTALLER L'APP SUR L'ÉCRAN D'ACCUEIL » (#/installer)
// ════════════════════════════════════════════════════════════
// Étapes vérifiées le 24/11/2026 : Apple (iPhone iOS 26, Mac), Google (Chrome), Microsoft (Edge)
var INSTALL_TIP_KEY = 'fiches_kine_tuto_ferme';   // hors sauvegarde (pas de préfixe kine_)
var INST_ICO = {
  share: '<path d="M12 3v11.5"/><path d="m8 7 4-4 4 4"/><path d="M8.5 10H7a2.5 2.5 0 0 0-2.5 2.5v6A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 17 10h-1.5"/>',
  more: '<circle cx="12" cy="12" r="9.5"/><circle cx="7.6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.4" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  dotsV: '<circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.8" fill="currentColor" stroke="none"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  add: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  install: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8.5 20h7"/><path d="M12 7v5.5"/><path d="m9.5 10 2.5 2.5 2.5-2.5"/>'
};
// Bouton à toucher, dessiné comme dans le navigateur (icône + libellé ; icône seule : nom lu par les lecteurs d'écran)
function instKey(ico, label, sr) {
  return '<span class="inst-key' + (label ? '' : ' inst-key-i') + '">' + (ico ? '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + INST_ICO[ico] + '</svg>' : '') +
    (label ? '<span>' + label + '</span>' : '<span class="sr-only">' + (sr || '') + '</span>') + '</span>';
}
var INST_GUIDE = {
  ios: { ico: '📱', label: 'iPhone / iPad', brs: [
    { k: 'safari', label: 'Safari', steps: [
      ['Dans Safari, touche ' + instKey('more', '', 'Plus') + ' à droite de la barre d\'adresse, puis ' + instKey('share', 'Partager') + '.',
        'Si le bouton ' + instKey('share', '', 'Partager') + ' est déjà visible dans la barre d\'outils, touche-le directement.'],
      ['Fais défiler la liste et touche ' + instKey('add', 'Sur l\'écran d\'accueil') + '.',
        'Pas dans la liste ? Tout en bas, touche « Modifier les actions » et ajoute-le.'],
      ['Laisse activée l\'option qui l\'ouvre comme une <strong>app web</strong>, puis touche ' + instKey('', 'Ajouter') + '.',
        'Avant iOS 26, il n\'y a pas d\'option : touche simplement « Ajouter ».'],
      ['L\'icône <strong>Fiches Kiné</strong> est sur ton écran d\'accueil : ouvre l\'app depuis là.']
    ]},
    { k: 'autre', label: 'Chrome, Edge, Firefox…', steps: [
      ['Touche ' + instKey('share', 'Partager') + ', dans la barre d\'adresse ou dans le menu du navigateur.'],
      ['Touche ' + instKey('add', 'Sur l\'écran d\'accueil') + ', puis ' + instKey('', 'Ajouter') + '.',
        'Possible depuis iOS 16.4. Si l\'option n\'apparaît pas, ouvre cette page dans Safari.'],
      ['L\'icône <strong>Fiches Kiné</strong> est sur ton écran d\'accueil : ouvre l\'app depuis là.']
    ]}
  ]},
  android: { ico: '🤖', label: 'Android', brs: [
    { k: 'chrome', label: 'Chrome', steps: [
      ['Touche le menu ' + instKey('dotsV', '', 'Plus') + ' en haut à droite.'],
      ['Touche ' + instKey('add', 'Ajouter à l\'écran d\'accueil') + '.',
        'Si le menu propose directement « Installer l\'appli », c\'est la même chose.'],
      ['Choisis ' + instKey('', 'Installer') + ', puis confirme.',
        'Chrome peut aussi te le proposer de lui-même en bas de l\'écran : accepte.'],
      ['L\'icône <strong>Fiches Kiné</strong> arrive sur l\'écran d\'accueil et dans la liste des applis.']
    ]},
    { k: 'samsung', label: 'Samsung Internet', steps: [
      ['Si une icône d\'installation apparaît dans la barre d\'adresse, touche-la et passe à l\'étape 3.'],
      ['Sinon, touche ' + instKey('menu', '', 'Menu') + ' en bas à droite → ' + instKey('', 'Ajouter la page à') + ' → ' + instKey('', 'Écran d\'accueil') + '.'],
      ['Touche ' + instKey('', 'Ajouter') + ' : l\'icône <strong>Fiches Kiné</strong> arrive sur l\'écran d\'accueil.']
    ]}
  ]},
  desktop: { ico: '💻', label: 'Ordinateur', brs: [
    { k: 'chrome', label: 'Chrome ou Edge', steps: [
      ['Clique sur l\'icône ' + instKey('install', '', 'Installer') + ' à droite de la barre d\'adresse, puis sur ' + instKey('', 'Installer') + '.'],
      ['Pas d\'icône ? <strong>Chrome</strong> : menu ⋮ → « Caster, enregistrer et partager » → « Installer… ».',
        '<strong>Edge</strong> : menu « … » → « Autres outils » → « Apps » → « Installer ce site en tant qu\'application ».'],
      ['L\'app s\'ouvre dans sa propre fenêtre et se range avec tes autres applications.']
    ]},
    { k: 'mac', label: 'Safari (Mac)', steps: [
      ['Dans Safari, menu <strong>Fichier</strong> → ' + instKey('', 'Ajouter au Dock') + '.',
        'Ou bouton ' + instKey('share', '', 'Partager') + ' → « Ajouter au Dock ». Il faut macOS Sonoma 14 ou plus récent.'],
      ['Garde le nom <strong>Fiches Kiné</strong> et clique sur ' + instKey('', 'Ajouter') + '.'],
      ['L\'app arrive dans le Dock et dans le dossier Applications de ton dossier personnel.']
    ]}
  ]}
};
// Appareil et navigateur détectés : présélectionnés dans le tuto
function instDetect() {
  var ua = navigator.userAgent || '';
  if (isIOS()) return { dev: 'ios', br: /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? 'autre' : 'safari' };
  if (/Android/i.test(ua)) return { dev: 'android', br: /SamsungBrowser/i.test(ua) ? 'samsung' : 'chrome' };
  return { dev: 'desktop', br: isMacSafari() ? 'mac' : 'chrome' };
}
// Navigateur intégré d'une autre app (lien ouvert depuis Instagram, Messenger…) : pas d'installation possible
function instInApp() { return /FBAN|FBAV|FB_IAB|Instagram|Snapchat|LinkedInApp|musical_ly|TikTok|BytedanceWebview|Line\//i.test(navigator.userAgent || ''); }

function renderInstall(app) {
  var det = instDetect(), inst = isStandalone(), online = isOnline();
  var dev = INST_GUIDE[state.instDev] ? state.instDev : det.dev, G = INST_GUIDE[dev];
  var B = G.brs.find(function (b) { return b.k === state.instBr; }) || G.brs.find(function (b) { return dev === det.dev && b.k === det.br; }) || G.brs[0];
  var h = '<div class="inst"><div class="topbar"><div class="eyebrow">Tuto</div>' +
    '<h1 class="h1" tabindex="-1">Installer l\'app sur ton écran d\'accueil</h1>' +
    '<p class="sub">Une icône comme une vraie appli, l\'app en plein écran, et tout fonctionne même sans réseau. Ça prend 30 secondes.</p></div>';
  if (!online) h += '<p class="prog-note inst-gap">📁 L\'app est ouverte comme fichier local : l\'installation fonctionnera une fois l\'app en ligne (GitHub Pages).</p>';
  else if (inst) h += '<p class="inst-ok">✓ C\'est fait : tu es dans l\'app installée.</p>';
  else {
    if (instInApp()) h += '<div class="inst-warn inst-gap"><strong>Tu es dans le navigateur d\'une autre app</strong> (Instagram, Messenger, Snapchat…) : l\'installation n\'y est pas possible. Ouvre d\'abord cette page dans Safari ou Chrome, avec l\'option prévue dans le menu de l\'app.</div>';
    if (installPromptEvt) h += '<div class="inst-now"><button class="btn-primary btn-big" ' + act('doInstall') + '>📲 Installer maintenant</button><p class="inst-now-s">Ton navigateur sait le faire en un geste. Sinon, suis les étapes.</p></div>';
  }
  h += '<section class="quiz-config inst-card" aria-labelledby="instStepsT"><h2 class="cfg-label" id="instStepsT">' + (inst ? 'Pour aider quelqu\'un, choisis son appareil' : 'Les étapes') + '</h2>' +
    '<div class="inst-devs" role="group" aria-label="Appareil">' + Object.keys(INST_GUIDE).map(function (k) {
      var on = k === dev;
      return '<button type="button" class="inst-dev' + (on ? ' on' : '') + '" data-dev="' + k + '" aria-pressed="' + on + '" ' + act('setInstallDev', k) + '>' +
        '<span class="inst-dev-i" aria-hidden="true">' + INST_GUIDE[k].ico + '</span><span>' + INST_GUIDE[k].label + '</span>' +
        (k === det.dev && online ? '<span class="inst-you">ton appareil</span>' : '') + '</button>';
    }).join('') + '</div>' +
    '<div class="inst-brs" role="group" aria-label="Navigateur">' + G.brs.map(function (b) {
      var on = b.k === B.k;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-br="' + b.k + '" aria-pressed="' + on + '" ' + act('setInstallBr', b.k) + '>' + b.label + '</button>';
    }).join('') + '</div>' +
    '<ol class="inst-steps">' + B.steps.map(function (s, i) {
      return '<li><span class="inst-n">' + (i + 1) + '</span><div class="inst-s"><p class="inst-t">' + s[0] + '</p>' + (s[1] ? '<p class="inst-d">' + s[1] + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>';
  if (!inst && (dev === 'ios' || B.k === 'mac')) h += '<div class="inst-warn"><strong>Ta progression ne suit pas toute seule.</strong> ' +
    (dev === 'ios' ? 'Sur iPhone et iPad' : 'Sur Mac avec Safari') + ', l\'app installée a sa propre mémoire, séparée du navigateur. Exporte ta progression avant d\'installer, puis restaure-la dans l\'app (Progression → Restaurer).' +
    '<div class="prog-actions"><button class="chip" ' + act('exportProgress') + '>💾 Exporter ma progression</button></div></div>';
  h += '</section>';
  h += '<section class="quiz-config inst-card" aria-labelledby="instAfterT"><h2 class="cfg-label" id="instAfterT">Après l\'installation</h2><ul class="inst-after">' +
    '<li>Ouvre toujours l\'app depuis son icône.</li>' +
    '<li>Ouvre-la une première fois avec du réseau : ensuite, elle marche même en mode avion.</li>' +
    '<li>Mise à jour : quand « Nouvelle version disponible » s\'affiche, touche « Recharger ».</li>' +
    '<li>Ta progression reste sur l\'appareil : exporte-la de temps en temps (Progression → Sauvegarder).</li></ul></section>';
  if (online) h += '<div class="inst-share"><button class="chip" ' + act('shareInstallLink') + '>🔗 Partager ce tuto</button></div>';
  app.innerHTML = instFr(h + '</div>');
}
// Typographie française : espaces insécables avant « : ; ? ! » et à l'intérieur des guillemets (jamais dans les balises)
function instFr(s) {
  return s.split(/(<[^>]+>)/).map(function (p) { return p.charAt(0) === '<' ? p : p.replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»').replace(/ ([:;?!])/g, '\u00a0$1'); }).join('');
}
// Changer d'appareil ou de navigateur : même position à l'écran, le focus reste sur le bouton choisi
function setInstallDev(k) { state.instDev = k; state.instBr = null; reInstall('[data-dev="' + k + '"]'); }
function setInstallBr(k) { state.instBr = k; reInstall('[data-br="' + k + '"]'); }
function reInstall(sel) {
  var y = window.scrollY;
  renderInstall(appEl());
  window.scrollTo(0, y);
  var b = document.querySelector(sel); if (b) b.focus({ preventScroll: true });
}
// Lien direct vers le tuto, à envoyer à quelqu'un
function shareInstallLink() {
  var url = location.origin + location.pathname + '#/installer';
  var copy = function () {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('✓ Lien du tuto copié.'); }, function () { toast(url); });
    else toast(url);
  };
  if (navigator.share && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    navigator.share({ title: 'Fiches Kiné', text: 'Installe Fiches Kiné sur ton écran d\'accueil :', url: url }).catch(function (e) { if (!e || e.name !== 'AbortError') copy(); });
    return;
  }
  copy();
}
// Aujourd'hui : petite suggestion (téléphone ou tablette, dans le navigateur), masquable
function installTodayHTML() {
  if (!isOnline() || isStandalone() || lsGet(INSTALL_TIP_KEY, null) === '1') return '';
  if (!(isIOS() || /Android/i.test(navigator.userAgent || ''))) return '';
  return '<div class="inst-tip"><button type="button" class="inst-tip-main" ' + act('setView', 'install') + '>' +
    '<span class="inst-tip-ico" aria-hidden="true">📲</span><span class="inst-tip-txt"><span class="inst-tip-t">Installe l\'app sur ton écran d\'accueil</span>' +
    '<span class="inst-tip-s">Plein écran, hors ligne · tuto en 30 s</span></span></button>' +
    '<button type="button" class="inst-tip-x" ' + act('hideInstallTip') + ' aria-label="Ne plus afficher cette suggestion">✕</button></div>';
}
function hideInstallTip() {
  lsSet(INSTALL_TIP_KEY, '1'); render();
  toast('Le tuto reste dans Progression → Installer l\'app.');
  var b = document.querySelector('.pdj-card'); if (b) b.focus({ preventScroll: true });
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

