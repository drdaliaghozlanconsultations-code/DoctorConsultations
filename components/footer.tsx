import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

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

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

function YouTubeIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" fill="currentColor" />
    </svg>
  )
}
function VisaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 32" width="38" height="26" fill="none" {...props}>
      <rect width="48" height="32" rx="4" fill="#F8FAFC" stroke="#E2E8F0" />
      <path
        d="M19.4 20.8h-2.6l1.6-10h2.6l-1.6 10zm7.8-9.8c-.5-.2-1.3-.4-2.3-.4-2.5 0-4.3 1.3-4.3 3.2 0 1.4 1.3 2.2 2.2 2.7.9.5 1.3.8 1.3 1.2 0 .6-.8.9-1.5.9-1 0-1.5-.2-2.3-.5l-.3-.2-.3 1.9c.5.2 1.5.4 2.6.4 2.7 0 4.4-1.3 4.4-3.3 0-1.1-.7-2-2.2-2.7-.9-.5-1.5-.8-1.5-1.2 0-.4.5-.8 1.5-.8.8 0 1.4.2 1.9.4l.2.1.3-1.6zm7.2 6.3l1.2-3.3c0-.1.2-.6.4-1.1h.1c.1.4.2.8.4 1.1l.7 3.3h-2.8zm3.9 3.5h2.3l-2-9.9h-2.1c-.5 0-.9.3-1.1.7l-3.8 9.2h2.7l.5-1.5h3.3l.2 1.5zm-14.7-10l-2.5 6.8-.3-1.4c-.5-1.6-1.9-3.4-3.6-4.3l2.3 8.9h2.7l4.1-10h-2.7z"
        fill="#1A1F71"
      />
      <path
        d="M10.8 10.8H6.7l-.1.3c3.2.8 5.3 2.8 6.2 5.1l-.9-4.6c-.2-.6-.6-.8-1.1-.8z"
        fill="#F7B600"
      />
    </svg>
  )
}

function MastercardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 32" width="38" height="26" fill="none" {...props}>
      <rect width="48" height="32" rx="4" fill="#F8FAFC" stroke="#E2E8F0" />
      <circle cx="20" cy="16" r="8" fill="#EB001B" />
      <circle cx="28" cy="16" r="8" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  )
}

import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ShieldCheck } from 'lucide-react'

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear()

  const explore = [
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/services`, label: dict.nav.services },
    { href: `/${locale}/booking`, label: dict.nav.booking },
  ]
  const policies = [
    { href: `/${locale}/policies/cancellation-refund`, label: dict.policies.cancellation.title },
    { href: `/${locale}/policies/delivery`, label: dict.policies.delivery.title },
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
                <a
                  href="mailto:drdaliaghozlan.consultations@gmail.com"
                  className="transition-colors hover:text-primary"
                >
                  drdaliaghozlan.consultations@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <a
                  href="tel:+201288000739"
                  dir="ltr"
                  className="transition-colors hover:text-primary"
                >
                  +20 12 88000739
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <a
                  href="https://share.google/muL8CF7S1mpXvMGXI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group transition-colors"
                >
                  <span className="block font-medium text-foreground group-hover:text-primary transition-colors">
                    {dict.footer.locationOrg}
                  </span>
                  <span className="block text-xs text-muted-foreground group-hover:text-primary/80 transition-colors mt-0.5">
                    {dict.footer.locationAddress}
                  </span>
                </a>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://www.facebook.com/share/1Ha2o1E4MK/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <FacebookIcon className="size-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.tiktok.com/@dr.daliaghozlan?_r=1&_t=ZS-99HMlPoXB4s"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <TikTokIcon className="size-4" aria-hidden="true" />
              </a>
              <a
                href="https://youtube.com/@dr.daliaghozlan?si=zI7oA_aA5ApMqcnH"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <YouTubeIcon className="size-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/dr.daliaghozlan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Payment Gateway Compliance & Accepted Methods */}
        <div className="mt-10 border-t border-border/70 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {locale === 'ar' ? 'وسائل الدفع المقبولة:' : 'Accepted Payment Methods:'}
            </span>
            <div className="flex items-center gap-2">
              <VisaIcon aria-label="Visa" />
              <MastercardIcon aria-label="MasterCard" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span>
              {locale === 'ar'
                ? 'مدفوعات مشفرة وآمنة عبر Kashier · معتمدة بمعايير PCI-DSS'
                : 'Secure 256-bit SSL encrypted payments processed via Kashier · PCI-DSS compliant'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
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
