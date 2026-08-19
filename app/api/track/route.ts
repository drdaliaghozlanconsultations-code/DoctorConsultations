import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getVisitsCollection } from '@/lib/db'

export const dynamic = 'force-dynamic'

function parseTrafficSource(rawReferrer: string, search: string, userAgent: string): string {
  const ref = (rawReferrer || '').toLowerCase()
  const s = (search || '').toLowerCase()
  const ua = (userAgent || '').toLowerCase()

  // 1. Instagram detection (Referrer link shim, in-app browser, or UTM)
  if (
    ref.includes('instagram.com') ||
    ref.includes('l.instagram.com') ||
    s.includes('utm_source=instagram') ||
    s.includes('ref=instagram') ||
    ua.includes('instagram')
  ) {
    return 'Instagram'
  }

  // 2. Facebook detection
  if (
    ref.includes('facebook.com') ||
    ref.includes('l.facebook.com') ||
    ref.includes('fb.com') ||
    s.includes('utm_source=facebook') ||
    s.includes('fbclid') ||
    ua.includes('fban') ||
    ua.includes('fbav')
  ) {
    return 'Facebook'
  }

  // 3. TikTok detection
  if (
    ref.includes('tiktok.com') ||
    s.includes('utm_source=tiktok') ||
    ua.includes('tiktok')
  ) {
    return 'TikTok'
  }

  // 4. WhatsApp detection
  if (
    ref.includes('whatsapp') ||
    ref.includes('api.whatsapp.com') ||
    s.includes('utm_source=whatsapp')
  ) {
    return 'WhatsApp'
  }

  // 5. Google Search
  if (
    ref.includes('google.com') ||
    ref.includes('google.com.eg') ||
    ref.includes('google.sa') ||
    ref.includes('google.ae') ||
    s.includes('utm_source=google')
  ) {
    return 'Google Search'
  }

  // 6. X / Twitter
  if (
    ref.includes('t.co') ||
    ref.includes('twitter.com') ||
    ref.includes('x.com') ||
    s.includes('utm_source=twitter')
  ) {
    return 'X (Twitter)'
  }

  // 7. YouTube
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
    return 'YouTube'
  }

  // 8. Custom / Other domain
  if (rawReferrer && rawReferrer.startsWith('http')) {
    try {
      const url = new URL(rawReferrer)
      return url.hostname.replace(/^www\./, '')
    } catch {
      return rawReferrer
    }
  }

  return 'Direct / None'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { path, referrer, search } = body

    // Ignore dashboard visits from analytics
    if (path && path.startsWith('/dashboard')) {
      return NextResponse.json({ skipped: true })
    }

    const isDev = process.env.NODE_ENV === 'development'
    const vercelCountry =
      request.headers.get('x-vercel-ip-country') ??
      request.headers.get('x-country') ??
      null

    const country =
      vercelCountry ||
      (isDev ? (process.env.MOCK_GEO_COUNTRY || 'EG') : 'Unknown')

    const city =
      request.headers.get('x-vercel-ip-city') ||
      (isDev ? 'Cairo' : 'Unknown')

    const region =
      request.headers.get('x-vercel-ip-country-region') ||
      (isDev ? 'Cairo Gov' : 'Unknown')

    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      (isDev ? '127.0.0.1' : 'Unknown')

    const trafficSource = parseTrafficSource(referrer, search, userAgent)

    const visitsCollection = await getVisitsCollection()
    await visitsCollection.insertOne({
      path: path || '/',
      country: country.toUpperCase(),
      city,
      region,
      referrer: trafficSource,
      userAgent,
      ip,
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true, source: trafficSource })
  } catch (error: any) {
    console.error('Visit tracking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record visit' },
      { status: 500 },
    )
  }
}
