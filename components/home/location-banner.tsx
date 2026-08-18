'use client'

import * as React from 'react'
import { MapPin } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'

type Region = 'loading' | 'egypt' | 'international' | 'neutral'

export function LocationBanner({ dict }: { dict: Dictionary }) {
  const [region, setRegion] = React.useState<Region>('loading')

  React.useEffect(() => {
    let active = true
    fetch('/api/geo')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { country?: string | null }) => {
        if (!active) return
        if (data.country === 'EG') setRegion('egypt')
        else if (data.country) setRegion('international')
        else setRegion('neutral')
      })
      .catch(() => active && setRegion('neutral'))
    return () => {
      active = false
    }
  }, [])

  const content =
    region === 'egypt'
      ? { title: dict.location.egyptTitle, body: dict.location.egyptBody }
      : region === 'international'
        ? {
            title: dict.location.internationalTitle,
            body: dict.location.internationalBody,
          }
        : { title: dict.location.neutralTitle, body: dict.location.neutralBody }

  return (
    <section className="mx-auto max-w-6xl px-5 pt-6">
      <div
        className="flex items-start gap-4 rounded-2xl border border-primary/15 bg-accent/50 p-5"
        aria-live="polite"
      >
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {dict.location.badge}
          </p>
          {region === 'loading' ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {dict.location.detecting}
            </p>
          ) : (
            <>
              <h2 className="mt-1 font-serif text-lg font-medium text-foreground">
                {content.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {content.body}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
