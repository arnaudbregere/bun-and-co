# Spécification : parcours de commande sur borne tactile Bun & Co

**Branche** : `001-parcours-commande`

**Créée le** : 2026-11-24

**Statut** : adoptée

**Issue** : #12

## Scénarios utilisateur et tests

### Histoire 1 — Commander un produit seul (priorité P1)

Un client arrive devant la borne en veille, la réveille, choisit de manger sur place,
sélectionne un burger sans le modifier, valide son panier et paie. Il récupère un ticket
portant son numéro de commande.

**Pourquoi cette priorité** : c'est le chemin le plus court qui produit une commande
complète. Sans lui, aucune autre fonction n'a de valeur.

**Test indépendant** : jouable de bout en bout sans personnalisation, sans menu et sans
modification de panier.

**Scénarios d'acceptation** :

1. **Étant donné** la borne en veille, **quand** le client touche l'écran, **alors** l'écran de choix du mode de consommation s'affiche.
2. **Étant donné** le mode « sur place » choisi, **quand** le client ouvre la catégorie Burgers, **alors** la liste des burgers s'affiche avec nom, prix et visuel.
3. **Étant donné** un burger affiché, **quand** le client l'ajoute au panier, **alors** le panier contient une ligne de ce burger en quantité 1 et le total vaut le prix du burger.
4. **Étant donné** un panier contenant une ligne, **quand** le client valide et confirme le paiement, **alors** un numéro de commande à trois chiffres s'affiche et le panier est vidé.

---

### Histoire 2 — Composer un menu (priorité P1)

Le client choisit un burger, le passe en menu, choisit la taille, l'accompagnement et la
boisson. Le prix affiché correspond au forfait de la taille retenue, pas à la somme des
pièces.

**Pourquoi cette priorité** : le menu est la commande majoritaire en restauration rapide,
et il porte les règles de calcul les plus nombreuses.

**Test indépendant** : vérifiable sur le seul écran de composition, en comparant le prix
affiché à la grille tarifaire.

**Scénarios d'acceptation** :

1. **Étant donné** un burger à 5,90 €, **quand** le client le passe en menu de taille M, **alors** le prix de la ligne vaut 9,90 €.
2. **Étant donné** un menu de taille M, **quand** le client le passe en taille L, **alors** le prix de la ligne vaut 10,80 € et la boisson passe de 33 cl à 50 cl.
3. **Étant donné** un menu en cours de composition, **quand** le client remplace les frites par des potatoes, **alors** le prix de la ligne augmente de 0,60 € et la substitution est affichée sur la ligne.
4. **Étant donné** un menu incomplet, **quand** le client tente de l'ajouter au panier, **alors** l'ajout est refusé et l'étape manquante est désignée.

---

### Histoire 3 — Personnaliser un produit (priorité P2)

Le client retire un ingrédient qu'il n'aime pas et ajoute un supplément payant. Les deux
choix apparaissent sur la ligne de panier et le prix en tient compte.

**Pourquoi cette priorité** : la personnalisation différencie une vraie borne d'un
catalogue, et elle porte les deux cas de calcul — gratuit et payant.

**Test indépendant** : vérifiable sur un produit unique, en comparant la ligne de panier
aux choix effectués.

**Scénarios d'acceptation** :

1. **Étant donné** un burger contenant des oignons, **quand** le client retire les oignons, **alors** le prix reste inchangé et la ligne porte la mention « sans oignons ».
2. **Étant donné** un burger affiché, **quand** le client ajoute du bacon, **alors** le prix de la ligne augmente de 1,20 € et la ligne porte la mention « avec bacon ».
3. **Étant donné** une personnalisation en cours, **quand** le client revient en arrière sans valider, **alors** aucune ligne n'est ajoutée au panier.
4. **Étant donné** deux burgers identiques personnalisés différemment, **quand** ils sont ajoutés au panier, **alors** le panier contient deux lignes distinctes et non une ligne de quantité 2.

---

### Histoire 4 — Corriger son panier (priorité P2)

Le client revient sur son panier, change une quantité, supprime une ligne, puis continue
sa commande.

**Pourquoi cette priorité** : une commande sans correction possible provoque un abandon ou
un appel au personnel.

**Test indépendant** : vérifiable depuis l'écran de panier seul, préalablement rempli.

**Scénarios d'acceptation** :

1. **Étant donné** une ligne en quantité 1, **quand** le client incrémente la quantité, **alors** la quantité vaut 2 et le total de ligne vaut le double du prix unitaire.
2. **Étant donné** une ligne en quantité 1, **quand** le client décrémente la quantité, **alors** la ligne est supprimée après confirmation.
3. **Étant donné** un panier non vide, **quand** le client vide le panier, **alors** une confirmation est demandée avant la suppression.
4. **Étant donné** un panier devenu vide, **quand** le client tente de payer, **alors** le paiement est indisponible et la raison est annoncée.

---

### Histoire 5 — Consulter les allergènes (priorité P2)

Le client ouvre la fiche d'un produit et consulte la liste de ses allergènes avant de
l'ajouter.

**Pourquoi cette priorité** : obligation réglementaire issue du règlement européen
1169/2011, dit INCO. Une borne qui ne présente pas cette information n'est pas conforme.

**Test indépendant** : vérifiable sur la fiche produit, sans ajout au panier.

**Scénarios d'acceptation** :

1. **Étant donné** la fiche d'un produit, **quand** elle s'affiche, **alors** les allergènes du produit sont listés en texte, pas uniquement par pictogramme.
2. **Étant donné** un produit sans allergène, **quand** sa fiche s'affiche, **alors** la mention « aucun allergène des quatorze catégories réglementaires » est affichée.
3. **Étant donné** un supplément porteur d'un allergène, **quand** le client l'ajoute, **alors** l'allergène ajouté est signalé.

---

### Histoire 6 — Abandonner une commande (priorité P3)

Le client s'éloigne sans finir. La borne l'avertit, attend, puis se réinitialise pour le
client suivant.

**Pourquoi cette priorité** : sans réinitialisation, le client suivant hérite d'un panier
qui n'est pas le sien, ce qui est une faute fonctionnelle et un risque de litige.

**Test indépendant** : vérifiable en laissant la borne inactive, sans dépendre des autres
histoires.

**Scénarios d'acceptation** :

1. **Étant donné** une commande en cours, **quand** aucune interaction n'a lieu pendant 90 secondes, **alors** un avertissement s'affiche avec un compte à rebours de 20 secondes.
2. **Étant donné** l'avertissement affiché, **quand** le client demande à continuer, **alors** le compte à rebours disparaît et la commande est conservée.
3. **Étant donné** l'avertissement affiché, **quand** le compte à rebours arrive à zéro, **alors** le panier est vidé et la borne retourne en veille.
4. **Étant donné** une commande payée, **quand** le ticket est affiché, **alors** la borne retourne en veille après 15 secondes sans attendre d'interaction.

### Cas limites

- Panier vide : le paiement est indisponible, et la raison est restituée au lecteur d'écran.
- Quantité maximale : 10 unités par ligne, 30 articles par commande. Au-delà, l'incrément est refusé et la limite est annoncée.
- Produit indisponible : la carte le présente désactivé, avec la mention « indisponible », et son ajout est impossible.
- Retour en cours de personnalisation : les choix en cours sont abandonnés, aucune ligne n'est créée.
- Rafraîchissement de la page : la commande en cours est restaurée depuis `sessionStorage`.
- Nouvelle session : aucune commande antérieure n'est restaurée.
- Menu dont le burger est indisponible : le menu entier est indisponible.
- Substitution impossible : un accompagnement indisponible n'est pas proposé en substitution.

## Exigences fonctionnelles

### Parcours et navigation

- **EF-001** : La borne DOIT présenter sept écrans : veille, mode de consommation, carte, fiche produit, panier, paiement, ticket.
- **EF-002** : La borne DOIT permettre de revenir à l'écran précédent depuis tout écran, sauf depuis le ticket.
- **EF-003** : La borne DOIT rendre le panier consultable depuis la carte et depuis la fiche produit, sans perdre la navigation en cours.
- **EF-004** : La borne DOIT interdire tout retour en arrière après la confirmation du paiement.
- **EF-005** : La borne DOIT afficher en permanence, à partir de l'écran de carte, le nombre d'articles et le montant total du panier.

### Carte et produits

- **EF-006** : La borne DOIT présenter la carte en six catégories : Burgers, Menus, Poulet, Accompagnements, Desserts, Boissons.
- **EF-007** : La borne DOIT afficher pour chaque produit son nom, son prix et son visuel.
- **EF-008** : La borne DOIT afficher sur chaque fiche produit la liste nommée de ses allergènes, ou l'absence d'allergène.
- **EF-009** : La borne DOIT présenter un produit indisponible comme désactivé et en interdire l'ajout.

### Menus

- **EF-010** : Un menu DOIT être composé d'un burger, d'un accompagnement et d'une boisson.
- **EF-011** : Un menu DOIT exister en trois tailles : M, L et XL.
- **EF-012** : Le prix d'un menu DOIT valoir le prix du burger augmenté du forfait de la taille retenue : 4,00 € en M, 4,90 € en L, 6,90 € en XL.
- **EF-013** : La taille DOIT déterminer le format de l'accompagnement et de la boisson, selon la grille de composition.
- **EF-014** : La taille XL DOIT inclure un dessert au choix parmi les desserts disponibles.
- **EF-015** : Une substitution d'accompagnement ou de boisson DOIT appliquer le supplément prévu par la grille de substitution.
- **EF-016** : La borne DOIT refuser l'ajout d'un menu incomplet et désigner l'étape manquante.

### Personnalisation

- **EF-017** : La borne DOIT permettre de retirer sans frais chaque ingrédient retirable du produit.
- **EF-018** : La borne DOIT permettre d'ajouter les suppléments payants prévus pour le produit.
- **EF-019** : Le prix d'une ligne DOIT valoir le prix de base du produit augmenté de la somme des suppléments et des substitutions, multiplié par la quantité.
- **EF-019b** : Tous les montants DOIVENT être manipulés en centimes entiers, et convertis en euros au seul moment de l'affichage.
- **EF-020** : La borne DOIT afficher sur la ligne de panier les retraits et les suppléments retenus.
- **EF-021** : Deux produits identiques personnalisés différemment DOIVENT former deux lignes de panier distinctes.
- **EF-022** : Deux produits identiques personnalisés à l'identique DOIVENT être regroupés sur une seule ligne, dont la quantité est incrémentée.

### Panier

- **EF-023** : La borne DOIT permettre d'incrémenter et de décrémenter la quantité de chaque ligne.
- **EF-024** : La borne DOIT demander confirmation avant de supprimer une ligne ou de vider le panier.
- **EF-025** : La borne DOIT limiter chaque ligne à 10 unités et la commande à 30 articles, et annoncer le refus au-delà.
- **EF-026** : La borne DOIT rendre le paiement indisponible lorsque le panier est vide.
- **EF-027** : La borne DOIT conserver la commande en cours dans `sessionStorage` et la restaurer après un rafraîchissement de page.
- **EF-028** : La borne NE DOIT PAS restaurer une commande issue d'une session antérieure.

### Paiement et ticket

- **EF-029** : La borne DOIT proposer deux modes de règlement : carte bancaire sur la borne, ou règlement en caisse.
- **EF-030** : Le paiement DOIT être simulé : aucune donnée bancaire n'est saisie, demandée ni transmise.
- **EF-031** : La borne DOIT afficher un récapitulatif complet avant la confirmation du règlement : lignes, personnalisations, quantités, total.
- **EF-032** : La borne DOIT attribuer à chaque commande confirmée un numéro à trois chiffres, unique au sein de la session.
- **EF-033** : La borne DOIT afficher le mode de consommation retenu sur le ticket.
- **EF-034** : La borne DOIT retourner en veille 15 secondes après l'affichage du ticket.

### Limite de temps

- **EF-035** : La borne DOIT afficher un avertissement après 90 secondes sans interaction, avec un compte à rebours de 20 secondes.
- **EF-036** : La borne DOIT permettre de prolonger la session depuis cet avertissement.
- **EF-037** : La borne DOIT vider le panier et retourner en veille à l'expiration du compte à rebours.
- **EF-038** : La borne NE DOIT PAS déclencher de limite de temps sur l'écran de veille ni sur l'écran de ticket.

### Accessibilité

- **EF-039** : Chaque élément interactif DOIT être atteignable et actionnable au clavier seul.
- **EF-040** : Chaque changement du panier DOIT être annoncé par une région `aria-live="polite"`.
- **EF-041** : Chaque erreur et chaque refus DOIVENT être annoncés par une région `role="alert"`.
- **EF-042** : Chaque écran DOIT porter un titre de page unique et une structure de titres hiérarchisée.
- **EF-043** : Chaque cible tactile DOIT mesurer au moins 44 × 44 pixels.
- **EF-044** : Aucune information NE DOIT être portée par la couleur seule.
- **EF-045** : L'avertissement de limite de temps DOIT recevoir le focus à son apparition et le restituer à sa fermeture.

## Entités clés

- **Produit** : article vendable seul. Identifiant, nom, catégorie, prix, visuel, allergènes, disponibilité, ingrédients retirables, suppléments possibles.
- **Allergène** : une des quatorze catégories réglementaires. Identifiant et libellé.
- **Taille de menu** : M, L ou XL. Forfait tarifaire, format d'accompagnement, format de boisson, présence d'un dessert.
- **Supplément** : ajout payant rattaché à une catégorie de produits. Libellé, prix, allergènes apportés.
- **Substitution** : remplacement d'un composant de menu par un autre, avec son supplément éventuel.
- **Ligne de panier** : produit ou menu retenu, sa composition, ses retraits, ses suppléments, sa quantité, son prix unitaire et son prix total.
- **Panier** : ensemble ordonné de lignes, nombre d'articles, montant total.
- **Commande** : panier confirmé, mode de consommation, mode de règlement, numéro à trois chiffres, horodatage.
- **Mode de consommation** : sur place ou à emporter.

## Carte Bun & Co

Les allergènes sont désignés parmi les quatorze catégories du règlement européen
1169/2011 : gluten, crustacés, œufs, poissons, arachides, soja, lait, fruits à coque,
céleri, moutarde, sésame, sulfites, lupin, mollusques.

### Burgers

| Produit | Prix | Allergènes |
| --- | --- | --- |
| Le Classique | 5,90 € | gluten, lait, œufs, moutarde, sésame, sulfites |
| Le Fermier | 6,90 € | gluten, lait, œufs, moutarde, sésame |
| Le Végétal | 6,40 € | gluten, lait, soja, moutarde, sésame |
| Le Mariner | 6,40 € | gluten, lait, œufs, poissons, moutarde, sésame |
| Le Montagnard | 7,90 € | gluten, lait, œufs, moutarde, sésame, sulfites |
| Le Double Smoky | 8,40 € | gluten, lait, œufs, moutarde, sésame, sulfites |

### Poulet

| Produit | Prix | Allergènes |
| --- | --- | --- |
| Croquettes de poulet, 6 pièces | 4,50 € | gluten, lait, moutarde |
| Croquettes de poulet, 9 pièces | 6,20 € | gluten, lait, moutarde |
| Tenders, 3 pièces | 4,90 € | gluten, lait, œufs |
| Wrap Croustillant | 5,50 € | gluten, lait, œufs, moutarde, céleri |

### Accompagnements

| Produit | Prix | Allergènes |
| --- | --- | --- |
| Frites maison, petite | 2,50 € | aucun |
| Frites maison, moyenne | 3,10 € | aucun |
| Frites maison, grande | 3,60 € | aucun |
| Potatoes | 3,30 € | gluten |
| Salade verte | 2,90 € | moutarde, sulfites |
| Pommes tranchées | 2,20 € | aucun |

### Desserts

| Produit | Prix | Allergènes |
| --- | --- | --- |
| Cookie tout chocolat | 1,90 € | gluten, lait, œufs, soja |
| Brownie noix de pécan | 2,40 € | gluten, lait, œufs, fruits à coque |
| Sundae caramel | 2,90 € | lait, œufs, soja |
| Beignet à la pomme | 2,20 € | gluten, lait, œufs |

### Boissons

| Produit | Prix | Allergènes |
| --- | --- | --- |
| Soda, 33 cl | 2,40 € | aucun |
| Soda, 50 cl | 2,90 € | aucun |
| Thé glacé pêche, 50 cl | 2,60 € | aucun |
| Eau minérale, 50 cl | 2,20 € | aucun |
| Jus d'orange, 25 cl | 2,70 € | aucun |
| Café | 1,80 € | aucun |
| Milkshake vanille, chocolat ou fraise | 3,50 € | lait, œufs, soja |

### Menus

Un menu existe pour chacun des six burgers. Son prix vaut le prix du burger augmenté du
forfait de la taille retenue.

| Taille | Forfait | Accompagnement inclus | Boisson incluse | Dessert |
| --- | --- | --- | --- | --- |
| M | + 4,00 € | frites maison, petite | 33 cl | non |
| L | + 4,90 € | frites maison, moyenne | 50 cl | non |
| XL | + 6,90 € | frites maison, grande | 50 cl | oui, au choix |

Prix résultants, à titre de contrôle :

| Menu | M | L | XL |
| --- | --- | --- | --- |
| Le Classique | 9,90 € | 10,80 € | 12,80 € |
| Le Fermier | 10,90 € | 11,80 € | 13,80 € |
| Le Végétal | 10,40 € | 11,30 € | 13,30 € |
| Le Mariner | 10,40 € | 11,30 € | 13,30 € |
| Le Montagnard | 11,90 € | 12,80 € | 14,80 € |
| Le Double Smoky | 12,40 € | 13,30 € | 15,30 € |

Le forfait croît moins vite que la somme des pièces achetées séparément : l'économie
réalisée par le client augmente avec la taille, de 0,90 € en M à 1,50 € en XL. Cette
propriété est une règle métier vérifiée par les tests unitaires du lot 4.

### Substitutions dans un menu

| Composant remplacé | Remplacement | Supplément |
| --- | --- | --- |
| Accompagnement | Potatoes | + 0,60 € |
| Accompagnement | Salade verte | + 0,40 € |
| Accompagnement | Pommes tranchées | sans frais |
| Boisson | Milkshake | + 1,10 € |
| Boisson | Jus d'orange | + 0,30 € |
| Boisson | Eau minérale, thé glacé ou café | sans frais |
| Boisson 33 cl en taille M | Boisson 50 cl | + 0,50 € |

Les suppléments de substitution sont des forfaits, indépendants de la taille du menu. Ils
sont calibrés sur la taille M, où ils correspondent à l'écart de prix à la pièce. En
tailles L et XL, l'écart réel est plus faible, mais le forfait reste identique : c'est la
pratique du secteur, et elle évite une grille tarifaire à neuf cases pour un gain de
quelques centimes. Ce choix est une règle métier, pas une approximation de calcul.

### Personnalisation des burgers

Retraits possibles, sans frais : oignons, cornichons, salade, tomate, sauce, fromage.

| Supplément | Prix | Allergènes apportés |
| --- | --- | --- |
| Bacon | + 1,20 € | aucun |
| Cheddar | + 0,80 € | lait |
| Galette de pomme de terre | + 1,00 € | gluten |
| Œuf | + 0,90 € | œufs |
| Steak supplémentaire | + 2,50 € | aucun |
| Sauce supplémentaire | + 0,50 € | œufs, moutarde, sulfites |

Le Végétal n'accepte ni bacon ni steak supplémentaire. Le Mariner n'accepte pas le steak
supplémentaire. Les produits des catégories Poulet,
Accompagnements, Desserts et Boissons n'acceptent ni retrait ni supplément.

## Écrans et transitions

| Écran | Rôle | Sorties autorisées |
| --- | --- | --- |
| Veille | Invite à démarrer une commande | Mode de consommation |
| Mode de consommation | Sur place ou à emporter | Carte, retour en veille |
| Carte | Navigation par catégorie, ajout direct | Fiche produit, panier, retour au mode |
| Fiche produit | Détail, allergènes, personnalisation, composition de menu | Carte, panier |
| Panier | Récapitulatif et correction | Carte, paiement, retour en veille après confirmation de l'abandon |
| Paiement | Choix du mode de règlement et confirmation | Ticket, retour au panier |
| Ticket | Numéro de commande | Veille, automatiquement après 15 secondes |

Aucune transition ne ramène du ticket vers le paiement ou le panier. La commande est
confirmée et immuable.

## Critères d'accessibilité par écran

| Écran | Points vérifiés |
| --- | --- |
| Veille | Démarrage actionnable au clavier, pas de déclenchement par simple survol, animation respectant `prefers-reduced-motion` |
| Mode de consommation | Deux boutons de 44 × 44 pixels minimum, libellés explicites, focus visible, titre de page unique |
| Carte | Navigation par catégories en liste de liens ou d'onglets accessibles, état actif non porté par la couleur seule, grille de produits parcourable au clavier dans l'ordre visuel |
| Fiche produit | Options en groupes de champs étiquetés, retraits en cases à cocher, taille de menu en boutons radio, allergènes en texte lisible, prix mis à jour annoncé en `aria-live` |
| Panier | Chaque ligne identifiable par un libellé complet, boutons de quantité étiquetés par produit et non par icône seule, suppression confirmée dans une boîte de dialogue avec focus piégé puis restitué, total annoncé à chaque changement |
| Paiement | Récapitulatif structuré en tableau, bouton de confirmation explicite, erreur de règlement annoncée en `role="alert"` |
| Ticket | Numéro de commande annoncé dès l'affichage, compte à rebours de retour en veille annoncé mais non intrusif |
| Tous | Contrastes 4.5:1 pour le texte et 3:1 pour les composants, aucune perte d'information au zoom 200 %, aucun piège au clavier, avertissement de limite de temps recevant le focus |

## Critères de succès mesurables

- **CS-001** : Une commande d'un produit seul s'effectue en moins de 60 secondes et en 5 interactions au maximum.
- **CS-002** : Une commande d'un menu personnalisé s'effectue en moins de 120 secondes.
- **CS-003** : Les sept écrans ne présentent aucune violation détectée par axe-core.
- **CS-004** : Le parcours complet est réalisable au clavier seul, sans souris ni écran tactile.
- **CS-005** : Toutes les paires de couleurs utilisées respectent les seuils de contraste, vérifiées par un test automatisé.
- **CS-006** : Les règles tarifaires sont couvertes à 100 % par les tests unitaires du domaine.
- **CS-007** : Le chargement initial reste sous 2 secondes sur une connexion 4G simulée, pour un poids de JavaScript inférieur à 200 kilooctets compressés.
- **CS-008** : La commande en cours survit à un rafraîchissement de page et ne survit pas à une nouvelle session.

## Hypothèses

- La borne est un écran tactile unique en mode portrait, utilisé par un client à la fois.
- La conception reste mobile first : la mise en page est d'abord définie pour une largeur étroite, puis élargie.
- Le catalogue est une donnée statique livrée avec l'application. Il ne change pas sans nouveau déploiement.
- Les prix sont en euros, toutes taxes comprises, et affichés avec deux décimales et la virgule comme séparateur décimal. En interne, ils sont stockés et calculés en centimes entiers, afin d'écarter les erreurs d'arrondi des nombres à virgule flottante.
- Le catalogue est servi par une route préconstruite au build et consommé par un appel réseau, afin que l'application comporte un vrai code d'appel de données sans exiger de serveur à l'exécution.
- Le paiement est simulé de bout en bout. Aucune donnée bancaire n'est saisie, demandée ni transmise.
- Les numéros de commande sont tirés dans la plage 100 à 999 et uniques au sein d'une session.
- L'interface est en français uniquement.
- Les visuels de produits sont des images locales optimisées, avec un texte alternatif vide, le nom du produit étant déjà affiché en texte.

## Hors périmètre

- Paiement réel et intégration d'un terminal bancaire.
- Compte client, fidélité, codes promotionnels.
- Impression physique du ticket et communication avec la cuisine.
- Back-office d'édition du catalogue et suivi des commandes.
- Multilinguisme.
- Information nutritionnelle au-delà des allergènes.
- Gestion des stocks en temps réel : la disponibilité est une donnée statique du catalogue.
