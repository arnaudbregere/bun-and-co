<script setup lang="ts">
import type { IconName } from '~/components/atoms/BaseIcon.vue'
import { cents } from '~/domain/money'

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

const dernierClic = ref<string | null>(null)

const annoncer = (libelle: string) => {
  dernierClic.value = libelle
}
</script>

<template>
  <main class="o-container o-stack">
    <header class="o-stack">
      <h1>Atelier des composants</h1>
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
          critère WCAG 1.4.11 sur le vermillon comme sur le fond crème.
        </p>
      </div>

      <h3>Dernière activation</h3>
      <p aria-live="polite" class="c-specimen__note">
        {{ dernierClic === null ? 'Aucun bouton activé.' : `Bouton activé : ${dernierClic}.` }}
      </p>
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
  </main>
</template>
