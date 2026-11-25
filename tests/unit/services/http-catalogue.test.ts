import { describe, expect, it, vi } from 'vitest'
import { createHttpCatalogueGateway } from '../../../app/services/http-catalogue'
import { PRODUCTS } from '../../../app/services/catalogue-data'

const UN_PRODUIT = {
  id: 'classique',
  name: 'Le Classique',
  category: 'burgers',
  priceCents: 590,
  allergens: ['gluten'],
  available: true,
  removables: [{ id: 'onions', label: 'Oignons' }],
  extras: [{ id: 'bacon', label: 'Bacon', priceCents: 120, allergens: [] }],
}

const clientRendant = (payload: unknown) => vi.fn(async () => payload)

describe('catalogue servi par le réseau', () => {
  it('rend les produits de la réponse', async () => {
    const client = clientRendant([UN_PRODUIT])
    const gateway = createHttpCatalogueGateway(client, '/')

    await expect(gateway.all()).resolves.toEqual([UN_PRODUIT])
  })

  it('accepte la carte livrée, sérialisée puis relue', async () => {
    const serialisee: unknown = JSON.parse(JSON.stringify(PRODUCTS))
    const gateway = createHttpCatalogueGateway(clientRendant(serialisee), '/')

    await expect(gateway.all()).resolves.toEqual(serialisee)
  })

  it('accepte une liste vide, qui décrit une carte sans produit disponible', async () => {
    const gateway = createHttpCatalogueGateway(clientRendant([]), '/')

    await expect(gateway.all()).resolves.toEqual([])
  })

  describe('URL appelée', () => {
    it('préfixe le chemin par baseURL', async () => {
      const client = clientRendant([])
      await createHttpCatalogueGateway(client, '/bun-and-co/').all()

      expect(client).toHaveBeenCalledWith('/bun-and-co/api/catalogue.json')
    })

    it('ajoute la barre oblique manquante au lieu de coller les segments', async () => {
      const client = clientRendant([])
      await createHttpCatalogueGateway(client, '/bun-and-co').all()

      expect(client).toHaveBeenCalledWith('/bun-and-co/api/catalogue.json')
    })

    it('appelle la racine en développement', async () => {
      const client = clientRendant([])
      await createHttpCatalogueGateway(client, '/').all()

      expect(client).toHaveBeenCalledWith('/api/catalogue.json')
    })
  })

  describe('réponse illisible', () => {
    it('lève quand la réponse n’est pas une liste', async () => {
      const gateway = createHttpCatalogueGateway(clientRendant({ products: [] }), '/')

      await expect(gateway.all()).rejects.toThrow(TypeError)
    })

    it.each([
      ['une chaîne au lieu d’un produit', 'classique'],
      ['un produit nul', null],
      ['un identifiant absent', { ...UN_PRODUIT, id: 42 }],
      ['un identifiant vide', { ...UN_PRODUIT, id: '' }],
      ['un nom non textuel', { ...UN_PRODUIT, name: 42 }],
      ['une catégorie hors de la liste fermée', { ...UN_PRODUIT, category: 'salads' }],
      ['un prix à virgule', { ...UN_PRODUIT, priceCents: 5.9 }],
      ['une disponibilité non booléenne', { ...UN_PRODUIT, available: 'oui' }],
      ['des allergènes qui ne sont pas une liste', { ...UN_PRODUIT, allergens: 'gluten' }],
      ['un allergène non textuel', { ...UN_PRODUIT, allergens: [42] }],
      ['des retraits qui ne sont pas une liste', { ...UN_PRODUIT, removables: {} }],
      ['des suppléments qui ne sont pas une liste', { ...UN_PRODUIT, extras: {} }],
      ['un format hors de la liste fermée', { ...UN_PRODUIT, format: 'XXL' }],
    ])('lève sur %s', async (_cas, produit) => {
      const gateway = createHttpCatalogueGateway(clientRendant([produit]), '/')

      await expect(gateway.all()).rejects.toThrow(/Catalogue illisible/)
    })

    it('accepte un format valide', async () => {
      const produit = { ...UN_PRODUIT, category: 'drinks', format: 'medium' }
      const gateway = createHttpCatalogueGateway(clientRendant([produit]), '/')

      await expect(gateway.all()).resolves.toEqual([produit])
    })
  })
})
