# Design system — Bun & Co

Direction visuelle, tokens et règles de conception de la borne de commande.

Les tokens vivent dans `app/assets/scss/1-settings/`. Ce document explique les choix ; le
code en est la source de vérité.

## Direction

Fast-food américain. L'enseigne s'adresse à un public de 15 à 35 ans : l'écran doit donner
faim avant de donner des instructions. La référence est le comptoir américain — rouge,
jaune, blanc, capitales grasses, prix sur pastille — et non l'enseigne peinte d'un comptoir
de quartier, trop sage pour ce public.

Inspiration et non imitation. Aucun logo, aucune arche, aucun nom de marque réelle n'entre
dans ce projet : ce sont les codes du registre qui sont repris, pas l'identité de
quelqu'un.

Rouge pour l'action, jaune pour la mise en avant, vert pour ce qui est acquis — confirmé,
inclus, disponible. Trois rôles, trois couleurs : une quatrième couleur d'accent ne
désignerait plus rien. Grotesque condensée pour l'affichage, grotesque normale pour
l'interface. Angles presque droits sur les surfaces, pastilles entièrement arrondies pour
les prix et les étiquettes, ombre franche sans flou.

Le fond passe au blanc. Un fond coloré teinte les photographies posées dessus, et la borne
vend d'abord des photographies de produits. La chaleur de la direction est portée par les
surfaces — cartes et zones secondaires, en crème — et non par le fond général.

L'interface reste sobre pour autant : sur une borne, l'utilisateur est debout, pressé, et
parfois observé par la file d'attente. La densité visuelle se paie en temps de commande. La
photographie porte l'appétence ; l'interface la met en page.

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
| `--color-background` | `#ffffff` | fond général |
| `--color-surface` | `#fff8e7` | cartes produit, crème chaud |
| `--color-surface-muted` | `#ffeec9` | zones secondaires, onglets au repos |
| `--color-border` | `#1a1a1a` | bordures porteuses de sens, 17,40:1 sur le fond |
| `--color-border-subtle` | `#e6dcc4` | séparateurs purement décoratifs |

### Texte

| Token | Valeur | Contraste sur le fond |
| --- | --- | --- |
| `--color-ink` | `#1a1a1a` | 17,40:1 |
| `--color-ink-muted` | `#56504a` | 7,95:1 |
| `--color-ink-inverse` | `#ffffff` | sur accent : 5,11:1 |

### Accents et états

| Token | Valeur | Usage | Contraste |
| --- | --- | --- | --- |
| `--color-accent` | `#d81e05` | actions principales, catégorie ouverte | 5,11:1 avec le texte inversé |
| `--color-accent-pressed` | `#a81603` | état actif | 7,55:1 |
| `--color-highlight` | `#ffc72c` | pastille de prix, action secondaire, bandes | 11,15:1 avec l'encre |
| `--color-green` | `#11703a` | confirmation, produit inclus, disponibilité | 6,17:1 |
| `--color-error` | `#8c1030` | erreurs et refus | 9,41:1 |
| `--color-disabled` | `#6b645c` | produit indisponible | 4,86:1 sur son fond |

**Le jaune ne dessine jamais une forme à lui seul.** Son contraste contre le blanc vaut
1,55:1, très loin des 3:1 exigés par le critère WCAG 1.4.11 pour un composant d'interface :
une pastille jaune posée sur du blanc n'aurait pas de contour visible. Elle reçoit donc
toujours un trait d'encre, mesuré à 11,15:1. C'est la seule couleur de la palette soumise à
cette contrainte, et le script la vérifie par la paire `border` / `highlight`.

L'erreur est une baie sombre et non un rouge vif. L'accent étant déjà rouge, deux rouges
voisins se confondraient — et le critère WCAG 1.4.1 interdit de toute façon de porter le
sens par la couleur seule : le libellé reste le porteur, la couleur ne fait que l'appuyer.

### Focus

L'indicateur de focus est à deux tons : un anneau sombre `--color-focus` doublé d'un
liseré clair `--color-focus-halo`.

L'exigence applicable au niveau AA est le critère WCAG 1.4.11, qui demande 3:1 entre
l'indicateur de focus et les couleurs adjacentes. Elle est satisfaite dès qu'un des deux
tons atteint ce seuil, et non les deux. Sur le rouge, l'anneau d'encre atteint 4,23:1 et le
liseré blanc 5,11:1 : les deux passent, là où le terracotta du premier jeu obligeait à ne
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
enseigne sage, et cette direction demande l'inverse. La condensée tient de surcroît le nom
d'un produit sur une seule ligne dans une carte étroite, ce qui vaut mieux qu'un nom coupé
en deux.

Les noms de produits, les titres d'écran et les titres de catégorie sont en capitales :
c'est la signature typographique du registre, et une capitale condensée grasse se repère de
plus loin qu'un bas-de-casse de même corps.

Deux réglages d'approche, et non un seul. `--letter-spacing-heading` vaut `-0.015em` : un
titre resserré forme un bloc que l'œil saisit d'un coup. `--letter-spacing-display`, pour
les libellés capitalisés de petit corps — boutons, étiquettes, onglets —, vaut `0.02em` :
collées, des capitales de 18 ou 20 px se lisent moins vite.

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

## Photographie

Les visuels des produits viennent de Pixabay, en cadrage horizontal, et sont versionnés avec
le dépôt. Ils portent l'appétence que l'interface ne cherche pas à porter : l'écran reste
sobre, la photographie fait le reste.

Chaque visuel existe en deux tailles — 340 px pour les grilles de carte, 640 px pour la fiche
produit — et le composant choisit selon son contexte. Le rapport d'affichage est réservé
avant le chargement : sans cela, la grille saute à l'arrivée de chaque image, et le client
appuie sur un produit qui vient de se déplacer.

Un produit sans photographie garde sa place derrière un substitut qui porte son nom. Rien
n'y laisse croire à un chargement en cours.

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
| `--radius-small` | 2 px | visuels de produit, petits blocs |
| `--radius-medium` | 4 px | boutons, cartes, onglets |
| `--radius-large` | 8 px | panneaux et dialogues |
| `--radius-pill` | 1000 px | pastille de prix, étiquette d'état |
| `--shadow-card` | `0 4px 0 rgb(26 26 26 / 20%)` | ombre franche, sans flou |

Les angles sont presque droits sans être vifs : un angle parfaitement à 90 degrés se lit
comme un défaut de rendu sur un écran tactile. La pastille, elle, est entièrement arrondie.
Le contraste des deux formes est voulu : un prix en pastille se détache d'autant mieux sur
une carte à angles vifs.

L'ombre est un décalage net, sans flou — une ombre diffuse appartient au registre de
l'élévation matérielle, étranger à cette direction, qui tient de l'affiche imprimée. Elle
porte aussi un état : un bouton, un onglet ou une carte s'enfonce de 4 px à l'appui et perd
son ombre, retour géométrique visible même pour qui distingue mal deux rouges voisins.

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

## Détecteur de design

Aucune règle n'est désactivée : `.impeccable/config.json` ne porte plus d'exception.

La direction précédente en demandait une. Son fond crème déclenchait la règle
`cream-palette`, qui signale le blanc cassé chaud devenu surface par défaut des interfaces
générées. Le fond est maintenant blanc, le crème n'habille plus que les cartes, et le
détecteur passe sans exception sur les deux pages construites.

## Vérification

```bash
node scripts/verify-contrasts.mjs
```

Le script rend 26 paires déclarées et 2 groupes à combinaison libre, et sort en erreur dès
qu'un seuil n'est pas tenu. Il tourne en intégration continue à chaque demande de fusion.

Les deux groupes couvrent l'indicateur de focus sur fond accentué, où une seule des deux
combinaisons doit atteindre le seuil.
