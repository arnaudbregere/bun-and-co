# Contribuer

## Règles de base

Un lot à la fois, un commit par unité de sens. Un commit doit laisser le dépôt dans un
état où l'intégration continue passe.

## Amorçage du dépôt

Les six premiers commits du dépôt, de `caf2562` à `7dbc636`, ont été poussés directement
sur `main`. Ils couvrent la création du dépôt, les gabarits de contribution, le squelette
du pipeline, le jeu d'étiquettes, l'installation de Spec Kit et la ratification de la
constitution.

Ce choix est assumé et borné. Le premier commit d'un dépôt ne peut pas passer par une
demande de fusion : une demande de fusion compare une branche à une base, et cette base
n'existe pas encore. La phase d'amorçage s'arrête à la mise en place de la règle de
protection, documentée par l'issue #5.

À partir de l'issue #8, toute modification de `main` passe par une demande de fusion, sans
exception.

## Branches

`main` est protégée et toujours déployable. Les règles appliquées sont les suivantes :

- toute modification passe par une demande de fusion ;
- la vérification d'intégration continue doit être verte ;
- la branche doit être à jour avec `main` avant la fusion ;
- l'historique reste linéaire ;
- la poussée forcée et la suppression de branche sont interdites ;
- les conversations de relecture doivent être résolues ;
- les règles s'appliquent aussi aux administrateurs du dépôt.

Aucune approbation n'est exigée : le projet est développé en solo, et exiger une
approbation rendrait toute fusion impossible. La barrière de qualité est le pipeline, pas
la revue humaine.

Le travail se fait sur des branches nommées `<type>/<lot>-<sujet>`, par exemple
`feat/4-calcul-panier` ou `a11y/7-focus-visible`.

Les branches créées par Spec Kit font exception : l'outil les nomme lui-même sous la forme
`<numéro>-<sujet>`, par exemple `001-parcours-commande`. Cette forme est conservée telle
quelle, pour que le numéro de branche corresponde au dossier de spécification.

## Liaison d'une demande de fusion à son issue

Le corps de la demande de fusion contient `Closes #<numéro>`. Ce mot-clé reste en anglais,
même si le reste de la description est en français : GitHub ne reconnaît que les mots-clés
anglais `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves` et
`resolved`. Une mention en français laisse l'issue ouverte après la fusion.

## Fusion

La fusion se fait en squash ou en rebase. Le commit de fusion est désactivé sur le dépôt,
car il contredirait l'exigence d'historique linéaire. Le titre du commit de squash reprend
le titre de la demande de fusion, son corps reprend la description. La branche est
supprimée automatiquement après la fusion.

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

Exécuter les vérifications disponibles. Le jeu s'étoffe au fil des lots, et une commande
absente n'est pas une étape à sauter : elle n'existe pas encore.

```bash
pnpm contrasts      # contrastes de la palette
pnpm format:check   # formatage
pnpm lint           # analyse statique, dont les règles d'accessibilité
pnpm typecheck      # types
pnpm test           # tests unitaires
pnpm generate       # rendu statique
pnpm layer-order    # ordre des couches dans le CSS construit
pnpm component-levels # niveaux d'Atomic Design dans les gabarits
pnpm catalogue-route # route du catalogue écrite en fichier statique
pnpm test:e2e       # parcours utilisateur et audits axe-core
```

`layer-order` et `catalogue-route` lisent un rendu construit, par `pnpm generate`.

`test:e2e` construit ce rendu lui-même et le sert en fichiers statiques, comme GitHub
Pages le fera. La suite tourne donc en parallèle, sans reprise : le serveur de
développement compilait ses routes à la demande, et plusieurs navigateurs qui réclamaient
ensemble des routes jamais compilées dépassaient les délais, demande #138. Trois serveurs
sont disponibles par la variable `E2E_SERVER` :

| Valeur | Serveur | Usage |
| --- | --- | --- |
| absente, ou `build` | `pnpm generate` puis `pnpm serve:static` | le défaut, avant une demande de fusion |
| `prebuilt` | `pnpm serve:static` | un rendu déjà construit, celui du pipeline |
| `dev` | `pnpm dev` | les états d'interaction, dont le détecteur de design aura besoin |

Le pipeline exécute ces mêmes commandes, mais une par job et en parallèle : `Format`,
`Lint`, `Types`, `Unit tests`, `Contrast ratios`, `Component levels`, `Static build`, puis
`Style layer order`, `Catalogue route` et `Design detector`, qui lisent le rendu construit,
et `End-to-end tests`. Les noms des jobs sont en anglais, comme le reste de l'outillage
GitHub.

Les trois jobs qui lisent le rendu attendent `Static build` et récupèrent sa sortie par un
artefact : la construction n'a lieu qu'une fois.

Refaire le parcours modifié entièrement au clavier, sans souris.

## Outillage exécuté automatiquement

Le dépôt versionne `.claude/settings.json`, qui déclare des points d'accroche pour le
détecteur de design Impeccable. Ces points d'accroche lancent
`.claude/skills/impeccable/scripts/impeccable`, un script livré dans le dépôt, après chaque
écriture de fichier et à l'arrêt d'une session d'agent.

Conséquence à connaître avant de cloner : ouvrir ce dépôt dans un agent compatible exécute
ce script sur ta machine, sans action de ta part. Le script réalise une analyse locale des
fichiers d'interface et n'émet aucune requête réseau pour fonctionner. Pour t'en passer,
supprime la section `hooks` de `.claude/settings.json` dans ta copie de travail, ou place
tes propres réglages dans `.claude/settings.local.json`, qui n'est pas versionné.

Ce choix est assumé : ces vérifications décrivent une exigence du projet et non une
préférence personnelle, elles ont donc leur place dans un fichier partagé.

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
