import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { CtaLink } from '@/components/cta-link'
import { Reveal } from '@/components/reveal'

export function CtaSection({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16 sm:py-20">
        <div
          className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full bg-primary-foreground/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -start-10 size-64 rounded-full bg-primary-foreground/10 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-balance font-serif text-3xl font-semibold sm:text-4xl">
            {dict.finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-primary-foreground/85">
            {dict.finalCta.subtitle}
          </p>
          <CtaLink
            href={`/${locale}/booking`}
            variant="soft"
            className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            {dict.finalCta.cta}
          </CtaLink>
        </div>
      </Reveal>
    </section>
  )
}
