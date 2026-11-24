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
| Styles | SCSS organisé en ITCSS, ordre appliqué par `@layer`, Atomic Design, mobile first |
| Tests unitaires | Vitest |
| Tests end-to-end | Playwright, avec audit axe-core sur chaque écran |
| Qualité | ESLint, Prettier, `eslint-plugin-vuejs-accessibility`, détecteur de design Impeccable |
| Spécifications | GitHub Spec Kit |
| Design system | Impeccable |
| Intégration continue | GitHub Actions |
| Hébergement | GitHub Pages |

## Architecture

Trois couches, une seule direction de dépendance.

```
app/pages, app/components, app/composables     interface
        ↓
app/services                                   services
        ↓
app/domain                                     métier
```

Le domaine ne connaît ni les services ni l'interface, ni Vue, ni le DOM, ni le navigateur.
Les services connaissent le domaine. L'interface connaît les deux, par les composables.

Ces frontières ne sont pas seulement écrites : ESLint les applique. Un import interdit
fait échouer `pnpm lint`, donc le pipeline, donc la fusion.

| Module | Couche | Rôle |
| --- | --- | --- |
| `app/domain/types.ts` | métier | vocabulaire du domaine |
| `app/domain/money.ts` | métier | montants en centimes entiers, et leur arithmétique |
| `app/domain/menu-rules.ts` | métier | forfaits de taille, substitutions autorisées |
| `app/domain/pricing.ts` | métier | prix d'une ligne, total du panier |
| `app/domain/cart.ts` | métier | ajout, quantités, limites, retrait |
| `app/domain/order.ts` | métier | numéro de commande, confirmation |
| `app/domain/catalogue.ts` | métier | consultation pure d'une liste de produits |
| `app/domain/ports.ts` | métier | contrats avec le monde extérieur |
| `app/domain/errors.ts` | métier | erreurs du domaine |
| `app/services/catalogue-data.ts` | services | les vingt-sept références de la carte |
| `app/services/static-catalogue.ts` | services | catalogue servi depuis les données livrées |
| `app/services/session-draft-store.ts` | services | commande en cours, dans le stockage de session |

Deux règles s'appliquent à tout le domaine.

**Les montants sont des entiers de centimes**, garantis par un type nominal. En JavaScript,
`5.90 + 1.20 + 0.80` vaut `7.9000000000000004`, et l'erreur s'accumule au fil des lignes.
La conversion en euros n'a lieu qu'à l'affichage.

**Le domaine lève plutôt que de rendre une valeur par défaut.** Un panier tarifé à zéro ou
une ligne silencieusement ignorée produiraient un ticket faux, bien plus difficile à
diagnostiquer qu'une erreur levée au premier appel.

## Accessibilité

Le référentiel appliqué est le RGAA 4.1, qui transpose WCAG 2.1 niveau AA, complété par
les critères ajoutés par WCAG 2.2 au même niveau. Les critères suivis de près sont les
contrastes, l'accès clavier complet, la visibilité de la prise de focus, la restitution des
changements de contexte au lecteur d'écran, l'étiquetage des options produit, la limite de
temps d'inactivité de la borne et une taille de cible tactile minimale de 44 × 44 pixels.

Trois contrôles tournent à chaque demande de fusion : la vérification des contrastes de la
palette, les règles d'accessibilité d'ESLint sur le balisage, et un audit axe-core sur
chaque écran traversé par les tests end-to-end.

## Référencement

La borne elle-même n'a aucune valeur de référencement : son contenu se trouve derrière des
interactions et ne répond à aucune intention de recherche. Le référencement se limite donc
à la page vitrine : métadonnées, Open Graph, URL canonique, données structurées
`Restaurant` et `Menu`, `robots.txt` et `sitemap.xml` générés au build.

## Développement

Prérequis : la version de Node déclarée dans `.nvmrc`, et la version de pnpm déclarée par
le champ `packageManager` de `package.json`.

```bash
nvm use
pnpm install
pnpm dev            # serveur de développement
pnpm generate       # rendu statique
```

Vérifications, dans l'ordre où le pipeline les exécute :

```bash
pnpm contrasts      # contrastes de la palette
pnpm format:check   # formatage
pnpm lint           # analyse statique, dont les règles d'accessibilité
pnpm typecheck      # types
pnpm test           # tests unitaires
pnpm generate       # rendu statique
pnpm layer-order    # ordre des couches dans le CSS construit
pnpm test:e2e       # parcours utilisateur et audits axe-core
```

Le navigateur des tests end-to-end s'installe une fois, par
`pnpm exec playwright install chromium`.

## Avancement

| Lot | État |
| --- | --- |
| 0 — Dépôt et intégration continue | terminé |
| 1 — Spécifications | terminé |
| 2 — Design system | terminé |
| 3 — Socle technique | terminé |
| 4 — Domaine métier | en cours, route du catalogue restante |
| 5 — Composants | à venir |
| 6 — Parcours utilisateur | à venir |
| 7 — Audit RGAA | à venir |
| 8 — Tests end-to-end | à venir |
| 9 — Build et déploiement | à venir |
| 10 — Référencement | à venir |

Les règles de contribution sont dans `CONTRIBUTING.md`, les règles de conception dans
`DESIGN.md`, les règles non négociables dans `.specify/memory/constitution.md`, et la
spécification de référence dans `specs/001-parcours-commande/spec.md`.

## Licence

MIT, voir le fichier `LICENSE`.
