import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { BookingFlow } from '@/components/booking/booking-flow'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = lang === 'ar' ? 'ar' : 'en'
  const dict = getDictionary(locale)
  return {
    title: dict.meta.booking.title,
    description: dict.meta.booking.description,
  }
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = getDictionary(lang)

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <BookingFlow locale={lang} dict={dict} />
    </Suspense>
  )
}
