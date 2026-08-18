import type { Metadata } from 'next'
import Image from 'next/image'
import { Award, BookOpen, Heart, Sparkles, CheckCircle2 } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { CtaLink } from '@/components/cta-link'
import { Reveal } from '@/components/reveal'
import { cn } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = lang === 'ar' ? 'ar' : 'en'
  const dict = getDictionary(locale)
  return {
    title: dict.meta.about.title,
    description: dict.meta.about.description,
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = getDictionary(lang)
  const about = dict.about

  const galleryImages = [
    { src: '/images/dr-dalia-hero.png', alt: 'Dr. Dalia Ghozlan' },
    { src: '/images/WhatsApp Image 2026-08-11 at 4.33.18 PM.jpeg', alt: 'Dr. Dalia clinical practice' },
    { src: '/images/WhatsApp Image 2026-08-11 at 4.33.18 PM (1).jpeg', alt: 'Dr. Dalia health education' },
    { src: '/images/WhatsApp Image 2026-08-11 at 4.33.19 PM.jpeg', alt: 'Dr. Dalia TV & Media' },
    { src: '/images/WhatsApp Image 2026-08-11 at 4.33.20 PM.jpeg', alt: 'Dr. Dalia community outreach' },
    { src: '/images/dr-dalia-about.png', alt: 'Dr. Dalia consultation' },
  ]

  return (
    <div className="overflow-hidden pb-10">
      {/* Hero Section */}
      <section className="relative border-b border-border/60 bg-linear-to-b from-secondary/50 via-background to-background py-6 sm:py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <Sparkles className="size-4" aria-hidden="true" />
              {about.eyebrow}
            </span>
            <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {about.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {about.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <CtaLink href={`/${lang}/booking`}>{about.cta}</CtaLink>
              <CtaLink href="#certificates" variant="outline">
                {about.certificatesTitle}
              </CtaLink>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-5">
            <div className="relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border bg-secondary shadow-xl">
              <Image
                src="/images/about.jpg"
                alt={about.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Biography Section */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <BookOpen className="size-5" />
            </span>
            <h2 className="font-serif text-3xl font-semibold text-foreground">
              {about.bioTitle}
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 space-y-12">
          {/* Paragraphs 0 & 1 */}
          <Reveal className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-foreground/80 sm:text-lg">
            <p>{about.bioParagraphs[0]}</p>
            <p>{about.bioParagraphs[1]}</p>
          </Reveal>

          {/* Featured Image 1 */}
          <Reveal>
            <div className="group relative mx-auto aspect-5/3 w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-border shadow-md">
              <Image
                src="/images/WhatsApp Image 2026-08-11 at 4.38.06 PM.jpeg"
                alt="Dr. Dalia Ghozlan medical practice and public health advocacy"
                fill
                sizes="(max-width: 1024px) 100vw, 80vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </Reveal>

          {/* Paragraphs 2 & 3 */}
          <Reveal className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-foreground/80 sm:text-lg">
            <p>{about.bioParagraphs[2]}</p>
            <p>{about.bioParagraphs[3]}</p>
          </Reveal>

          {/* Split Block with Image 2 */}
          <Reveal>
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="relative aspect-6/7 w-full overflow-hidden rounded-3xl border border-border shadow-sm md:col-span-5">
                <Image
                  src="/images/WhatsApp Image 2026-08-11 at 4.33.20 PM.jpeg"
                  alt="Dr. Dalia Ghozlan RCOG Anti-FGM Trainer & Educator"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-4 text-base leading-relaxed text-foreground/80 md:col-span-7 sm:text-lg">
                <p>{about.bioParagraphs[4]}</p>
                <p>{about.bioParagraphs[5]}</p>
              </div>
            </div>
          </Reveal>

          {/* Split Block with Image 3 */}
          <Reveal>
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="order-2 space-y-4 text-base leading-relaxed text-foreground/80 md:order-1 md:col-span-7 sm:text-lg">
                <p>{about.bioParagraphs[6]}</p>
                <p>{about.bioParagraphs[7]}</p>
              </div>
              <div className="relative order-1 aspect-4/3 w-full overflow-hidden rounded-3xl border border-border shadow-sm md:order-2 md:col-span-5">
                <Image
                  src="/images/WhatsApp Image 2026-08-11 at 4.33.19 PM (1).jpeg"
                  alt="Dr. Dalia Ghozlan Doctor Health TV presenter & Ambassador"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>

          {/* Split Block with Image 4 */}
          <Reveal>
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="relative aspect-6/7 w-full overflow-hidden rounded-3xl border border-border shadow-sm md:col-span-5">
                <Image
                  src="/images/WhatsApp Image 2026-08-11 at 4.33.18 PM (2).jpeg"
                  alt="Dr. Dalia Ghozlan Founder of VitaWear & Private Practice"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-4 text-base leading-relaxed text-foreground/80 md:col-span-7 sm:text-lg">
                <p>{about.bioParagraphs[8]}</p>
                <p>{about.bioParagraphs[9]}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Certificates & Qualifications Timeline */}
      <section id="certificates" className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">
              Medical Credentials
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {about.certificatesTitle}
            </h2>
          </Reveal>

          {/* Timeline Road */}
          <div className="relative mt-16 mx-auto max-w-4xl">
            {/* Vertical Road Line */}
            <div
              className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/30 via-primary to-primary/30"
              aria-hidden="true"
            />

            <div className="space-y-12">
              {[...about.certificates]
                .sort((a, b) => parseInt(a.year) - parseInt(b.year))
                .map((cert, index) => {
                  const isEven = index % 2 === 0
                  return (
                    <Reveal key={index} delay={index * 60}>
                      <div className="relative flex items-center">
                        {/* Year Node Badge - Centered on Line */}
                        <div className="absolute left-6 md:left-1/2 top-8 -translate-y-1/2 z-10 grid size-12 -translate-x-1/2 place-items-center rounded-full border-4 border-background bg-primary font-serif text-xs font-bold text-primary-foreground shadow-md">
                          {cert.year}
                        </div>

                        {/* Content Card */}
                        <div
                          className={cn(
                            'w-full pl-16 md:w-1/2 md:pl-0',
                            isEven ? 'md:me-auto' : 'md:ms-auto',
                          )}
                        >
                          <div
                            className={cn(
                              'rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg',
                              isEven ? 'md:me-10 md:ms-0' : 'md:ms-10 md:me-0',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                                <Award className="size-5" />
                              </span>
                              <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                                {cert.year}
                              </span>
                            </div>
                            <h3 className="mt-4 font-serif text-lg font-semibold leading-snug text-foreground">
                              {cert.title}
                            </h3>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {cert.institution}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  )
                })}
            </div>
          </div>
        </div>
      </section>

      {/* Areas of Focus */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Expertise
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            {about.areasOfFocusTitle}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {about.areasOfFocus.map((area, index) => (
            <Reveal key={index} delay={index * 50}>
              <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30">
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {area}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Photo Gallery */}
      {/* <section className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">
              Dr. Dalia in Action
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Media, Education & Practice
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((img, index) => (
              <Reveal key={index} delay={index * 80}>
                <div className="group relative aspect-4/3 overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:shadow-lg">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-5">
                    <p className="text-sm font-medium text-white">{img.alt}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section> */}

      {/* Why Patients Choose Dr. Dalia */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Patient Care
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            {about.whyTitle}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.why.map((item, index) => (
            <Reveal key={index} delay={index * 70}>
              <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 grid size-10 place-items-center rounded-2xl bg-accent text-primary">
                  <Heart className="size-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <CtaLink href={`/${lang}/booking`}>{about.cta}</CtaLink>
        </div>
      </section>
    </div>
  )
}
