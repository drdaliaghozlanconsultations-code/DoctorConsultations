import { headers } from 'next/headers'

export interface VisitorGeo {
  country: string
  currency: 'EGP' | 'USD'
  isEgypt: boolean
}

/**
 * Resolves visitor's country and preferred currency.
 * In development, respects MOCK_GEO_COUNTRY from environment or x-mock-country header.
 * In production, uses Vercel edge geolocation headers (x-vercel-ip-country).
 */
export async function getVisitorGeo(): Promise<VisitorGeo> {
  const isDev = process.env.NODE_ENV === 'development'
  let country: string | null = null

  try {
    const h = await headers()
    const vercelCountry = h.get('x-vercel-ip-country') ?? h.get('x-country') ?? null
    const mockHeader = h.get('x-mock-country')

    country =
      (isDev && (mockHeader || process.env.MOCK_GEO_COUNTRY)) ||
      vercelCountry ||
      (process.env.MOCK_GEO_COUNTRY ? process.env.MOCK_GEO_COUNTRY : null)
  } catch {
    country = process.env.MOCK_GEO_COUNTRY || null
  }

  if (!country) {
    country = 'EG'
  }

  const isEgypt = country.toUpperCase() === 'EG'
  const currency: 'EGP' | 'USD' = isEgypt ? 'EGP' : 'USD'

  return {
    country: country.toUpperCase(),
    currency,
    isEgypt,
  }
}
