#!/usr/bin/env node
// =============================================================================
// Récupération des visuels de la carte
// =============================================================================
// Les visuels viennent de Pixabay, une fois, et sont versionnés. Un appel à
// chaque construction rendrait le rendu non reproductible — deux builds
// successifs donneraient deux photographies — dépendrait d'un quota et d'un
// service tiers, et imposerait une clé à l'intégration continue. Ce script est
// donc lancé à la main, lorsque la carte change.
//
// La clé n'entre jamais dans le dépôt ni dans le bundle : un site statique n'a
// aucun secret, tout ce qui est livré est lisible. Elle est lue depuis `.env`,
// ignoré par Git, et ne sert qu'ici.
//
// Pixabay demande précisément ce schéma : ses conditions d'API interdisent
// l'appel permanent à ses serveurs et demandent de télécharger les images chez
// soi. Elles demandent aussi de citer la source, d'où les crédits enregistrés
// à côté de chaque visuel.
//
// Pexels était le premier choix. La délivrance de nouvelles clés y est
// suspendue — « New API key issuance is currently paused » — ce qui rend le
// service inutilisable pour un dépôt que quelqu'un d'autre doit pouvoir
// reconstruire.
//
// Usage : PIXABAY_API_KEY=… node scripts/fetch-product-images.mjs [--force]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const CATALOGUE = '.output/public/api/catalogue.json'
const DOSSIER = 'app/assets/images/products'
const MODULE = 'app/services/product-images.ts'
const ENDPOINT = 'https://pixabay.com/api/'

// Terme de recherche par produit. La carte est en français et Pexels indexe
// surtout en anglais : traduire ici donne de meilleurs résultats que d'envoyer
// le nom commercial, qui ne décrit pas le plat. « Le Mariner » ne rendrait rien,
// « fish burger » rend ce qu'il faut.
const TERMES = {
  classique: 'classic cheeseburger',
  fermier: 'farmhouse burger bacon',
  vegetal: 'veggie burger',
  mariner: 'fish burger sandwich',
  montagnard: 'mountain burger melted cheese',
  'double-smoky': 'double smoky burger',
  'nuggets-6': 'chicken nuggets',
  'nuggets-9': 'chicken nuggets box',
  'tenders-3': 'chicken tenders strips',
  wrap: 'chicken wrap',
  'fries-small': 'french fries small',
  'fries-medium': 'french fries',
  'fries-large': 'french fries large portion',
  potatoes: 'potato wedges',
  salad: 'green salad bowl',
  'apple-slices': 'sliced apple snack',
  cookie: 'chocolate cookie',
  brownie: 'pecan brownie',
  sundae: 'caramel sundae ice cream',
  'apple-donut': 'apple doughnut',
  'soda-33': 'soda can cola',
  'soda-50': 'soda cup fast food',
  'iced-tea-50': 'peach iced tea glass',
  'water-50': 'mineral water bottle',
  'orange-juice-25': 'orange juice glass',
  coffee: 'coffee cup',
  milkshake: 'vanilla milkshake',
}

const cle = process.env.PIXABAY_API_KEY ?? lireEnv('PIXABAY_API_KEY')

if (!cle) {
  console.error(`Clé absente. Renseigner PIXABAY_API_KEY dans .env, sur le modèle de`)
  console.error(`.env.example. Une clé gratuite s'obtient sur https://pixabay.com/api/docs/.`)
  process.exit(1)
}

function lireEnv(nom) {
  if (!existsSync('.env')) return undefined

  for (const ligne of readFileSync('.env', 'utf8').split('\n')) {
    const [cle, ...reste] = ligne.split('=')
    if (cle?.trim() === nom) return reste.join('=').trim()
  }

  return undefined
}

if (!existsSync(CATALOGUE)) {
  console.error(`${CATALOGUE} absent. Lancer \`pnpm generate\` avant ce script.`)
  process.exit(1)
}

const produits = JSON.parse(readFileSync(CATALOGUE, 'utf8'))
const force = process.argv.includes('--force')
mkdirSync(DOSSIER, { recursive: true })

const visuels = []

for (const produit of produits) {
  const terme = TERMES[produit.id]

  if (!terme) {
    console.error(`Aucun terme de recherche pour ${produit.id}. Compléter TERMES.`)
    process.exit(1)
  }

  const fichierMoyen = join(DOSSIER, `${produit.id}-medium.jpg`)
  const fichierGrand = join(DOSSIER, `${produit.id}-large.jpg`)
  const creditExistant = litCreditExistant(produit.id)

  if (!force && existsSync(fichierMoyen) && existsSync(fichierGrand) && creditExistant) {
    visuels.push(creditExistant)
    console.log(`${produit.id} : déjà présent`)
    continue
  }

  const parametres = new URLSearchParams({
    key: cle,
    q: terme,
    image_type: 'photo',
    orientation: 'horizontal',
    category: 'food',
    safesearch: 'true',
    per_page: '3',
  })

  const reponse = await fetch(`${ENDPOINT}?${parametres}`)

  if (!reponse.ok) {
    console.error(`${produit.id} : Pixabay a répondu ${reponse.status} ${reponse.statusText}`)
    process.exit(1)
  }

  const { hits } = await reponse.json()
  const photo = hits?.[0]

  if (!photo) {
    console.error(`${produit.id} : aucune photographie pour « ${terme} ».`)
    process.exit(1)
  }

  // `webformatURL` est servi en 640 px de large, et Pixabay autorise à
  // remplacer ce suffixe par 180 ou 340. Les tailles supérieures sont refusées
  // sur cette URL signée — un _960 répond 400 — et `largeImageURL` rendrait du
  // 1280 px, trop lourd pour ce qu'une borne affiche.
  //
  // 340 px pour les grilles de carte, 640 px pour la fiche produit.
  await telecharge(photo.webformatURL.replace('_640', '_340'), fichierMoyen)
  await telecharge(photo.webformatURL, fichierGrand)

  visuels.push({
    id: produit.id,
    alt: produit.name,
    photographe: photo.user,
    page: photo.pageURL,
  })

  console.log(`${produit.id} : ${photo.user}`)
}

async function telecharge(url, chemin) {
  const reponse = await fetch(url)

  if (!reponse.ok) {
    console.error(`Téléchargement impossible : ${url} (${reponse.status})`)
    process.exit(1)
  }

  writeFileSync(chemin, Buffer.from(await reponse.arrayBuffer()))
}

function litCreditExistant(id) {
  if (!existsSync(MODULE)) return undefined

  const source = readFileSync(MODULE, 'utf8')
  const bloc = new RegExp(
    `'${id}': \\{[^}]*alt: '([^']*)'[^}]*photographer: '([^']*)'[^}]*page: '([^']*)'`,
    's',
  ).exec(source)

  return bloc ? { id, alt: bloc[1], photographe: bloc[2], page: bloc[3] } : undefined
}

const imports = visuels
  .map(
    ({ id }) =>
      `import ${nomVariable(id)}Medium from '../assets/images/products/${id}-medium.jpg'\n` +
      `import ${nomVariable(id)}Large from '../assets/images/products/${id}-large.jpg'`,
  )
  .join('\n')

const entrees = visuels
  .map(
    ({ id, alt, photographe, page }) =>
      `  '${id}': {\n` +
      `    medium: ${nomVariable(id)}Medium,\n` +
      `    large: ${nomVariable(id)}Large,\n` +
      `    alt: '${echappe(alt)}',\n` +
      `    photographer: '${echappe(photographe)}',\n` +
      `    page: '${page}',\n` +
      `  },`,
  )
  .join('\n')

function nomVariable(id) {
  return id.replace(/-([a-z0-9])/g, (_, lettre) => lettre.toUpperCase())
}

function echappe(texte) {
  return texte.replace(/'/g, '’')
}

writeFileSync(
  MODULE,
  `// =============================================================================
// Visuels de la carte
// =============================================================================
// Fichier produit par \`node scripts/fetch-product-images.mjs\`. Ne pas modifier
// à la main : la prochaine exécution l'écraserait.
//
// Les photographies viennent de Pixabay, sont versionnées avec le dépôt et
// servies depuis celui-ci. La borne n'appelle aucun service tiers, et la
// construction n'a besoin d'aucun réseau.
//
// Deux tailles par produit : 340 px de large pour les grilles de carte, 640 px
// pour la fiche produit. Le composant choisit selon son contexte.

${imports}

export interface ProductImage {
  readonly medium: string
  readonly large: string
  /** Texte alternatif de repli : le nom du produit. */
  readonly alt: string
  readonly photographer: string
  readonly page: string
}

export const PRODUCT_IMAGES: Readonly<Record<string, ProductImage>> = {
${entrees}
}
`,
)

console.log(`\n${visuels.length} visuels, ${MODULE} réécrit.`)
