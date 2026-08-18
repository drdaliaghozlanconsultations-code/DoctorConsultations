import Link from 'next/link'
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { type ServiceItem, localizedField } from '@/lib/data/site'
import { formatPrice } from '@/lib/format'
import { ServiceIcon } from '@/components/service-icon'

export function ServiceCard({
  service,
  locale,
  dict,
}: {
  service: ServiceItem
  locale: Locale
  dict: Dictionary
}) {
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <div className="mb-5 grid size-13 place-items-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <ServiceIcon name={service.icon} />
      </div>
      <h3 className="font-serif text-xl font-semibold text-foreground">
        {localizedField(service.name, locale)}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {localizedField(service.description, locale)}
      </p>

      <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden="true" />
          {service.durationMinutes} {dict.common.minutes}
        </span>
        <span className="text-foreground/70">
          {dict.common.from}{' '}
          <span className="font-semibold text-foreground">
            {formatPrice(service.startingPrice, locale)}
          </span>
        </span>
      </div>

      <Link
        href={`/${locale}/booking?consultation=${service.durationMinutes >= 60 ? 'consult-60' : 'consult-30'}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
      >
        {dict.services.bookNow}
        <Arrow className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      </Link>
    </article>
  )
}
