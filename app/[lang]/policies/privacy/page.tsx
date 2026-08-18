import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { PolicyLayout } from '@/components/policy-layout'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = lang === 'ar' ? 'ar' : 'en'
  const dict = getDictionary(locale)
  return {
    title: `${dict.policies.privacy.title} · ${dict.meta.siteName}`,
    description: dict.policies.privacy.intro,
  }
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = getDictionary(lang)
  const policy = dict.policies.privacy

  return (
    <PolicyLayout
      locale={lang}
      title={policy.title}
      intro={policy.intro}
      lastUpdated={`${dict.policies.lastUpdated}: ${dict.policies.lastUpdatedValue}`}
      sections={policy.sections}
    />
  )
}
