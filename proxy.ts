import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'

function detectLocale(request: NextRequest): string {
  const accept = request.headers.get('accept-language') ?? ''
  const preferred = accept.split(',').map((p) => p.split(';')[0].trim().toLowerCase())
  for (const p of preferred) {
    if (p.startsWith('ar')) return 'ar'
    if (p.startsWith('en')) return 'en'
  }
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  if (hasLocale) return NextResponse.next()

  const locale = detectLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Skip Next internals, API routes, and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
