'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import {
  locales,
  localeLabels,
  localizePath,
  type Locale,
} from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({
  locale,
  label,
  className,
}: {
  locale: Locale
  label: string
  className?: string
}) {
  const pathname = usePathname() || `/${locale}`

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-card p-1',
        className,
      )}
      role="group"
      aria-label={label}
    >
      {/* <Languages
        className="ms-1.5 size-4 text-muted-foreground"
        aria-hidden="true"
      /> */}
      {locales.map((l) => {
        const active = l === locale
        return (
          <Link
            key={l}
            href={localizePath(pathname, l)}
            hrefLang={l}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {localeLabels[l].short}
          </Link>
        )
      })}
    </div>
  )
}
