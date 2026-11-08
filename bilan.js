/* Fiches Kiné — contenu du guide « Faire un bilan » (écran Tests → Méthode du bilan).
   Sources vérifiées le 8 novembre 2026 : voir la section « Sources » (dernière section).
   Chaque section (tabs) : key (adresse #/bilan/<key>), num (numéro d'étape, facultatif), label, parts.
   Types de blocs : callout (encadré), steps (étapes cliquables vers une section), bloc (titre + liste),
   quotes (questions entre guillemets), tools (nom + texte), cif (tableau CIF), cards (cartes),
   links ('tests' ou 'fiche:<id>'), template (trame à copier), sources (url vide → bouton « rechercher »).
   **gras** possible dans les textes. Après modification : mettre à jour REF_BILAN dans tools/check.js. */
const BILAN_GUIDE = {
  tabs: [
    {
      key: "apercu", label: "Vue d'ensemble",
      parts: [
        { t: "callout", text: "Un bon bilan n'est pas une liste de tests : c'est un **raisonnement**. L'anamnèse fait naître les hypothèses, l'examen les vérifie, la synthèse décide de la suite." },
        { t: "steps", items: [
          { key: "preparer", titre: "Préparer", txt: "Lire la prescription et les comptes rendus, connaître son cadre (prescription ou accès direct), préparer les questionnaires." },
          { key: "anamnese", titre: "Anamnèse", txt: "Motif et attentes, histoire, douleur, irritabilité, fonction (PSFS), contexte de vie." },
          { key: "drapeaux", titre: "Drapeaux", txt: "Signes d'alerte (rouges) chez tous les patients, facteurs de chronicité (jaunes, bleus, noirs)." },
          { key: "hypotheses", titre: "Hypothèses", txt: "Deux ou trois hypothèses, sévérité et irritabilité (SINSS), mécanisme de la douleur, plan de l'examen." },
          { key: "examen", titre: "Examen", txt: "Examen ciblé : observation, geste qui pose problème, mobilité, force, neurologique si besoin, tests spécifiques, palpation." },
          { key: "diagnostic", titre: "Diagnostic kiné", txt: "Synthèse selon la CIF et décision : traiter, traiter en informant le médecin, ou réorienter." },
          { key: "objectifs", titre: "Objectifs", txt: "Objectifs SMART décidés avec le patient, plan de soins, auto-exercices." },
          { key: "suivi", titre: "Suivi", txt: "Astérisques retestés à chaque séance, questionnaires, bilan de fin, transmission au médecin." }
        ] },
        { t: "bloc", titre: "Règles d'or", items: [
          "Une **hypothèse avant chaque test** : on ne teste que ce qui peut changer la décision.",
          "Les **drapeaux rouges** se recherchent chez tous les patients, avant de traiter.",
          "Un **test isolé** ne fait pas un diagnostic : tenir compte de la Se/Sp, des clusters et du contexte.",
          "Mesurer ce qui compte pour le patient (**PSFS**, astérisques) et le **retester**.",
          "**Tracer** : bilan dans le dossier, fiche de synthèse ou compte rendu au médecin."
        ] },
        { t: "bloc", titre: "Pièges fréquents", items: [
          "Faire tous les tests de la région « au cas où », sans hypothèse.",
          "Conclure sur un test isolé ou sur l'imagerie seule.",
          "Oublier les astérisques : sans mesure de départ, impossible de savoir si le traitement marche.",
          "Fixer les objectifs à la place du patient.",
          "Ne pas expliquer le bilan au patient."
        ] }
      ]
    },
    {
      key: "preparer", num: 1, label: "Préparer",
      parts: [
        { t: "bloc", titre: "Le cadre", items: [
          "**Sur prescription** : le kiné établit un bilan qui comprend le **diagnostic kinésithérapique**, les **objectifs de soins** et le **choix des actes et des techniques** ; il est tenu à la disposition du médecin prescripteur (CSP, art. R4321-2).",
          "**Fiche de synthèse** au prescripteur : en fin de traitement si 10 séances ou plus, et dès qu'il faut modifier le traitement ou qu'une complication apparaît (art. R4321-2).",
          "**Accès direct** (loi du 19 mai 2023, art. L4321-1) : établissements de santé, établissements médico-sociaux et structures d'exercice coordonné (MSP, centres de santé, ESP) ; en CPTS, dans le cadre d'une expérimentation.",
          "Sans diagnostic médical préalable : **8 séances au maximum** (dans les 3 mois suivant la première, selon l'Assurance maladie) ; **bilan initial et compte rendu** adressés au patient et au médecin traitant, et reportés dans le DMP (art. L4321-1).",
          "Le dossier du patient comporte notamment : histoire de la maladie, comptes rendus d'examens, projet du patient, bilans datés, diagnostic kinésithérapique, objectifs, traitement, évaluation des résultats et compte rendu de fin de traitement (ANAES 2000)."
        ] },
        { t: "bloc", titre: "Avant la séance", items: [
          "Lire la prescription et les comptes rendus (opératoire, imagerie, hospitalisation) ; noter les consignes du chirurgien (appui, amplitudes autorisées, attelle, délais).",
          "Préparer le matériel : goniomètre ou inclinomètre, mètre ruban, marteau à réflexes, chronomètre, dynamomètre si disponible.",
          "Faire remplir en salle d'attente les questionnaires utiles (ex. : STarT Back pour une lombalgie, schéma de la douleur).",
          "Prévoir de quoi exposer la zone examinée ; expliquer le déroulé de la séance et recueillir le consentement."
        ] }
      ]
    },
    {
      key: "anamnese", num: 2, label: "Anamnèse",
      parts: [
        { t: "callout", text: "Laisser le patient raconter, puis préciser. C'est l'anamnèse qui fait naître les hypothèses : l'examen physique sert ensuite à les vérifier." },
        { t: "bloc", titre: "Motif et attentes", items: [
          "« Qu'est-ce qui vous amène ? Qu'attendez-vous de la kiné ? » : noter les mots du patient.",
          "Ce qu'il ne peut plus faire et voudrait refaire : c'est la base des objectifs."
        ] },
        { t: "bloc", titre: "Histoire du problème", items: [
          "Début (date), mécanisme (traumatique, progressif, sans cause apparente), évolution (mieux, stable, pire), épisodes antérieurs.",
          "Examens et traitements déjà faits, et leur effet."
        ] },
        { t: "bloc", titre: "Douleur et symptômes", items: [
          "Localisation sur un **schéma corporel** : zone principale, irradiations, paresthésies, zones sans symptôme.",
          "Intensité sur une **échelle numérique** (EN 0-10) : maintenant, au pire et au mieux sur 24 h.",
          "Comportement sur 24 h : **mécanique** (calmée par le repos) ou **inflammatoire** (réveil nocturne, raideur matinale prolongée) ; facteurs aggravants et soulageants.",
          "**Irritabilité** : quelle activité déclenche les symptômes, à quelle intensité, et combien de temps faut-il pour qu'ils se calment ?"
        ] },
        { t: "bloc", titre: "Fonction et participation", items: [
          "**PSFS** (Patient-Specific Functional Scale) : le patient cite 3 à 5 activités difficiles et les cote de 0 (impossible) à 10 (comme avant le problème).",
          "Travail (poste, arrêt), sport, loisirs, sommeil, rôle familial."
        ] },
        { t: "bloc", titre: "Santé et contexte", items: [
          "Antécédents médicaux et chirurgicaux, comorbidités, traitements (anticoagulants, corticoïdes, bisphosphonates…).",
          "Mode de vie (activité physique, sommeil, tabac), environnement (escaliers, aidants, aides techniques).",
          "Représentations : « D'après vous, qu'est-ce qui se passe ? Qu'est-ce qui vous inquiète ? »"
        ] },
        { t: "quotes", titre: "Questions utiles", items: [
          "Montrez-moi où vous avez mal. Est-ce que ça descend quelque part ?",
          "Qu'est-ce qui aggrave ? Qu'est-ce qui soulage ?",
          "Comment sont vos nuits ? Et le matin au réveil ?",
          "Qu'aimeriez-vous pouvoir refaire en premier ?"
        ] }
      ]
    },
    {
      key: "drapeaux", num: 3, label: "Drapeaux",
      parts: [
        { t: "callout", text: "Un drapeau rouge isolé est rarement informatif : c'est la **combinaison** des signes, dans le contexte du patient (âge, antécédents), qui fait monter la suspicion (IFOMPT 2020)." },
        { t: "bloc", titre: "Drapeaux rouges à rechercher chez tous", items: [
          "Antécédent de cancer, perte de poids inexpliquée, altération de l'état général.",
          "Fièvre, contexte infectieux, immunodépression, toxicomanie intraveineuse.",
          "Traumatisme important, ostéoporose, corticothérapie prolongée (fracture).",
          "Douleur non mécanique, constante ou nocturne, qui s'aggrave malgré le repos et les traitements.",
          "Signes neurologiques étendus ou qui progressent ; troubles sphinctériens ou anesthésie en selle (urgence).",
          "Signes vasculaires : douleur thoracique, essoufflement inhabituel, mollet chaud et gonflé, signes d'AVC.",
          "Chaque fiche de l'appli détaille les drapeaux propres à la pathologie (onglet Drapeaux)."
        ] },
        { t: "bloc", titre: "Que faire ? (IFOMPT 2020)", items: [
          "🚨 **Urgence, le jour même** : suspicion de syndrome de la queue de cheval, infection avec atteinte générale et signes neurologiques.",
          "**Urgent, en quelques jours** (5 jours à titre indicatif) : suspicion de cancer, par exemple douleur nocturne qui s'aggrave chez un patient aux antécédents de cancer.",
          "**Faible suspicion** : traiter et surveiller, avec des **consignes de sécurité** (quels signes doivent faire reconsulter, quoi faire, dans quel délai).",
          "Noter la recherche des drapeaux et la décision dans le dossier ; informer le médecin."
        ] },
        { t: "bloc", titre: "Drapeaux jaunes, bleus et noirs", items: [
          "**Jaunes** (la personne) : croyance que la douleur est dangereuse, peur du mouvement et évitement, catastrophisme, humeur dépressive, attente d'un traitement passif.",
          "**Bleus** (le travail) : travail perçu comme pénible ou nocif, manque de soutien, insatisfaction.",
          "**Noirs** (le contexte) : litiges, règles d'indemnisation, contraintes de l'employeur ou du système de soins.",
          "Les repérer tôt et les **prendre en charge** donne de meilleurs résultats que de les ignorer (Nicholas 2011)."
        ] },
        { t: "tools", titre: "Outils de repérage", items: [
          { nom: "STarT Back", txt: "Lombalgie : risque faible, moyen ou élevé de chronicité ; oriente l'intensité de la prise en charge (Hill 2011)." },
          { nom: "Örebro, version courte", txt: "10 items, toutes régions : risque d'incapacité au travail ; score > 50 sur 100 = risque plus élevé (Linton 2011)." },
          { nom: "Tampa, PCS, HADS", txt: "Si besoin : peur du mouvement (kinésiophobie), catastrophisme, anxiété et dépression." }
        ] }
      ]
    },
    {
      key: "hypotheses", num: 4, label: "Hypothèses",
      parts: [
        { t: "callout", text: "Avant de toucher le patient, formuler **2 ou 3 hypothèses** et décider de ce qu'il faut tester pour les confirmer ou les écarter." },
        { t: "bloc", titre: "Estimer la présentation : SINSS", items: [
          "**Sévérité** : intensité des symptômes et retentissement ; règle l'intensité de l'examen.",
          "**Irritabilité** : si peu d'activité suffit à déclencher des symptômes forts et longs à se calmer, l'irritabilité est élevée → examen court, peu de répétitions, pas de provocation inutile.",
          "**Nature** : type de problème et de douleur, drapeaux, limites du champ de compétence.",
          "**Stade** : depuis quand, phase de cicatrisation.",
          "**Stabilité** : en amélioration, stable, en aggravation ou fluctuant.",
          "Cadre utile mais subjectif, qui ne pose pas un diagnostic à lui seul (Petersen 2021)."
        ] },
        { t: "bloc", titre: "Catégories d'hypothèses (Jones)", items: [
          "Capacités et restrictions d'activité et de participation.",
          "Composantes psychosociales : croyances, émotions, attentes.",
          "Classification du problème : source probable des symptômes et mécanisme de la douleur.",
          "Déficiences de fonction ou de structure à mesurer.",
          "Facteurs qui ont favorisé ou entretiennent le problème (charge, mode de vie, comorbidités).",
          "Précautions et contre-indications à l'examen et au traitement.",
          "Choix et progression du traitement ; pronostic."
        ] },
        { t: "bloc", titre: "Mécanisme de la douleur dominant", items: [
          "**Nociceptive** : douleur localisée, proportionnée, liée à des mouvements ou des charges précis.",
          "**Neuropathique** : lésion ou maladie du système nerveux somatosensoriel ; douleur dans un territoire neurologique cohérent, souvent avec brûlures, décharges ou paresthésies.",
          "**Nociplastique** : douleur liée à une nociception altérée sans lésion tissulaire ou nerveuse suffisante pour l'expliquer ; critères IASP 2021 : plus de 3 mois, distribution régionale ou diffuse, hypersensibilité à la douleur, souvent sommeil perturbé, fatigue, sensibilité à la lumière ou au bruit (Kosek 2021).",
          "Plusieurs mécanismes peuvent coexister : retenir le **dominant**, car il oriente la prise en charge."
        ] },
        { t: "bloc", titre: "Planifier l'examen", items: [
          "Lister ce qu'il faut voir **aujourd'hui** (drapeaux, astérisques, tests qui changent la décision) et ce qui peut attendre une séance suivante.",
          "Irritabilité élevée : examen limité, en commençant par le moins provocant."
        ] }
      ]
    },
    {
      key: "examen", num: 5, label: "Examen",
      parts: [
        { t: "callout", text: "Examiner pour **vérifier les hypothèses**, pas pour tout tester. Comparer au côté sain et retenir 2 ou 3 **astérisques** à retester." },
        { t: "bloc", titre: "Ordre conseillé", items: [
          "**Observation** : posture, attitude antalgique, gonflement, cicatrice, amyotrophie, aides techniques, façon de bouger.",
          "**Geste qui pose problème** : faire reproduire l'activité limitante (s'asseoir, monter une marche, lever le bras) ; c'est souvent le premier astérisque.",
          "**Mobilité active puis passive** : amplitude (goniomètre, inclinomètre), qualité du mouvement, douleur, sensation de fin de mouvement.",
          "**Force** : testing manuel (0 à 5), dynamomètre si possible, nombre de répétitions ; comparer au côté sain.",
          "**Examen neurologique** si symptômes distaux ou suspicion radiculaire : sensibilité, force par myotome, réflexes, tests neurodynamiques.",
          "**Tests spécifiques** choisis selon les hypothèses, puis **palpation**, en dernier et ciblée.",
          "**Tests fonctionnels** selon le profil : se relever d'une chaise, TUG, appui unipodal, sauts, test de marche."
        ] },
        { t: "bloc", titre: "Bien interpréter un test", items: [
          "Test très **sensible** et négatif → aide à **exclure** ; test très **spécifique** et positif → aide à **confirmer**.",
          "Préférer les **clusters** (association de tests) à un test isolé, et tenir compte de la probabilité avant le test.",
          "Un test n'est positif que s'il reproduit la **douleur familière** du patient, ou le signe recherché."
        ] },
        { t: "bloc", titre: "Astérisques (signes de comparaison)", items: [
          "Mesures simples et reproductibles, liées à la plainte principale : amplitude douloureuse, geste fonctionnel, EN pendant un mouvement.",
          "Les noter précisément (« flexion d'épaule 120°, douleur 6/10 ») et les retester après une intervention et à chaque séance."
        ] },
        { t: "links", items: [
          { label: "Ouvrir la section Tests", action: "tests" }
        ] }
      ]
    },
    {
      key: "diagnostic", num: 6, label: "Diagnostic",
      parts: [
        { t: "callout", text: "Le **diagnostic kinésithérapique** décrit le problème de fonctionnement du patient et fonde les objectifs ; il ne remplace pas le diagnostic médical." },
        { t: "cif", titre: "Synthèse selon la CIF (OMS 2001)", rows: [
          { k: "Déficiences", d: "Problèmes de fonction ou de structure", ex: "Flexion de genou limitée à 90°, quadriceps à 4/5, douleur 6/10 dans l'escalier." },
          { k: "Limitations d'activité", d: "Difficultés à réaliser une tâche", ex: "Monter les escaliers, s'accroupir, marcher plus de 20 min." },
          { k: "Restrictions de participation", d: "Difficultés dans les situations de vie", ex: "Arrêt du football, poste de travail aménagé." },
          { k: "Facteurs environnementaux", d: "Environnement physique, social, attitudes", ex: "3e étage sans ascenseur (obstacle), famille présente (facilitateur)." },
          { k: "Facteurs personnels", d: "Caractéristiques de la personne", ex: "Motivation, peur de se blesser à nouveau, croyances." }
        ] },
        { t: "bloc", titre: "Compléter avec", items: [
          "Hypothèse principale et mécanisme de la douleur dominant ; sévérité et irritabilité.",
          "Facteurs de risque de chronicité et pronostic attendu."
        ] },
        { t: "bloc", titre: "Décider", items: [
          "**Traiter** : la présentation relève de la kinésithérapie.",
          "**Traiter et informer le médecin** : doute, évolution inhabituelle, élément nouveau.",
          "**Réorienter** : drapeau rouge, problème hors du champ de compétence, ou absence d'amélioration (en accès direct : retour vers le médecin traitant)."
        ] },
        { t: "bloc", titre: "Expliquer au patient", items: [
          "Restituer le bilan avec des mots simples : ce qui est probable, ce qui est rassurant, ce qui va être fait et pourquoi."
        ] }
      ]
    },
    {
      key: "objectifs", num: 7, label: "Objectifs",
      parts: [
        { t: "callout", text: "Les objectifs partent du **patient** : ce qu'il veut refaire, traduit en résultats mesurables." },
        { t: "bloc", titre: "Objectifs SMART", items: [
          "**Spécifique** : une activité précise (« monter les 3 étages chez moi »).",
          "**Mesurable** : un critère (PSFS, temps, amplitude, EN).",
          "**Atteignable** et **réaliste** : compte tenu du pronostic, de la cicatrisation et des contraintes.",
          "**Temporel** : une échéance (« dans 4 semaines »)."
        ] },
        { t: "bloc", titre: "Décider ensemble (HAS 2013)", items: [
          "**Échanger** les informations : ce que montre le bilan, les options, ce que souhaite le patient.",
          "**Délibérer** : aider le patient à peser les options et à exprimer ses préférences (fréquence, auto-exercices, contraintes).",
          "**Décider** d'un commun accord, et l'écrire dans le dossier."
        ] },
        { t: "bloc", titre: "Plan de soins", items: [
          "Objectifs à court terme (douleur, mobilité, confiance) et à moyen terme (activités, reprise).",
          "Moyens choisis (exercices, éducation, thérapie manuelle…) cohérents avec les recommandations de la fiche de la pathologie.",
          "Programme d'auto-exercices simple, critères de progression ou d'arrêt.",
          "Consignes de sécurité : ce qui doit faire reconsulter."
        ] }
      ]
    },
    {
      key: "suivi", num: 8, label: "Suivi",
      parts: [
        { t: "callout", text: "Réévaluer, c'est vérifier que le **raisonnement** était juste : si ça ne s'améliore pas, revenir aux hypothèses." },
        { t: "bloc", titre: "À chaque séance", items: [
          "Retester les **astérisques** et l'EN ; noter ce qui a changé depuis la dernière séance.",
          "Progresser si ça s'améliore ; revoir les hypothèses si ça stagne ou s'aggrave."
        ] },
        { t: "tools", titre: "Repères de changement important", items: [
          { nom: "EN douleur (0-10)", txt: "Une baisse d'environ 2 points ou de 30 % correspond à un changement cliniquement important (Farrar 2001, douleur chronique)." },
          { nom: "PSFS", txt: "Une hausse d'environ 2 points de la moyenne est souvent retenue ; les seuils varient selon les études (de 1,2 à 2,2 points)." },
          { nom: "Questionnaires de région", txt: "ODI, KOOS, DASH… : utiliser leur propre seuil de changement important (onglet Bilan de chaque fiche)." }
        ] },
        { t: "bloc", titre: "Bilans intermédiaire et de fin", items: [
          "Bilan intermédiaire si l'évolution s'écarte du pronostic, ou avant une étape (reprise du travail, du sport).",
          "Bilan de fin : résultats sur chaque objectif, conseils pour la suite, auto-exercices."
        ] },
        { t: "bloc", titre: "Transmettre", items: [
          "**Fiche de synthèse** au prescripteur : en fin de traitement si 10 séances ou plus, ou si le traitement change ou se complique (art. R4321-2).",
          "**Accès direct** : bilan initial et compte rendu des soins au patient et au médecin traitant, reportés dans le DMP (art. L4321-1).",
          "En accès direct, sans amélioration : réorienter vers le médecin traitant (guide FFMKR 2025)."
        ] }
      ]
    },
    {
      key: "adapter", label: "Adapter",
      parts: [
        { t: "callout", text: "La trame reste la même ; ce qui change, c'est la **priorité** de chaque étape selon le patient." },
        { t: "cards", items: [
          { titre: "Douleur aiguë, très irritable", items: [
            "Priorité aux drapeaux et à la réassurance ; examen court et peu provocant.",
            "Reporter les tests non indispensables ; conseils pour rester actif."
          ] },
          { titre: "Douleur persistante (plus de 3 mois)", items: [
            "Approche biopsychosociale approfondie : croyances, peurs, sommeil, stress (questionnaires).",
            "Penser au mécanisme nociplastique ; objectifs centrés sur les activités ; éducation à la douleur."
          ] },
          { titre: "Après une chirurgie", items: [
            "Compte rendu opératoire et consignes du chirurgien : appui, amplitudes autorisées, attelle, délais.",
            "Cicatrice, œdème, douleur ; surveiller les signes de phlébite et d'infection ; respecter les délais de cicatrisation (voir la fiche post-op correspondante)."
          ] },
          { titre: "Neurologie", items: [
            "Échelles validées selon la pathologie (équilibre, vitesse de marche, spasticité…) ; motricité, sensibilité, équilibre, fatigue, cognition.",
            "Objectifs centrés sur l'autonomie (voir les fiches Neurologie)."
          ] },
          { titre: "Personne âgée, chutes", items: [
            "Chutes répétées : au moins 2 en 12 mois. Tests : Romberg, appui unipodal, Timed Up and Go, se relever d'une chaise sans les mains.",
            "Trouble de la marche ou de l'équilibre si TUG ≥ 20 s et/ou appui unipodal ≤ 5 s (HAS 2009) ; peur de tomber, capacité à se relever du sol, domicile."
          ] },
          { titre: "Sportif, retour au sport", items: [
            "Charge d'entraînement, geste sportif, échéances de reprise.",
            "Force mesurée (dynamomètre), tests de saut et d'agilité, confiance (ex. : ACL-RSI après ligamentoplastie) ; critères objectifs avant la reprise."
          ] },
          { titre: "Enfant et adolescent", items: [
            "Recueillir l'histoire avec l'enfant et ses parents ; croissance, activités, sport.",
            "Examen ludique ; drapeaux pédiatriques (boiterie fébrile, douleur nocturne) : voir les fiches Pédiatrie."
          ] }
        ] }
      ]
    },
    {
      key: "exemple", label: "Exemple",
      parts: [
        { t: "callout", text: "**M. D., 42 ans, magasinier**, adressé pour une lombalgie apparue il y a 3 semaines en soulevant un carton. Exemple fictif, pour illustrer la démarche." },
        { t: "bloc", titre: "1. Préparer", items: [
          "Prescription de rééducation pour lombalgie, sans imagerie. STarT Back rempli en salle d'attente : risque moyen."
        ] },
        { t: "bloc", titre: "2. Anamnèse", items: [
          "Douleur lombaire basse sans irradiation sous le genou ; EN 6/10 au pire, 2/10 au repos ; mécanique (soulagée allongé), pas de réveil nocturne.",
          "Irritabilité modérée : assis 30 min → 6/10, calmé en 20 min.",
          "PSFS : porter un carton de 10 kg 3/10, rester assis 1 h 4/10, jouer avec ses enfants 5/10.",
          "Peur de « se bloquer » le dos ; arrêt de travail en cours."
        ] },
        { t: "bloc", titre: "3. Drapeaux", items: [
          "Rouges : aucun (pas d'antécédent de cancer, de fièvre, de perte de poids, de trouble sphinctérien ni de déficit).",
          "Jaunes : peur du mouvement, croyance d'une « lésion » du dos."
        ] },
        { t: "bloc", titre: "4. Hypothèses", items: [
          "Lombalgie commune, douleur nociceptive mécanique, irritabilité modérée.",
          "À écarter : radiculalgie (examen neurologique rapide).",
          "Facteurs contributifs : peur et évitement, contraintes du poste de travail."
        ] },
        { t: "bloc", titre: "5. Examen", items: [
          "Astérisque 1 : flexion debout, distance doigts-sol 35 cm, EN 5/10.",
          "Astérisque 2 : ramasser un objet au sol, mouvement d'évitement, EN 4/10.",
          "Neurologique normal (réflexes, force, sensibilité), Lasègue négatif."
        ] },
        { t: "bloc", titre: "6. Diagnostic kiné (CIF)", items: [
          "Déficiences : douleur lombaire mécanique (6/10 au pire), flexion lombaire limitée et douloureuse.",
          "Limitations : porter des charges, rester assis longtemps.",
          "Restrictions : arrêt de travail, jeux avec ses enfants.",
          "Facteurs : peur de se bloquer (obstacle) ; employeur prêt à aménager le poste (facilitateur).",
          "Décision : traiter ; aucun signe d'alerte ; pronostic favorable."
        ] },
        { t: "bloc", titre: "7. Objectifs (décidés avec lui)", items: [
          "Dans 4 semaines, porter un carton de 10 kg du sol à une table avec une douleur ≤ 3/10 (PSFS ≥ 7).",
          "Dans 3 semaines, rester assis 1 h sans dépasser 3/10.",
          "Plan : éducation (bénignité, rester actif), exercices progressifs de flexion et de port de charges, auto-exercices quotidiens."
        ] },
        { t: "bloc", titre: "8. Suivi", items: [
          "Astérisques retestés à chaque séance ; PSFS refait toutes les 2 semaines (amélioration nette : environ +2 points).",
          "Fiche de synthèse au prescripteur en fin de traitement si 10 séances ou plus."
        ] },
        { t: "links", items: [
          { label: "Voir la fiche Lombalgie commune", action: "fiche:lombalgie-commune" }
        ] }
      ]
    },
    {
      key: "modele", label: "Modèle",
      parts: [
        { t: "callout", text: "Trame à copier dans ton logiciel ou tes notes, puis à compléter. Elle reprend les éléments attendus du bilan et du dossier (R4321-2, ANAES 2000)." },
        { t: "template", titre: "Trame de bilan", text:
"BILAN KINÉSITHÉRAPIQUE — [initiales], [âge] ans — [date]\n" +
"Cadre : prescription du Dr [nom] du [date] / accès direct ([structure])\n\n" +
"MOTIF ET ATTENTES DU PATIENT :\n\n" +
"HISTOIRE : début [date], mécanisme [ ], évolution [ ], épisodes antérieurs [ ]\n" +
"Examens et traitements déjà faits : \n\n" +
"DOULEUR : localisation [ ] ; EN actuelle [ ]/10, au pire [ ]/10, au mieux [ ]/10\n" +
"Comportement sur 24 h : [ ] ; irritabilité : [faible / modérée / élevée]\n\n" +
"FONCTION (PSFS) : 1. [ ] [ ]/10 ; 2. [ ] [ ]/10 ; 3. [ ] [ ]/10\n" +
"Travail, sport, loisirs : \n\n" +
"ANTÉCÉDENTS, TRAITEMENTS : \n\n" +
"DRAPEAUX ROUGES : recherchés — absents / présents : [ ] → conduite : [ ]\n" +
"FACTEURS PSYCHOSOCIAUX : [ ] (questionnaire : [ ], score : [ ])\n\n" +
"EXAMEN :\n" +
"- Observation : \n" +
"- Astérisques : 1. [ ] 2. [ ]\n" +
"- Mobilité : \n" +
"- Force : \n" +
"- Neurologique : \n" +
"- Tests spécifiques : \n" +
"- Mesures et questionnaires : \n\n" +
"DIAGNOSTIC KINÉSITHÉRAPIQUE (CIF) :\n" +
"- Déficiences : \n" +
"- Limitations d'activité : \n" +
"- Restrictions de participation : \n" +
"- Facteurs environnementaux et personnels (+/-) : \n" +
"Hypothèse principale, mécanisme de la douleur, pronostic : \n" +
"Décision : traiter / traiter et informer le médecin / réorienter\n\n" +
"OBJECTIFS (SMART, décidés avec le patient) :\n" +
"1. \n2. \n\n" +
"PLAN DE SOINS : techniques, fréquence, auto-exercices, critères de réévaluation\n\n" +
"INFORMATIONS DONNÉES AU PATIENT / TRANSMISES AU MÉDECIN :\n" }
      ]
    },
    {
      key: "sources", label: "Sources",
      parts: [
        { t: "sources", items: [
          { txt: "Code de la santé publique, art. R4321-2 : bilan, diagnostic kinésithérapique, objectifs, fiche de synthèse", url: "" },
          { txt: "Code de la santé publique, art. L4321-1 : accès direct (loi n° 2023-379 du 19 mai 2023)", url: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006171311" },
          { txt: "Ordre des masseurs-kinésithérapeutes — Accès direct aux kinésithérapeutes (mise à jour 2026)", url: "https://www.ordremk.fr/actualites/kines/acces-direct-aux-kinesitherapeutes/" },
          { txt: "FFMKR — Guide pratique sur l'accès direct au kinésithérapeute, version 1, 2025", url: "https://www.ffmkr.org/assets/file_block/2025/09/22/0d3bb942-6041-4f54-a8db-5125d44ca5dd-ffmkr-guide-pratique-acces-direct-va5.pdf?s=d76132ea60b834130818e7258bf96d88" },
          { txt: "ANAES 2000 — Le dossier du patient en masso-kinésithérapie", url: "https://www.has-sante.fr/jcms/c_272084/fr/le-dossier-du-patient-en-masso-kinesitherapie" },
          { txt: "OMS 2001 — Classification internationale du fonctionnement, du handicap et de la santé (CIF)", url: "https://www.ehesp.fr/wp-content/uploads/2017/12/Presentation-CIF-2018.pdf" },
          { txt: "HAS 2013 — Patient et professionnels de santé : décider ensemble", url: "https://has-sante.fr/jcms/c_1671523/fr/patient-et-professionnels-de-sante-decider-ensemble" },
          { txt: "HAS 2009 — Évaluation et prise en charge des personnes âgées faisant des chutes répétées", url: "https://has-sante.fr/jcms/c_793371/fr/evaluation-et-prise-en-charge-des-personnes-agees-faisant-des-chutes-repetees" },
          { txt: "Finucane L et al. — International framework for red flags for potential serious spinal pathologies, IFOMPT 2020", url: "https://www.ifompt.org/site/ifompt/International%20Framework%20for%20Red%20Flags%20for%20Potential%20Serious%20Spinal%20Pathologies%20master%20copy%20.pdf" },
          { txt: "Nicholas MK et al. Phys Ther 2011 — Early identification and management of psychological risk factors (« yellow flags ») in patients with low back pain", url: "https://read.qxmd.com/read/21451099/early-identification-and-management-of-psychological-risk-factors-yellow-flags-in-patients-with-low-back-pain-a-reappraisal" },
          { txt: "Kendall N et al. — Tackling musculoskeletal problems : cadre des drapeaux jaunes, bleus et noirs (TSO)", url: "https://tsoshop.co.uk/Medical/Musculoskeletal-Medicine/About-the-Flags-Framework" },
          { txt: "Hill JC et al. Lancet 2011 — STarT Back : prise en charge stratifiée de la lombalgie (ECR)", url: "" },
          { txt: "Linton SJ et al. Spine 2011;36:1891-1895 — Örebro, version courte", url: "https://maic.qld.gov.au/outcome-measures-for-treatment-providers/orebro_musculoskeletal_pain_questionnaire-short-form/" },
          { txt: "Petersen EJ et al. J Man Manip Ther 2021;29(5):297-309 — SINSS", url: "https://www.physio-pedia.com/S.I.N.S.S" },
          { txt: "Jones MA, Rivett DA — Clinical Reasoning in Musculoskeletal Practice : catégories d'hypothèses", url: "https://www.physio-network.com/?p=92764" },
          { txt: "Kosek E et al. Pain 2021 — Critères cliniques de la douleur nociplastique (IASP) ; résumé : Reis & Chaves, BrJP 2024", url: "https://www.scielo.br/j/brjp/a/HVWbhjSMkp4Ym5cPp78Y75f/?lang=en" },
          { txt: "Farrar JT et al. Pain 2001;94(2):149-158 — Changement cliniquement important sur l'EN", url: "https://pubmed.ncbi.nlm.nih.gov/11690728/" },
          { txt: "Stratford P et al. Physiother Can 1995 — Patient-Specific Functional Scale ; seuils de changement (Shirley Ryan AbilityLab)", url: "https://www.sralab.org/rehabilitation-measures/patient-specific-functional-scale" }
        ] },
        { t: "callout", text: "Outil de révision personnel : revérifie les textes officiels en vigueur avant toute application. Inspiré aussi des trames enseignées en formation continue (anamnèse structurée, triage, examen guidé par les hypothèses, plan co-construit, suivi chiffré)." }
      ]
    }
  ]
};
