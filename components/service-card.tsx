import Link from 'next/link'
import { Clock, Sparkles } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { type ServiceItem, localizedField } from '@/lib/data/site'
import { formatPrice } from '@/lib/format'

export function ServiceCard({
  service,
  locale,
  dict,
  isMostWanted = false,
}: {
  service: ServiceItem
  locale: Locale
  dict: Dictionary
  isMostWanted?: boolean
}) {
  const isArabic = locale === 'ar'

  return (
    <article
      className={`group relative flex h-full flex-col justify-between rounded-3xl border p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isMostWanted
          ? 'border-primary/50 bg-card hover:border-primary'
          : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      {/* "Most Wanted" Badge on Top Right */}
      {isMostWanted && (
        <div className="absolute -top-3.5 end-6 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1 text-xs font-bold shadow-md ring-2 ring-background">
          <Sparkles className="size-3.5 fill-current" />
          <span>
            {dict.booking?.consultation?.mostWanted ||
              (isArabic ? 'الأكثر طلباً' : 'Most Wanted')}
          </span>
        </div>
      )}

      <div>
        {/* Duration Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5 text-primary" aria-hidden="true" />
            <span>
              {service.durationMinutes} {dict.common.minutes}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-5 font-serif text-2xl font-semibold text-foreground">
          {localizedField(service.name, locale)}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {localizedField(service.description, locale)}
        </p>
      </div>

      {/* Bottom: Price & Action */}
      <div className="mt-8 flex items-end justify-between border-t border-border/80 pt-5">
        <div>
          <span className="block text-xs text-muted-foreground">
            {dict.common.from}
          </span>
          <span className="font-serif text-3xl font-semibold text-foreground">
            {formatPrice(service.startingPrice, locale, 'EGP')}
          </span>
        </div>

        <Link
          href={`/${locale}/booking?consultation=${service.id}`}
          className="rounded-full px-5 py-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs active:scale-95"
        >
          {dict.services.bookNow}
        </Link>
      </div>
    </article>
  )
}
