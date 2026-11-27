// =============================================================================
// Commande en cours
// =============================================================================
// Le panier et le mode de consommation, exposés aux écrans. Ce composable ne
// décide rien : il délègue chaque mutation à `app/domain/cart.ts` et chaque
// calcul à `app/domain/pricing.ts`. Les limites de dix unités par ligne et de
// trente articles par commande, exigence EF-025, ne sont écrites nulle part
// ici ; elles viennent du domaine, qui refuse, et le refus est annoncé.
//
// La commande survit à un rafraîchissement de page, exigence EF-027, et jamais
// à une session antérieure, exigence EF-028. C'est le comportement attendu
// d'une borne : le client suivant ne doit pas trouver le panier du précédent.
// Le stockage de session porte exactement cette durée de vie.
//
// Le stockage et la passerelle du catalogue sont des paramètres, avec les
// implémentations de production par défaut. Les tests passent alors un stockage
// en mémoire et une passerelle immédiate, sans navigateur ni réseau.

import { getCurrentInstance } from 'vue'
import { addLine, clear, itemCount, removeLine, setQuantity } from '../domain/cart'
import { findProduct } from '../domain/catalogue'
import { CartLimitError } from '../domain/errors'
import type { CatalogueGateway, DraftStore } from '../domain/ports'
import { cartTotalCents } from '../domain/pricing'
import type {
  Cart,
  CartLineId,
  Customisation,
  Draft,
  MenuComposition,
  ProductId,
  ServiceMode,
} from '../domain/types'
import { createSessionDraftStore } from '../services/session-draft-store'
import { formatEuros } from '../utils/format-euros'

/** Clé de la commande en cours, partagée par tous les écrans. */
const CLE = 'commande-en-cours'

/** Clé de la restauration, pour ne relire le stockage qu'une fois. */
const CLE_RESTAURATION = 'commande-en-cours-restauree'

/**
 * Commande vide.
 *
 * Le mode sur place est le point de départ, et non une absence de choix : le
 * parcours impose l'écran du mode avant la carte, exigence EF-001, donc la
 * valeur est remplacée avant le premier ajout.
 */
const COMMANDE_VIDE: Draft = { cart: { lines: [] }, serviceMode: 'eat-in' }

export interface AjoutAuPanier {
  readonly productId: ProductId
  readonly customisation: Customisation
  readonly menu?: MenuComposition
  readonly quantity?: number
}

export interface DependancesCommande {
  /** Stockage de la commande en cours. Par défaut, celui de la session. */
  readonly magasin?: DraftStore
  /** Passerelle du catalogue, nécessaire au total. */
  readonly catalogue?: CatalogueGateway
}

export const useDraft = (dependances: DependancesCommande = {}) => {
  const { produits } = useCatalogue(dependances.catalogue)
  const { annoncer, alerter } = useAnnonces()

  // Le stockage n'existe pas au rendu : la page est écrite au build, où aucune
  // session de navigateur n'est ouverte.
  const magasin =
    dependances.magasin ??
    (import.meta.client ? createSessionDraftStore(sessionStorage) : undefined)

  const commande = useState<Draft>(CLE, () => COMMANDE_VIDE)
  const restauree = useState(CLE_RESTAURATION, () => false)

  /**
   * Relit la commande laissée par le rafraîchissement, une fois par session.
   *
   * La page servie est préconstruite, donc identique pour tous : c'est le
   * stockage du navigateur qui sait ce que ce client avait commencé, exigence
   * EF-027.
   */
  const restaurer = () => {
    if (magasin === undefined || restauree.value) return

    restauree.value = true

    const stockee = magasin.read()
    if (stockee !== undefined) commande.value = stockee
  }

  // La relecture a lieu après le premier rendu, et non pendant. Lue pendant la
  // mise en place, elle donnait au premier rendu client un panier que le rendu
  // du serveur n'avait pas : Vue signalait l'écart et réemployait les nœuds du
  // serveur sans les rectifier, demande #139. Un total faux restait alors
  // affiché, et sur une borne le montant affiché est ce que le client croit
  // devoir payer.
  //
  // Hors d'un composant — dans un test — il n'y a pas de rendu à attendre :
  // l'appelant déclenche la relecture lui-même par `restaurer`.
  if (getCurrentInstance() !== null) onMounted(restaurer)

  const ecrire = (panier: Cart, mode: ServiceMode = commande.value.serviceMode) => {
    commande.value = { cart: panier, serviceMode: mode }
    magasin?.write(commande.value)
  }

  const totalCentimes = computed(() => cartTotalCents(produits.value, commande.value.cart.lines))
  const articles = computed(() => itemCount(commande.value.cart))

  /** Ce que le client vient d'obtenir : ce qu'il a, et ce qu'il doit. */
  const etatDuPanier = () =>
    `${articles.value} article${articles.value > 1 ? 's' : ''}, ${formatEuros(totalCentimes.value)}`

  /**
   * Applique une mutation du domaine.
   *
   * Le domaine refuse en levant. Le refus est annoncé par la région d'alerte,
   * exigence EF-041, avec le message du domaine : dupliquer ici « dix » ou
   * « trente » ferait vivre la limite à deux endroits.
   *
   * `InvalidLineError` n'est pas rattrapée. Une ligne inconnue ou une quantité
   * négative est une faute de programmation, que l'interface aurait dû
   * empêcher ; l'étouffer la rendrait invisible jusqu'au ticket.
   */
  const appliquer = (mutation: () => Cart, succes: (panier: Cart) => string): boolean => {
    try {
      const panier = mutation()
      ecrire(panier)
      annoncer(succes(panier))
      return true
    } catch (refus) {
      if (!(refus instanceof CartLimitError)) throw refus

      alerter(refus.message)
      return false
    }
  }

  const nomDe = (productId: ProductId) => findProduct(produits.value, productId)?.name ?? 'Produit'

  return {
    /**
     * Relit le stockage de session, pour un appelant hors composant.
     *
     * Dans un écran, la relecture part toute seule après le premier rendu.
     */
    restaurer,

    commande: computed<Draft>(() => commande.value),
    panier: computed<Cart>(() => commande.value.cart),
    mode: computed<ServiceMode>(() => commande.value.serviceMode),
    articles,
    totalCentimes,

    /** Choisit sur place ou à emporter, exigence EF-003. */
    definirMode: (mode: ServiceMode) => {
      ecrire(commande.value.cart, mode)
      annoncer(mode === 'eat-in' ? 'Commande sur place.' : 'Commande à emporter.')
    },

    ajouter: (ajout: AjoutAuPanier) =>
      appliquer(
        () => addLine(commande.value.cart, ajout),
        () => `${nomDe(ajout.productId)} ajouté au panier. ${etatDuPanier()}`,
      ),

    changerQuantite: (ligne: CartLineId, quantite: number) =>
      appliquer(
        () => setQuantity(commande.value.cart, ligne, quantite),
        (panier) =>
          panier.lines.some((candidate) => candidate.id === ligne)
            ? `Quantité portée à ${quantite}. ${etatDuPanier()}`
            : `Ligne retirée du panier. ${etatDuPanier()}`,
      ),

    retirer: (ligne: CartLineId) =>
      appliquer(
        () => removeLine(commande.value.cart, ligne),
        () => `Ligne retirée du panier. ${etatDuPanier()}`,
      ),

    /** Vide le panier, et le stockage avec lui. */
    vider: () => {
      commande.value = { cart: clear(), serviceMode: commande.value.serviceMode }
      magasin?.clear()
      annoncer('Panier vidé.')
    },
  }
}
