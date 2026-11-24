<script setup lang="ts">
// Page témoin du design system. Elle vérifie que les tokens sont compilés,
// que l'ordre des couches est appliqué et que la prise de focus est visible.
// Elle sera remplacée par l'écran de veille de la borne au lot 6.

interface Specimen {
  readonly token: string
  readonly intitule: string
  readonly contraste: string
}

const surfaces: readonly Specimen[] = [
  { token: '--couleur-fond', intitule: 'Fond général', contraste: '15,43:1 avec l’encre' },
  { token: '--couleur-surface', intitule: 'Carte produit', contraste: '16,60:1 avec l’encre' },
  { token: '--couleur-surface-sourde', intitule: 'Zone secondaire', contraste: '13,80:1 avec l’encre' },
]

const accents: readonly Specimen[] = [
  { token: '--couleur-accent', intitule: 'Action principale', contraste: '7,14:1 avec le texte inversé' },
  { token: '--couleur-olive', intitule: 'Confirmation', contraste: '8,50:1 avec le texte inversé' },
  { token: '--couleur-erreur', intitule: 'Erreur', contraste: '7,77:1 avec le texte inversé' },
]

const echelle = [
  { token: '--taille-mention', taille: '18 px', usage: 'Allergènes et mentions' },
  { token: '--taille-corps', taille: '20 px', usage: 'Texte courant' },
  { token: '--taille-intertitre', taille: '25 px', usage: 'Nom de produit' },
  { token: '--taille-titre-section', taille: '31 px', usage: 'Titre de catégorie' },
  { token: '--taille-titre-ecran', taille: '39 px', usage: 'Titre d’écran' },
  { token: '--taille-prix-fort', taille: '49 px', usage: 'Total du panier' },
] as const

useHead({
  title: 'Design system de Bun & Co',
  meta: [
    {
      name: 'description',
      content:
        'Tokens de la borne de commande Bun & Co : palette vérifiée en contraste, échelle typographique et cibles tactiles.',
    },
  ],
})
</script>

<template>
  <main class="o-contenant c-page">
    <header class="c-page__entete">
      <p class="c-page__surtitre">Bun & Co</p>
      <h1>Design system</h1>
      <p>
        Page témoin du lot 2. Elle vérifie que les tokens sont compilés, que l’ordre des
        couches est appliqué et que la prise de focus reste visible. L’écran de veille de la
        borne la remplacera au lot 6.
      </p>
    </header>

    <section class="o-pile" aria-labelledby="titre-palette">
      <h2 id="titre-palette">Palette</h2>

      <h3>Surfaces</h3>
      <ul class="c-specimens">
        <li v-for="surface in surfaces" :key="surface.token" class="c-specimen">
          <span
            class="c-specimen__pastille"
            :style="{ backgroundColor: `var(${surface.token})` }"
          />
          <span class="c-specimen__intitule">{{ surface.intitule }}</span>
          <code class="c-specimen__token">{{ surface.token }}</code>
          <span class="c-specimen__mesure">{{ surface.contraste }}</span>
        </li>
      </ul>

      <h3>Accents</h3>
      <ul class="c-specimens">
        <li v-for="accent in accents" :key="accent.token" class="c-specimen">
          <span
            class="c-specimen__pastille c-specimen__pastille--accent"
            :style="{ backgroundColor: `var(${accent.token})` }"
          />
          <span class="c-specimen__intitule">{{ accent.intitule }}</span>
          <code class="c-specimen__token">{{ accent.token }}</code>
          <span class="c-specimen__mesure">{{ accent.contraste }}</span>
        </li>
      </ul>
    </section>

    <section class="o-pile" aria-labelledby="titre-typographie">
      <h2 id="titre-typographie">Échelle typographique</h2>
      <p>
        Base de 20 px et non 16 px : une borne est regardée à environ 70 cm, contre 30 cm
        pour un téléphone. Ratio de 1,25, dit tierce majeure.
      </p>
      <dl class="c-echelle">
        <template v-for="niveau in echelle" :key="niveau.token">
          <dt class="c-echelle__exemple" :style="{ fontSize: `var(${niveau.token})` }">
            Le Classique
          </dt>
          <dd class="c-echelle__detail">
            <code>{{ niveau.token }}</code>
            <span>{{ niveau.taille }}, {{ niveau.usage }}</span>
          </dd>
        </template>
      </dl>
    </section>

    <section class="o-pile" aria-labelledby="titre-cibles">
      <h2 id="titre-cibles">Cibles tactiles</h2>
      <p>
        56 px pour une action principale, 48 px pour une action secondaire. Le critère
        WCAG 2.5.8 n’exige que 24 px : ces valeurs visent la baisse du taux d’erreur au
        doigt, pas la seule conformité. Navigue au clavier pour voir l’indicateur de focus
        à deux tons.
      </p>
      <div class="c-cibles">
        <button type="button" class="c-bouton c-bouton--principal">Ajouter au panier</button>
        <button type="button" class="c-bouton c-bouton--secondaire">Personnaliser</button>
      </div>
    </section>
  </main>
</template>

<style lang="scss">
@use '~/assets/scss/1-settings/points-de-rupture' as rupture;

@layer components {
  .c-page {
    display: flex;
    flex-direction: column;
    gap: var(--espace-8);
    padding-block: var(--espace-7);
  }

  .c-page__entete {
    display: flex;
    flex-direction: column;
    gap: var(--espace-3);
  }

  .c-page__surtitre {
    margin: 0;
    color: var(--couleur-accent);
    font-weight: var(--graisse-appuyee);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .c-specimens {
    display: grid;
    gap: var(--espace-3);
    margin: 0;
    padding: 0;
    list-style: none;

    @media (min-width: rupture.$rupture-moyen) {
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    }
  }

  .c-specimen {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'pastille intitule'
      'pastille token'
      'pastille mesure';
    gap: 0 var(--espace-4);
    align-items: center;
    padding: var(--espace-4);
    border: 1px solid var(--couleur-bordure);
    border-radius: var(--rayon-moyen);
    background-color: var(--couleur-surface);
  }

  .c-specimen__pastille {
    grid-area: pastille;
    width: var(--cible-secondaire);
    height: var(--cible-secondaire);
    border: 1px solid var(--couleur-bordure);
    border-radius: var(--rayon-petit);
  }

  .c-specimen__intitule {
    grid-area: intitule;
    font-weight: var(--graisse-appuyee);
  }

  .c-specimen__token {
    grid-area: token;
    color: var(--couleur-encre-sourde);
    font-size: var(--taille-mention);
  }

  .c-specimen__mesure {
    grid-area: mesure;
    color: var(--couleur-encre-sourde);
    font-size: var(--taille-mention);
  }

  .c-echelle {
    display: grid;
    gap: var(--espace-4);
    margin: 0;

    @media (min-width: rupture.$rupture-moyen) {
      grid-template-columns: auto 1fr;
      align-items: baseline;
    }
  }

  .c-echelle__exemple {
    font-family: var(--police-titre);
    line-height: var(--interligne-titre);
  }

  .c-echelle__detail {
    display: flex;
    flex-direction: column;
    gap: var(--espace-1);
    margin: 0;
    color: var(--couleur-encre-sourde);
    font-size: var(--taille-mention);
  }

  .c-cibles {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ecart-cibles);
  }

  .c-bouton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--cible-primaire);
    padding-inline: var(--espace-5);
    border: 2px solid transparent;
    border-radius: var(--rayon-moyen);
    font-weight: var(--graisse-appuyee);
    cursor: pointer;
  }

  .c-bouton--principal {
    background-color: var(--couleur-accent);
    color: var(--couleur-encre-inversee);

    &:active {
      background-color: var(--couleur-accent-appuye);
    }
  }

  .c-bouton--secondaire {
    min-height: var(--cible-secondaire);
    border-color: var(--couleur-bordure);
    background-color: var(--couleur-surface);
    color: var(--couleur-encre);

    &:active {
      background-color: var(--couleur-surface-sourde);
    }
  }
}
</style>
