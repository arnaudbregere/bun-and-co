# Design system — Bun & Co

Direction visuelle, tokens et règles de conception de la borne de commande.

Les tokens vivent dans `app/assets/scss/1-settings/`. Ce document explique les choix ; le
code en est la source de vérité.

## Direction

Néo-diner. L'enseigne prépare sur place et s'adresse à un public de 15 à 35 ans : l'écran
doit donner faim avant de donner des instructions. La référence est l'enseigne peinte d'un
comptoir, relue en moderne — pas la pastille arrondie d'une application mobile, pas le
rouge et jaune saturés des grandes chaînes.

Vermillon pour l'action, crème pour le fond, teal profond pour tout ce qui ne doit pas
disputer l'attention au vermillon. Grotesque condensée pour l'affichage, grotesque normale
pour l'interface. Angles presque droits, ombre franche sans flou, étiquettes posées comme
des autocollants.

Le fond reste crème. Sur un écran regardé à 70 cm pendant plusieurs minutes, un fond sombre
fatigue moins mais écrase les photographies de produit, et un blanc pur éblouit.

L'interface reste sobre pour autant : sur une borne, l'utilisateur est debout, pressé, et
parfois observé par la file d'attente. La densité visuelle se paie en temps de commande. La
photographie porte l'appétence ; l'interface, elle, s'efface.

## Contrainte d'usage, qui précède l'esthétique

Trois propriétés de la borne commandent tous les tokens.

**Distance de lecture d'environ 70 cm**, contre 30 cm pour un téléphone. À taille en pixels
égale, le texte est perçu deux fois plus petit. D'où une base de 20 px et non 16 px.

**Entrée tactile exclusive.** Il n'y a pas de survol. Toute information révélée au
`:hover` est invisible pour l'utilisateur réel.

**Portée physique limitée.** La norme EN 301 549 traite du matériel à sa clause 8, et des
plages d'atteinte à la sous-clause 8.3 : une personne en fauteuil atteint environ 1,20 m de
hauteur. Les commandes
critiques restent dans les deux tiers inférieurs de l'écran, et l'action principale est
ancrée en bas.

## Palette

Chaque valeur est vérifiée par `node scripts/verify-contrasts.mjs`, qui lit le fichier
de tokens, calcule les rapports de contraste des combinaisons réellement utilisées et
échoue si l'une descend sous son seuil.

### Surfaces

| Token | Valeur | Usage |
| --- | --- | --- |
| `--color-background` | `#fbf6ee` | fond général |
| `--color-surface` | `#ffffff` | cartes produit |
| `--color-surface-muted` | `#f0e8db` | zones secondaires, en-têtes de catégorie |
| `--color-border` | `#7d6c55` | bordures porteuses de sens, 4,71:1 sur le fond |
| `--color-border-subtle` | `#ded2bf` | séparateurs purement décoratifs |

### Texte

| Token | Valeur | Contraste sur le fond |
| --- | --- | --- |
| `--color-ink` | `#17130d` | 17,19:1 |
| `--color-ink-muted` | `#4e463a` | 8,63:1 |
| `--color-ink-inverse` | `#fff8f0` | sur accent : 5,70:1 |

### Accents et états

| Token | Valeur | Usage | Contraste |
| --- | --- | --- | --- |
| `--color-accent` | `#c21f0d` | actions principales | 5,70:1 avec le texte inversé |
| `--color-accent-pressed` | `#96160a` | état actif | 8,25:1 |
| `--color-teal` | `#0c4f4c` | confirmation, disponibilité, bandes | 8,91:1 |
| `--color-error` | `#8c1030` | erreurs et refus | 8,93:1 |
| `--color-disabled` | `#645c50` | produit indisponible | 5,12:1 sur son fond |

L'erreur est une baie sombre et non un rouge vif. L'accent étant déjà rouge, deux rouges
voisins se confondraient — et le critère WCAG 1.4.1 interdit de toute façon de porter le
sens par la couleur seule : le libellé reste le porteur, la couleur ne fait que l'appuyer.

### Focus

L'indicateur de focus est à deux tons : un anneau sombre `--color-focus` doublé d'un
liseré clair `--color-focus-halo`.

L'exigence applicable au niveau AA est le critère WCAG 1.4.11, qui demande 3:1 entre
l'indicateur de focus et les couleurs adjacentes. Elle est satisfaite dès qu'un des deux
tons atteint ce seuil, et non les deux. Sur le vermillon, l'anneau sombre atteint 3,08:1 et
le liseré clair 5,70:1 : les deux passent, là où le terracotta précédent obligeait à ne
compter que sur le liseré.

Le critère WCAG 2.4.13, qui ajoute des exigences de surface et d'épaisseur de
l'indicateur, relève du niveau AAA. Le mécanisme à deux tons y répond également, mais ce
n'est pas lui qui fixe notre obligation.

## Typographie

Échelle modulaire de ratio 1,25, dite tierce majeure, à partir de 20 px.

| Token | Taille | Usage |
| --- | --- | --- |
| `--font-size-note` | 18 px | allergènes, mentions |
| `--font-size-body` | 20 px | texte courant, libellés de contrôle |
| `--font-size-subheading` | 25 px | nom de produit |
| `--font-size-section` | 31 px | titre de catégorie |
| `--font-size-screen` | 39 px | titre d'écran |
| `--font-size-price` | 49 px | total du panier |

Interligne de 1,5 sur le texte courant, minimum exigé par le critère WCAG 1.4.12. Longueur
de ligne cible de 60 caractères, bornée entre 45 et 75.

Archivo pour l'interface, Archivo Narrow pour l'affichage.

Inter et Fraunces étaient le premier choix. Le détecteur de design les a signalées comme
omniprésentes, au point de ne plus porter d'identité : elles reviennent sur une grande part
des interfaces récentes. Archivo est une grotesque dessinée pour la lisibilité en petit
corps.

Petrona, l'antique du premier jeu, a été retirée. Un titre à empattements posait une
enseigne sage, et la direction néo-diner demande l'inverse. La condensée tient de surcroît
le nom d'un produit sur une seule ligne dans une carte étroite, ce qui vaut mieux qu'un nom
coupé en deux.

Les libellés capitalisés — boutons, étiquettes, catégories — portent `--letter-spacing-display`
à `0.04em` : des capitales collées se lisent moins vite que des bas-de-casse.

Polices auto-hébergées en `woff2`, sous-ensemble latin, dans `app/assets/fonts/`. Aucun
appel à un hébergeur tiers : le cache des navigateurs est partitionné par site depuis 2020,
un lien externe n'apporte donc aucun gain et ajoute une résolution DNS, une connexion et une
requête bloquante devant le premier rendu. Un test end-to-end vérifie qu'aucune requête ne
part vers `fonts.googleapis.com` ni `fonts.gstatic.com`.

| Fichier | Famille | Poids |
| --- | --- | --- |
| `archivo-variable-latin.woff2` | Archivo, graisses 400 à 700 | 35 Ko |
| `archivo-narrow-variable-latin.woff2` | Archivo Narrow, graisses 400 à 700 | 19 Ko |

Une seule ressource par famille : ce sont des fontes variables, et l'API de Google Fonts
servait le même fichier pour chaque graisse demandée. Déclarer une plage de graisses évite
d'embarquer trois copies des mêmes octets.

`font-display: swap` : le texte s'affiche immédiatement dans la police de substitution, puis
bascule. Un écran vide pendant le chargement est un échec d'affichage, pas un raffinement
typographique.

Licence SIL Open Font License 1.1, Omnibus-Type.

## Espacements et cibles

Échelle unique de 4 px, de `--space-1` à `--space-8`. Une seule échelle pour les marges,
les espacements internes et les écarts de grille.

| Token | Valeur | Raison |
| --- | --- | --- |
| `--target-primary` | 56 px | loi de Fitts : sur une borne, le gain de temps et la baisse du taux d'erreur sont mesurables |
| `--target-secondary` | 48 px | au-dessus des 44 px exigés par le critère WCAG 2.5.5, de niveau AAA |
| `--target-gap` | 12 px | évite d'activer la cible voisine |

Le critère WCAG 2.5.8, de niveau AA, n'exige que 24 px. Nos valeurs sont volontairement au-delà.

## Formes

| Token | Valeur | Raison |
| --- | --- | --- |
| `--radius-small` | 2 px | étiquettes et petits blocs |
| `--radius-medium` | 4 px | boutons, cartes |
| `--radius-large` | 8 px | panneaux et dialogues |
| `--shadow-card` | `0 3px 0 rgb(23 19 13 / 12%)` | ombre franche, sans flou |

Les angles sont presque droits sans être vifs : un angle parfaitement à 90 degrés se lit
comme un défaut de rendu sur un écran tactile. L'ombre est un décalage net, sans flou — une
ombre diffuse appartient au registre de l'élévation matérielle, étranger à cette direction.

## Cascade

L'ordre ITCSS est appliqué par les couches natives `@layer`, déclarées dans
`app/assets/scss/_layers.scss` :

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
composant impose de l'ajouter à `scripts/verify-contrasts.mjs`.

## Écart assumé au détecteur de design

Le détecteur signale la règle `cream-palette` sur notre fond crème : un blanc cassé chaud
est devenu la surface par défaut des interfaces générées, choisie par réflexe.

La règle est désactivée dans `.impeccable/config.json`, et voici pourquoi. Le fond crème
n'est pas ici un réflexe mais une décision de direction, prise avec le vermillon et le teal,
et chaque paire de couleurs est mesurée. La règle n'accepte pas d'exception par valeur,
seulement par fichier ou par règle entière, d'où la désactivation complète.

L'alternative, si cet écart devenait gênant, serait le fond charbon de la direction
concurrente, écartée parce qu'elle fatigue moins l'œil mais écrase les photographies de
produit, qui portent ici l'essentiel de l'appétence.

## Vérification

```bash
node scripts/verify-contrasts.mjs
```

Le script rend 23 paires déclarées et 2 groupes à combinaison libre, et sort en erreur dès
qu'un seuil n'est pas tenu. Il tourne en intégration continue à chaque demande de fusion.

Les deux groupes couvrent l'indicateur de focus sur fond accentué, où une seule des deux
combinaisons doit atteindre le seuil. Ces deux cas étaient d'abord comptés parmi les paires
strictes, d'où un total de 25 avant leur déplacement.
