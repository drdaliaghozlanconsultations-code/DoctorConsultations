'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function VisitTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    // Avoid tracking dashboard or api routes
    if (!pathname || pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
      return
    }

    const search = typeof window !== 'undefined' ? window.location.search : ''
    const currentFull = pathname + search

    if (lastTracked.current === currentFull) {
      return
    }

    lastTracked.current = currentFull

    try {
      const data = JSON.stringify({
        path: pathname,
        search,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      })

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon('/api/track', blob)
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Silently ignore tracking errors
    }
  }, [pathname])

  return null
}
