# Contribuer

## Règles de base

Un lot à la fois, un commit par unité de sens. Un commit doit laisser le dépôt dans un
état où l'intégration continue passe.

## Branches

`main` est protégée et toujours déployable. Le travail se fait sur des branches nommées
`<type>/<lot>-<sujet>`, par exemple `feat/4-calcul-panier` ou `a11y/7-focus-visible`.

## Messages de commit

Format Conventional Commits, sujet en français à l'impératif, 72 caractères maximum.

```
feat(panier): calcule le total avec les suppléments

Le total prend en compte les options payantes de chaque ligne.
Le calcul reste une fonction pure, testée sans composant.
```

Types utilisés : `feat`, `fix`, `a11y`, `refactor`, `test`, `style`, `docs`, `chore`, `ci`,
`perf`.

## Avant d'ouvrir une demande de fusion

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Refaire le parcours modifié entièrement au clavier, sans souris.

## Accessibilité

Toute contribution qui ajoute de l'interface respecte le RGAA 4.1. Un composant livré sans
accès clavier, sans étiquette ou sans contraste suffisant est refusé, même si ses tests
unitaires passent.

## Étiquettes et jalons

Les étiquettes reprennent les types de Conventional Commits : `feat`, `fix`, `a11y`,
`test`, `refactor`, `perf`, `docs`, `chore`, `ci`. Une issue porte une seule étiquette de
type. Les étiquettes `design` et `seo` marquent un domaine et se cumulent avec un type.
`blocked` signale une issue en attente d'une décision ou d'un autre lot.

Le découpage en lots passe par les jalons GitHub, de « Lot 0 » à « Lot 10 ». Les lots ne
sont pas dupliqués en étiquettes : un seul système décrit l'avancement, et le jalon fournit
la progression chiffrée.
