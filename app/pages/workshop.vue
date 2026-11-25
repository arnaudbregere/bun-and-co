<script setup lang="ts">
import type { IconName } from '~/components/atoms/BaseIcon.vue'
import type { CategoryTab } from '~/components/molecules/CategoryTabs.vue'
import { itemCount } from '~/domain/cart'
import { MENU_SIZE_RULES } from '~/domain/menu-rules'
import { cents } from '~/domain/money'
import { cartTotalCents, extrasTotalCents, lineTotalCents, unitPriceCents } from '~/domain/pricing'
import { ALLERGENS, MENU_SIZES, toCartLineId, type CartLine, type MenuSize } from '~/domain/types'
import { PRODUCTS } from '~/services/catalogue-data'
import { PRODUCT_IMAGES } from '~/services/product-images'

/**
 * Atelier des composants.
 *
 * Les composants du lot 5 n'apparaissent dans aucun écran du parcours avant le
 * lot 6. Sans cette page, ils ne se vérifieraient que par lecture du code, et le
 * détecteur de design n'aurait aucune page rendue à analyser avant la fin du lot
 * 6 — or son propre avertissement qualifie une analyse de fichiers source de
 * rapport incomplet.
 *
 * Chaque demande de fusion du lot ajoute ici son composant, dans ses états.
 */

useHead({ title: 'Atelier des composants · Bun & Co' })

const icones: readonly IconName[] = ['arrow-left', 'cart', 'plus', 'minus', 'trash', 'alert']

// L'atelier lit la couche services directement : c'est une page de
// vérification, sans parcours ni état. Les écrans du lot 6 passeront par un
// composable, comme le veut la règle des trois couches.
const apercu = (['classique', 'mariner', 'fries-medium', 'milkshake'] as const).flatMap((id) => {
  const image = PRODUCT_IMAGES[id]
  // `noUncheckedIndexedAccess` rend un accès par clé possiblement indéfini, et
  // c'est juste : le fichier des visuels est produit par un script, pas garanti
  // par le typage.
  return image === undefined ? [] : [{ id, image }]
})

const sansOignons = ref(false)
const sansCornichons = ref(true)
const avecBacon = ref(true)
const avecCheddar = ref(false)

// L'atelier lit la carte réelle plutôt que des produits inventés : un spécimen
// qui montre autre chose que ce que la borne vendra ne vérifie rien.
const carteParIdentifiant = (identifiant: string) =>
  PRODUCTS.find((produit) => produit.id === identifiant)

const pourCarte = (identifiant: string, disponible: boolean) => {
  const produit = carteParIdentifiant(identifiant)
  const visuel = PRODUCT_IMAGES[identifiant]

  return produit === undefined
    ? undefined
    : {
        id: produit.id,
        name: produit.name,
        priceCents: produit.priceCents,
        src: visuel?.medium ?? '',
        available: disponible,
      }
}

const cartes = ['classique', 'fermier', 'wrap', 'sundae'].flatMap((identifiant) => {
  const carte = pourCarte(identifiant, true)
  return carte === undefined ? [] : [carte]
})

const indisponible = pourCarte('montagnard', false) ?? {
  id: 'montagnard',
  name: 'Le Montagnard',
  priceCents: cents(790),
  src: '',
  available: false,
}

const allergenesDuClassique = carteParIdentifiant('classique')?.allergens ?? []

// Groupe d'options : les retraits et les suppléments du Classique, tels que la
// carte les déclare. Le total vient du domaine, `extrasTotalCents`, et non d'une
// addition écrite dans la page.
const classique = carteParIdentifiant('classique')

const retraits = (classique?.removables ?? []).map((retrait) => ({
  id: retrait.id,
  label: `Sans ${retrait.label.toLocaleLowerCase('fr-FR')}`,
}))

const supplements = (classique?.extras ?? []).map((extra) => ({
  id: extra.id,
  label: extra.label,
  priceCents: extra.priceCents,
}))

const retraitsRetenus = ref<readonly string[]>(['pickles'])
const supplementsRetenus = ref<readonly string[]>(['bacon'])

const totalDesSupplements = computed(() =>
  classique === undefined
    ? cents(0)
    : extrasTotalCents(classique, {
        removedIds: retraitsRetenus.value,
        extraIds: supplementsRetenus.value,
      }),
)

// Sélecteur de taille : les trois règles du domaine, dans l'ordre croissant.
// Aucun forfait ni aucun format n'est écrit dans la page.
const reglesDeTaille = MENU_SIZES.map((taille) => MENU_SIZE_RULES[taille])

const tailleRetenue = ref<MenuSize>('L')

// Lignes de panier : le même burger, personnalisé de deux façons. Exigence
// EF-021 : ce sont deux lignes distinctes, et les mentions sont ce qui les
// distingue. Les prix viennent du domaine, aucune multiplication n'est écrite
// ici.
const quantitesDeLigne = ref<Record<string, number>>({ nature: 2, garni: 1 })

const lignesDePanier = computed(() => {
  if (classique === undefined) return []

  const compositions = [
    { id: 'nature', removedIds: [], extraIds: [], removed: [], extras: [] },
    {
      id: 'garni',
      removedIds: ['onions'],
      extraIds: ['bacon'],
      removed: ['Oignons'],
      extras: classique.extras
        .filter((extra) => extra.id === 'bacon')
        .map((extra) => ({ id: extra.id, label: extra.label, priceCents: extra.priceCents })),
    },
  ] as const

  return compositions.map((composition) => {
    const ligne: CartLine = {
      id: toCartLineId(composition.id),
      productId: classique.id,
      quantity: quantitesDeLigne.value[composition.id] ?? 1,
      customisation: { removedIds: composition.removedIds, extraIds: composition.extraIds },
    }

    return {
      id: composition.id,
      name: classique.name,
      quantity: ligne.quantity,
      removed: composition.removed,
      extras: composition.extras,
      unitPriceCents: unitPriceCents(classique, ligne),
      totalPriceCents: lineTotalCents(classique, ligne),
    }
  })
})

// Résumé du panier : le compte et le total viennent du domaine, calculés sur
// les lignes du spécimen précédent.
const lignesDuDomaine = computed(() =>
  classique === undefined
    ? []
    : lignesDePanier.value.map((ligne) => ({
        id: toCartLineId(ligne.id),
        productId: classique.id,
        quantity: ligne.quantity,
        customisation: {
          removedIds: ligne.removed.length > 0 ? ['onions'] : [],
          extraIds: ligne.extras.map((extra) => extra.id),
        },
      })),
)

const nombreDArticles = computed(() => itemCount({ lines: lignesDuDomaine.value }))

const totalDuPanier = computed(() =>
  classique === undefined ? cents(0) : cartTotalCents([classique], lignesDuDomaine.value),
)

const quantite = ref(2)

// Les six entrées de l'exigence EF-006. « Menus » n'est pas une catégorie de
// produit : un menu se compose à partir d'un burger. L'écart appartient à
// l'écran de carte, pas à la barre d'onglets, qui reçoit sa liste.
const categories: readonly CategoryTab[] = [
  { id: 'burgers', label: 'Burgers' },
  { id: 'menus', label: 'Menus' },
  { id: 'chicken', label: 'Poulet' },
  { id: 'sides', label: 'Accompagnements' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Boissons' },
]

const categorie = ref<string>('burgers')

const produitsDeLaCategorie = computed(() =>
  PRODUCTS.filter((produit) => produit.category === categorie.value),
)

const annonceCourtoise = ref('')
const alerte = ref('')

const annoncerAuLecteur = (texte: string) => {
  annonceCourtoise.value = ''
  annonceCourtoise.value = texte
}

const alerterLeLecteur = (texte: string) => {
  alerte.value = ''
  alerte.value = texte
}

const dernierClic = ref<string | null>(null)

const annoncer = (libelle: string) => {
  dernierClic.value = libelle
}
</script>

<template>
  <main class="o-container o-stack">
    <header class="o-stack">
      <h1>Atelier des composants</h1>
      <div class="c-band" aria-hidden="true" />
      <p>
        Chaque composant de la borne y figure dans ses états. Cette page ne fait pas partie du
        parcours client : elle sert à vérifier les composants au clavier, à l'œil et par les audits
        automatiques.
      </p>
    </header>

    <section class="o-stack" aria-labelledby="titre-bouton">
      <h2 id="titre-bouton">Bouton</h2>

      <h3>Variantes</h3>
      <div class="c-specimen">
        <div class="c-button-group">
          <BaseButton @activate="annoncer('Ajouter au panier')">Ajouter au panier</BaseButton>
          <BaseButton variant="secondary" @activate="annoncer('Retour')">Retour</BaseButton>
          <BaseButton variant="quiet" @activate="annoncer('Voir les allergènes')">
            Voir les allergènes
          </BaseButton>
        </div>
        <p class="c-specimen__note">
          Hauteur de 56 px en variante principale, 48 px pour les deux autres. Au-dessus des 44 px
          exigés par le critère WCAG 2.5.5.
        </p>
      </div>

      <h3>État indisponible</h3>
      <div class="c-specimen">
        <div class="c-button-group">
          <BaseButton disabled reason="Panier vide" @activate="annoncer('Payer')">Payer</BaseButton>
          <BaseButton disabled variant="secondary" @activate="annoncer('Quantité maximale')">
            Ajouter
          </BaseButton>
        </div>
        <p class="c-specimen__note">
          Le bouton indisponible reste dans le parcours de tabulation : il porte
          <code>aria-disabled</code> et non l'attribut <code>disabled</code>, pour que la raison du
          refus soit atteignable au clavier. Son activation n'émet rien.
        </p>
      </div>

      <h3>Prise de focus</h3>
      <div class="c-specimen">
        <div class="c-button-group">
          <BaseButton @activate="annoncer('Focus principal')">Principal</BaseButton>
          <BaseButton variant="secondary" @activate="annoncer('Focus secondaire')">
            Secondaire
          </BaseButton>
        </div>
        <p class="c-specimen__note">
          À observer à la tabulation, et non à la souris : l'indicateur suit
          <code>:focus-visible</code>. Anneau sombre et liseré clair, pour tenir le seuil de 3:1 du
          critère WCAG 1.4.11 sur le rouge comme sur le fond blanc.
        </p>
      </div>

      <h3>Dernière activation</h3>
      <p aria-live="polite" class="c-specimen__note">
        {{ dernierClic === null ? 'Aucun bouton activé.' : `Bouton activé : ${dernierClic}.` }}
      </p>
    </section>
    <section class="o-stack" aria-labelledby="titre-carte">
      <h2 id="titre-carte">Carte de produit</h2>

      <h3>Quatre produits</h3>
      <div class="c-specimen">
        <ul class="c-specimen__grid">
          <li v-for="produit of cartes" :key="produit.id">
            <ProductCard
              :name="produit.name"
              :price-cents="produit.priceCents"
              :src="produit.src"
              :available="produit.available"
              loading="eager"
              @select="annoncerAuLecteur(`${produit.name} sélectionné`)"
            />
          </li>
        </ul>
        <p class="c-specimen__note">
          La carte entière est une cible unique, et une seule prise de focus. Un titre cliquable
          entouré de zones mortes multiplierait les appuis manqués, et tripler les arrêts de
          tabulation par produit ferait abandonner un client au clavier avant la fin de la carte.
        </p>
      </div>

      <h3>Produit indisponible</h3>
      <div class="c-specimen">
        <div class="c-specimen__grid">
          <ProductCard
            :name="indisponible.name"
            :price-cents="indisponible.priceCents"
            :src="indisponible.src"
            :available="false"
            loading="eager"
            @select="annoncerAuLecteur('Ceci ne doit jamais être annoncé')"
          />
        </div>
        <p class="c-specimen__note">
          Exigence EF-009 : le produit est présenté désactivé et son ajout est impossible. La carte
          reste atteignable au clavier et porte le mot « indisponible », la couleur ne disant jamais
          seule qu'un produit ne peut pas être commandé.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-etat">
      <h2 id="titre-etat">Étiquette d'état</h2>

      <h3>Les trois états</h3>
      <div class="c-specimen">
        <p class="c-button-group">
          <StatusBadge state="unavailable" />
          <StatusBadge state="included" />
          <StatusBadge state="surcharge" />
        </p>
        <p class="c-specimen__note">
          Chaque état porte son libellé. Le critère WCAG 1.4.1 interdit de porter une information
          par la couleur seule, et le mode contraste élevé du système écrase les couleurs d'auteur :
          une pastille sans texte ne dirait plus rien.
        </p>
      </div>

      <h3>En contexte</h3>
      <div class="c-specimen">
        <p>
          Salade verte — <PriceTag :amount-cents="cents(290)" /> <StatusBadge state="included" />
        </p>
        <p>Potatoes — <PriceTag :amount-cents="cents(330)" /> <StatusBadge state="surcharge" /></p>
        <p>
          Le Montagnard — <PriceTag :amount-cents="cents(790)" />
          <StatusBadge state="unavailable" />
        </p>
        <p class="c-specimen__note">
          L'étiquette n'est pas interactive et ne prend pas le focus : elle qualifie ce qui
          l'entoure, elle ne s'active pas.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-groupe">
      <h2 id="titre-groupe">Groupe d'options</h2>

      <h3>Retraits et suppléments d'un produit</h3>
      <div class="c-specimen">
        <OptionGroup v-model="retraitsRetenus" legend="Retirer" :options="retraits" />
        <OptionGroup
          v-model="supplementsRetenus"
          legend="Ajouter"
          :options="supplements"
          :total-cents="totalDesSupplements"
        />
        <p class="c-specimen__note">
          Chaque groupe est un <code>fieldset</code> nommé par sa <code>legend</code> : un lecteur
          d'écran annonce le nom du groupe avant la première case, puis le rappelle à chaque option.
          Sans lui, « Bacon » suivrait « Sans cornichons » dans une même liste plate, et rien ne
          dirait que l'un retire et que l'autre ajoute.
        </p>
      </div>

      <h3>Produit sans personnalisation</h3>
      <div class="c-specimen">
        <OptionGroup :model-value="[]" legend="Retirer" :options="[]" />
        <p class="c-specimen__note">
          Rien n'est rendu : un groupe de zéro option annoncerait une personnalisation que le
          produit n'offre pas. Les croquettes, les boissons et les desserts ne se modifient pas.
        </p>
      </div>

      <h3>Le composant n'additionne pas</h3>
      <div class="c-specimen">
        <p class="c-specimen__note">
          Le total affiché ci-dessus vaut
          <strong><PriceTag :amount-cents="totalDesSupplements" /></strong>, calculé par
          <code>extrasTotalCents</code> dans <code>app/domain/pricing.ts</code>. Deux endroits qui
          additionnent les mêmes montants finissent par ne plus être d'accord, et c'est le ticket
          qui tranche.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-icone">
      <h2 id="titre-icone">Icône</h2>

      <h3>Jeu complet</h3>
      <div class="c-specimen">
        <ul class="c-icon-list">
          <li v-for="nom of icones" :key="nom">
            <BaseIcon :name="nom" />
            <code>{{ nom }}</code>
          </li>
        </ul>
        <p class="c-specimen__note">
          Six symboles, et aucune dépendance d'icônes : le parcours n'en emploie pas d'autres. La
          taille est en <code>em</code>, donc l'icône suit le corps du texte et le zoom du
          navigateur.
        </p>
      </div>

      <h3>Bouton réduit à son icône</h3>
      <div class="c-specimen">
        <div class="c-button-group">
          <BaseButton variant="secondary" @activate="annoncer('Vider le panier')">
            <BaseIcon name="trash" />
            <span class="u-visually-hidden">Vider le panier</span>
          </BaseButton>
        </div>
        <p class="c-specimen__note">
          L'icône est décorative et porte <code>aria-hidden</code>. Le libellé existe dans le
          balisage, masqué à l'écran par <code>.u-visually-hidden</code> : le bouton garde un nom
          pour un lecteur d'écran, et aucune icône ne porte seule le sens d'une action.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-ligne">
      <h2 id="titre-ligne">Ligne de panier</h2>

      <h3>Le même produit, deux personnalisations</h3>
      <div class="c-specimen">
        <ul class="o-stack o-stack--tight c-specimen__lines">
          <CartLineItem
            v-for="ligne of lignesDePanier"
            :key="ligne.id"
            :name="ligne.name"
            :quantity="ligne.quantity"
            :removed="ligne.removed"
            :extras="ligne.extras"
            :unit-price-cents="ligne.unitPriceCents"
            :total-price-cents="ligne.totalPriceCents"
            @remove="annoncerAuLecteur(`Retrait de ${ligne.name} demandé`)"
          >
            <template #quantity>
              <QuantityStepper
                :quantity="ligne.quantity"
                :product-name="ligne.name"
                :increase-disabled-reason="ligne.quantity >= 10 ? 'Maximum de 10 par ligne' : ''"
                @increase="quantitesDeLigne[ligne.id] = ligne.quantity + 1"
                @decrease="quantitesDeLigne[ligne.id] = ligne.quantity - 1"
                @remove="annoncerAuLecteur(`Retrait de ${ligne.name} demandé`)"
              />
            </template>
          </CartLineItem>
        </ul>
        <p class="c-specimen__note">
          Exigence EF-021 : deux produits identiques personnalisés différemment forment deux lignes.
          Ce sont les mentions « sans oignons » et « avec bacon » qui les distinguent — sans elles,
          le panier afficherait deux fois « Le Classique » et le client ne saurait pas laquelle
          retirer.
        </p>
      </div>

      <h3>Le composant ne multiplie rien</h3>
      <div class="c-specimen">
        <p class="c-specimen__note">
          Prix unitaires et prix de ligne viennent de <code>unitPriceCents</code> et
          <code>lineTotalCents</code>, dans <code>app/domain/pricing.ts</code>. Le sélecteur de
          quantité arrive par un emplacement : une molécule ne consomme pas une molécule, c'est
          l'écran qui place l'un dans l'autre. Le bouton de retrait ne retire rien, il demande le
          retrait, et l'écran en demandera confirmation, exigence EF-024.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-allergenes">
      <h2 id="titre-allergenes">Liste d'allergènes</h2>

      <h3>Un produit et ses allergènes</h3>
      <div class="c-specimen">
        <p>Le Classique</p>
        <AllergenList :allergens="allergenesDuClassique" />
        <p class="c-specimen__note">
          Exigence EF-008 : les allergènes sont nommés en texte, et jamais portés par un pictogramme
          seul. L'ordre suivi est celui du règlement 1169/2011, pour qu'un allergène occupe le même
          rang d'une fiche à l'autre.
        </p>
      </div>

      <h3>Produit sans allergène</h3>
      <div class="c-specimen">
        <p>Pommes tranchées</p>
        <AllergenList :allergens="[]" />
        <p class="c-specimen__note">
          Une liste vide se lirait comme un oubli de la borne. La mention est explicite, et personne
          n'a à commander sur une absence d'information.
        </p>
      </div>

      <h3>Allergène apporté par un supplément</h3>
      <div class="c-specimen">
        <p>Le Végétal, avec cheddar</p>
        <AllergenList :allergens="['gluten', 'soy']" :extra-allergens="['milk']" />
        <p class="c-specimen__note">
          Histoire 5 : l'allergène du supplément est signalé comme tel. Le client qui retire le
          supplément retire aussi l'allergène, ce qu'une liste fondue en une seule ne dirait pas.
        </p>
      </div>

      <h3>Les quatorze catégories</h3>
      <div class="c-specimen">
        <AllergenList :allergens="ALLERGENS" />
        <p class="c-specimen__note">
          La liste du règlement est fermée : un allergène hors de ces catégories n'existe pas au
          sens de la réglementation. Les libellés français vivent dans le composant, le domaine ne
          connaissant pas la langue d'affichage.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-prix">
      <h2 id="titre-prix">Montant</h2>

      <h3>En ligne</h3>
      <div class="c-specimen">
        <p>
          Burger : <PriceTag :amount-cents="cents(590)" />, supplément bacon :
          <PriceTag :amount-cents="cents(120)" />, montant nul :
          <PriceTag :amount-cents="cents(0)" />.
        </p>
        <p class="c-specimen__note">
          Les montants circulent en centimes entiers dans tout le projet. Ce composant est le seul
          endroit où un montant est divisé par cent, et le seul où il devient une chaîne.
        </p>
      </div>

      <h3>Total du panier</h3>
      <div class="c-specimen">
        <PriceTag :amount-cents="cents(2470)" variant="total" />
        <p class="c-specimen__note">
          Corps de 49 px, le plus grand de l'échelle : c'est le montant que le client cherche des
          yeux sans le lire. Chiffres à largeur fixe, pour que le total ne tremble pas à chaque
          ajout.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-onglets">
      <h2 id="titre-onglets">Onglets de catégories</h2>

      <h3>Les six catégories de la carte</h3>
      <div class="c-specimen">
        <CategoryTabs v-model="categorie" :tabs="categories" label="Catégories de la carte">
          <p v-if="categorie === 'menus'">
            Un menu se compose à partir d'un burger : cette entrée mènera à l'écran de composition
            du lot 6, et non à une liste de produits.
          </p>
          <ul v-else class="o-stack o-stack--tight">
            <li v-for="produit of produitsDeLaCategorie" :key="produit.id">
              {{ produit.name }} — <PriceTag :amount-cents="produit.priceCents" />
            </li>
          </ul>
        </CategoryTabs>
        <p class="c-specimen__note">
          Tab entre dans la barre et n'y rencontre qu'un arrêt, les flèches changent d'onglet, Home
          et End vont aux extrémités. La sélection suit le focus : la carte est déjà chargée, et
          exiger un second appui ne ferait qu'allonger le parcours clavier. L'onglet courant se
          distingue par son fond, sa graisse et son ombre portée, jamais par la couleur seule.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-option">
      <h2 id="titre-option">Option à cocher</h2>

      <h3>Retraits sans frais</h3>
      <div class="c-specimen">
        <div class="o-stack o-stack--tight">
          <OptionToggle v-model="sansOignons" label="Sans oignons" />
          <OptionToggle v-model="sansCornichons" label="Sans cornichons" />
        </div>
        <p class="c-specimen__note">
          L'étiquette enveloppe la case : tout le texte est cliquable, et la cible dépasse les 48
          px. L'état coché se voit aussi par la bordure, la case seule étant un détail de 24 px au
          bout d'une ligne.
        </p>
      </div>

      <h3>Suppléments payants</h3>
      <div class="c-specimen">
        <div class="o-stack o-stack--tight">
          <OptionToggle v-model="avecBacon" label="Bacon">
            <template #price><PriceTag :amount-cents="cents(120)" /></template>
          </OptionToggle>
          <OptionToggle v-model="avecCheddar" label="Cheddar">
            <template #price><PriceTag :amount-cents="cents(80)" /></template>
          </OptionToggle>
        </div>
        <p class="c-specimen__note">
          Le prix arrive par un emplacement, et non par une propriété : seul l'atome Prix convertit
          des centimes en euros, et un atome ne consomme pas un autre atome. C'est la page qui place
          l'un dans l'autre.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-annonce">
      <h2 id="titre-annonce">Région d'annonce</h2>

      <h3>Annonce courtoise</h3>
      <div class="c-specimen">
        <div class="c-button-group">
          <BaseButton
            variant="secondary"
            @activate="annoncerAuLecteur('Le Classique ajouté au panier')"
          >
            Ajouter un produit
          </BaseButton>
          <BaseButton variant="secondary" @activate="annoncerAuLecteur('Panier vidé')">
            Annoncer un panier vidé
          </BaseButton>
        </div>
        <LiveRegion :message="annonceCourtoise" />
        <p class="c-specimen__note">
          La région est invisible : elle existe dans le balisage avant d'avoir un message, faute de
          quoi un lecteur d'écran n'annoncerait pas le premier. Dernier message émis :
          <strong>{{ annonceCourtoise === '' ? 'aucun' : annonceCourtoise }}</strong>.
        </p>
      </div>

      <h3>Alerte</h3>
      <div class="c-specimen">
        <div class="c-button-group">
          <BaseButton
            variant="secondary"
            @activate="alerterLeLecteur('Quantité maximale atteinte')"
          >
            Dépasser la limite
          </BaseButton>
        </div>
        <LiveRegion :message="alerte" mode="alert" />
        <p class="c-specimen__note">
          Un même message envoyé deux fois de suite est relu : la région est vidée puis réécrite au
          cycle suivant. « Quantité maximale atteinte » doit se répéter si le client insiste.
          Dernière alerte : <strong>{{ alerte === '' ? 'aucune' : alerte }}</strong>.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-resume">
      <h2 id="titre-resume">Résumé du panier</h2>

      <h3>Panier rempli</h3>
      <div class="c-specimen">
        <CartSummary
          :item-count="nombreDArticles"
          :total-cents="totalDuPanier"
          @open="annoncerAuLecteur('Ouverture du panier demandée')"
        />
        <p class="c-specimen__note">
          Le compte et le total viennent de <code>itemCount</code> et <code>cartTotalCents</code>,
          calculés sur les lignes de la section précédente : changer une quantité plus haut change
          ce total. La barre colle au bas de son cadre, <code>position: sticky</code> et non
          <code>fixed</code> — une barre fixe sort du flux et recouvre le dernier élément de la
          liste.
        </p>
      </div>

      <h3>Panier vide</h3>
      <div class="c-specimen">
        <CartSummary :item-count="0" :total-cents="cents(0)" />
        <p class="c-specimen__note">
          Exigence EF-026 : l'accès est refusé, et il donne sa raison plutôt que de rester
          silencieusement inopérant. La barre annonce « panier vide » et non « 0 article » : un zéro
          suivi d'un montant nul se lit comme un prix, pas comme une absence.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-quantite">
      <h2 id="titre-quantite">Sélecteur de quantité</h2>

      <h3>Quantité courante</h3>
      <div class="c-specimen">
        <QuantityStepper
          :quantity="quantite"
          product-name="Le Classique"
          :increase-disabled-reason="quantite >= 10 ? 'Maximum de 10 par ligne' : ''"
          @increase="quantite += 1"
          @decrease="quantite -= 1"
          @remove="annoncerAuLecteur('Suppression de la ligne demandée')"
        />
        <p class="c-specimen__note">
          La valeur s'affiche, elle ne se saisit pas : une borne tactile n'a pas de clavier. Sa
          largeur est fixe, sans quoi le passage de 9 à 10 décalerait les boutons sous un doigt qui
          enchaîne les appuis.
        </p>
      </div>

      <h3>Dernière unité</h3>
      <div class="c-specimen">
        <QuantityStepper
          :quantity="1"
          product-name="Le Fermier"
          @remove="annoncerAuLecteur('Suppression de la ligne demandée')"
        />
        <p class="c-specimen__note">
          À une unité, diminuer ne produit pas une quantité nulle : le composant demande la
          suppression de la ligne, et l'icône passe à la corbeille. C'est l'écran qui en demandera
          confirmation, exigence EF-024.
        </p>
      </div>

      <h3>Limite atteinte</h3>
      <div class="c-specimen">
        <QuantityStepper
          :quantity="10"
          product-name="Le Végétal"
          increase-disabled-reason="Maximum de 10 par ligne"
        />
        <p class="c-specimen__note">
          Le bouton refuse en donnant sa raison, plutôt que de rester silencieusement inopérant. Les
          limites viennent du domaine : dix par ligne, trente par commande, exigence EF-025. Aucune
          n'est écrite dans le composant.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-taille">
      <h2 id="titre-taille">Sélecteur de taille de menu</h2>

      <h3>Les trois tailles</h3>
      <div class="c-specimen">
        <MenuSizePicker v-model="tailleRetenue" legend="Taille du menu" :rules="reglesDeTaille" />
        <p class="c-specimen__note">
          Des boutons radio natifs : le navigateur donne l'exclusivité du choix, le passage d'une
          taille à l'autre aux flèches et un seul arrêt de tabulation pour le groupe. Chaque taille
          annonce ce qu'elle comprend, et pas seulement sa lettre — une lettre seule n'est pas un
          choix éclairé.
        </p>
      </div>

      <h3>Les règles viennent du domaine</h3>
      <div class="c-specimen">
        <p class="c-specimen__note">
          Taille retenue : <strong>{{ tailleRetenue }}</strong>, forfait
          <strong><PriceTag :amount-cents="MENU_SIZE_RULES[tailleRetenue].surchargeCents" /></strong
          >. Forfaits, formats et dessert viennent de <code>MENU_SIZE_RULES</code>, dans
          <code>app/domain/menu-rules.ts</code> : exigences EF-012, EF-013 et EF-014. Les écrire
          dans le composant en ferait une seconde source de vérité, qui divergerait au premier
          changement de grille.
        </p>
      </div>
    </section>
    <section class="o-stack" aria-labelledby="titre-visuel">
      <h2 id="titre-visuel">Visuel de produit</h2>

      <h3>Quelques produits de la carte</h3>
      <div class="c-specimen">
        <ul class="c-specimen__grid">
          <li v-for="produit of apercu" :key="produit.id">
            <ProductImage :src="produit.image.medium" :alt="produit.image.alt" loading="eager" />
            <p class="c-specimen__caption">{{ produit.image.alt }}</p>
            <p class="c-specimen__note">Photographie {{ produit.image.photographer }}, Pixabay</p>
          </li>
        </ul>
        <p class="c-specimen__note">
          Les photographies sont versionnées avec le dépôt, en deux tailles. La borne n'appelle
          aucun service tiers, et la construction n'a besoin d'aucun réseau.
        </p>
      </div>

      <h3>Produit sans photographie</h3>
      <div class="c-specimen">
        <div class="c-specimen__grid">
          <ProductImage alt="Le Montagnard" />
        </div>
        <p class="c-specimen__note">
          Le substitut garde la place du visuel dans la grille et porte le nom du produit. Sans
          réservation de place, la grille sauterait à l'arrivée de chaque image, et le client
          appuierait sur un produit qui vient de se déplacer.
        </p>
      </div>
    </section>
  </main>
</template>
