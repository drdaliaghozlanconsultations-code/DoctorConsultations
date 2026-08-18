import Image from 'next/image'
import { Sparkles, ShieldCheck } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { CtaLink } from '@/components/cta-link'

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-secondary/60 via-background to-background"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-6 pt-6 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pb-12 lg:pt-10">
        <div className="order-2 animate-fade-up lg:order-1">
          {/* <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="size-4" aria-hidden="true" />
            {dict.hero.eyebrow}
          </span> */}
          <h1 className="mt-6 text-balance font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {dict.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {dict.hero.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink href={`/${locale}/booking`}>{dict.hero.primaryCta}</CtaLink>
            <CtaLink href={`/${locale}/about`} variant="outline">
              {dict.hero.secondaryCta}
            </CtaLink>
          </div>
          <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            {dict.hero.trust}
          </p>
        </div>

        <div className="relative order-1 animate-fade-up [animation-delay:120ms] lg:order-2">
          <div className="relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border bg-secondary shadow-xl">
            <Image
              src="/images/WhatsApp Image 2026-08-11 at 4.33.18 PM.jpeg"
              alt={dict.hero.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div
            className="pointer-events-none absolute -bottom-6 -start-6 -z-10 size-40 rounded-full bg-primary/10 blur-2xl"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
