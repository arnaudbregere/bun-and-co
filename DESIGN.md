# Design system — Bun & Co

Direction visuelle, tokens et règles de conception de la borne de commande.

Les tokens vivent dans `assets/scss/1-settings/`. Ce document explique les choix ; le
code en est la source de vérité.

## Direction

Artisanal chaleureux. L'enseigne vend des produits préparés sur place, pas de
l'industriel : la palette vient de la terre cuite, de la pâte et du végétal, pas du rouge
et du jaune saturés des grandes chaînes.

Terracotta pour l'action, crème pour le fond, vert olive pour la confirmation. Titres à
empattements pour la chaleur, interface sans empattement pour la lisibilité.

L'interface reste sobre : sur une borne, l'utilisateur est debout, pressé, et parfois
observé par la file d'attente. La densité visuelle se paie en temps de commande.

## Contrainte d'usage, qui précède l'esthétique

Trois propriétés de la borne commandent tous les tokens.

**Distance de lecture d'environ 70 cm**, contre 30 cm pour un téléphone. À taille en pixels
égale, le texte est perçu deux fois plus petit. D'où une base de 20 px et non 16 px.

**Entrée tactile exclusive.** Il n'y a pas de survol. Toute information révélée au
`:hover` est invisible pour l'utilisateur réel.

**Portée physique limitée.** La norme EN 301 549, clause 8, traite des terminaux en libre
service : une personne en fauteuil atteint environ 1,20 m de hauteur. Les commandes
critiques restent dans les deux tiers inférieurs de l'écran, et l'action principale est
ancrée en bas.

## Palette

Chaque valeur est vérifiée par `node scripts/verifier-contrastes.mjs`, qui lit le fichier
de tokens, calcule les rapports de contraste des combinaisons réellement utilisées et
échoue si l'une descend sous son seuil.

### Surfaces

| Token | Valeur | Usage |
| --- | --- | --- |
| `--couleur-fond` | `#fbf6ee` | fond général |
| `--couleur-surface` | `#ffffff` | cartes produit |
| `--couleur-surface-sourde` | `#f2e9db` | zones secondaires, en-têtes de catégorie |
| `--couleur-bordure` | `#8c7a60` | bordures porteuses de sens |
| `--couleur-bordure-discrete` | `#e2d7c6` | séparateurs purement décoratifs |

### Texte

| Token | Valeur | Contraste sur le fond |
| --- | --- | --- |
| `--couleur-encre` | `#241d19` | 15,43:1 |
| `--couleur-encre-sourde` | `#574c43` | 7,75:1 |
| `--couleur-encre-inversee` | `#fffdf9` | sur accent : 7,14:1 |

### Accents et états

| Token | Valeur | Usage | Contraste |
| --- | --- | --- | --- |
| `--couleur-accent` | `#9b3412` | actions principales | 7,14:1 avec le texte inversé |
| `--couleur-accent-appuye` | `#76270c` | état actif | 10,01:1 |
| `--couleur-olive` | `#3f5218` | confirmation, disponibilité | 8,50:1 |
| `--couleur-erreur` | `#a01b12` | erreurs et refus | 7,77:1 |
| `--couleur-desactive` | `#6b6159` | produit indisponible | 4,82:1 sur son fond |

### Focus

L'indicateur de focus est à deux tons : un anneau sombre `--couleur-focus` doublé d'un
liseré clair `--couleur-focus-halo`. Le critère WCAG 2.4.13 est satisfait dès qu'un des
deux tons atteint 3:1 contre la couleur adjacente. Sur un bouton terracotta, l'anneau
sombre n'y parvient pas, à 2,40:1 ; c'est le liseré clair qui porte le contraste, à
7,14:1. Ce mécanisme rend l'indicateur lisible sur n'importe quel fond de la palette.

## Typographie

Échelle modulaire de ratio 1,25, dite tierce majeure, à partir de 20 px.

| Token | Taille | Usage |
| --- | --- | --- |
| `--taille-mention` | 18 px | allergènes, mentions |
| `--taille-corps` | 20 px | texte courant, libellés de contrôle |
| `--taille-intertitre` | 25 px | nom de produit |
| `--taille-titre-section` | 31 px | titre de catégorie |
| `--taille-titre-ecran` | 39 px | titre d'écran |
| `--taille-prix-fort` | 49 px | total du panier |

Interligne de 1,5 sur le texte courant, minimum exigé par le critère WCAG 1.4.12. Longueur
de ligne cible de 60 caractères, bornée entre 45 et 75.

Polices auto-hébergées en `woff2`, sous-ensemble latin, chiffres et ponctuation. Aucun
appel à un hébergeur tiers : le cache des navigateurs est partitionné par site depuis
2020, un lien externe n'apporte donc aucun gain et ajoute une requête bloquante.

## Espacements et cibles

Échelle unique de 4 px, de `--espace-1` à `--espace-8`. Une seule échelle pour les marges,
les espacements internes et les écarts de grille.

| Token | Valeur | Raison |
| --- | --- | --- |
| `--cible-primaire` | 56 px | loi de Fitts : sur une borne, le gain de temps et la baisse du taux d'erreur sont mesurables |
| `--cible-secondaire` | 48 px | au-dessus des 44 px recommandés par le critère WCAG 2.5.5 |
| `--ecart-cibles` | 12 px | évite d'activer la cible voisine |

Le critère WCAG 2.5.8 n'exige que 24 px. Nos valeurs sont volontairement au-delà.

## Cascade

L'ordre ITCSS est appliqué par les couches natives `@layer`, déclarées dans
`assets/scss/_couches.scss` :

```scss
@layer settings, tools, generic, elements, objects, components, utilities;
```

Une règle de `components` ne peut donc pas être emportée par une règle de `generic`,
quelle que soit la spécificité des sélecteurs. Les guerres de spécificité et les
`!important` deviennent sans objet.

## Interdits

Chacun de ces points est un défaut de conception, pas une préférence.

**Pas de `px` dans les composants.** Les tailles sont en `rem`, sinon le zoom à 200 % exigé
par le critère WCAG 1.4.4 ne fonctionne pas.

**Pas d'information portée par la couleur seule.** Chaque état porte aussi un libellé, une
icône ou une forme. Le mode `forced-colors` des systèmes d'exploitation écrase les couleurs :
ce qui n'a que la couleur pour sens y disparaît.

**Pas d'affordance au survol.** Il n'y a pas de survol sur un écran tactile.

**Pas de `outline: none` sans remplacement.** La prise de focus reste visible en
permanence.

**Pas de framework utilitaire de classes.** Il contournerait la cascade que `@layer`
établit.

**Pas de valeur de couleur en dur.** Toute couleur passe par un token, sinon le script de
vérification ne la voit pas et le contrôle devient décoratif.

**Pas de nouvelle combinaison de couleurs sans déclaration.** Ajouter une paire dans un
composant impose de l'ajouter à `scripts/verifier-contrastes.mjs`.

## Vérification

```bash
node scripts/verifier-contrastes.mjs
```

Le script rend 25 paires déclarées et 2 groupes à combinaison libre, et sort en erreur
dès qu'un seuil n'est pas tenu. Il tourne en intégration continue à chaque demande de
fusion.
