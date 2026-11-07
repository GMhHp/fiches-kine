/* Fiches Kiné — vues Fiches, détail, Quiz, Cartes, Cas */
// ════════════════════════════════════════════════════════════
//  RENDU PRINCIPAL
// ════════════════════════════════════════════════════════════
// Dessine l'écran courant puis met l'adresse (#/…) à jour pour le bouton retour
function render() { renderView(); syncRoute(); }
function renderView() {
  // Quiz, Cartes, Cas et Examen sont regroupés sous « S'entraîner » dans la barre
  var navOf = { quiz: 'train', flash: 'train', cas: 'train', train: 'train' };
  ["today", "fiches", "tests", "train", "prog"].forEach(v => { var el=document.getElementById("tab-"+v); if(el) { var on = (navOf[state.view] || state.view) === v; el.classList.toggle("on", on); if (on) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current"); } });
  const app = document.getElementById("app");
  if (state.view === "today") return renderToday(app);
  if (state.view === "train") return renderTrain(app);
  if (state.view === "quiz") return renderQuiz(app);
  if (state.view === "cas") return renderCas(app);
  if (state.view === "flash") return renderFlash(app);
  if (state.view === "prog") return renderProg(app);
  if (state.view === "tests" && !state.openId) return renderTests(app);
  if (state.openId) return renderDetail(app, ALL_FICHES.find(f => f.id === state.openId));
  return renderFichesList(app);
}

// ── VUE FICHES : liste ──

function getPathologieDuJour() {
  var today = new Date();
  var seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  var idx = seed % ALL_FICHES.length;
  return ALL_FICHES[idx];
}
function renderPathologieDuJour() {
  var f = getPathologieDuJour();
  var N = NIVEAUX[f.niveau];
  return '<div class="pdj-card" ' + act('openFiche', f.id) + ' style="--lvl-c:'+N.color+'">' +
    '<div class="pdj-label">✨ Pathologie du jour</div>' +
    '<div class="pdj-name">'+esc(f.nom)+'</div>' +
    '<div class="pdj-zone">'+esc(f.zone)+' · <span class="pdj-lvl"><i style="background:'+N.color+'"></i>'+N.label+'</span></div>' +
    '<div class="pdj-resume">'+esc(qCut(f.resume,120))+'</div>' +
    '</div>';
}

function renderFichesList(app) {
  app.innerHTML =
    '<div class="topbar"><div class="eyebrow">GUILBERT Max-Hugo · Kinésithérapie · EBP</div>' +
    '<h1 class="h1">Fiches cliniques <em>musculo-squelettiques</em></h1>' +
    '<p class="sub">Tes pathologies prioritaires classées par fréquence, avec définition, drapeaux, diagnostics différentiels, bilan, prise en charge EBP, pronostic et recommandations.</p></div>' +
    '<div class="controls"><div class="searchbox"><svg class="icon si" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
    '<input type="text" id="searchInput" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Rechercher dans les fiches" placeholder="Pathologie, test, signe, traitement…" value="' + esc(state.query) + '">' +
    '<button class="search-clear" type="button" aria-label="Effacer la recherche" ' + act('clearSearch') + '' + (state.query ? '' : ' hidden') + '>✕</button>' +
    '</div><div class="filter-row" id="filterRow"></div></div><div id="fichesBody"></div>';
  const fr = document.getElementById("filterRow");
  fr.innerHTML =
    '<button class="chip chip-fav' + (state.favsOnly ? ' on' : '') + '" ' + act('toggleFavsOnly') + '>★ Favoris' + (state.favs.size ? ' (' + state.favs.size + ')' : '') + '</button><div class="filter-sep"></div>' +
    ZONES.filter(z => z === "Toutes" || ALL_FICHES.some(f => f.zone === z)).map(z => '<button class="chip' + (state.zone === z ? ' on' : '') + '" ' + act('setZone', z) + '>' + esc(z) + '</button>').join("");
  const si = document.getElementById("searchInput");
  si.addEventListener("input", e => setQuery(e.target.value));
  si.addEventListener("keydown", e => { if (e.key === "Enter") si.blur(); });
  renderFichesBody();
}

function renderFichesBody() {
  var body = document.getElementById('fichesBody');
  if (!body) return;
  var q = state.query.trim();
  var toks = sTokens(q);
  var pool = ALL_FICHES.filter(function(f) {
    if (state.favsOnly && !state.favs.has(f.id)) return false;
    return ficheInZone(f, state.zone);
  });
  var html = '';
  if (toks.length) {
    // Recherche : résultats classés par pertinence, avec l'extrait où le mot apparaît
    var full = [], part = [];
    pool.forEach(function(f) { var m = sMatch(f, toks); if (!m) return; if (m.n === toks.length) full.push({ f: f, m: m }); else if (toks.length >= 2 && m.n >= toks.length - 1) part.push({ f: f, m: m }); });
    var byScore = function(a, b) { return b.m.score - a.m.score; };
    full.sort(byScore); part.sort(byScore);
    var showPart = part.length && full.length < 8;
    html += '<div class="count" role="status"><span aria-hidden="true">🔍</span> ' + full.length + ' résultat' + (full.length > 1 ? 's' : '') + ' pour « ' + esc(q) + ' »' +
      (showPart ? '<span class="count-deep"> · ' + Math.min(part.length, 12) + ' partiel' + (part.length > 1 ? 's' : '') + '</span>' : '') +
      ((state.zone !== 'Toutes' || state.favsOnly) ? '<span class="count-deep"> · filtre actif</span>' : '') +
      ' <button class="chip" style="padding:3px 10px;margin-left:4px" ' + act('resetFilters') + '>✕ Réinitialiser</button></div>';
    if (!full.length && !showPart) {
      html += '<div class="empty"><p>Aucun résultat pour « ' + esc(q) + ' ».</p><p class="empty-tip">Essaie un autre mot (nom d\'un test, d\'un signe, d\'un traitement)' + ((state.zone !== 'Toutes' || state.favsOnly) ? ' ou retire le filtre' : '') + '.</p></div>';
    }
    if (full.length) html += '<div class="grid">' + full.map(function(r) { return cardHTML(r.f, toks, r.m); }).join('') + '</div>';
    if (showPart) {
      html += '<div class="zone-head"><span class="zone-name">Résultats partiels</span><span class="zone-count">un mot manquant</span><span class="lvl-line"></span></div>';
      html += '<div class="grid">' + part.slice(0, 12).map(function(r) { return cardHTML(r.f, toks, r.m); }).join('') + '</div>';
    }
  } else {
    var filtered = pool;
    html += renderPathologieDuJour();
    html += '<div class="count"><span aria-hidden="true">🔍</span> '+filtered.length+' pathologie'+(filtered.length>1?'s':'')+
      ((state.zone!=='Toutes'||state.favsOnly)?' <button class="chip" style="padding:3px 10px;margin-left:4px" ' + act('resetFilters') + '>✕ Réinitialiser</button>':'')+
      '</div>';
    if (filtered.length === 0) {
      html += '<div class="empty"><p>Aucune pathologie ne correspond.</p></div>';
    } else {
      // « Toutes » : une fiche à double casquette apparaît dans ses deux zones.
      // Zone précise : un seul groupe. Pédiatrie : regroupement par zone principale, sans doublon.
      var groups;
      if (state.zone === 'Toutes') {
        groups = ZONE_ORDER_DISPLAY.map(function(z){ return { zone: z, items: filtered.filter(function(f){ return f.zone === z || f.secondaryZone === z; }) }; });
      } else if (state.zone === 'Pédiatrie') {
        groups = ZONE_ORDER_DISPLAY.map(function(z){ return { zone: z, items: filtered.filter(function(f){ return f.zone === z; }) }; });
      } else {
        groups = [{ zone: state.zone, items: filtered }];
      }
      groups.filter(function(g){ return g.items.length; }).forEach(function(g) {
        var icon = ZONE_ICONS[g.zone]||'📌';
        html += '<div class="zone-head"><span class="zone-icon" aria-hidden="true">'+icon+'</span><span class="zone-name">'+esc(g.zone)+'</span><span class="zone-count">'+g.items.length+' fiche'+(g.items.length>1?'s':'')+'</span><span class="lvl-line"></span></div>';
        html += '<div class="grid">';
        g.items.forEach(function(f){ html += cardHTML(f, ''); });
        html += '</div>';
      });
    }
  }
  html += '<div class="foot-note">'+ALL_FICHES.length+' pathologies · '+ALL_FICHES.filter(function(f){return f.has.verified;}).length+' sourcées HAS · '+state.mastered.size+' maîtrisées</div>';
  body.innerHTML = html;
}

function cardHTML(f, hl, m) {
  const N = NIVEAUX[f.niveau];
  const fav = state.favs.has(f.id), mast = state.mastered.has(f.id);
  const hitTab = m && m.hit && m.hit.tab.charAt(0) !== '_' ? m.hit.tab : '';
  const open = hitTab ? act('openFicheAt', f.id, hitTab) : act('openFiche', f.id);
  const hasHl = Array.isArray(hl) ? hl.length > 0 : !!hl;
  return '<div class="pcard-wrap"><button class="pcard" style="--lvl-c:' + N.color + '" ' + open + '>' +
    '<div class="pcard-top"><div class="pcard-name">' + (hasHl ? rich(f.nom, hl) : esc(f.nom)) + '</div></div>' +
    '<div class="pcard-zone">' + esc(f.zone) + (f.secondaryZone ? ' · ' + esc(f.secondaryZone) : '') + (f.pediatrie && f.zone !== 'Pédiatrie' ? '<span class="ped-tag">🧒 Pédiatrie</span>' : '') + '</div>' +
    (hitTab
      ? '<div class="pcard-hit"><span class="pcard-hit-tab">' + esc(sTabLabel(hitTab)) + '</span> ' + sSnippet(m.hit.raw, hl) + '</div>'
      : '<div class="pcard-resume">' + rich(f.resume, hl) + '</div>') +
    '<div class="pcard-foot">' +
    (f.has.tier===1 ? '<span class="has-tag tier1">✓ HAS</span>' : f.has.tier===2 ? '<span class="has-tag tier2">📖 ' + esc(f.has.label.replace(/\s*\(.*?\)/g,'').replace(/HAS\s*/i,'').trim().slice(0,28)) + '</span>' : '<span class="has-tag tier3">' + esc(f.has.label.slice(0,28)) + '</span>') +
    (mast ? '<span class="mastered-dot">✓ maîtrisée</span>' : '') +
    '</div></button>' +
    '<button type="button" class="pcard-fav' + (fav ? ' on' : '') + '" data-fav="' + f.id + '" aria-pressed="' + fav + '" aria-label="Favori : ' + esc(f.nom) + '" ' + act('toggleFav', f.id) + '><span aria-hidden="true">' + (fav ? '★' : '☆') + '</span></button></div>';
}



// ════════════════════════════════════════════════════════════
//  VUE DÉTAIL D'UNE FICHE
// ════════════════════════════════════════════════════════════
let detailTab = null;
// Icônes de la fiche (traits, couleur du texte)
var F1_ICO = {
  star: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  dots: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
  image: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
  print: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
  chevR: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  chevL: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  book: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>',
  alert: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>'
};
function f1Has(v) { return !!v && String(v).trim() !== '' && String(v).trim() !== '—'; }
function f1Count(f, k) {
  var O = f.onglets;
  if (k === 'flags' && O.flags) return (O.flags.red || []).length + (O.flags.yellow || []).length;
  if (k === 'ddx' && O.ddx) return (O.ddx.items || []).length;
  if (k === 'tests' && O.tests) return (O.tests.items || []).length;
  return 0;
}

function renderDetail(app, f) {
  const tabs = ONGLETS_DEF.filter(t => f.onglets[t.key] !== undefined);
  if (!detailTab || !tabs.find(t => t.key === detailTab)) detailTab = tabs[0].key;
  const N = NIVEAUX[f.niveau];
  const fav = state.favs.has(f.id), mast = state.mastered.has(f.id);
  const hl = state.view === "tests" ? tState().q.trim() : state.query.trim();
  const listLbl = state.view === 'tests' ? 'Tests cliniques' : 'Toutes les pathologies';
  const nomQ = esc(f.nom).replace(/'/g, "");

  const nav = state.ficheHistory.length
    ? '<button class="back" ' + act('backFiche') + '>' + F1_ICO.chevL + '<span class="back-lbl">Retour : ' + esc(ficheNom(state.ficheHistory[state.ficheHistory.length - 1].id)) + '</span></button>' +
      '<button class="back back-all" ' + act('closeFiche') + '><span class="back-lbl">' + listLbl + '</span></button>'
    : '<button class="back" ' + act('closeFiche') + '>' + F1_ICO.chevL + '<span class="back-lbl">' + listLbl + '</span></button>';

  const favLbl = fav ? 'Retirer des favoris' : 'Ajouter aux favoris';
  let html = '<div class="detail f1" style="--lvl-c:' + N.color + '">' +
    '<div class="d-top"><div class="d-nav">' + nav + '</div>' +
    '<div class="d-head-actions">' +
      '<button class="d-act d-fav-btn' + (fav ? ' on' : '') + '" data-fav="' + f.id + '" ' + act('toggleFav', f.id) + ' aria-pressed="' + fav + '" aria-label="' + favLbl + '" title="' + favLbl + '">' + F1_ICO.star + '</button>' +
      '<div class="d-menu-wrap">' +
        '<button class="d-act" id="dMenuBtn" ' + act('toggleDMenu', '$ev') + ' aria-expanded="false" aria-controls="dMenu" aria-label="Plus d\'actions" title="Plus d\'actions">' + F1_ICO.dots + '</button>' +
        '<div class="d-menu" id="dMenu" hidden>' +
          '<button class="d-menu-item" ' + act('toggleMastered', f.id) + ' aria-pressed="' + mast + '">' + F1_ICO.check + '<span>' + (mast ? 'Retirer des fiches maîtrisées' : 'Marquer comme maîtrisée') + '</span></button>' +
          '<button class="d-menu-item" ' + act('menuImg', f.nom + ' anatomie pathologie') + '>' + F1_ICO.image + '<span>Rechercher des images</span></button>' +
          '<button class="d-menu-item" ' + act('menuPrint') + '>' + F1_ICO.print + '<span>Imprimer ou enregistrer en PDF</span></button>' +
        '</div>' +
      '</div>' +
    '</div></div>' +
    '<div class="d-head">' +
      '<h2 class="d-title">' + esc(f.nom) + '</h2>' +
      '<div class="d-badges">' +
        '<span class="badge badge-zone">' + esc(f.zone) + '</span>' + (f.secondaryZone ? '<span class="badge badge-zone">' + esc(f.secondaryZone) + '</span>' : '') +
        '<span class="badge badge-lvl l' + f.niveau + '">' + N.label + '</span>' +
        (f.has.tier === 1 ? '<span class="badge badge-has-ok">' + F1_ICO.check + 'RBP HAS</span>'
          : f.has.tier === 2 ? '<span class="badge badge-has-warn">' + F1_ICO.book + esc(f.has.label) + '</span>'
          : '<span class="badge badge-has-t3">EBP</span>') +
        (mast ? '<span class="badge badge-mast">' + F1_ICO.check + 'Maîtrisée</span>' : '') +
      '</div>' +
      '<p class="d-resume">' + rich(f.resume, hl) + '</p>' +
    '</div>';

  if (f.stats && f.stats.length) {
    html += '<div class="d-stats">' + f.stats.map(s => '<div class="d-stat"><div class="d-stat-val">' + esc(s.val).replace(/(&lt;|&gt;|≤|≥) (?=\d)/g, '$1&nbsp;').replace(/(\d) (?=[%°a-zA-Zé])/g, '$1&nbsp;') + '</div><div class="d-stat-lbl">' + esc(s.lbl) + '</div></div>').join("") + '</div>';
  }

  html += '<div id="tabsAnchor"></div><div class="tabs-wrap"><div class="tabs" role="tablist" aria-label="Sections de la fiche" onscroll="updateTabsFades()">' +
    tabs.map(t => {
      const on = detailTab === t.key, n = f1Count(f, t.key);
      return '<button class="tab' + (on ? ' on' : '') + '" role="tab" id="tab-' + t.key + '" data-key="' + t.key + '" aria-selected="' + on + '" aria-controls="tabPanel" ' + act('switchTab', t.key, '$el') + '>' + (t.short || t.label) + (n ? '<span class="tab-n">' + n + '</span>' : '') + '</button>';
    }).join("") + '</div></div>';
  html += '<div class="section" id="tabPanel" role="tabpanel" aria-labelledby="tab-' + detailTab + '">' + tabContent(f, detailTab, hl) + '</div>';

  const idx = tabs.findIndex(t => t.key === detailTab);
  if (idx < tabs.length - 1) {
    const nx = tabs[idx + 1];
    html += '<button class="d-next" ' + act('goTab', nx.key) + '><span class="d-next-txt"><span class="d-next-k">Section suivante</span><span class="d-next-l">' + nx.label + '</span></span>' + F1_ICO.chevR + '</button>';
  } else {
    html += '<button class="d-next d-mast' + (mast ? ' on' : '') + '" ' + act('toggleMastered', f.id) + ' aria-pressed="' + mast + '"' + (mast ? ' title="Retirer des fiches maîtrisées"' : '') + '>' + F1_ICO.check + '<span>' + (mast ? 'Fiche maîtrisée' : 'Marquer comme maîtrisée') + '</span></button>';
  }
  html += ficheTrainHTML(f);
  html += '<div class="disclaimer">' + F1_ICO.alert + '<div>Outil de révision personnel. Les recommandations évoluent : <strong>revérifie systématiquement les sources HAS/officielles à jour</strong> avant toute application clinique. Les valeurs de Se/Sp sont indicatives et varient selon les études.</div></div></div>';
  app.innerHTML = html;
  setNavH();
  updateTabsFades();
  if (state.openId) setTimeout(scrollActiveTab, 80);
}

function tabContent(f, tab, hl) {
  const O = f.onglets;
  const blocs = arr => arr.map(b => '<div class="block"><h3 class="block-title">' + esc(b.titre) + '</h3><ul class="items">' + b.items.map(i => '<li class="item"><span>' + rich(i, hl) + '</span></li>').join("") + '</ul></div>').join("");
  if (["definition", "bilan", "pec", "pronostic"].includes(tab) && O[tab]) return blocs(O[tab].blocs);
  if (tab === "flags" && O.flags) {
    const card = (cls, titre, list) => '<div class="flag-card ' + cls + '"><h3 class="flag-head"><span>' + titre + '</span><span class="flag-n">' + list.length + '</span></h3><ul class="flag-list">' +
      list.map(r => '<li class="flag-item"><span>' + rich(r, hl) + '</span></li>').join("") + '</ul></div>';
    return '<div class="flags-grid">' + card('flag-red', 'Drapeaux rouges', O.flags.red || []) + card('flag-yellow', 'Drapeaux jaunes', O.flags.yellow || []) + '</div>' +
      (O.flags.note ? '<p class="flag-note">' + rich(O.flags.note, hl) + '</p>' : "");
  }
  if (tab === "ddx" && O.ddx) {
    if (!O.ddx.items.length) return '<div class="block"><ul class="items"><li class="item"><span>📝 À compléter.</span></li></ul></div>';
    return '<div class="ddx-card">' + O.ddx.items.map(d =>
      '<div class="ddx-row"><div class="ddx-dx">' + (d.fiche && ALL_FICHES.some(function (x) { return x.id === d.fiche; }) ? '<button class="ddx-link" ' + act('goFiche', d.fiche) + '>' + rich(d.dx, hl) + ' <span class="ddx-go">Voir la fiche ›</span></button>' : rich(d.dx, hl)) + '</div><div class="ddx-cols">' +
      '<div class="ddx-pour"><span class="ddx-lbl">En faveur</span>' + rich(d.pour, hl) + '</div>' +
      '<div class="ddx-contre"><span class="ddx-lbl">Contre</span>' + rich(d.contre, hl) + '</div></div></div>').join("") + '</div>';
  }
  if (tab === "tests" && O.tests) {
    return (O.tests.note ? '<p class="t-callout">' + rich(O.tests.note, hl) + '</p>' : '') +
      '<div class="t-list">' + O.tests.items.map(t => {
        const sesp = f1Has(t.se) || f1Has(t.sp);
        return '<div class="test-card"><div class="test-top"><div class="test-head' + (sesp ? '' : ' no-sesp') + '"><h3 class="test-name">' + rich(t.nom, hl) + '</h3>' +
          (sesp ? '<div class="test-stats">' + (f1Has(t.se) ? '<span class="test-se">Se <b>' + esc(t.se) + '</b></span>' : '') + (f1Has(t.sp) ? '<span class="test-sp">Sp <b>' + esc(t.sp) + '</b></span>' : '') + '</div>' : '') +
          '</div><button class="test-img-btn" ' + act('searchImg', t.nom + ' test clinique') + ' title="Voir des images du test" aria-label="Voir des images : ' + esc(t.nom).replace(/"/g, '') + '">' + F1_ICO.image + '</button></div>' +
          (t.note ? '<p class="test-note">' + rich(t.note, hl) + '</p>' : '') + '</div>';
      }).join("") + '</div>';
  }
  if (tab === "orientation" && O.orientation) {
    return '<div class="block"><h3 class="block-title">Critères d\'orientation / réorientation médicale</h3><ul class="items">' +
      O.orientation.items.map(i => '<li class="item"><span>' + rich(i, hl) + '</span></li>').join("") + '</ul></div>';
  }
  if (tab === "has" && O.has) {
    let h = O.has.grades.map(g => '<div class="grade-item"><span class="grade-tag">' + esc(g.g) + '</span><span class="grade-txt">' + rich(g.t, hl) + '</span></div>').join("");
    h += '<div class="src-card"><h3 class="src-title">Sources officielles & références</h3>' +
      O.has.sources.map(s => {
        const isHAS = /HAS/i.test(s) && !s.startsWith("⚠️");
        return '<div class="src-item"><span class="src-bullet">' + esc(s) + '</span>' +
          (isHAS ? '<button class="src-link" ' + act('askURL', String(s).replace(/^[—–]\s*/, '') + ' site:has-sante.fr') + '>↗ source</button>' : '') + '</div>';
      }).join("") + '</div>';
    h += '<button class="btn-primary" style="margin-top:16px" ' + act('askURL', 'recommandations HAS ' + f.nom + ' kinésithérapie') + '>↗ Chercher les recos à jour</button>';
    return h;
  }
  return "";
}

// Barre d'onglets : hauteur de la barre du haut (fixe sur grand écran), fondus, menu « ⋯ »
function setNavH() {
  var nb = document.querySelector('.navbar');
  var h = nb && getComputedStyle(nb).position === 'sticky' ? nb.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty('--nav-h', Math.round(h) + 'px');
}
function updateTabsFades() {
  var t = document.querySelector('.f1 .tabs');
  if (!t) return;
  var max = t.scrollWidth - t.clientWidth;
  t.parentNode.classList.toggle('fade-l', t.scrollLeft > 4);
  t.parentNode.classList.toggle('fade-r', t.scrollLeft < max - 4);
}
function toggleDMenu(ev) {
  if (ev) ev.stopPropagation();
  var m = document.getElementById('dMenu'), b = document.getElementById('dMenuBtn');
  if (!m || !b) return;
  var open = m.hidden;
  m.hidden = !open;
  b.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) { var first = m.querySelector('button'); if (first) first.focus(); }
}
function closeDMenu(focusBtn) {
  var m = document.getElementById('dMenu'), b = document.getElementById('dMenuBtn');
  if (!m || m.hidden) return;
  m.hidden = true;
  if (b) { b.setAttribute('aria-expanded', 'false'); if (focusBtn) b.focus(); }
}
document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.d-menu-wrap')) closeDMenu(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDMenu(true); });
window.addEventListener('resize', function () { if (state.openId) { setNavH(); updateTabsFades(); } });
// Après un changement d'onglet : si la barre d'onglets est collée en haut, revenir au début de la section
function tabsToTop() {
  var a = document.getElementById('tabsAnchor');
  if (!a) return;
  var navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
  var y = a.getBoundingClientRect().top + window.scrollY - navH;
  if (window.scrollY > y + 1) window.scrollTo(0, y);
}
function goTab(key) {
  switchTab(key, document.querySelector('.tab[data-key="' + key + '"]'));
  var t = document.querySelector('.tab.on');
  if (t) t.focus({ preventScroll: true });
}

// ════════════════════════════════════════════════════════════
//  VUE QUIZ
// ════════════════════════════════════════════════════════════
function renderQuiz(app) {
  // Init state multi-select
  if (!state.quizZones) state.quizZones = new Set();
  if (!state.quizNiveaux) state.quizNiveaux = new Set();

  var Q = state.quiz;

  // ── Accueil ────────────────────────────────────────────────
  if (!Q) {
    var allZones = ZONES.filter(function(z){ return z !== 'Toutes' && ALL_FICHES.some(function(f){ return !f.stub && ficheInZone(f, z); }); });
    var best = STORE.bestScore;

    var h = '<div class="quiz-home">';
    h += '<div class="mode-intro">';
    h += '<div class="mode-icon" style="background:var(--blue-bg);color:var(--blue)">❓</div>';
    h += '<h2 class="mode-title">Quiz — QCM</h2>';
    h += '<p class="mode-sub">Teste-toi sur l\'identification des pathologies, les diagnostics différentiels, les tests cliniques et les drapeaux rouges.</p>';
    if (best) h += '<p class="result-best" style="margin-top:12px">🏆 Meilleur score : ' + best.pct + '% (' + best.score + '/' + best.total + ')</p>';
    h += '</div>';
    var nErr = errorsCount();
    if (nErr) h += '<div class="quiz-config quiz-errs"><span>📕 <strong>' + nErr + '</strong> question' + (nErr > 1 ? 's' : '') + ' dans ton carnet d\'erreurs</span><button class="btn-primary"' + act('startErrorQuiz', true) + '>Les revoir</button></div>';
    h += '<div class="quiz-config">';

    // Filtres Zones (multi-select)
    h += '<label class="cfg-label">Zones anatomiques <span style="color:var(--ink-faint);font-weight:400;text-transform:none;letter-spacing:0">(sélectionne une ou plusieurs)</span></label>';
    h += '<div class="filter-row" style="margin-bottom:8px">';
    h += '<button class="chip' + (state.quizZones.size===0?' on':'') + '" ' + act('quizToggleZone', '__all__') + '>Toutes</button>';
    allZones.forEach(function(z) {
      var on = state.quizZones.has(z) ? ' on' : '';
      h += '<button class="chip chip-fav' + on + '" ' + act('quizToggleZone', z) + '>'+esc(z)+'</button>';
    });
    h += '</div>';

    // Filtres Niveaux (multi-select)
    h += '<label class="cfg-label" style="margin-top:16px">Niveaux <span style="color:var(--ink-faint);font-weight:400;text-transform:none;letter-spacing:0">(optionnel)</span></label>';
    h += '<div class="filter-row" style="margin-bottom:18px">';
    var NLABELS = {1:{l:'Niveau 1',c:'#d97642'},2:{l:'Niveau 2',c:'#c9a227'},3:{l:'Niveau 3',c:'#6a994e'}};
    [1,2,3].forEach(function(n) {
      var on = state.quizNiveaux.has(n) ? ' on' : '';
      var nl = NLABELS[n];
      h += '<button class="chip' + on + '" style="' + (state.quizNiveaux.has(n)?'background:'+nl.c+';border-color:'+nl.c+';color:#fff':'') + '" ' + act('quizToggleNiveau', n) + '>' + nl.l + '</button>';
    });
    h += '</div>';

    // Compteur de questions disponibles
    var preview = quizPreviewCount();
    h += '<div class="quiz-preview">📊 <strong>' + preview + '</strong> question' + (preview>1?'s':'') + ' disponible' + (preview>1?'s':'') + ' avec ces filtres</div>';

    // Nombre de questions
    h += '<label class="cfg-label" style="margin-top:16px">Nombre de questions</label>';
    h += '<div class="quiz-len-btns">';
    [5, 10, 20, 'Max'].forEach(function(n) {
      var nb = n === 'Max' ? preview : Math.min(n, preview);
      var disabled = preview === 0 ? ' disabled style="opacity:.4"' : '';
      h += '<button class="quiz-len"' + disabled + ' ' + act('startQuiz', n==='Max'?preview:n) + '>' + (n==='Max'?'Tout ('+preview+')':n+' questions') + '</button>';
    });
    h += '</div>';
    h += '<button class="chip quiz-exam-link"' + act('setView', 'train') + '>🎓 Mode examen chronométré</button>';
    h += '</div></div>';
    app.innerHTML = h;
    return;
  }

  // ── Résultats ───────────────────────────────────────────────
  if (Q.idx >= Q.questions.length) {
    var pct = Math.round((Q.score / Q.questions.length) * 100);
    var msg = Q.timeUp ? 'Temps écoulé' : pct >= 80 ? 'Excellent !' : pct >= 60 ? 'Bien, continue !' : 'À retravailler';
    if (Q.mode === 'exam') msg = '🎓 ' + msg;
    var best2 = STORE.bestScore;
    var misses = Q.answered.filter(function(a){ return !a.correct; });
    var h = '<div class="quiz-results">';
    h += '<div class="result-ring" style="background:conic-gradient(var(--accent) ' + pct + '%, var(--paper-2) 0)"><div class="result-pct">' + pct + '%</div></div>';
    h += '<h2 class="result-title">' + msg + '</h2>';
    h += '<p class="result-score">' + Q.score + ' / ' + Q.questions.length + ' bonnes réponses' + (Q.unanswered ? ' · ' + Q.unanswered + ' sans réponse' : '') + '</p>';
    if (Q.answered.some(function (a) { return !a.correct; })) h += '<p class="result-best">📕 Tes erreurs sont dans le carnet : elles reviendront demain.</p>';
    if (best2) h += '<p class="result-best">🏆 Meilleur score : ' + best2.pct + '%</p>';
    h += '<div class="result-list">';
    if (misses.length) h += '<p class="result-section-lbl">À revoir :</p>';
    misses.forEach(function(a) {
      var fi = ALL_FICHES.find(function(f){ return f.id === a.q.ficheId; });
      var cs = a.q.casId && CAS_CLINIQUES.find(function (x) { return x.id === a.q.casId; });
      h += '<button class="result-miss" ' + (cs ? act('openCasById', cs.id) : act('openFicheAt', a.q.ficheId, quizTab(a.q))) + '>';
      h += '<span class="miss-x">✕</span><div>';
      h += '<div class="miss-cat">' + esc(a.q.type) + ' · ' + esc(cs ? cs.titre : fi ? fi.nom : '') + '</div>';
      h += '<div class="miss-ans">Réponse : ' + esc(a.q.answer) + '</div>';
      h += '</div><span class="miss-arrow">›</span></button>';
    });
    h += '</div>';
    var eD = errorsDue().length;
    h += '<div class="result-actions">' + (eD && Q.mode !== 'errors' ? '<button class="btn-primary"' + act('startErrorQuiz') + '>Revoir mes erreurs (' + eD + ')</button>' : '') +
      '<button class="' + (eD && Q.mode !== 'errors' ? 'chip' : 'btn-primary') + '" ' + act('quizHome') + '>Nouveau quiz</button>' +
      '<button class="chip"' + act('setView', 'today') + '>Aujourd\'hui</button></div>';
    h += '</div>';
    app.innerHTML = h;
    return;
  }

  // ── Question en cours ────────────────────────────────────────
  var q = Q.questions[Q.idx];
  var opts = q.options.map(function(opt, ii) {
    var cls = 'quiz-opt';
    var ic = '';
    if (Q.picked !== null) {
      if (opt === q.answer) { cls += ' correct'; ic = '<span class="opt-ic" aria-hidden="true">✓</span><span class="sr-only"> — bonne réponse</span>'; }
      else if (opt === Q.picked) { cls += ' wrong'; ic = '<span class="opt-ic" aria-hidden="true">✕</span><span class="sr-only"> — ton choix, faux</span>'; }
      else cls += ' dim';
    }
    return '<button class="' + cls + '"' + (Q.picked !== null ? ' disabled' : '') + ' ' + act('chooseQuiz', ii) + '>' +
      '<span class="opt-letter">' + String.fromCharCode(65+ii) + '</span>' +
      '<span class="opt-text">' + esc(opt) + '</span>' + ic + '</button>';
  }).join('');

  var h = '<div class="quiz-run">';
  h += '<div class="quiz-progress"><div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:' + (Q.idx/Q.questions.length*100) + '%"></div></div>';
  h += '<div class="quiz-prog-txt">' + (Q.idx+1) + ' / ' + Q.questions.length + (Q.mode === 'exam' ? ' · <span class="exam-clock" id="examClock" role="timer" aria-label="Temps restant">' + examClock(examLeft()) + '</span>' : ' · <span class="quiz-score-live">' + Q.score + ' pts</span>') + '</div></div>';
  if (Q.mode === 'errors') h += '<p class="quiz-mode-tag">📕 Carnet d\'erreurs</p>';
  h += '<div class="quiz-qcard"><span class="quiz-qtype">' + esc(q.type) + '</span><p class="quiz-qtext">' + esc(q.q) + '</p></div>';
  h += '<div class="quiz-options">' + opts + '</div>';
  if (Q.picked !== null) {
    h += '<p class="quiz-feedback ' + (Q.picked === q.answer ? 'ok">✓ Bonne réponse' : 'ko">✕ Raté — la bonne réponse est ' + quizLetter(q)) + '</p>';
    var tl = quizTabLabel(q);
    h += '<div class="quiz-next-row">' + (q.ficheId ? '<button class="quiz-review-link" ' + act('openFicheAt', q.ficheId, quizTab(q)) + '>Voir dans la fiche' + (tl ? ' · ' + tl : '') + '</button>' : q.casId ? '<button class="quiz-review-link" ' + act('openCasById', q.casId) + '>Revoir le cas</button>' : '<span></span>');
    h += '<button class="btn-primary" id="quizNext" ' + act('nextQuiz') + '>' + (Q.idx+1<Q.questions.length?'Suivant ›':'Voir les résultats ›') + '</button></div>';
  }
  if (Q.mode === 'exam') h += '<button class="flash-quit"' + act('examFinish', false) + '>Terminer l\'examen maintenant</button>';
  h += '</div>';
  app.innerHTML = h;
}
function startQuiz(nb) {
  // Questions calculées une fois par ouverture de l'app (≈1 s sur iPhone) ; le tirage reste aléatoire à chaque quiz
  var pool = quizPool();
  // Filtre zones (multi-select)
  if (state.quizZones && state.quizZones.size > 0) {
    pool = pool.filter(function(q){ var f = ALL_FICHES.find(function(x){ return x.id === q.ficheId; }); return Array.from(state.quizZones).some(function(z){ return ficheInZone(f, z); }); });
  }
  // Filtre niveaux (multi-select)
  if (state.quizNiveaux && state.quizNiveaux.size > 0) {
    pool = pool.filter(function(q){
      var f = ALL_FICHES.find(function(f){ return f.id === q.ficheId; });
      return f && state.quizNiveaux.has(f.niveau);
    });
  }
  pool = shuffle(pool).slice(0, nb || 10);
  state.quiz = { questions: pool, idx: 0, picked: null, score: 0, answered: [], mode: 'quiz' };
  if (state.view !== 'quiz') { state.view = 'quiz'; render(); window.scrollTo(0, 0); }
  else renderQuiz(document.getElementById('app'));
}

function quizToggleZone(z) {
  if (!state.quizZones) state.quizZones = new Set();
  if (z === '__all__') { state.quizZones.clear(); }
  else if (state.quizZones.has(z)) { state.quizZones.delete(z); }
  else { state.quizZones.add(z); }
  renderQuiz(document.getElementById('app'));
}

function quizToggleNiveau(n) {
  if (!state.quizNiveaux) state.quizNiveaux = new Set();
  if (state.quizNiveaux.has(n)) { state.quizNiveaux.delete(n); }
  else { state.quizNiveaux.add(n); }
  renderQuiz(document.getElementById('app'));
}

function quizPreviewCount() {
  var pool = quizPool();
  if (state.quizZones && state.quizZones.size > 0) {
    pool = pool.filter(function(q){ var f = ALL_FICHES.find(function(x){ return x.id === q.ficheId; }); return Array.from(state.quizZones).some(function(z){ return ficheInZone(f, z); }); });
  }
  if (state.quizNiveaux && state.quizNiveaux.size > 0) {
    pool = pool.filter(function(q){
      var f = ALL_FICHES.find(function(f){ return f.id === q.ficheId; });
      return f && state.quizNiveaux.has(f.niveau);
    });
  }
  return pool.length;
}
function chooseQuiz(i) {
  const Q = state.quiz; if (Q.picked !== null) return;
  const opt = Q.questions[Q.idx].options[i];
  Q.picked = opt;
  const correct = opt === Q.questions[Q.idx].answer;
  if (correct) Q.score++;
  Q.answered.push({ q: Q.questions[Q.idx], picked: opt, correct });
  learnQuizAnswer(Q.questions[Q.idx], correct);
  // Examen : pas de correction pendant l'épreuve, question suivante tout de suite
  if (Q.mode === 'exam') {
    Q.picked = null;
    if (Q.idx + 1 >= Q.questions.length) { examFinish(false); return; }
    Q.idx++; renderQuiz(document.getElementById("app"));
    var first = document.querySelector('.quiz-opt'); if (first) first.focus({ preventScroll: true });
    return;
  }
  renderQuiz(document.getElementById("app"));
  announce(correct ? 'Bonne réponse.' : 'Raté. La bonne réponse est ' + Q.questions[Q.idx].answer + '.');
  var nx = document.getElementById('quizNext'); if (nx) nx.focus({ preventScroll: true });
}
// Lettre de la bonne réponse (« B : … »), pour le message affiché après la réponse
function quizLetter(q) { return String.fromCharCode(65 + q.options.indexOf(q.answer)) + ' : ' + esc(q.answer); }
// Message lu par VoiceOver sans être affiché (zone #srLive, hors de la partie redessinée)
function announce(t) {
  var el = document.getElementById('srLive'); if (!el) return;
  el.textContent = '';
  t = String(t).replace(/\.{2,}/g, '.');
  setTimeout(function () { el.textContent = t; }, 60);
}
function nextQuiz() {
  const Q = state.quiz;
  if (Q.idx + 1 < Q.questions.length) { Q.idx++; Q.picked = null; }
  else {
    Q.idx = Q.questions.length;
    const pct = Math.round((Q.score / Q.questions.length) * 100);
    const best = STORE.bestScore;
    if (!best || pct > best.pct) STORE.bestScore = { pct, score: Q.score, total: Q.questions.length };
    learnQuizEnd(Q);
  }
  renderQuiz(document.getElementById("app"));
}

// ════════════════════════════════════════════════════════════
//  VUE FLASHCARDS
// ════════════════════════════════════════════════════════════
function renderFlash(app) {
  const F = state.flash;
  if (!F) {
    const zones = ["Toutes", ...ZONES.filter(z => z !== "Toutes" && ALL_FICHES.some(f => f.zone === z && !f.stub))];
    const all = allCards();
    const cats = ["Toutes", ...FC_CATS.filter(c => all.some(x => x.cat === c))];
    const n = flashPool().length;
    app.innerHTML = '<div class="quiz-home"><div class="mode-intro"><div class="mode-icon" style="background:var(--gold-bg);color:var(--gold)">🗂</div>' +
      '<h2 class="mode-title">Flashcards</h2><p class="mode-sub">Révision active recto/verso. Une question s\'affiche, tu réfléchis, puis tu retournes la carte pour vérifier. Définitions, drapeaux, bilan, tests un par un, diagnostics différentiels, prise en charge, pièges à éviter, chiffres clés et pronostic.</p></div>' +
      '<div class="quiz-config"><label class="cfg-label">Filtrer par zone</label><div class="filter-row" id="fzones" style="margin-bottom:22px"></div>' +
      '<label class="cfg-label">Type de carte</label><div class="filter-row" id="fcats" style="margin-bottom:22px"></div>' +
      srsHomeHTML() +
      '<button class="chip btn-browse" ' + act('startFlash') + '' + (n ? '' : ' disabled') + '>Parcourir toutes les cartes · ' + n + '</button></div></div>';
    document.getElementById("fzones").innerHTML = zones.map(z => '<button class="chip' + (state.flashZone === z || (!state.flashZone && z === "Toutes") ? ' on' : '') + '" ' + act('setFlashZone', z) + '>' + esc(z) + '</button>').join("");
    document.getElementById("fcats").innerHTML = cats.map(c => '<button class="chip' + (state.flashCat === c || (!state.flashCat && c === "Toutes") ? ' on' : '') + '" ' + act('setFlashCat', c) + '>' + esc(c) + '</button>').join("");
    return;
  }
  if (!F.cards.length) { app.innerHTML = '<div class="empty"><p>Aucune carte pour ces filtres.</p><button class="chip" ' + act('flashHome') + '>Retour</button></div>'; return; }
  if (F.finished) { app.innerHTML = srsDoneHTML(F); return; }
  const c = F.cards[F.idx];
  app.innerHTML = '<div class="flash-run"><div class="quiz-progress"><div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:' + ((F.idx + 1) / F.cards.length * 100) + '%"></div></div>' +
    '<div class="quiz-prog-txt">' + (F.idx + 1) + ' / ' + F.cards.length + '</div></div>' +
    '<div class="flashcard' + (F.flipped ? ' flipped' : '') + '" id="flashCard" role="button" tabindex="0" aria-roledescription="carte" data-act="flipFlash" data-key="flashKey"><div class="flash-inner">' +
    '<div class="flash-face flash-front"' + (F.flipped ? ' aria-hidden="true"' : '') + '><div class="flash-meta"><span class="flash-cat">' + c.cat + '</span><span class="flash-fiche">' + esc(c.fiche) + '</span></div>' +
    '<p class="flash-q">' + esc(c.q) + (c.sub ? '<span class="flash-sub">' + esc(c.sub) + '</span>' : '') + '</p><div class="flash-hint">↻ Touche la carte pour révéler</div></div>' +
    '<div class="flash-face flash-back"' + (F.flipped ? '' : ' aria-hidden="true"') + '><div class="flash-meta"><span class="flash-cat">' + c.cat + '</span><span class="flash-fiche">' + esc(c.fiche) + '</span></div>' +
    (c.sub ? '<div class="flash-sub flash-sub-back">' + esc(c.sub) + '</div>' : '') + '<ul class="flash-a">' + c.a.map(l => '<li>' + esc(l) + '</li>').join("") + '</ul></div>' +
    '</div></div>' +
    (F.flipped ? gradeButtonsHTML(c) : (F.srs ? '<p class="grade-hint">Retourne la carte, puis dis comment tu t\'en es souvenu.</p>' : '')) +
    '<div class="flash-controls"><button class="flash-nav" ' + act('navFlash', -1) + ' aria-label="Carte précédente">‹</button>' +
    '<button class="flash-seefiche" ' + act('openFiche', c.ficheId) + '>Voir la fiche complète</button>' +
    '<button class="flash-nav" ' + act('navFlash', 1) + ' aria-label="Carte suivante">›</button></div>' +
    '<button class="flash-quit" ' + act('flashHome') + '>Changer de filtre / quitter</button></div>';
}
function startFlash() {
  state.flash = { cards: shuffle(flashPool()), idx: 0, flipped: false };
  renderFlash(document.getElementById("app"));
}
function flipFlash() { state.flash.flipped = !state.flash.flipped; renderFlash(document.getElementById("app")); focusFlash(); }
// Entrée / Espace : retourner ; flèches : carte précédente / suivante
function flashKey(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipFlash(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); navFlash(1); focusFlash(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); navFlash(-1); focusFlash(); }
}
function focusFlash() { var c = document.getElementById('flashCard'); if (c) c.focus({ preventScroll: true }); }
function navFlash(dir) {
  const F = state.flash; F.flipped = false;
  let n = F.idx + dir;
  if (n < 0) n = F.cards.length - 1;
  if (n >= F.cards.length) n = 0;
  F.idx = n;
  renderFlash(document.getElementById("app"));
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════

var casState = { idx: 0, answered: null, score: 0, started: false, currentCas: null, pickedAnswers: {} };
function renderCas(app) {
  if (typeof CAS_CLINIQUES === 'undefined' || !CAS_CLINIQUES.length) {
    app.innerHTML = '<div class="empty"><p>Aucun cas clinique disponible.</p></div>';
    return;
  }
  if (!casState.started) {
    var h = '<div class="quiz-home">';
    h += '<div class="mode-intro">';
    h += '<div class="mode-icon" style="background:var(--blue-bg);color:var(--blue)">📋</div>';
    h += '<h2 class="mode-title">Cas cliniques</h2>';
    h += '<p class="mode-sub">Situations cliniques réalistes : anamnèse, examen, QCM avec correction. Entraîne-toi à raisonner comme en stage.</p>';
    h += '</div>';
    h += '<div class="quiz-config">';
    var cz = casState.zone || 'Toutes';
    var czones = ['Toutes'].concat(ZONES.filter(function(z) { return z !== 'Toutes' && CAS_CLINIQUES.some(function(x) { return x.zone === z; }); }));
    h += '<label class="cfg-label">Filtrer par zone</label><div class="filter-row" style="margin-bottom:22px">' + czones.map(function(z) {
      return '<button class="chip' + (z === cz ? ' on' : '') + '" ' + act('setCasZone', z) + '>' + esc(z) + '</button>';
    }).join('') + '</div>';
    // Cas de la zone choisie, regroupés par zone (ordre des zones de l'application)
    var cidx = [];
    for (var k = 0; k < CAS_CLINIQUES.length; k++) if (cz === 'Toutes' || CAS_CLINIQUES[k].zone === cz) cidx.push(k);
    cidx.sort(function(x, y) { return (ZONES.indexOf(CAS_CLINIQUES[x].zone) - ZONES.indexOf(CAS_CLINIQUES[y].zone)) || (x - y); });
    h += '<label class="cfg-label">Choisir un cas (' + cidx.length + ' disponible' + (cidx.length > 1 ? 's' : '') + ')</label>';
    h += '<div id="cas-list">';
    for (var cj = 0; cj < cidx.length; cj++) {
      var ci = cidx[cj], c = CAS_CLINIQUES[ci];
      var diffCls = c.difficulte === 'Débutant' ? 'diff-débutant' : c.difficulte === 'Intermédiaire' ? 'diff-intermédiaire' : 'diff-avancé';
      h += '<button class="cas-item" ' + act('startCas', ci) + '>';
      h += '<div class="cas-item-top"><span class="cas-titre">' + esc(c.titre) + '</span>';
      h += '<span class="cas-diff ' + diffCls + '">' + esc(c.difficulte) + '</span></div>';
      var st = casStatus(c);
      h += '<div class="cas-zone">' + esc(c.zone) + ' · ' + c.questions.length + ' questions <span class="cas-st cas-st-' + st.k + '">' + st.l + '</span></div>';
      h += '</button>';
    }
    h += '</div></div></div>';
    app.innerHTML = h;
    return;
  }
  var c = casState.currentCas;
  var h = '<div class="cas-run">';
  h += '<button class="back" ' + act('casHome') + '>‹ Tous les cas</button>';
  h += '<div class="cas-header"><h2 class="cas-run-titre">' + esc(c.titre) + '</h2>';
  h += '<span class="cas-diff">' + esc(c.difficulte) + '</span></div>';
  h += '<div class="cas-presentation"><div class="cas-section-lbl">🧑‍⚕️ Présentation</div>';
  h += '<p class="cas-text">' + esc(c.presentation) + '</p></div>';
  h += '<div class="cas-examen"><div class="cas-section-lbl">🔍 Examen clinique</div>';
  h += '<p class="cas-text">' + esc(c.examen) + '</p></div>';
  h += '<div class="cas-questions">';
  for (var qi = 0; qi < c.questions.length; qi++) {
    var q = c.questions[qi];
    var picked = casState.pickedAnswers[qi];
    h += '<div class="cas-q">';
    h += '<div class="cas-q-num">Question ' + (qi+1) + ' / ' + c.questions.length + '</div>';
    h += '<div class="cas-q-text">' + esc(q.q) + '</div>';
    h += '<div class="cas-q-options">';
    for (var oi = 0; oi < q.options.length; oi++) {
      var opt = q.options[oi];
      var cls = 'quiz-opt';
      var ic = '';
      if (picked !== undefined) {
        if (oi === q.answer) { cls += ' correct'; ic = '<span class="opt-ic" aria-hidden="true">✓</span><span class="sr-only"> — bonne réponse</span>'; }
        else if (oi === picked) { cls += ' wrong'; ic = '<span class="opt-ic" aria-hidden="true">✕</span><span class="sr-only"> — ton choix, faux</span>'; }
        else cls += ' dim';
      }
      h += '<button class="' + cls + '"' + (picked !== undefined ? ' disabled' : '') + ' ' + act('pickCas', qi, oi) + '>';
      h += '<span class="opt-letter">' + String.fromCharCode(65+oi) + '</span>';
      h += '<span class="opt-text">' + esc(opt) + '</span>' + ic + '</button>';
    }
    h += '</div>';
    if (picked !== undefined) {
      var ok = picked === q.answer;
      h += '<div class="cas-explication ' + (ok ? 'cas-ok' : 'cas-ko') + '">';
      h += (ok ? '✅ <strong>Correct !</strong> ' : '❌ <strong>Incorrect.</strong> ') + esc(q.explication);
      h += '</div>';
    }
    h += '</div>';
  }
  h += '</div>';
  var allAnswered = Object.keys(casState.pickedAnswers).length === c.questions.length;
  if (allAnswered) {
    var score = 0;
    for (var k = 0; k < c.questions.length; k++) {
      if (casState.pickedAnswers[k] === c.questions[k].answer) score++;
    }
    var msg = score === c.questions.length ? 'Parfait !' : score >= c.questions.length/2 ? 'Bien !' : 'À revoir';
    h += '<div class="cas-score">Score : <strong>' + score + ' / ' + c.questions.length + '</strong> — ' + msg + '</div>';
    h += '<div style="text-align:center;margin:16px 0">';
    h += '<button class="btn-primary" ' + act('casHome') + '>Autre cas</button>';
    h += '</div>';
  }
  h += '</div>';
  app.innerHTML = h;
}
function startCas(i) {
  casState.currentCas = CAS_CLINIQUES[i];
  casState.started = true;
  casState.pickedAnswers = {};
  renderCas(document.getElementById('app'));
}
function pickCas(qi, oi) {
  if (casState.pickedAnswers[qi] !== undefined) return;
  casState.pickedAnswers[qi] = oi;
  var cc = casState.currentCas;
  learnCasAnswer(cc, qi, oi);
  if (Object.keys(casState.pickedAnswers).length === cc.questions.length) {
    var sc = 0; cc.questions.forEach(function (q, k) { if (casState.pickedAnswers[k] === q.answer) sc++; });
    learnCasEnd(cc, sc);
  }
  renderCas(document.getElementById('app'));
  var cq = casState.currentCas.questions[qi];
  announce((oi === cq.answer ? 'Correct. ' : 'Incorrect. La bonne réponse est ' + cq.options[cq.answer] + '. ') + cq.explication);
  setTimeout(function(){ var el=document.querySelector('.cas-q:nth-child('+(qi+2)+')'); if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'}); },100);
}


// ── TABS SCROLLABLES : scroll vers l'onglet actif ─────────────────────────
function scrollActiveTab() {
  var tabsEl = document.querySelector('.tabs');
  if (!tabsEl) return;
  var activeTab = tabsEl.querySelector('.tab.on');
  if (!activeTab) return;
  var tabsRect = tabsEl.getBoundingClientRect();
  var tabRect = activeTab.getBoundingClientRect();
  var offset = tabRect.left - tabsRect.left - (tabsRect.width/2) + (tabRect.width/2);
  tabsEl.scrollBy({ left: offset, behavior: 'smooth' });
  updateTabsDots();
  updateTabsFades();
}

function updateTabsDots() {
  var tabsEl = document.querySelector('.tabs');
  var dotsEl = document.querySelector('.tabs-dots');
  if (!tabsEl || !dotsEl) return;
  var tabs = tabsEl.querySelectorAll('.tab');
  var dots = dotsEl.querySelectorAll('.tabs-dot');
  var activeIdx = Array.from(tabs).findIndex(function(t){ return t.classList.contains('on'); });
  dots.forEach(function(d,i){ d.classList.toggle('on', i===activeIdx); });
}

// ── LOUPE FLOTTANTE ────────────────────────────────────────────────────────
function fabSearchClick() {
  var si = document.getElementById('searchInput');
  if (si) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(function(){ si.focus(); }, 400);
  } else {
    setView(state.view === 'tests' ? 'tests' : 'fiches');
    setTimeout(function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
      var si2 = document.getElementById('searchInput');
      if (si2) setTimeout(function(){ si2.focus(); }, 400);
    }, 100);
  }
}

// Afficher/masquer le bouton loupe selon le scroll
window.addEventListener('scroll', function() {
  var fab = document.getElementById('fabSearch');
  if (!fab) return;
  var si = document.getElementById('searchInput');
  if (si) {
    var rect = si.getBoundingClientRect();
    fab.classList.toggle('visible', rect.bottom < 0);
  } else {
    fab.classList.toggle('visible', window.scrollY > 120);
  }
}, { passive: true });


// ── SWIPE HORIZONTAL ENTRE ONGLETS ─────────────────────────────────────────
(function() {
  var touchStartX = 0;
  var touchStartY = 0;
  var touchStartTime = 0;
  var SWIPE_THRESHOLD = 50;   // pixels minimum pour déclencher le swipe
  var SWIPE_MAX_Y = 80;       // mouvement vertical max autorisé
  var SWIPE_MAX_TIME = 400;   // ms max pour le geste
  var touchStartEl = null;

  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    touchStartEl = e.target;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (!state.openId) return; // seulement dans le détail d'une fiche
    if (touchStartEl && touchStartEl.closest && touchStartEl.closest('.tabs, .d-menu')) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    var dt = Date.now() - touchStartTime;
    if (dt > SWIPE_MAX_TIME) return;
    if (Math.abs(dy) > SWIPE_MAX_Y) return; // swipe trop vertical
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    var f = ALL_FICHES.find(function(f){ return f.id === state.openId; });
    if (!f) return;
    var tabs = [
      { key:'definition'}, { key:'flags'}, { key:'ddx'}, { key:'bilan'},
      { key:'tests'}, { key:'orientation'}, { key:'pec'}, { key:'pronostic'}, { key:'has'}
    ].filter(function(t){ return f.onglets[t.key] !== undefined; });

    var currentIdx = tabs.findIndex(function(t){ return t.key === detailTab; });
    if (currentIdx < 0) return;

    var nextIdx;
    if (dx < 0) {
      // Swipe gauche → onglet suivant
      nextIdx = Math.min(currentIdx + 1, tabs.length - 1);
    } else {
      // Swipe droite → onglet précédent
      nextIdx = Math.max(currentIdx - 1, 0);
    }
    if (nextIdx === currentIdx) return;

    detailTab = tabs[nextIdx].key;
    render();
    tabsToTop();
    setTimeout(scrollActiveTab, 50);
  }, { passive: true });
})();


var _swipeDir = 'right';

function applySlide(dir) {
  var s = document.querySelector('.section');
  if (!s) return;
  s.classList.remove('slide-right','slide-left');
  void s.offsetWidth;
  s.classList.add('slide-'+(dir||'right'));
  s.addEventListener('animationend', function(){ s.classList.remove('slide-right','slide-left'); }, { once: true });
}

function switchTab(key, tabEl) {
  var allTabs = Array.from(document.querySelectorAll('.tab'));
  var oldIdx = allTabs.findIndex(function(t){ return t.classList.contains('on'); });
  var newIdx = allTabs.indexOf(tabEl);
  var dir = newIdx >= oldIdx ? 'right' : 'left';
  detailTab = key;
  render();
  tabsToTop();
  applySlide(dir);
  setTimeout(scrollActiveTab, 50);
}


