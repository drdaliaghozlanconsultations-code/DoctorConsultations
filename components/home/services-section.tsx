import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { services } from '@/lib/data/site'
import { ServiceCard } from '@/components/service-card'
import { CtaLink } from '@/components/cta-link'
import { Reveal } from '@/components/reveal'

export function ServicesSection({
  locale,
  dict,
  showAll = false,
}: {
  locale: Locale
  dict: Dictionary
  showAll?: boolean
}) {
  const list = showAll ? services : services.slice(0, 3)

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

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((service, i) => (
          <Reveal key={service.id} delay={i * 70} className="h-full">
            <ServiceCard service={service} locale={locale} dict={dict} />
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
