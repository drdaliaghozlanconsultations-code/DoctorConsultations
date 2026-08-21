import { consultationTypes, localizedField, ConsultationType } from '@/lib/data/site'
import { getConsultationsCollection } from '@/lib/db'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import type { Locale } from '@/lib/i18n/config'
import { Reveal } from '@/components/reveal'
import { CtaLink } from '@/components/cta-link'
import { formatPrice } from '@/lib/format'
import { Clock, Sparkles } from 'lucide-react'

export async function ConsultationsSection({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  let list: (ConsultationType & { priceEGP?: number; priceUSD?: number })[] = consultationTypes

  try {
    const col = await getConsultationsCollection()
    const docs = await col
      .find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray()

    if (docs && docs.length > 0) {
      list = docs.map((d) => ({
        id: d._id?.toString() || '',
        name: d.title,
        description: d.description,
        durationMinutes: d.durationMinutes,
        price: d.priceEGP,
        priceEGP: d.priceEGP,
        priceUSD: d.priceUSD,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch consultations for home section:', error)
    list = consultationTypes
  }

  // Find the highest priced consultation for the "Most Wanted" badge
  const highestPrice = Math.max(
    ...list.map((c) => c.priceEGP ?? c.price ?? 0),
    0,
  )

  const isArabic = locale === 'ar'

  return (
    <section className="bg-secondary/40 py-6 md:py-12 2xl:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            {dict.services.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl text-balance">
            {dict.booking.consultation.title}
          </h2>
        </Reveal>

        <div
          className={`mx-auto mt-12 grid max-w-5xl gap-6 ${list.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
            }`}
        >
          {list.map((c, i) => {
            const priceVal = c.priceEGP ?? c.price ?? 0
            const isMostWanted = priceVal === highestPrice && highestPrice > 0

            return (
              <Reveal key={c.id} delay={i * 90}>
                <div
                  className={`group relative flex h-full flex-col justify-between rounded-3xl border p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isMostWanted
                      ? 'border-primary/50 bg-card hover:border-primary'
                      : 'border-border bg-card hover:border-primary/40'
                    }`}
                >
                  {/* "Most Booked" Badge on Top Right */}
                  {isMostWanted && (
                    <div className="absolute -top-3.5 end-6 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1 text-xs font-bold shadow-md ring-2 ring-background">
                      <Sparkles className="size-3.5 fill-current" />
                      <span>{dict.booking.consultation.mostWanted || (isArabic ? 'الأكثر حجزاً' : 'Most Booked')}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4 text-primary" aria-hidden="true" />
                      <span>
                        {c.durationMinutes} {dict.common.minutes}
                      </span>
                    </div>

                    <h3 className="mt-4 font-serif text-2xl font-medium text-foreground">
                      {localizedField(c.name, locale)}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {localizedField(c.description, locale)}
                    </p>
                  </div>

                  <div className="mt-6 flex items-end justify-between border-t border-border pt-5">
                    <div>
                      <span className="block text-xs text-muted-foreground">
                        {dict.common.from}
                      </span>
                      <span className="font-serif text-3xl font-medium text-foreground">
                        {formatPrice(priceVal, locale, 'EGP')}
                      </span>
                    </div>

                    <CtaLink
                      href={`/${locale}/booking?consultation=${c.id}`}
                      size="md"
                    >
                      {dict.services.bookNow}
                    </CtaLink>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
