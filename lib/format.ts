import type { Locale } from '@/lib/i18n/config'

export function formatPrice(
  amount: number,
  locale: Locale,
  currencyCode: 'EGP' | 'USD' = 'EGP',
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount)
}
