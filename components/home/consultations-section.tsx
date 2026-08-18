import { consultationTypes, localizedField } from '@/lib/data/site'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import type { Locale } from '@/lib/i18n/config'
import { Reveal } from '@/components/reveal'
import { CtaLink } from '@/components/cta-link'
import { formatPrice } from '@/lib/format'
import { Clock } from 'lucide-react'

export function ConsultationsSection({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <section className="bg-secondary/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            {dict.services.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl text-balance">
            {dict.booking.consultation.title}
          </h2>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {consultationTypes.map((c, i) => (
            <Reveal key={c.id} delay={i * 90}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" aria-hidden="true" />
                  <span>
                    {c.durationMinutes} {dict.common.minutes}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-2xl font-medium text-foreground">
                  {localizedField(c.name, locale)}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {localizedField(c.description, locale)}
                </p>
                <div className="mt-6 flex items-end justify-between border-t border-border pt-5">
                  <span className="font-serif text-3xl font-medium text-foreground">
                    {formatPrice(c.price, locale)}
                  </span>
                  <CtaLink
                    href={`/${locale}/booking?consultation=${c.id}`}
                    size="md"
                  >
                    {dict.services.bookNow}
                  </CtaLink>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
