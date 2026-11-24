# Constitution — borne de commande Bun & Co

## Principes fondamentaux

### I. Accessibilité RGAA 4.1 (NON NÉGOCIABLE)

Le référentiel appliqué est le RGAA 4.1. La conformité se vérifie à chaque contribution,
jamais en fin de projet.

Tout élément interactif est atteignable et actionnable au clavier seul, dans un ordre de
tabulation conforme à l'ordre visuel. La prise de focus est toujours visible : une règle
`outline: none` sans remplacement explicite fait échouer la revue. Les cibles tactiles
mesurent au moins 44 × 44 pixels. Les contrastes atteignent 4.5:1 pour le texte et 3:1
pour les composants d'interface, valeurs mesurées et non estimées. Aucune information
n'est portée par la couleur seule. Chaque changement d'état du panier est restitué par une
région `aria-live="polite"`, chaque erreur par `role="alert"`. Chaque option de produit
porte une étiquette explicite liée à son contrôle.

Une interface livrée sans accès clavier, sans étiquette ou sans contraste suffisant est
refusée, même si ses tests unitaires passent.

*Raison* : une borne en libre-service est le seul moyen de commander dans certains
restaurants. Son inaccessibilité exclut purement et simplement une partie des clients.

### II. Domaine métier pur et isolé

La logique métier vit dans `app/domain/`, sous forme de types et de fonctions pures. Elle
ne connaît ni Vue, ni le DOM, ni `window`, ni aucune API de navigateur. Les prix, les
règles de menu, les règles de personnalisation et les mutations de panier appartiennent à
cette couche et à elle seule.

Les composants affichent et émettent. Ils ne calculent pas de prix et ne décident pas de
règles de menu. Un calcul trouvé dans un composant est un défaut, pas un raccourci.

Tout accès au monde extérieur passe par un port déclaré dans `app/domain/ports.ts`, dont
les implémentations vivent dans `app/infrastructure/`.

*Raison* : les règles tarifaires sont la partie la plus susceptible de changer et la plus
coûteuse à casser. Isolées et pures, elles se testent sans navigateur et se relisent sans
contexte.

### III. Hébergement statique assumé

L'application est générée en statique et servie par GitHub Pages. Aucun serveur
applicatif, aucune base de données, aucune route serveur Nitro.

L'état de la commande en cours vit dans `sessionStorage` : la commande survit à un
rafraîchissement accidentel et disparaît à la fin de la session. Une borne ne doit jamais
présenter au client suivant le panier du client précédent.

Introduire un serveur applicatif constitue une révision majeure de cette constitution, pas
une décision d'implémentation.

*Raison* : le besoin réel d'une borne est local — un appareil, une session, un client. Un
backend n'apporterait ici aucune fonction, seulement une dépendance d'exécution qui
contredit la cible de déploiement.

### IV. Simplicité contrainte

Aucune dépendance n'est ajoutée sans besoin démontré par un cas d'usage présent dans la
spécification. Aucune abstraction n'est créée pour un unique appelant. Aucun code non
appelé n'est conservé, y compris une option de configuration devenue inutile.

Un seul système décrit chaque axe du projet : les lots sont des jalons GitHub, les types de
travail sont des étiquettes, l'avancement est l'état des issues. Une information redite en
deux endroits est un défaut à corriger, pas une redondance utile.

*Raison* : un projet lisible se maintient. Chaque abstraction prématurée et chaque système
en double se paient à chaque modification ultérieure.

### V. Vérification automatisée à chaque commit

Le dépôt reste dans un état où l'intégration continue passe, commit après commit. La
chaîne de vérification comprend le typage TypeScript en mode strict, l'analyse statique,
les tests unitaires du domaine et des composables, les tests end-to-end du parcours, et un
audit axe-core sur chaque écran traversé.

Les tests unitaires portent sur le comportement : règles de calcul, transitions d'état,
cas limites. Les tests de snapshot de markup sont interdits, car ils cassent au moindre
changement de style sans rien démontrer.

Un pipeline rouge bloque la fusion. Il n'est jamais contourné ; il est réparé.

*Raison* : la conformité RGAA et la justesse des calculs tarifaires ne se constatent pas à
l'œil sur sept écrans et des dizaines de combinaisons d'options.

## Contraintes techniques

Nuxt 4 en génération statique, TypeScript en mode strict. SCSS organisé en ITCSS, dans
l'ordre `1-settings`, `2-tools`, `3-generic`, `4-elements`, `5-objects`, `6-components`,
`7-utilities` ; la spécificité ne décroît jamais d'une couche à la suivante. Composants
organisés en Atomic Design, un composant ne consommant que des composants de niveau
inférieur.

Conception mobile first : les media queries utilisent exclusivement `min-width`.

Aucun framework utilitaire de classes, incompatible avec la discipline ITCSS. Les tokens de
design sont déclarés en `1-settings`, sous forme de variables SCSS et de custom properties.

Le référencement se limite à la page vitrine : métadonnées, Open Graph, URL canonique,
données structurées `Restaurant` et `Menu`, `robots.txt` et `sitemap.xml` générés au
build. Le parcours de commande n'est pas optimisé pour la recherche, faute d'intention de
recherche correspondante.

Les allergènes des 14 catégories réglementaires (règlement INCO 1169/2011) sont une donnée
obligatoire de chaque produit, affichée sur la fiche produit et restituée au lecteur
d'écran.

## Processus de développement

Le travail avance par lots, un lot à la fois, matérialisés par les jalons GitHub « Lot 0 »
à « Lot 10 ». Chaque unité de travail est une issue portant un type et un jalon.

Les commits suivent les Conventional Commits, sujet en français à l'impératif, un commit
par unité de sens. `main` reste toujours déployable.

Les spécifications précèdent l'implémentation. Un écart entre le code livré et la
spécification se résout en corrigeant l'un ou en amendant l'autre, jamais en laissant les
deux divergents.

## Gouvernance

Cette constitution prime sur toute autre pratique du projet. En cas de conflit entre un
principe et une facilité d'implémentation, le principe gagne.

Un amendement se fait par modification de ce document, accompagnée de la raison du
changement. La version suit le versionnage sémantique : MAJEUR pour la suppression ou la
redéfinition incompatible d'un principe, MINEUR pour l'ajout d'un principe ou d'une section,
CORRECTIF pour une clarification sans effet sur le fond.

Toute demande de fusion vérifie le respect des cinq principes. Toute complexité ajoutée se
justifie explicitement dans la demande de fusion. Les règles d'application au quotidien
sont consignées dans `CLAUDE.md` à la racine du dépôt, qui ne peut pas contredire ce
document.

**Version** : 1.0.0 | **Ratifiée** : 2026-11-24 | **Dernier amendement** : 2026-11-24
