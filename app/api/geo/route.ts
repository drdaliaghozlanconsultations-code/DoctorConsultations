import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns the visitor's country code and currency preference based on Vercel's edge geo headers.
 * In local dev, falls back to MOCK_GEO_COUNTRY or query param for testing.
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const mockCountryParam = request.nextUrl.searchParams.get('mockCountry')
  const mockHeader = request.headers.get('x-mock-country')

  const vercelCountry =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('x-country') ??
    null

  const country =
    (isDev && (mockCountryParam || mockHeader || process.env.MOCK_GEO_COUNTRY)) ||
    vercelCountry ||
    'EG'

  const city = request.headers.get('x-vercel-ip-city') ?? (isDev ? 'Cairo (Dev)' : 'Unknown')
  const region = request.headers.get('x-vercel-ip-country-region') ?? (isDev ? 'Cairo' : 'Unknown')

  const isEgypt = country?.toUpperCase() === 'EG'
  const currency = isEgypt ? 'EGP' : 'USD'

  return NextResponse.json(
    {
      country: country.toUpperCase(),
      isEgypt,
      currency,
      city,
      region,
      isMocked: !vercelCountry,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
