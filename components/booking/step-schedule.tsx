'use client'

import * as React from 'react'
import { Calendar, Clock, Globe } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import {
  getUpcomingDays,
  getSlotsForDate,
  formatSlotLabel,
  formatDateLabel,
  type DayAvailability,
  type TimeSlot,
} from '@/lib/data/availability'
import { cn } from '@/lib/utils'

interface StepScheduleProps {
  locale: Locale
  dict: Dictionary
  selectedDate: string | null
  selectedTime: string | null
  onSelectSlot: (date: string, time: string) => void
}

export function StepSchedule({
  locale,
  dict,
  selectedDate,
  selectedTime,
  onSelectSlot,
}: StepScheduleProps) {
  const d = dict.booking.schedule
  const days = React.useMemo(() => getUpcomingDays(14), [])

  const [activeDate, setActiveDate] = React.useState<string | null>(
    selectedDate ?? days.find((x) => x.hasSlots)?.date ?? null,
  )

  const slots = React.useMemo(() => {
    if (!activeDate) return []
    return getSlotsForDate(activeDate)
  }, [activeDate])

  const handleTimeClick = (slot: TimeSlot) => {
    if (!slot.available || !activeDate) return
    onSelectSlot(activeDate, slot.time)
  }

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

      {/* Date selector strip */}
      <div className="mt-8">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="size-4 text-primary" />
          <span>{d.chooseDate}</span>
        </div>

        <div className="mt-4 flex snap-x gap-2.5 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {days.map((day: DayAvailability) => {
            const isSelected = activeDate === day.date
            return (
              <button
                key={day.date}
                type="button"
                disabled={!day.hasSlots}
                onClick={() => setActiveDate(day.date)}
                className={cn(
                  'flex min-w-24 shrink-0 snap-start flex-col items-center rounded-2xl border p-3.5 text-center transition-all outline-none',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : day.hasSlots
                      ? 'border-border bg-card hover:border-primary/40 hover:bg-accent/40'
                      : 'cursor-not-allowed border-border/50 bg-muted/40 opacity-40',
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {formatDateLabel(day.date, locale)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots grid */}
      <div className="mt-10 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="size-4 text-primary" />
            <span>{d.chooseTime}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" />
            <span>{d.timezoneNote}</span>
          </div>
        </div>

        {!activeDate ? (
          <p className="mt-6 text-sm text-muted-foreground">{d.selectDateFirst}</p>
        ) : slots.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{d.noSlots}</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slot: TimeSlot) => {
              const isSelected = selectedDate === activeDate && selectedTime === slot.time
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => handleTimeClick(slot)}
                  className={cn(
                    'flex h-12 items-center justify-center rounded-xl border text-sm font-medium transition-all outline-none',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                      : slot.available
                        ? 'border-border bg-card hover:border-primary/40 hover:bg-accent/40 text-foreground'
                        : 'cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50 line-through',
                  )}
                >
                  {formatSlotLabel(slot.time, locale)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
