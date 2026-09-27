import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n'
import { BookingFlow } from '@/components/booking/booking-flow'
import { getConsultationsCollection } from '@/lib/db'
import type { ConsultationType } from '@/lib/data/site'
import { getVisitorGeo } from '@/lib/geo'

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
  const geo = await getVisitorGeo()

  let initialConsultations: (ConsultationType & { priceEGP?: number; priceUSD?: number })[] = []
  try {
    const col = await getConsultationsCollection()
    const docs = await col
      .find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray()

    if (docs && docs.length > 0) {
      initialConsultations = docs.map((d) => ({
        id: d._id?.toString() || '',
        name: d.title,
        description: d.description,
        durationMinutes: d.durationMinutes,
        breakAfterMinutes: d.breakAfterMinutes,
        isMostBooked: d.isMostBooked,
        price: geo.currency === 'USD' ? (d.priceUSD || 60) : (d.priceEGP || 1500),
        priceEGP: d.priceEGP,
        priceUSD: d.priceUSD,
      }))
    }
  } catch (err) {
    console.error('Failed to fetch initial consultations in BookingPage:', err)
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <BookingFlow
        locale={lang}
        dict={dict}
        initialConsultations={initialConsultations}
        initialCurrency={geo.currency}
        initialCountry={geo.country}
      />
    </Suspense>
  )
}

