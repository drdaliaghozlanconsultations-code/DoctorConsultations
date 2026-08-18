'use client'

import { Clock, Check } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { consultationTypes, localizedField, type ConsultationType } from '@/lib/data/site'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

interface StepConsultationProps {
  locale: Locale
  dict: Dictionary
  selectedId: string | null
  onSelect: (consultation: ConsultationType) => void
}

export function StepConsultation({
  locale,
  dict,
  selectedId,
  onSelect,
}: StepConsultationProps) {
  const d = dict.booking.consultation

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
        {consultationTypes.map((item) => {
          const isSelected = selectedId === item.id
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                'group relative flex cursor-pointer flex-col justify-between rounded-3xl border p-7 shadow-sm transition-all duration-200',
                isSelected
                  ? 'border-primary bg-accent/30 ring-2 ring-primary/20 shadow-md'
                  : 'border-border bg-card hover:border-primary/40 hover:shadow-md',
              )}
            >
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
                    {formatPrice(item.price, locale)}
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
