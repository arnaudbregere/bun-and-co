# Borne de commande — Bun & Co

Borne de commande tactile pour une enseigne de restauration rapide fictive, « Bun & Co ».
Le projet reproduit le parcours complet d'une borne en restaurant : choix du mode de
consommation, navigation dans la carte, composition de menus, personnalisation des
produits, panier, paiement simulé et édition d'un ticket avec numéro de commande.

## Objectifs

- Un parcours utilisateur crédible, utilisable au doigt comme au clavier.
- Une conformité RGAA 4.1 vérifiée en continu, pas constatée à la fin.
- Une logique métier pure, testée sans DOM, séparée de l'affichage.
- Un historique de commits lisible, un lot fonctionnel à la fois.

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | Nuxt 4 en génération statique (`nuxt generate`) |
| Langage | TypeScript en mode strict |
| Styles | SCSS organisé en ITCSS, composants en Atomic Design, mobile first |
| Tests unitaires | Vitest + @vue/test-utils |
| Tests end-to-end | Playwright, avec audit axe-core sur chaque écran |
| Qualité | ESLint, Prettier, eslint-plugin-vuejs-accessibility |
| Spécifications | GitHub Spec Kit |
| Design system | Impeccable |
| Intégration continue | GitHub Actions |
| Hébergement | GitHub Pages |

## Accessibilité

Le référentiel appliqué est le RGAA 4.1, qui transpose WCAG 2.1 niveau AA, complété par
les critères ajoutés par WCAG 2.2 au même niveau. Les critères suivis de près sont les contrastes,
l'accès clavier complet, la visibilité de la prise de focus, la restitution des changements
de contexte au lecteur d'écran, l'étiquetage des options produit, la limite de temps
d'inactivité de la borne et une taille de cible tactile minimale de 44 × 44 pixels.

## Référencement

La borne elle-même n'a aucune valeur de référencement : son contenu se trouve derrière des
interactions et ne répond à aucune intention de recherche. Le référencement se limite donc
à la page vitrine : métadonnées, Open Graph, URL canonique, données structurées
`Restaurant` et `Menu`, `robots.txt` et `sitemap.xml` générés au build.

## Développement

Le projet avance par lots, et toutes les commandes n'existent pas encore. Celles qui
suivent sont disponibles aujourd'hui :

```bash
node scripts/verify-contrasts.mjs   # contrastes de la palette
```

Les commandes du socle applicatif arrivent au lot 3 : `pnpm install`, `pnpm dev`,
`pnpm generate`, `pnpm typecheck`, puis `pnpm lint`, `pnpm test` et `pnpm test:e2e`.

Prérequis à ce moment : la version de Node déclarée dans `.nvmrc`, et la version de pnpm
déclarée par le champ `packageManager` de `package.json`.

## Licence

MIT, voir le fichier `LICENSE`.
