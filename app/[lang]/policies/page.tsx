import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, FileText, ArrowRight, ArrowLeft } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { Reveal } from '@/components/reveal'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = lang === 'ar' ? 'ar' : 'en'
  const dict = getDictionary(locale)
  return {
    title: dict.meta.policies.title,
    description: dict.meta.policies.description,
  }
}

export default async function PoliciesIndexPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = getDictionary(lang)
  const policies = dict.policies
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight

  const list = [
    {
      href: `/${lang}/policies/cancellation-refund`,
      title: policies.cancellation.title,
      description: policies.cancellation.intro,
    },
    {
      href: `/${lang}/policies/privacy`,
      title: policies.privacy.title,
      description: policies.privacy.intro,
    },
    {
      href: `/${lang}/policies/terms`,
      title: policies.terms.title,
      description: policies.terms.intro,
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-medium text-primary">
          <ShieldCheck className="size-4" />
          {policies.indexTitle}
        </span>
        <h1 className="mt-6 font-serif text-4xl font-semibold text-foreground sm:text-5xl">
          {policies.indexTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {policies.indexSubtitle}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {list.map((item, index) => (
          <Reveal key={item.href} delay={index * 80}>
            <Link
              href={item.href}
              className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <FileText className="size-6" />
                </div>
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary">
                <span>{policies.readPolicy}</span>
                <Arrow className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
