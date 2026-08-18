import type { Locale } from '@/lib/i18n/config'

export interface Country {
  code: string
  name: Record<Locale, string>
}

// A concise list; Egypt first, then common markets, then a generic "Other".
export const countries: Country[] = [
  { code: 'EG', name: { en: 'Egypt', ar: 'مصر' } },
  { code: 'SA', name: { en: 'Saudi Arabia', ar: 'السعودية' } },
  { code: 'AE', name: { en: 'United Arab Emirates', ar: 'الإمارات' } },
  { code: 'KW', name: { en: 'Kuwait', ar: 'الكويت' } },
  { code: 'QA', name: { en: 'Qatar', ar: 'قطر' } },
  { code: 'BH', name: { en: 'Bahrain', ar: 'البحرين' } },
  { code: 'OM', name: { en: 'Oman', ar: 'عُمان' } },
  { code: 'JO', name: { en: 'Jordan', ar: 'الأردن' } },
  { code: 'LB', name: { en: 'Lebanon', ar: 'لبنان' } },
  { code: 'US', name: { en: 'United States', ar: 'الولايات المتحدة' } },
  { code: 'GB', name: { en: 'United Kingdom', ar: 'المملكة المتحدة' } },
  { code: 'CA', name: { en: 'Canada', ar: 'كندا' } },
  { code: 'DE', name: { en: 'Germany', ar: 'ألمانيا' } },
  { code: 'FR', name: { en: 'France', ar: 'فرنسا' } },
  { code: 'OTHER', name: { en: 'Other', ar: 'أخرى' } },
]

export function countryName(code: string, locale: Locale): string {
  const c = countries.find((x) => x.code === code)
  return c ? c.name[locale] : code
}
