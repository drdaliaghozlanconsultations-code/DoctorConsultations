import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Fraunces, Nunito_Sans, Cairo } from 'next/font/google'
import '../globals.css'
import { locales, isLocale, localeDirection, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { VisitTracker } from '@/components/visit-tracker'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})
const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  const dict = getDictionary(locale)
  return {
    metadataBase: new URL('https://dr-dalia.example.com'),
    title: {
      default: dict.meta.home.title,
      template: `%s · ${dict.meta.siteName}`,
    },
    description: dict.meta.home.description,
    generator: 'v0.app',
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        ar: '/ar',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_EG' : 'en_US',
      siteName: dict.meta.siteName,
      title: dict.meta.home.title,
      description: dict.meta.home.description,
    },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale: Locale = lang
  const dir = localeDirection[locale]
  const dict = getDictionary(locale)

  const fontVars =
    locale === 'ar'
      ? ({
        '--font-display': 'var(--font-cairo)',
        '--font-body': 'var(--font-cairo)',
      } as React.CSSProperties)
      : ({
        '--font-display': 'var(--font-fraunces)',
        '--font-body': 'var(--font-nunito)',
      } as React.CSSProperties)

  return (
    <html
      lang={locale}
      dir={dir}
      className={`bg-background ${fraunces.variable} ${nunito.variable} ${cairo.variable}`}
      style={fontVars}
    >
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          {dict.nav.home}
        </a>
        <Navbar locale={locale} dict={dict} />
        <main id="main">{children}</main>
        <Footer locale={locale} dict={dict} />
        <VisitTracker />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
