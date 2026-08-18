'use client'

import * as React from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { testimonials } from '@/lib/data/site'
import { TestimonialCard } from '@/components/testimonial-card'
import { Reveal } from '@/components/reveal'

export function TestimonialsSection({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  // Split or offset testimonials for 2 distinct marquee rows
  const row1 = [...testimonials]
  const row2 = [
    testimonials[3] || testimonials[0],
    testimonials[4] || testimonials[1],
    testimonials[5] || testimonials[2],
    testimonials[0],
    testimonials[1],
    testimonials[2],
  ]

  // Duplicate for seamless 50% translation infinite loop
  const marqueeRow1 = [...row1, ...row1]
  const marqueeRow2 = [...row2, ...row2]

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-6 text-center">
        <Reveal>
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            {dict.testimonials.eyebrow}
          </span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            {dict.testimonials.title}
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-pretty text-muted-foreground">
            {dict.testimonials.subtitle}
          </p>
        </Reveal>
      </div>

      {/* Infinite Horizontal Marquee Rows Container */}
      <div className="relative space-y-1.5 sm:space-y-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_6%,black_94%,transparent_100%)] py-3">
        {/* Row 1: Moves Left */}
        <div className="animate-marquee-left flex  px-4">
          {marqueeRow1.map((t, index) => (
            <div
              key={`r1-${t.id}-${index}`}
              className="w-[220px] sm:w-[250px] md:w-[275px] lg:w-[285px] shrink-0"
            >
              <TestimonialCard testimonial={t} locale={locale} index={index} />
            </div>
          ))}
        </div>

        {/* Row 2: Moves Right (Vice Versa) */}
        <div className="animate-marquee-right flex gap-4 sm:gap-6 px-4">
          {marqueeRow2.map((t, index) => (
            <div
              key={`r2-${t.id}-${index}`}
              className="w-[220px] sm:w-[250px] md:w-[275px] lg:w-[285px] shrink-0"
            >
              <TestimonialCard testimonial={t} locale={locale} index={index + 3} flipped />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
