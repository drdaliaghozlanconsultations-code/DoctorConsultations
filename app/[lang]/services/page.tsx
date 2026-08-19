import type { Metadata } from 'next'
import { Sparkles, MessageCircleHeart, ShieldQuestion, HelpCircle, HeartHandshake, Award, Monitor } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { CtaLink } from '@/components/cta-link'
import { Reveal } from '@/components/reveal'
import { ConsultationsSection } from '@/components/home/consultations-section'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = lang === 'ar' ? 'ar' : 'en'
  const dict = getDictionary(locale)
  return {
    title: dict.meta.services.title,
    description: dict.meta.services.description,
  }
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = getDictionary(lang)
  const benefits = dict.sessionBenefits

  const icons = [
    MessageCircleHeart,
    ShieldQuestion,
    HelpCircle,
    HeartHandshake,
    Award,
    Monitor,
  ]

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <section className="relative border-b border-border/60 bg-linear-to-b from-secondary/50 via-background to-background py-6 sm:py-12 2xl:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <Sparkles className="size-4" aria-hidden="true" />
              {benefits.eyebrow}
            </span>
            <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {benefits.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {benefits.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 6 Core Session Experience Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12 2xl:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.items.map((item, index) => {
            const IconComponent = icons[index % icons.length]
            return (
              <Reveal key={index} delay={index * 70} className="h-full">
                <div className="group flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <IconComponent className="size-7" />
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Available Consultation Options (30 min / 60 min) */}
      <ConsultationsSection dict={dict} locale={lang} />

      {/* Bottom CTA */}
      <section className="mx-auto max-w-4xl px-4 py-6 md:py-12 text-center sm:px-6 2xl:py-16">
        <Reveal className="rounded-3xl border border-primary/20 bg-accent/40 p-10 sm:p-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            {dict.finalCta.title}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {dict.finalCta.subtitle}
          </p>
          <div className="mt-8 flex justify-center">
            <CtaLink href={`/${lang}/booking`}>
              {dict.hero.primaryCta}
            </CtaLink>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
