'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { CtaLink } from '@/components/cta-link'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'

export function Navbar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname() || `/${locale}`
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change.
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock scroll when the mobile menu is open.
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const links = [
    { href: `/${locale}`, label: dict.nav.home, exact: true },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/services`, label: dict.nav.services },
    { href: `/${locale}/booking`, label: dict.nav.booking },
    { href: `/${locale}/policies`, label: dict.nav.policies },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-border/70 bg-background/85 backdrop-blur-md'
          : 'border-b border-transparent bg-background/60 backdrop-blur-sm',
      )}
    >
      <nav
        className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        aria-label="Main"
      >
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          {/* <span
            className="grid size-9 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            D
          </span> */}
          <span className="font-serif text-xl font-semibold text-primary tracking-tight">
            {dict.meta.siteName}
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive(link.href, link.exact)
                    ? 'text-primary'
                    : 'text-foreground/70 hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <CtaLink href={`/${locale}/booking`} size="md">
            {dict.nav.bookNow}
          </CtaLink>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <CtaLink href={`/${locale}/booking`} size="md" className="h-10 px-4 text-sm">
            {dict.nav.bookNow}
          </CtaLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'fixed inset-x-0 top-18 z-40 origin-top border-b border-border bg-background px-4 pb-8 pt-2 transition-all duration-300',
            open ? 'opacity-100 translate-y-0' : '-translate-y-2 opacity-0',
          )}
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
                  className={cn(
                    'block rounded-xl px-4 py-3.5 text-base font-medium transition-colors',
                    isActive(link.href, link.exact)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/80 hover:bg-muted',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between gap-3">
            <LanguageSwitcher locale={locale} label={dict.nav.language} />
            <CtaLink
              href={`/${locale}/booking`}
              size="md"
              className="flex-1"
            >
              {dict.nav.bookNow}
            </CtaLink>
          </div>
        </div>
      </div>
    </header>
  )
}
