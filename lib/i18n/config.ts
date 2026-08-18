export const locales = ['en', 'ar'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeDirection: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
}

export const localeLabels: Record<Locale, { native: string; short: string }> = {
  en: { native: 'English', short: 'EN' },
  ar: { native: 'العربية', short: 'ع' },
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/**
 * Swap the locale segment of a pathname while preserving the rest of the path.
 * e.g. localizePath('/en/about', 'ar') -> '/ar/about'
 */
export function localizePath(pathname: string, target: Locale): string {
  const segments = pathname.split('/')
  // segments[0] is '' because pathname starts with '/'
  if (segments.length > 1 && isLocale(segments[1])) {
    segments[1] = target
  } else {
    segments.splice(1, 0, target)
  }
  const next = segments.join('/')
  return next || `/${target}`
}
