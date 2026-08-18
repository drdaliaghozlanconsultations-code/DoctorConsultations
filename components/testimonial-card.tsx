'use client'

import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n/config'
import { type Testimonial, localizedField } from '@/lib/data/site'

export function TestimonialCard({
  testimonial,
  locale,
  index = 0,
  flipped = false,
}: {
  testimonial: Testimonial
  locale: Locale
  index?: number
  flipped?: boolean
}) {
  // Realistic multi-lobed cloud SVG paths for authentic puffy cloud shapes
  const cloudPaths = [
    // Cloud Shape 1: Classic puffy cloud with prominent top puffs
    'M 22,86 C 8,86 2,74 3,60 C 0,46 8,34 22,30 C 20,16 32,5 48,7 C 60,1 76,5 84,18 C 94,16 100,28 98,42 C 102,56 96,72 86,80 C 78,86 68,85 60,85 C 48,88 34,88 22,86 Z',
    // Cloud Shape 2: Billowing soft cloud with gentle scallops
    'M 20,85 C 7,85 2,72 4,58 C 1,44 10,32 24,28 C 24,14 38,4 52,6 C 66,2 80,8 86,22 C 96,22 101,34 98,48 C 101,62 94,76 84,82 C 74,86 64,84 50,86 C 36,87 28,86 20,85 Z',
    // Cloud Shape 3: Dreamy organic cloud with asymmetric arches
    'M 24,86 C 10,86 3,75 4,59 C 2,45 12,33 26,29 C 28,15 42,5 56,8 C 70,4 82,12 88,24 C 98,26 101,38 98,52 C 100,66 92,80 82,84 C 70,88 56,85 42,87 C 32,88 28,87 24,86 Z',
  ]

  const currentPath = cloudPaths[index % cloudPaths.length]
  const gradId = `cloud-grad-${testimonial.id}-${index}`

  return (
    <figure className="group relative  flex min-h-44 sm:min-h-50 h-full items-center justify-center px-7 py-1.5 md:py-3 sm:px-9 sm:py-8 transition-all duration-500 hover:-translate-y-2 [filter:drop-shadow(0_10px_20px_rgba(225,150,175,0.18))] hover:[filter:drop-shadow(0_16px_28px_rgba(225,130,160,0.28))]">
      {/* SVG Cloud Background Contour & Stroke */}
      <svg
        className={cn(
          'pointer-events-none  absolute inset-0 -z-10 h-full w-full overflow-visible',
          flipped && '-scale-x-100'
        )}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="oklch(0.975 0.02 15)" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Ambient cloud backdrop */}
        <path
          d={currentPath}
          fill={`url(#${gradId})`}
          stroke="oklch(0.62 0.13 8 / 0.22)"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
          className="transition-colors duration-300 group-hover:stroke-primary/50"
        />
      </svg>

      {/* Centered Patient Quote */}
      <blockquote className="relative z-10 text-center font-medium leading-snug sm:leading-relaxed text-primary text-xs sm:text-[0.6rem] md:text-[0.72rem] lg:text-[0.81rem]">
        &ldquo;{localizedField(testimonial.quote, locale)}&rdquo;
      </blockquote>
    </figure>
  )
}
