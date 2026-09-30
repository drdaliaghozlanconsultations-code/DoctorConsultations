'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Clock, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isArabic = locale === 'ar'

  const NextIcon = isArabic ? ChevronLeft : ChevronRight
  const PrevIcon = isArabic ? ChevronRight : ChevronLeft

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current
    if (!container) return
    const cards = container.querySelectorAll<HTMLElement>('[data-consultation-item]')
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
      setCurrentIndex(index)
    }
  }, [])

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % consultationsList.length
    scrollToIndex(nextIdx)
  }

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + consultationsList.length) % consultationsList.length
    scrollToIndex(prevIdx)
  }

  // Auto-scroll to selected consultation if preselected
  useEffect(() => {
    if (selectedId && consultationsList.length > 0) {
      const idx = consultationsList.findIndex((c) => c.id === selectedId)
      if (idx !== -1) {
        setCurrentIndex(idx)
        const timer = setTimeout(() => scrollToIndex(idx), 60)
        return () => clearTimeout(timer)
      }
    }
  }, [selectedId, consultationsList, scrollToIndex])

  // Track active slide on swipe/scroll
  const onScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const cards = container.querySelectorAll<HTMLElement>('[data-consultation-item]')
    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    let closestIndex = 0
    let minDistance = Infinity

    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect()
      const cardCenter = rect.left + rect.width / 2
      const distance = Math.abs(containerCenter - cardCenter)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = idx
      }
    })

    setCurrentIndex(closestIndex)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let timeoutId: NodeJS.Timeout
    const debouncedScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(onScroll, 60)
    }

    container.addEventListener('scroll', debouncedScroll, { passive: true })
    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener('scroll', debouncedScroll)
    }
  }, [onScroll])

  // Loading skeleton in carousel format
  if (isLoading || consultationsList.length === 0) {
    return (
      <div>
        <div className="text-center sm:text-start">
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            {d.title}
          </h2>
          {/* <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            {d.subtitle}
          </p> */}
        </div>

        <div className="mt-3 flex gap-4 overflow-hidden pt-5 pb-3 px-1">
          {[1, 2].map((idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs animate-pulse w-full sm:w-[calc(50%-8px)] shrink-0 min-h-[300px] sm:min-h-[320px]"
              aria-hidden="true"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 rounded-full bg-muted/80" />
                  <div className="size-6 rounded-full bg-muted/60" />
                </div>
                <div className="mt-4 h-6 w-3/4 rounded-xl bg-muted/80" />
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-3 w-full rounded bg-muted/60" />
                  <div className="h-3 w-4/5 rounded bg-muted/60" />
                </div>
              </div>
              <div className="mt-6 flex items-end justify-between border-t border-border/80 pt-4">
                <div className="space-y-1">
                  <div className="h-2.5 w-8 rounded bg-muted/50" />
                  <div className="h-6 w-16 rounded-lg bg-muted/70" />
                </div>
                <div className="h-7 w-16 rounded-full bg-muted/70" />
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

  const showCarouselControls = consultationsList.length > 2

  return (
    <div>
      {/* Header with Title & Optional Navigation Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-center sm:text-start">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            {d.title}
          </h2>
          {/* <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            {d.subtitle}
          </p> */}
        </div>

        {/* Carousel Navigation Buttons in Header when > 2 consultations */}
        {showCarouselControls && (
          <div className="hidden sm:flex items-center gap-1.5 self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrev}
              className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-accent hover:border-primary/50 active:scale-95 cursor-pointer shadow-2xs"
              title={dict.common.back || 'Previous'}
              aria-label="Previous consultation"
            >
              <PrevIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex size-8 items-center justify-center rounded-full border-2 border-primary bg-card text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 cursor-pointer shadow-2xs"
              title={dict.common.next || 'Next'}
              aria-label="Next consultation"
            >
              <NextIcon className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel Track with Floating Side Buttons */}
      <div className="relative">
        {/* Floating Side Arrow Buttons (Desktop/Tablet) */}
        {showCarouselControls && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex size-9 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md backdrop-blur-xs hover:border-primary hover:text-primary active:scale-95 transition-all cursor-pointer',
                isArabic ? '-right-4' : '-left-4',
              )}
              title={dict.common.back || 'Previous'}
              aria-label="Previous consultation"
            >
              <PrevIcon className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex size-9 items-center justify-center rounded-full border-2 border-primary bg-card/95 text-primary shadow-md backdrop-blur-xs hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all cursor-pointer ring-2 ring-primary/20',
                isArabic ? '-left-4' : '-right-4',
              )}
              title={dict.common.next || 'Next'}
              aria-label="Next consultation"
            >
              <NextIcon className="size-4" />
            </button>
          </>
        )}

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex gap-4 sm:gap-5 pb-3 pt-5 px-1 scrollbar-none [&::-webkit-scrollbar]:hidden',
            showCarouselControls
              ? 'overflow-x-auto snap-x snap-mandatory scroll-smooth'
              : 'overflow-x-auto sm:overflow-x-visible',
          )}
        >
          {consultationsList.map((item, idx) => {
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
                data-consultation-item
                onClick={() => onSelect(item)}
                className={cn(
                  'group/card relative flex cursor-pointer flex-col justify-between rounded-2xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs transition-all duration-200 shrink-0 min-h-[270px] sm:min-h-[320px]',
                  showCarouselControls
                    ? 'w-[calc(70%-6px)] sm:w-[calc(50%-10px)] md:w-[400px] lg:w-[450px] snap-start'
                    : 'w-full sm:w-[calc(50%-10px)]',
                  isSelected
                    ? 'border-primary bg-accent/30 ring-2 ring-primary/20 shadow-md'
                    : isMostWanted
                      ? 'border-primary/50 bg-card hover:border-primary hover:shadow-md'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-md',
                )}
              >
                {/* "Most Booked" Badge on Top Right */}
                {isMostWanted && (
                  <div className="absolute -top-3 end-3 sm:end-5 z-10 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 text-[9px] sm:text-[11px] font-bold shadow-md ring-2 ring-background">
                    <Sparkles className="size-2.5 sm:size-3 fill-current" />
                    <span>{d.mostWanted || (locale === 'ar' ? 'الأكثر حجزاً' : 'Most Booked')}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                      <Clock className="size-2.5 sm:size-3 text-primary" />
                      <span>
                        {item.durationMinutes} {dict.common.minutes}
                      </span>
                    </div>

                    <span
                      className={cn(
                        'grid size-5 sm:size-6 place-items-center rounded-full border transition-colors shrink-0',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-transparent group-hover/card:border-primary/40',
                      )}
                    >
                      <Check className="size-3 sm:size-3.5 stroke-3" />
                    </span>
                  </div>

                  <h3 className="mt-2.5 sm:mt-3.5 font-serif text-base sm:text-xl font-semibold text-foreground leading-snug">
                    {localizedField(item.name, locale)}
                  </h3>

                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-[9] ">
                    {localizedField(item.description, locale)}
                  </p>
                </div>

                <div className="mt-3.5 sm:mt-5 flex items-end justify-between border-t border-border/80 pt-3 sm:pt-4 gap-1">
                  <div>
                    <span className="block text-[10px] sm:text-[11px] text-muted-foreground">
                      {dict.common.from}
                    </span>
                    <span className="font-serif text-lg sm:text-2xl font-semibold text-foreground whitespace-nowrap">
                      {formatPrice(priceValue, locale, currency)}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold transition-colors shrink-0',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground group-hover/card:bg-primary group-hover/card:text-primary-foreground',
                    )}
                  >
                    {isSelected ? d.selected : d.select}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dot Indicators on Mobile */}
        {showCarouselControls && (
          <div className="mt-3 flex items-center justify-center gap-1.5 sm:hidden">
            {consultationsList.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => scrollToIndex(dotIdx)}
                aria-label={`Consultation ${dotIdx + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                  dotIdx === currentIndex
                    ? 'w-5 bg-primary'
                    : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
