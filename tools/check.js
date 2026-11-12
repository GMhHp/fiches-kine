/* Contrôle Fiches Kiné : lancer « node tools/check.js » avant chaque mise en ligne.
   Vérifie que le contenu médical n'a pas changé (empreinte), que le code se charge,
   que le quiz et les cartes se génèrent, et que le guide du bilan est intact. N'écrit rien. */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
// Empreinte de référence du contenu (fiches + cas), fixée le 11/11/2026 (ajout des fiches du sport) : à changer après une modification voulue
const REF = '82699566bb3e5d8c';
// Empreinte du guide « Faire un bilan » (data/bilan.js), fixée le 08/11/2026 : à changer après une modification voulue
const REF_BILAN = '4daf02603a010b68';
const dataLines = ['data/fiches.js', 'data/cas.js'].map(f => read(f).split('\n').find(l => /^const (ALL_FICHES|CAS_CLINIQUES) = /.test(l)));
const hash = crypto.createHash('sha256').update(dataLines.join('\n') + '\n').digest('hex').slice(0, 16);
let ok = true;
const say = (good, msg) => { console.log((good ? '✓ ' : '✗ ') + msg); if (!good) ok = false; };
say(hash === REF, 'Contenu médical ' + (hash === REF ? 'inchangé' : 'MODIFIÉ (empreinte ' + hash + ', attendue ' + REF + ')'));
// Ordre de chargement = celui de index.html
const html = read('index.html');
const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
const store = {};
const el = () => ({ classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, removeAttribute() {}, addEventListener() {}, appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; }, style: {}, innerHTML: '', textContent: '' });
const ctx = { console, setTimeout: () => 0, clearTimeout() {}, location: { protocol: 'file:', hash: '', href: 'file:///index.html' }, history: { replaceState() {}, pushState() {} },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; } },
  navigator: { userAgent: 'node', platform: 'node', maxTouchPoints: 0 }, matchMedia: () => ({ matches: false, addEventListener() {} }),
  document: { body: el(), documentElement: el(), getElementById: () => el(), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, createElement: el }, addEventListener() {} };
ctx.window = ctx; vm.createContext(ctx);
try {
  scripts.forEach(f => vm.runInContext(read(f), ctx, { filename: f }));
  say(true, scripts.length + ' fichiers de code chargés sans erreur');
  const r = vm.runInContext('({ fiches: ALL_FICHES.length, cas: CAS_CLINIQUES.length, quiz: buildQuiz(ALL_FICHES).length, cartes: buildFlashcards(ALL_FICHES.filter(f => !f.stub)).length })', ctx);
  say(r.fiches === 98 && r.cas === 57, r.fiches + ' fiches, ' + r.cas + ' cas cliniques');
  say(r.quiz > 850, r.quiz + ' questions de quiz générées');
  say(r.cartes > 2000, r.cartes + ' cartes générées');
  // Guide du bilan : contenu inchangé, étapes et liens qui mènent quelque part
  const g = vm.runInContext('({ json: JSON.stringify(BILAN_GUIDE), keys: BILAN_GUIDE.tabs.map(t => t.key), ids: ALL_FICHES.map(f => f.id) })', ctx);
  const hB = crypto.createHash('sha256').update(g.json).digest('hex').slice(0, 16), G = JSON.parse(g.json), bad = [];
  say(hB === REF_BILAN, 'Guide du bilan ' + (hB === REF_BILAN ? 'inchangé' : 'MODIFIÉ (empreinte ' + hB + ', attendue ' + REF_BILAN + ')'));
  G.tabs.forEach(t => t.parts.forEach(p => {
    if (p.t === 'steps') p.items.forEach(s => { if (!g.keys.includes(s.key)) bad.push('étape « ' + s.key + ' »'); });
    if (p.t === 'links') p.items.forEach(l => { const id = l.action.startsWith('fiche:') ? l.action.slice(6) : ''; if (l.action !== 'tests' && !g.ids.includes(id)) bad.push('lien « ' + l.action + ' »'); });
  }));
  say(!bad.length, G.tabs.length + ' sections dans le guide du bilan' + (bad.length ? ', liens cassés : ' + bad.join(', ') : ', liens valides'));
} catch (e) { say(false, 'Erreur au chargement : ' + e.message); }
// Même numéro de version dans sw.js et index.html
const vSw = (read('sw.js').match(/const VERSION = '([^']+)'/) || [])[1];
const vApp = (html.match(/name="app-version" content="([^"]+)"/) || [])[1];
say(!!vSw && vSw === 'fiches-kine-' + vApp, 'Version : sw.js « ' + vSw + ' », index.html « ' + vApp + ' »');
process.exit(ok ? 0 : 1);
