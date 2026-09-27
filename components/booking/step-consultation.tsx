'use client'

import { Clock, Check, Sparkles } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import type { ConsultationType } from '@/lib/data/site'
import { localizedField } from '@/lib/data/site'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

interface StepConsultationProps {
  locale: Locale
  dict: Dictionary
  consultationsList: (ConsultationType & { priceEGP?: number; priceUSD?: number })[]
  currency: 'EGP' | 'USD'
  selectedId: string | null
  onSelect: (consultation: ConsultationType) => void
  isLoading?: boolean
}

export function StepConsultation({
  locale,
  dict,
  consultationsList,
  currency = 'EGP',
  selectedId,
  onSelect,
  isLoading = false,
}: StepConsultationProps) {
  const d = dict.booking.consultation

  // When loading or when no consultations have loaded yet, render clean data-free skeletons
  if (isLoading || consultationsList.length === 0) {
    return (
      <div>
        <div className="text-center sm:text-start">
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            {d.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {d.subtitle}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {[1, 2].map((idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-7 shadow-xs animate-pulse"
              aria-hidden="true"
            >
              <div>
                {/* Duration & checkmark skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 rounded-full bg-muted/80" />
                  <div className="size-7 rounded-full bg-muted/60" />
                </div>

                {/* Title skeleton */}
                <div className="mt-5 h-7 w-3/4 rounded-xl bg-muted/80" />

                {/* Description lines skeleton - NO TEXT, NO DATA */}
                <div className="mt-3 space-y-2">
                  <div className="h-3.5 w-full rounded-md bg-muted/60" />
                  <div className="h-3.5 w-5/6 rounded-md bg-muted/60" />
                  <div className="h-3.5 w-2/3 rounded-md bg-muted/60" />
                </div>
              </div>

              {/* Bottom: No prices, no numbers, no data - pure neutral placeholders */}
              <div className="mt-8 flex items-end justify-between border-t border-border/80 pt-5">
                <div className="space-y-1.5">
                  <div className="h-3 w-10 rounded bg-muted/50" />
                  <div className="h-7 w-20 rounded-lg bg-muted/70" />
                </div>
                <div className="h-8 w-20 rounded-full bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Check if any consultation is explicitly marked as "Most Booked"
  const hasExplicitMostBooked = consultationsList.some((item) => item.isMostBooked)
  const highestPrice = Math.max(
    ...consultationsList.map((item) => {
      if (currency === 'USD' && item.priceUSD !== undefined) return item.priceUSD
      if (currency === 'EGP' && item.priceEGP !== undefined) return item.priceEGP
      return item.price || 0
    }),
    0,
  )

  return (
    <div>
      <div className="text-center sm:text-start">
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          {d.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {d.subtitle}
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {consultationsList.map((item) => {
          const isSelected = selectedId === item.id
          const priceValue =
            currency === 'USD' && item.priceUSD !== undefined
              ? item.priceUSD
              : currency === 'EGP' && item.priceEGP !== undefined
                ? item.priceEGP
                : item.price || 0

          const isMostWanted = hasExplicitMostBooked
            ? Boolean(item.isMostBooked)
            : priceValue === highestPrice && highestPrice > 0

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                'group relative flex cursor-pointer flex-col justify-between rounded-3xl border p-7 shadow-sm transition-all duration-200',
                isSelected
                  ? 'border-primary bg-accent/30 ring-2 ring-primary/20 shadow-md'
                  : isMostWanted
                    ? 'border-primary/50 bg-card hover:border-primary hover:shadow-md'
                    : 'border-border bg-card hover:border-primary/40 hover:shadow-md',
              )}
            >
              {/* "Most Booked" Badge on Highest Priced Session */}
              {isMostWanted && (
                <div className="absolute -top-3.5 end-6 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1 text-xs font-bold shadow-md ring-2 ring-background">
                  <Sparkles className="size-3.5 fill-current" />
                  <span>{d.mostWanted || (locale === 'ar' ? 'الأكثر حجزاً' : 'Most Booked')}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Clock className="size-3.5 text-primary" />
                    <span>
                      {item.durationMinutes} {dict.common.minutes}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'grid size-7 place-items-center rounded-full border transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-transparent group-hover:border-primary/40',
                    )}
                  >
                    <Check className="size-4 stroke-3" />
                  </span>
                </div>

                <h3 className="mt-5 font-serif text-2xl font-semibold text-foreground">
                  {localizedField(item.name, locale)}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {localizedField(item.description, locale)}
                </p>
              </div>

              <div className="mt-8 flex items-end justify-between border-t border-border/80 pt-5">
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {dict.common.from}
                  </span>
                  <span className="font-serif text-3xl font-semibold text-foreground">
                    {formatPrice(priceValue, locale, currency)}
                  </span>
                </div>

                <span
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-semibold transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground',
                  )}
                >
                  {isSelected ? d.selected : d.select}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
