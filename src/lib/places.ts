// src/lib/places.ts
export type PlaceResult = {
  id: string
  label: string
  lat: number
  lng: number
}

/**
 * Pesquisa de locais/moradas.
 *
 * AGORA: mock simples em memória.
 * FUTURO: aqui passas a fazer fetch ao teu backend / serviço real de geocoding.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const q = query.trim()
  if (!q) return []

  // mocks só para teres UX enquanto não tens backend
  const mockPlaces: PlaceResult[] = [
    {
      id: 'leiria-centro',
      label: 'Centro de Leiria, Portugal',
      lat: 39.74362,
      lng: -8.80705,
    },
    {
      id: 'leiria-estadio',
      label: 'Estádio Municipal de Leiria',
      lat: 39.74931,
      lng: -8.80374,
    },
    {
      id: 'praia-vieira',
      label: 'Praia da Vieira, Leiria',
      lat: 39.87258,
      lng: -8.93802,
    },
    {
      id: 'lisboa-rossio',
      label: 'Praça do Rossio, Lisboa',
      lat: 38.71408,
      lng: -9.13934,
    },
  ]

  // filtro tolo mas suficiente por agora
  return mockPlaces.filter((p) => p.label.toLowerCase().includes(q.toLowerCase()))
}
