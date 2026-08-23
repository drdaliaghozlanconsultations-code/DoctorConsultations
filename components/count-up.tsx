'use client'

import * as React from 'react'

interface CountUpProps {
  value: string
  duration?: number // duration in ms
  className?: string
}

function parseNumberParts(raw: string) {
  const match = raw.match(/^([^\d]*)([\d,.]+)([^\d]*)$/)
  if (!match) {
    return { prefix: '', target: null, suffix: raw, hasCommas: false }
  }

  const prefix = match[1] || ''
  const numStr = match[2]
  const suffix = match[3] || ''
  const hasCommas = numStr.includes(',')
  const target = parseFloat(numStr.replace(/,/g, ''))

  return { prefix, target: isNaN(target) ? null : target, suffix, hasCommas }
}

export function CountUp({ value, duration = 1800, className }: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [displayValue, setDisplayValue] = React.useState<string>('0')
  const [hasAnimated, setHasAnimated] = React.useState(false)

  const { prefix, target, suffix, hasCommas } = React.useMemo(
    () => parseNumberParts(value),
    [value],
  )

  React.useEffect(() => {
    const el = ref.current
    if (!el || target === null) {
      setDisplayValue(value)
      return
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      setDisplayValue(value)
      setHasAnimated(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          observer.disconnect()

          let startTime: number | null = null

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)

            // Ease-out cubic: 1 - (1 - t)^3
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            const currentNumber = Math.round(easeProgress * target)

            const formattedNumber = hasCommas
              ? currentNumber.toLocaleString()
              : String(currentNumber)

            if (progress < 1) {
              setDisplayValue(`${prefix}${formattedNumber}${suffix}`)
              requestAnimationFrame(step)
            } else {
              setDisplayValue(value)
            }
          }

          requestAnimationFrame(step)
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -20px 0px' },
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [value, duration, target, prefix, suffix, hasCommas, hasAnimated])

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  )
}
