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

  // 1. Dashboard routes: standalone, no locale prefixing
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const sessionCookie = request.cookies.get('drdalia_session')?.value

    // If accessing login page while already logged in
    if (pathname === '/dashboard/login') {
      if (sessionCookie) {
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = '/dashboard'
        return NextResponse.redirect(dashboardUrl)
      }
      return NextResponse.next()
    }

    // If accessing protected dashboard routes without session cookie
    if (!sessionCookie) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/dashboard/login'
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // 2. Public routes: check locale prefix
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
