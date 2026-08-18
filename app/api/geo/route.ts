import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns the visitor's country code based on Vercel's edge geo headers.
 * Falls back to null when the header is unavailable (e.g. local dev).
 */
export async function GET(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('x-country') ??
    null

  return NextResponse.json(
    { country },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
