import Image from 'next/image'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { CtaLink } from '@/components/cta-link'
import { Reveal } from '@/components/reveal'

export function AboutPreview({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  return (
    <section className="bg-secondary/40 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative aspect-5/4 w-full overflow-hidden rounded-[2rem] border border-border shadow-lg">
            <Image
              src="/images/WhatsApp Image 2026-08-11 at 4.33.19 PM.jpeg"
              alt={dict.aboutPreview.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={100} className="order-1 lg:order-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            {dict.aboutPreview.eyebrow}
          </span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            {dict.aboutPreview.title}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {dict.aboutPreview.body}
          </p>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {dict.aboutPreview.body2}
          </p>
          <div className="mt-8">
            <CtaLink href={`/${locale}/about`}>
              {dict.aboutPreview.cta}
            </CtaLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
