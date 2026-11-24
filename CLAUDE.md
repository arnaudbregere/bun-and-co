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

Les accès au monde extérieur passent par un port déclaré dans `app/domain/ports.ts` et une
implémentation dans `app/infrastructure/`. La version 1 persiste la commande dans
`sessionStorage`, comportement attendu d'une borne : la commande ne doit pas survivre au
client suivant.

Les composants suivent l'Atomic Design dans `app/components/atoms`, `molecules` et
`organisms`. Un composant ne consomme que des composants de niveau inférieur.

## Styles

SCSS organisé en ITCSS, dans l'ordre `1-settings`, `2-tools`, `3-generic`, `4-elements`,
`5-objects`, `6-components`, `7-utilities`. La spécificité ne doit jamais décroître d'une
couche à la suivante.

Mobile first : les media queries utilisent `min-width` uniquement.

Pas de framework utilitaire de classes, qui entrerait en conflit avec ITCSS. Les tokens de
design sont des variables SCSS et des custom properties déclarées en `1-settings`.

## Accessibilité

Référentiel RGAA 4.1, vérifié en continu et non en fin de projet.

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

## Conventions de commit

Conventional Commits, sujet en français à l'impératif. Un commit par unité de sens. Voir
`CONTRIBUTING.md`.

## À éviter

Ajouter une dépendance sans besoin démontré. Créer une abstraction pour un seul cas
d'usage. Laisser du code non appelé. Introduire un serveur applicatif, incompatible avec
l'hébergement statique retenu.
