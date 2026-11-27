<script setup lang="ts">
/**
 * Paiement, demande #126.
 *
 * Le règlement, simulé : aucune donnée bancaire n'est saisie, demandée ni
 * transmise, exigence EF-030. Il n'y a donc aucun champ sur cet écran, ni réel
 * ni simulé — pas de numéro de carte, pas de cryptogramme, pas même un champ
 * désactivé pour faire vrai. Un faux formulaire bancaire sur une borne
 * apprendrait au client à saisir sa carte là où on la lui demande, ce qu'une
 * borne de démonstration n'a pas le droit d'enseigner.
 *
 * Le récapitulatif reprend les lignes telles que le panier les montrait,
 * exigence EF-031, par le même `lignesAffichees` : un récapitulatif qui
 * nommerait autrement ce que le client vient de valider le ferait douter au
 * moment de payer.
 *
 * Il est en lecture seule. Corriger se fait au panier, dont le retour est à
 * portée : laisser modifier ici dédoublerait les commandes de correction et la
 * confirmation qu'elles demandent.
 *
 * L'écran ne calcule aucun montant et n'attribue aucun numéro. `useReglement`
 * délègue à `confirmOrder` et `nextOrderNumber`, qui appartiennent au domaine.
 *
 * Après la confirmation, le parcours ne revient pas en arrière, exigences
 * EF-002 et EF-004 : `useParcours` ne donne aucun retour au ticket, et le
 * panier est vidé par la confirmation elle-même, donc revenir ici ne
 * permettrait pas de régler deux fois.
 */

import type { PaymentMode } from '../domain/types'
import { lignesAffichees } from '../utils/lignes-panier'

const { panier, mode: modeDeConsommation, totalCentimes, articles } = useDraft()
const { produits } = useCatalogue()
const { confirmer, reglable } = useReglement()

/** Les deux modes de l'exigence EF-029, avec ce qu'ils disent au client. */
const MODES: readonly { readonly id: PaymentMode; readonly label: string }[] = [
  { id: 'card', label: 'Carte bancaire sur la borne' },
  { id: 'counter', label: 'Règlement en caisse' },
]

const modeRetenu = ref<PaymentMode>('card')

const lignes = computed(() => lignesAffichees(produits.value, panier.value.lines))

const libelleDeConsommation = computed(() =>
  modeDeConsommation.value === 'eat-in' ? 'Sur place' : 'À emporter',
)

/**
 * Confirme le règlement, puis mène au ticket.
 *
 * La navigation n'a lieu que si la commande est confirmée. `useReglement`
 * annonce le refus par la région d'alerte, exigence EF-041, et l'écran reste
 * en place pour que le client lise pourquoi.
 */
const regler = async () => {
  if (!reglable.value) return
  if (confirmer(modeRetenu.value) === undefined) return

  await navigateTo('/ticket')
}

useHead({ title: 'Paiement — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack c-payment">
    <h1>Paiement</h1>

    <!-- Le contenu dépend de `sessionStorage`, que le serveur ne connaît pas :
         la page est écrite au build. Sans `ClientOnly`, les deux arbres
         diffèrent par leur structure, et Vue réemploie les nœuds rendus plutôt
         que de rectifier l'écart. -->
    <ClientOnly>
      <template v-if="!reglable">
        <p>Votre panier est vide. Il n'y a rien à régler.</p>

        <p>
          <NuxtLink class="c-button c-button--primary" to="/carte">Revenir à la carte</NuxtLink>
        </p>
      </template>

      <template v-else>
        <section class="o-stack o-stack--tight" aria-labelledby="titre-recapitulatif">
          <h2 id="titre-recapitulatif">Votre commande</h2>

          <p class="c-payment__service">{{ libelleDeConsommation }}</p>

          <!-- Lecture seule : une liste de description plutôt que les
               commandes du panier. Chaque ligne y est un terme et son prix,
               donc lisible ligne à ligne par un lecteur d'écran. -->
          <ul class="c-payment__lines">
            <li v-for="affichee of lignes" :key="affichee.id" class="c-payment__line">
              <span class="c-payment__name">
                {{ affichee.ligne.quantity }} × {{ affichee.produit.name }}
                <span v-if="affichee.menuLabel !== ''">{{ affichee.menuLabel }}</span>
              </span>

              <ul
                v-if="
                  affichee.removed.length > 0 ||
                  affichee.extras.length > 0 ||
                  affichee.substitutions.length > 0
                "
                class="c-payment__details"
              >
                <li v-for="retrait of affichee.removed" :key="retrait">
                  Sans {{ retrait.toLowerCase() }}
                </li>
                <li v-for="supplement of affichee.extras" :key="supplement.id">
                  Avec {{ supplement.label.toLowerCase() }}
                  <PriceTag :amount-cents="supplement.priceCents" />
                </li>
                <li v-for="remplacement of affichee.substitutions" :key="remplacement.id">
                  {{ remplacement.label }}
                  <PriceTag :amount-cents="remplacement.priceCents" />
                </li>
              </ul>

              <PriceTag :amount-cents="affichee.totalPriceCents" />
            </li>
          </ul>

          <p class="c-payment__total">
            <span>Total, {{ articles }} {{ articles > 1 ? 'articles' : 'article' }}</span>
            <PriceTag :amount-cents="totalCentimes" variant="total" />
          </p>
        </section>

        <fieldset class="c-payment__modes">
          <legend class="c-payment__legend">Mode de règlement</legend>

          <label v-for="mode of MODES" :key="mode.id" class="c-payment__mode">
            <input
              v-model="modeRetenu"
              class="c-payment__input"
              type="radio"
              name="reglement"
              :value="mode.id"
            />
            <span class="c-payment__label">{{ mode.label }}</span>
          </label>
        </fieldset>

        <p class="c-payment__simulated">
          Paiement simulé : aucune donnée bancaire n'est demandée ni transmise.
        </p>

        <p>
          <NuxtLink class="c-button c-button--secondary" to="/panier">
            Corriger ma commande
          </NuxtLink>
        </p>

        <!-- La confirmation vit dans cette branche, et non sous les deux. Le
             serveur rend toujours un panier vide : un bouton commun arriverait
             `aria-disabled` du serveur, et Vue ne rectifie pas un attribut
             divergent — il resterait indisponible une fois le panier
             restauré. La branche vide, elle, n'a pas de confirmation à
             offrir : elle dit pourquoi et mène à la carte. -->
        <p>
          <BaseButton @activate="regler">Confirmer</BaseButton>
        </p>
      </template>

      <!-- Le serveur rend un panier vide : sans ce repli, l'écran n'aurait
           aucun contenu avant l'hydratation, et le client qui arrive avant le
           code client verrait un titre seul. -->
      <template #fallback>
        <p>Préparation de votre commande…</p>
      </template>
    </ClientOnly>
  </main>
</template>
