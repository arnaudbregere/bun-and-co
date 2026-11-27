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
les prix et les étiquettes.

**La couleur ne vient pas des fonds.** Le fond général et les cartes sont blancs. Le crème
du premier jeu a disparu : une surface beige sous une photographie l'éteint, et l'ensemble
se lisait terne. Ce sont les éléments qui portent la couleur — titres de section rouges,
pastilles de prix jaunes, onglet courant en pavé rouge.

**Le noir porte la structure.** Trait d'encre de 3 px autour des cartes, des boutons, des
onglets et des pastilles, doublé d'une ombre portée pleine de 6 px. Le registre est celui
de l'affiche imprimée et de l'autocollant : un aplat et son décalage, jamais un dégradé ni
un flou. À 70 cm de distance, un filet d'un pixel disparaît et les cartes flottent sur le
blanc.

**La photographie va bord à bord.** Dans une carte de produit, le visuel occupe toute la
largeur et seul le texte reçoit une marge intérieure. Une photographie entourée de marges
perd la moitié de sa force, et c'est elle que le client regarde en premier.

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
| `--color-surface` | `#ffffff` | cartes produit |
| `--color-surface-muted` | `#fff3cc` | onglets au repos, substitut de visuel |
| `--color-border` | `#0f0f0f` | traits porteurs de sens, 19,17:1 sur le fond |
| `--color-border-subtle` | `#dcd7cd` | séparateurs purement décoratifs |

### Texte

| Token | Valeur | Contraste sur le fond |
| --- | --- | --- |
| `--color-ink` | `#0f0f0f` | 19,17:1 |
| `--color-ink-muted` | `#4a4a4a` | 8,86:1 |
| `--color-ink-inverse` | `#ffffff` | sur accent : 4,85:1 |

### Accents et états

| Token | Valeur | Usage | Contraste |
| --- | --- | --- | --- |
| `--color-accent` | `#e4002b` | actions principales, titres de section, catégorie ouverte | 4,85:1 avec le texte inversé |
| `--color-accent-pressed` | `#b00020` | état actif | 7,33:1 |
| `--color-highlight` | `#ffd100` | pastille de prix, action secondaire | 13,12:1 avec l'encre |
| `--color-green` | `#11703a` | confirmation, produit inclus, disponibilité | 6,17:1 |
| `--color-disabled` | `#6b645c` | produit indisponible | 4,86:1 sur son fond |

La palette ne porte pas de couleur d'erreur. Les messages d'erreur appartiennent aux écrans
du lot 6 : un token que rien ne peint est du code mort, et sa paire de contraste un contrôle
décoratif. Les deux entreront avec le premier composant qui les emploie.

**Le jaune ne dessine jamais une forme à lui seul.** Son contraste contre le blanc vaut
1,46:1, très loin des 3:1 exigés par le critère WCAG 1.4.11 pour un composant d'interface :
une pastille jaune posée sur du blanc n'aurait pas de contour visible. Elle reçoit donc
toujours un trait d'encre, mesuré à 13,12:1. C'est la seule couleur de la palette soumise à
cette contrainte, et le script la vérifie par la paire `border` / `highlight`.

Le critère WCAG 1.4.1 interdit de porter le sens par la couleur seule : le libellé reste le
porteur, la couleur ne fait que l'appuyer. L'étiquette d'un produit inclus dans un menu
porte ainsi le mot « inclus », en vert sur fond vert clair.

### Focus

L'indicateur de focus est à deux tons : un anneau sombre `--color-focus` doublé d'un
liseré clair `--color-focus-halo`.

L'exigence applicable au niveau AA est le critère WCAG 1.4.11, qui demande 3:1 entre
l'indicateur de focus et les couleurs adjacentes. Elle est satisfaite dès qu'un des deux
tons atteint ce seuil, et non les deux. Sur le rouge, le liseré blanc atteint 4,85:1 : le
seuil est tenu, là où le terracotta du premier jeu ne passait que de justesse.

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

Fredoka pour l'affichage, Figtree pour l'interface.

Fredoka est une géométrique aux angles arrondis : ses capitales pleines tiennent le
registre du comptoir américain sans sa raideur, et c'est elle qui donne à l'écran son air
accueillant. Figtree porte le texte courant, grotesque géométrique aux formes ouvertes
dessinée pour l'écran. Deux polices rondes auraient donné une interface molle ; l'une
arrondie et l'autre ouverte se complètent.

Trois jeux ont précédé celui-ci. Inter et Fraunces, signalées par le détecteur de design
comme omniprésentes au point de ne plus porter d'identité. Petrona, antique à empattements,
qui posait une enseigne sage. Archivo et Archivo Narrow enfin, lisibles mais sérieuses, et
qui lisaient administratif là où la borne s'adresse à un public de 15 à 35 ans.

Les noms de produits, les titres d'écran et les titres de catégorie sont en capitales :
c'est la signature typographique du registre, et une capitale grasse se repère de plus loin
qu'un bas-de-casse de même corps.

Deux réglages d'approche, et non un seul. `--letter-spacing-heading` vaut `-0.005em` :
Fredoka est déjà large et ronde, et l'approche négative dessinée pour une condensée ferait
se toucher les panses. `--letter-spacing-display`, pour les libellés capitalisés de petit
corps — boutons, étiquettes, onglets —, vaut `0.02em` : collées, des capitales de 18 ou
20 px se lisent moins vite.

Polices auto-hébergées en `woff2`, sous-ensemble latin, dans `app/assets/fonts/`. Aucun
appel à un hébergeur tiers : le cache des navigateurs est partitionné par site depuis 2020,
un lien externe n'apporte donc aucun gain et ajoute une résolution DNS, une connexion et une
requête bloquante devant le premier rendu. Un test end-to-end vérifie qu'aucune requête ne
part vers `fonts.googleapis.com` ni `fonts.gstatic.com`.

| Fichier | Famille | Poids |
| --- | --- | --- |
| `fredoka-variable-latin.woff2` | Fredoka, graisses 400 à 700 | 29 Ko |
| `figtree-variable-latin.woff2` | Figtree, graisses 400 à 800 | 20 Ko |

Une seule ressource par famille : ce sont des fontes variables, et l'API de Google Fonts
servait le même fichier pour chaque graisse demandée. Déclarer une plage de graisses évite
d'embarquer trois copies des mêmes octets.

`font-display: swap` : le texte s'affiche immédiatement dans la police de substitution, puis
bascule. Un écran vide pendant le chargement est un échec d'affichage, pas un raffinement
typographique.

Licence SIL Open Font License 1.1 : Fredoka par Milena Brandão et Hafontia, Figtree par
Erik Kennedy.

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

Échelle unique de 4 px, de `--space-1` à `--space-6`. Une seule échelle pour les marges,
les espacements internes et les écarts de grille. Elle s'arrête au pas employé : les pas
suivants entreront avec la mise en page des écrans, qui les demandera.

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
| `--radius-pill` | 1000 px | pastille de prix, étiquette d'état |
| `--border-bold` | 3 px | trait d'encre des cartes, boutons, onglets et pastilles |
| `--shadow-card` | `0 6px 0 var(--color-ink)` | ombre pleine, sans flou ni transparence |
| `--shadow-card-pressed` | `0 2px 0 var(--color-ink)` | la même, à l'appui |

Les angles sont presque droits sans être vifs : un angle parfaitement à 90 degrés se lit
comme un défaut de rendu sur un écran tactile. La pastille, elle, est entièrement arrondie.
Le contraste des deux formes est voulu : un prix en pastille se détache d'autant mieux sur
une carte à angles vifs.

L'ombre est un décalage net, plein, sans flou ni transparence — une ombre diffuse
appartient au registre de l'élévation matérielle, étranger à cette direction. Elle porte
aussi un état : un bouton, un onglet ou une carte descend de 4 px à l'appui et son ombre se
réduit d'autant, retour géométrique visible même pour qui distingue mal deux rouges
voisins.

### Motifs écartés

La bande posée sous un titre a connu trois dessins. Les rayures rouges et jaunes en
diagonale sont celles d'un ruban de chantier : la borne y annonçait un danger au lieu d'un
repas. Les deux barres pleines, rouge au-dessus et jaune en dessous, se lisaient comme un
drapeau. Reste l'aplat rouge et son ombre d'encre.

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

Le script rend 25 paires déclarées et 2 groupes à combinaison libre, et sort en erreur dès
qu'un seuil n'est pas tenu. Il tourne en intégration continue à chaque demande de fusion.

Les deux groupes couvrent l'indicateur de focus sur fond accentué, où une seule des deux
combinaisons doit atteindre le seuil.
