import type { Locale } from '@/lib/i18n/config'
import { currency } from '@/lib/data/site'

export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(amount)
}
