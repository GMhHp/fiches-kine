/* Fiches Kiné — configuration, stockage, état, utilitaires */



// ════════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════════
const NIVEAUX = {
  1: { label: "Niveau 1", desc: "Incontournables — vues quasi quotidiennement", color: "#d97642", bg: "rgba(217,118,66,0.12)" },
  2: { label: "Niveau 2", desc: "Très fréquentes — plusieurs fois par semaine", color: "#c9a227", bg: "rgba(201,162,39,0.12)" },
  3: { label: "Niveau 3", desc: "Fréquentes — à maîtriser avant de démarrer", color: "#6a994e", bg: "rgba(106,153,78,0.12)" },
};

const ZONE_ORDER_DISPLAY = ["Rachis","ATM","Épaule","Coude","Poignet / Main","Hanche","Genou","Cheville","Pied","Neurologie","Pédiatrie"];
const ZONE_ICONS = {"Rachis":"🦴","ATM":"🦷","Épaule":"💪","Coude":"💪","Poignet / Main":"✋","Poignet":"✋","Hanche":"🦵","Hanche / Bassin":"🦵","Genou":"🦵","Membres inférieurs":"🦵","Cheville":"🦶","Pied":"🦶","Neurologie":"🧠","Pédiatrie":"👶"};
const NIVEAU_COLORS = {1:"#d97642",2:"#c9a227",3:"#6a994e"};

const ZONES = ["Toutes","Rachis","ATM","Épaule","Coude","Poignet / Main","Hanche","Genou","Cheville","Pied","Neurologie","Pédiatrie"];
const ONGLETS_DEF = [
  { key: "definition", label: "Définition", short: "Définition" }, { key: "flags", label: "Drapeaux", short: "Drapeaux" },
  { key: "ddx", label: "Diag. différentiels", short: "Diagnostics" }, { key: "bilan", label: "Bilan & scores", short: "Bilan" },
  { key: "tests", label: "Tests cliniques", short: "Tests" }, { key: "orientation", label: "Orientation", short: "Orientation" },
  { key: "pec", label: "Prise en charge", short: "Prise en charge" }, { key: "pronostic", label: "Pronostic & délais", short: "Pronostic" },
  { key: "has", label: "Recos / Sources", short: "Recos" },
];

// ════════════════════════════════════════════════════════════
//  STOCKAGE LOCAL (persistant entre sessions)
// ════════════════════════════════════════════════════════════

function lsGet(k, def) { try { return localStorage.getItem(k); } catch { return def; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
const STORE = {
  get favs() { try { return new Set(JSON.parse(lsGet("kine_favs", "[]") || "[]")); } catch { return new Set(); } },
  set favs(s) { lsSet("kine_favs", JSON.stringify([...s])); },
  get mastered() { try { return new Set(JSON.parse(lsGet("kine_mastered", "[]") || "[]")); } catch { return new Set(); } },
  set mastered(s) { lsSet("kine_mastered", JSON.stringify([...s])); },
  get bestScore() { try { return JSON.parse(lsGet("kine_best", "null") || "null"); } catch { return null; } },
  set bestScore(v) { lsSet("kine_best", JSON.stringify(v)); },
  get dark() { return lsGet("kine_dark", "0") === "1"; },
  set dark(v) { lsSet("kine_dark", v ? "1" : "0"); },
};

// ════════════════════════════════════════════════════════════
//  ÉTAT GLOBAL
// ════════════════════════════════════════════════════════════
let state = {
  view: "today", openId: null,
  query: "", zone: "Toutes", favsOnly: false,
  favs: STORE.favs, mastered: STORE.mastered,
  quiz: null, flash: null, ficheHistory: [],
};

// ── Helpers ──
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function clean(t) {
  if (!t || typeof t !== 'string') return '';
  var r = t.replace(/\*\*/g, '').trim();
  // Retire pictogrammes et puces en tête (🚨 ❌ ⚠️ ✅ → •) sans toucher aux lettres accentuées ni aux signes ≥ ≤ < > ~
  r = r.replace(/^[^0-9A-Za-zÀ-ɏ«"'(\[<>≤≥~±+\-]+/, '');
  return r.trim();
}
function rich(text, hl) {
  let t = esc(text).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const toks = Array.isArray(hl) ? hl : (hl && String(hl).trim().length >= 2 ? sTokens(hl) : []);
  const re = toks.length ? sRegex(toks) : null;
  if (re) {
    // Surligne uniquement le texte, jamais l'intérieur des balises ni des entités HTML
    t = t.split(/(<[^>]+>|&[#a-z0-9]+;)/i).map(function(part) { return /^(<[^>]+>|&[#a-z0-9]+;)$/i.test(part) ? part : part.replace(re, "<mark class='hl'>$1</mark>"); }).join("");
  }
  return t;
}
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function searchImg(term) { window.open("https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(term), "_blank"); }
function askURL(s) { window.open("https://www.google.com/search?q=" + encodeURIComponent(s), "_blank"); }

// ════════════════════════════════════════════════════════════
//  ACTIONS DES BOUTONS (sans code dans le HTML)
// ════════════════════════════════════════════════════════════
// act('openFiche', id) → ' data-act="openFiche" data-args="[…]"' : les guillemets des noms
// (« Syndrome de l'essuie-glace ») ne peuvent plus casser un bouton.
// '$el' = l'élément cliqué, '$ev' = l'événement.
function act(name) {
  var a = Array.prototype.slice.call(arguments, 1);
  return ' data-act="' + name + '"' + (a.length ? ' data-args="' + esc(JSON.stringify(a)) + '"' : '');
}
function runAct(el, ev) {
  var fn = window[el.getAttribute('data-act')];
  if (typeof fn !== 'function') { if (window.console) console.warn('Action inconnue :', el.getAttribute('data-act')); return; }
  var raw = el.getAttribute('data-args'), args = [];
  try { args = raw ? JSON.parse(raw) : []; } catch (e) { args = []; }
  fn.apply(el, args.map(function (x) { return x === '$el' ? el : x === '$ev' ? ev : x; }));
}
document.addEventListener('click', function (e) {
  var el = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
  if (el && !el.disabled) runAct(el, e);
});
document.addEventListener('keydown', function (e) {
  var el = e.target && e.target.closest ? e.target.closest('[data-key]') : null;
  if (el && typeof window[el.getAttribute('data-key')] === 'function') window[el.getAttribute('data-key')](e);
});
document.addEventListener('change', function (e) {
  var el = e.target && e.target.closest ? e.target.closest('[data-change]') : null;
  if (el && typeof window[el.getAttribute('data-change')] === 'function') window[el.getAttribute('data-change')](el);
});
// Petites actions qui étaient écrites directement dans les boutons
function appEl() { return document.getElementById('app'); }
function clearSearch() { var i = document.getElementById('searchInput'); if (i) { i.value = ''; setQuery(''); i.focus(); } }
function tClearSearch() { var i = document.getElementById('searchInput'); if (i) { i.value = ''; tSetQuery(''); i.focus(); } }
function quizHome() { state.quiz = null; renderQuiz(appEl()); }
function flashHome() { state.flash = null; renderFlash(appEl()); }
function setFlashZone(z) { state.flashZone = z; renderFlash(appEl()); }
function setFlashCat(c) { state.flashCat = c; renderFlash(appEl()); }
function setCasZone(z) { casState.zone = z; renderCas(appEl()); }
function casHome() { casState.started = false; casState.pickedAnswers = {}; renderCas(appEl()); }
function menuImg(term) { closeDMenu(); searchImg(term); }
function menuPrint() { closeDMenu(); window.print(); }
function pickImportFile() { var f = document.getElementById('importFile'); if (f) f.click(); }
function applyPasteCode() { var t = document.getElementById('pasteCode'); applyBackupText(t ? t.value : ''); }

