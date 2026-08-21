import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear()

  const explore = [
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/services`, label: dict.nav.services },
    { href: `/${locale}/booking`, label: dict.nav.booking },
  ]
  const policies = [
    { href: `/${locale}/policies/cancellation-refund`, label: dict.policies.cancellation.title },
    { href: `/${locale}/policies/privacy`, label: dict.policies.privacy.title },
    { href: `/${locale}/policies/terms`, label: dict.policies.terms.title },
  ]

  return (
    <footer className="mt-4 lg:mt-8 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pe-6">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              {/* <span
                className="grid size-9 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
                aria-hidden="true"
              >
                D
              </span> */}
              <span className="font-serif text-base md:text-xl text-primary font-semibold">
                {dict.meta.siteName}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {dict.footer.description}
            </p>
          </div>

          <nav aria-label={dict.footer.exploreTitle}>
            <h2 className="text-sm font-semibold text-foreground">
              {dict.footer.exploreTitle}
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footer.policiesTitle}>
            <h2 className="text-sm font-semibold text-foreground">
              {dict.footer.policiesTitle}
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {policies.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {dict.footer.contactTitle}
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span>drdaliaghozlan@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <span dir="ltr">+20 12 88000739</span>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://www.instagram.com/dr.daliaghozlan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.facebook.com/dalia.ghozlan.5"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <FacebookIcon className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {year} {dict.meta.siteName}. {dict.footer.rights}
          </p>
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
        </div>
        {/* <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70">
          {dict.footer.disclaimer}
        </p> */}
      </div>
    </footer>
  )
}
