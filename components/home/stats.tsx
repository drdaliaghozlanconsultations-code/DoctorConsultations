import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { stats, localizedField } from '@/lib/data/site'
import { Reveal } from '@/components/reveal'

export function Stats({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Reveal className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-balance font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            {dict.stats.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{dict.stats.subtitle}</p>
        </div>
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal
              key={stat.id}
              delay={i * 80}
              className="text-center"
            >
              <dt className="sr-only">{localizedField(stat.label, locale)}</dt>
              <dd className="font-serif text-4xl font-semibold text-primary sm:text-5xl">
                {stat.value}
              </dd>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {localizedField(stat.label, locale)}
              </p>
            </Reveal>
          ))}
        </dl>
      </Reveal>
    </section>
  )
}
