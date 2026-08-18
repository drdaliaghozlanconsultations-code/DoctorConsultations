import type { Locale } from '@/lib/i18n/config'
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/reveal'

interface PolicySection {
  heading: string
  body: string
}

interface PolicyLayoutProps {
  locale: Locale
  title: string
  intro: string
  disclaimer?: string
  lastUpdated?: string
  sections: readonly PolicySection[]
}

export function PolicyLayout({
  locale,
  title,
  intro,
  disclaimer,
  lastUpdated,
  sections,
}: PolicyLayoutProps) {
  const Arrow = locale === 'ar' ? ArrowRight : ArrowLeft

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mb-8">
        <Link
          href={`/${locale}/policies`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          <Arrow className="size-4" />
          <span>{locale === 'ar' ? 'العودة إلى السياسات' : 'Back to Policies'}</span>
        </Link>
      </div>

      <Reveal>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-accent text-primary">
            <Shield className="size-5" />
          </span>
          <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            {title}
          </h1>
        </div>

        {lastUpdated && (
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {lastUpdated}
          </p>
        )}

        <p className="mt-6 text-lg leading-relaxed text-foreground/80">
          {intro}
        </p>

        {disclaimer && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-accent/40 p-5 text-sm leading-relaxed text-foreground/80">
            {disclaimer}
          </div>
        )}
      </Reveal>

      <div className="mt-12 space-y-10 border-t border-border pt-10">
        {sections.map((sec, i) => (
          <Reveal key={i} delay={i * 50}>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                {sec.heading}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground sm:text-base">
                {sec.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
