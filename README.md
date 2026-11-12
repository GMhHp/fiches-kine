# Fiches Kiné

Application de révision en kinésithérapie (fiches cliniques, cartes à répétition espacée, quiz, examen blanc, cas cliniques), installable sur téléphone et utilisable hors ligne.

## Contenu
- `index.html` : la page de l'application (petite : elle charge les fichiers ci-dessous).
- `data/fiches.js`, `data/cas.js` : **le contenu médical** (98 fiches dont 28 marquées « Sport », 57 cas cliniques).
- `data/bilan.js` : le contenu du guide « Faire un bilan » (écran Tests → Méthode du bilan), sources comprises.
- `js/` : le code de l'application.
  - `core.js` : réglages, mémoire de l'appareil, boutons.
  - `quiz-cartes.js` : fabrication des questions et des cartes à partir des fiches.
  - `recherche.js` : recherche, navigation, adresses (#/…) et bouton retour.
  - `tests.js` : écran Tests cliniques.
  - `bilan.js` : guide « Faire un bilan », ouvert depuis l'écran Tests (adresses #/bilan/…).
  - `vues.js` : écrans Fiches, Quiz, Cartes, Cas.
  - `apprentissage.js` : répétition espacée, carnet d'erreurs, Aujourd'hui, S'entraîner, examen, statistiques.
  - `progression.js` : Progression, sauvegarde, installation, démarrage.
- `css/app.css` : l'apparence.
- `manifest.webmanifest` : nom, couleurs et icônes utilisés à l'installation.
- `sw.js` : service worker qui garde l'app en mémoire pour le mode hors ligne.
- `icons/` : icônes de l'écran d'accueil.
- `tools/check.js` : contrôle avant mise en ligne (voir plus bas).

## Mettre en ligne (GitHub Pages)
1. Sur github.com : **New repository**, nom `fiches-kine`, **Public**, puis **Create repository**.
2. Lien **uploading an existing file** : glisse **tout le contenu du dossier** (fichiers et dossiers `css`, `data`, `js`, `icons`, `tools`), puis **Commit changes**.
3. **Settings → Pages** : Source **Deploy from a branch**, branche `main`, dossier `/ (root)`, **Save**.
4. Une à deux minutes plus tard, l'app est en ligne à l'adresse `https://TON-PSEUDO.github.io/fiches-kine/`.

## Installer sur iPhone
1. Dans Safari, ouvre l'ancienne version (si tu en as une) → onglet 📈 **Progression** → **Exporter un fichier**.
2. Ouvre l'adresse GitHub Pages dans Safari → **Partager** → **Sur l'écran d'accueil**.
3. Dans l'app installée → 📈 **Progression** → **Importer un fichier** (l'app installée a sa propre mémoire, séparée de Safari).

## Mettre à jour
1. Change le numéro de version **aux deux endroits, avec la même valeur** :
   - `index.html` : `<meta name="app-version" content="2026-11-11-396ce9f1">`
   - `sw.js` : `const VERSION = 'fiches-kine-2026-11-11-396ce9f1';`
2. Lance le contrôle : `node tools/check.js` (tout doit être ✓ : contenu médical inchangé, code qui se charge, quiz et cartes générés, guide du bilan intact avec des liens valides, versions identiques). Après une modification voulue du contenu (fiches, cas) ou du guide du bilan, remplace `REF` ou `REF_BILAN` dans `tools/check.js` par la nouvelle empreinte affichée.
3. Envoie les fichiers modifiés sur GitHub.

L'app s'ouvre toujours tout de suite avec la version déjà sur le téléphone. Le téléphone installe la nouvelle en arrière-plan, puis un bandeau « Nouvelle version disponible » propose de recharger (il disparaît seul après 10 s ; sinon elle s'applique à l'ouverture suivante).

## Ta progression
Tout est enregistré sur l'appareil : favoris, fiches maîtrisées, cartes (répétition espacée), carnet d'erreurs, historique, statistiques par zone, cas cliniques, série de jours. **Exporte un fichier de temps en temps** (📈 Progression → Exporter) : iPhone peut effacer la mémoire d'une app peu utilisée.
