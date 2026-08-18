import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { Hero } from '@/components/home/hero'
import { LocationBanner } from '@/components/home/location-banner'
import { Stats } from '@/components/home/stats'
import { ServicesSection } from '@/components/home/services-section'
import { AboutPreview } from '@/components/home/about-preview'
import { ConsultationsSection } from '@/components/home/consultations-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { CtaSection } from '@/components/cta-section'

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = getDictionary(lang)

  return (
    <>
      <Hero locale={lang} dict={dict} />
      <LocationBanner dict={dict} />
      <Stats locale={lang} dict={dict} />
      <ServicesSection locale={lang} dict={dict} />
      <AboutPreview locale={lang} dict={dict} />
      {/* <ConsultationsSection locale={lang} dict={dict} /> */}
      <TestimonialsSection locale={lang} dict={dict} />
      <CtaSection locale={lang} dict={dict} />
    </>
  )
}
