'use client'

import * as React from 'react'
import { Calendar, Clock, Globe, Loader2 } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import {
  formatSlotLabel,
  formatDateLabel,
  type DayAvailability,
  type TimeSlot,
} from '@/lib/data/availability'
import { cn } from '@/lib/utils'

interface StepScheduleProps {
  locale: Locale
  dict: Dictionary
  durationMinutes?: number
  selectedDate: string | null
  selectedTime: string | null
  onSelectSlot: (date: string, time: string) => void
}

export function StepSchedule({
  locale,
  dict,
  durationMinutes = 30,
  selectedDate,
  selectedTime,
  onSelectSlot,
}: StepScheduleProps) {
  const d = dict.booking.schedule

  const [days, setDays] = React.useState<DayAvailability[]>([])
  const [loadingDays, setLoadingDays] = React.useState(true)
  const [activeDate, setActiveDate] = React.useState<string | null>(selectedDate || null)
  const [slots, setSlots] = React.useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = React.useState(false)

  // 1. Fetch available days from API (lightweight — no booking checks)
  React.useEffect(() => {
    let isMounted = true
    setLoadingDays(true)

    fetch(`/api/availability?action=days&duration=${durationMinutes}&count=14`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return
        if (json.success && Array.isArray(json.data)) {
          setDays(json.data)
        }
      })
      .catch((err) => console.error('Failed to load available days:', err))
      .finally(() => {
        if (isMounted) setLoadingDays(false)
      })

    return () => {
      isMounted = false
    }
  }, [durationMinutes])

  // 2. Fetch slots when activeDate changes
  React.useEffect(() => {
    if (!activeDate) {
      setSlots([])
      return
    }

    let isMounted = true
    setLoadingSlots(true)

    fetch(`/api/availability?action=slots&date=${activeDate}&duration=${durationMinutes}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return
        if (json.success && Array.isArray(json.data)) {
          setSlots(json.data)
        } else {
          setSlots([])
        }
      })
      .catch((err) => {
        console.error('Failed to load slots for date:', err)
        if (isMounted) setSlots([])
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeDate, durationMinutes])

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
        <div className="flex items-center justify-between text-sm font-medium text-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <span>{d.chooseDate}</span>
          </div>
          {loadingDays && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin text-primary" />
              <span>Loading schedule...</span>
            </span>
          )}
        </div>

        <div className="mt-4 flex snap-x gap-2.5 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {loadingDays && days.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex min-w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/50 p-3.5 animate-pulse"
              >
                <div className="h-4 w-12 rounded bg-muted"></div>
              </div>
            ))
          ) : (
            days.map((day: DayAvailability) => {
              const isSelected = activeDate === day.date
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!day.hasSlots}
                  onClick={() => setActiveDate(day.date)}
                  title={day.reason ? `${day.date}: ${day.reason}` : undefined}
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
                  {!day.hasSlots && day.reason && (
                    <span className="mt-1 text-[9px] text-muted-foreground/70 truncate max-w-[80px]">
                      {day.reason}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Time slots grid */}
      <div className="mt-10 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="size-4 text-primary" />
            <span>{d.chooseTime}</span>
            {durationMinutes > 0 && (
              <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                {durationMinutes} min
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" />
            <span>{d.timezoneNote}</span>
          </div>
        </div>

        {!activeDate ? (
          <p className="mt-6 text-sm text-muted-foreground">{d.selectDateFirst}</p>
        ) : loadingSlots ? (
          <div className="mt-6 flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Checking available slots...</span>
          </div>
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

