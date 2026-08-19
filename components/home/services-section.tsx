import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { services, ServiceItem } from '@/lib/data/site'
import { getConsultationsCollection } from '@/lib/db'
import { ServiceCard } from '@/components/service-card'
import { CtaLink } from '@/components/cta-link'
import { Reveal } from '@/components/reveal'

export async function ServicesSection({
  locale,
  dict,
  showAll = false,
}: {
  locale: Locale
  dict: Dictionary
  showAll?: boolean
}) {
  let list: ServiceItem[] = services

  try {
    const col = await getConsultationsCollection()
    const docs = await col
      .find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray()

    if (docs && docs.length > 0) {
      list = docs.map((d, index) => ({
        id: d._id?.toString() || `consult-${index}`,
        icon: 'Stethoscope',
        name: d.title,
        description: d.description,
        durationMinutes: d.durationMinutes,
        startingPrice: d.priceEGP,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch consultations for services section:', error)
    list = services
  }

  const displayedList = showAll ? list : list.slice(0, 3)

  // Find the highest priced session for the "Most Wanted" badge
  const highestPrice = Math.max(
    ...displayedList.map((s) => s.startingPrice || 0),
    0,
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id="services">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          {dict.services.eyebrow}
        </span>
        <h2 className="mt-3 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          {dict.services.title}
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          {dict.services.subtitle}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {displayedList.map((service, i) => (
          <Reveal key={service.id} delay={i * 70} className="h-full">
            <ServiceCard
              service={service}
              locale={locale}
              dict={dict}
              isMostWanted={service.startingPrice === highestPrice && highestPrice > 0}
            />
          </Reveal>
        ))}
      </div>

      {!showAll && (
        <div className="mt-10 text-center">
          <CtaLink href={`/${locale}/services`} variant="outline">
            {dict.common.viewAll}
          </CtaLink>
        </div>
      )}
    </section>
  )
}
