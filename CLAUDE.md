# Instructions de développement — borne de commande Bun & Co

## Nature du projet

Borne de commande tactile pour une enseigne de restauration rapide fictive. Application
Nuxt 4 générée en statique et servie par GitHub Pages. Aucun serveur applicatif, aucune
base de données.

## Règles d'architecture

La logique métier vit dans `app/domain/` sous forme de fonctions pures et de types. Elle
ne connaît ni Vue, ni le DOM, ni le navigateur. Les prix, les règles de menu et les
mutations de panier appartiennent à cette couche.

Les composants affichent et émettent. Ils ne calculent pas de prix et ne décident pas de
règles de menu.

## Trois couches, une seule direction

```
app/pages, app/components, app/composables     interface
        ↓
app/services                                   services
        ↓
app/domain                                     métier
```

Le domaine ne connaît ni les services ni l'interface. Les services connaissent le domaine.
L'interface connaît les deux, mais passe par les composables.

Ces frontières ne sont pas seulement écrites : `eslint.config.mjs` les applique. Un import
interdit fait échouer `pnpm lint`, donc le pipeline, donc la fusion.

**Domaine**, dans `app/domain/` : types, règles, calculs. Fonctions pures, aucun catalogue
détenu, aucun accès au monde extérieur. `catalogue.ts` interroge une liste de produits qu'on
lui passe en argument ; il n'en charge aucune.

**Services**, dans `app/services/` : les données de la carte, les implémentations des ports,
la persistance. Ce que l'enseigne vend aujourd'hui relève du service, pas du métier.

**Interface**, dans `app/pages/`, `app/components/` et `app/composables/` : affichage et
adaptation à Vue. Un composable ne contient aucune règle métier.

Les accès au monde extérieur passent par un port déclaré dans `app/domain/ports.ts` et une
implémentation dans `app/services/`. La version 1 persiste la commande dans
`sessionStorage`, comportement attendu d'une borne : la commande ne doit pas survivre au
client suivant.

Le catalogue est servi par une route Nitro préconstruite, `server/api/catalogue.json.get.ts`,
déclarée dans `nitro.prerender.routes` et donc écrite en fichier statique au build. Le
client la consomme par la passerelle, jamais par un `fetch` écrit dans un composant.

L'extension `.json` du nom de fichier est délibérée : un hébergeur statique déduit le type
de contenu de l'extension, et une route sans extension est servie en
`application/octet-stream`, que `$fetch` rend alors sous forme de chaîne.

L'URL d'appel doit être préfixée par `useRuntimeConfig().app.baseURL` : sur GitHub Pages le
site est servi sous `/bun-and-co/`, et une URL absolue partant de la racine renvoie un 404.
Ce préfixe est appliqué dans la passerelle, à un seul endroit.

Le calcul tarifaire reste local et synchrone. Aucun prix n'est demandé au réseau.

## Montants

Les montants sont manipulés en centimes entiers partout dans le domaine. `5.90 + 1.20 +
0.80` vaut `7.9000000000000004` en JavaScript, et l'erreur s'accumule au fil des lignes du
panier.

Les types portent l'unité dans leur nom, par exemple `prixCentimes`. La conversion en euros
a lieu au seul moment de l'affichage, par `Intl.NumberFormat('fr-FR', { style: 'currency',
currency: 'EUR' })`, dans `app/utils/format-euros.ts`. Aucun autre module ne divise un
montant par cent.

`app/utils/` ne reçoit que des fonctions pures d'affichage, partagées par au moins deux
appelants. Ce qui dépend de Vue ou d'un service relève d'un composable, et `eslint.config.mjs`
applique la frontière.

## Composants

Atomic Design dans `app/components/atoms`, `molecules` et `organisms`. Un composant ne
consomme que des composants de niveau strictement inférieur, règle appliquée par
`pnpm component-levels` : les composants sont auto-importés sans préfixe de dossier, donc
aucun gabarit n'écrit d'import, et ESLint ne voit pas la composition.

Chaque composant livré figure dans l'atelier, `app/pages/workshop.vue`, avec ses états.

## Styles

SCSS organisé en ITCSS, dans l'ordre `1-settings`, `2-tools`, `3-generic`, `4-elements`,
`5-objects`, `6-components`, `7-utilities`.

L'ordre de la cascade est appliqué par les couches natives `@layer`, déclarées une seule
fois en tête de la feuille principale. Une règle d'une couche basse ne peut donc pas
l'emporter sur une couche haute, quelle que soit sa spécificité. La structure de dossiers
ITCSS reste le plan de classement ; `@layer` en est la garantie technique.

Mobile first : les media queries utilisent `min-width` uniquement.

Pas de framework utilitaire de classes, qui entrerait en conflit avec ITCSS. Les tokens de
design sont des variables SCSS et des custom properties déclarées en `1-settings`.

Les styles d'un composant vivent dans `6-components/`, un fichier par composant et une
ligne dans `6-components/_index.scss`. Jamais de bloc `<style>` dans un fichier Vue : un
style encapsulé contourne la cascade que `@layer` établit, et `pnpm layer-order` ne le voit
pas.

## Direction visuelle

Fast-food américain : rouge, jaune, noir, blanc. Les règles qui en découlent, détaillées
dans `DESIGN.md` :

- aucune couleur en dur dans un composant, tout passe par un token de `1-settings` ;
- toute combinaison de couleurs employée par un composant figure dans les paires de
  `scripts/verify-contrasts.mjs`, sinon le contrôle devient décoratif ;
- le jaune ne dessine jamais une forme à lui seul : son contraste contre le blanc vaut
  1,46:1, donc toute pastille ou tout bouton jaune reçoit un trait `--border-bold` d'encre ;
- la couleur ne vient pas des fonds, qui sont blancs, mais des éléments : titres de section
  rouges, pastilles jaunes, traits d'encre et ombres pleines ;
- aucun état distingué par la seule couleur, critère WCAG 1.4.1 : l'onglet courant change
  aussi de graisse et d'ombre, un produit indisponible porte le mot « indisponible ».

## Accessibilité

Référentiel RGAA 4.1, vérifié en continu et non en fin de projet.

Le RGAA 4.1 transpose WCAG 2.1 niveau AA. Le projet visant WCAG 2.2 niveau AA, quatre
critères ajoutés par la version 2.2 s'appliquent en plus du référentiel : 2.4.11 sur le
focus non masqué, 2.5.7 sur les mouvements de glissement, 2.5.8 sur la taille minimale des
cibles et 3.2.6 sur la cohérence de l'aide.

Tout élément interactif est atteignable et actionnable au clavier. La prise de focus est
toujours visible : `outline: none` sans remplacement est interdit. Les cibles tactiles
mesurent au moins 44 × 44 pixels. Les contrastes atteignent 4.5:1 pour le texte et 3:1
pour les composants d'interface. Les mises à jour du panier sont annoncées par une région
`aria-live="polite"`, les erreurs par `role="alert"`. Chaque option de produit porte une
étiquette explicite.

## Tests

Vitest pour la logique de `app/domain/` et les composables, avec une couverture réelle des
règles de calcul. Pas de test de snapshot de markup, qui casse au moindre changement de
style sans rien prouver.

Playwright pour les parcours utilisateur, avec un audit axe-core sur chaque écran traversé.

Le détecteur Impeccable analyse une page rendue, pas un fichier source. Un `detect` lancé
sur des fichiers `.vue` ne déclenche que les règles à base d'expressions régulières et rend
un rapport incomplet, que son propre avertissement qualifie de sous-estimation. Il
s'exécute donc à deux endroits : sur le HTML produit par `nuxt generate`, à chaque demande
de fusion à partir du lot 3 ; et sur le serveur de développement dans le job end-to-end, au
lot 8, pour les règles qui dépendent des états d'interaction.

## Points d'accroche de l'agent

`.claude/settings.json` est versionné et déclare les points d'accroche du détecteur de
design. Ils exécutent `.claude/skills/impeccable/scripts/impeccable`, script présent dans
le dépôt, après chaque écriture de fichier et à l'arrêt de la session. Toute personne qui
ouvre ce dépôt dans un agent compatible exécute donc ce script localement.

Les réglages propres à une machine vont dans `.claude/settings.local.json`, ignoré par Git.

## Conventions de commit

Conventional Commits, sujet en français à l'impératif. Un commit par unité de sens. Voir
`CONTRIBUTING.md`.

## À éviter

Ajouter une dépendance sans besoin démontré. Créer une abstraction pour un seul cas
d'usage. Laisser du code non appelé. Introduire un serveur applicatif, incompatible avec
l'hébergement statique retenu.
