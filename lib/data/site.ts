import type { Locale } from '@/lib/i18n/config'

/**
 * Central content configuration.
 * All values here are PLACEHOLDERS and are intended to be replaced with the
 * client's real, verified information. Nothing here should be presented as a
 * factual medical or business claim.
 */

type Localized = Record<Locale, string>

export interface ServiceItem {
  id: string
  icon: string // lucide-react icon key, mapped in the UI
  name: Localized
  description: Localized
  durationMinutes: number
  startingPrice: number // in the display currency below
}

export interface StatItem {
  id: string
  value: string // placeholder — easy to replace
  label: Localized
}

export interface Testimonial {
  id: string
  initials: string
  name: Localized
  country: Localized
  quote: Localized
  rating: number
  source?: Localized
}

export interface ConsultationType {
  id: string
  name: Localized
  description: Localized
  durationMinutes: number
  price: number
}

export const currency = {
  code: 'USD',
  symbol: '$',
} as const

export const stats: StatItem[] = [
  {
    id: 'experience',
    value: '10+',
    label: { en: 'Years of Experience', ar: 'سنوات من الخبرة' },
  },
  {
    id: 'patients',
    value: '2,000+',
    label: { en: 'Happy Patients', ar: 'مريضة سعيدة' },
  },
  {
    id: 'consultations',
    value: '5,000+',
    label: { en: 'Consultations', ar: 'استشارة' },
  },
  {
    id: 'stories',
    value: '98%',
    label: { en: 'Satisfaction', ar: 'نسبة الرضا' },
  },
]

export const services: ServiceItem[] = [
  {
    id: 'general',
    icon: 'stethoscope',
    name: { en: 'General Consultation', ar: 'استشارة عامة' },
    description: {
      en: 'A comprehensive discussion of your health concerns with personalized guidance.',
      ar: 'مناقشة شاملة لمخاوفك الصحية مع إرشاد شخصي مخصّص.',
    },
    durationMinutes: 30,
    startingPrice: 60,
  },
  {
    id: 'followup',
    icon: 'clock',
    name: { en: 'Follow-up Consultation', ar: 'استشارة متابعة' },
    description: {
      en: 'A focused session to review progress and adjust your care plan.',
      ar: 'جلسة مركّزة لمراجعة التقدّم وتعديل خطة الرعاية.',
    },
    durationMinutes: 15,
    startingPrice: 35,
  },
  {
    id: 'wellness',
    icon: 'heart',
    name: { en: 'Wellness & Prevention', ar: 'العافية والوقاية' },
    description: {
      en: 'Preventive guidance and lifestyle advice tailored to your wellbeing.',
      ar: 'إرشاد وقائي ونصائح لنمط الحياة مصمّمة لأجل صحتك.',
    },
    durationMinutes: 30,
    startingPrice: 60,
  },
  {
    id: 'second-opinion',
    icon: 'file-text',
    name: { en: 'Second Opinion', ar: 'رأي طبي ثانٍ' },
    description: {
      en: 'A thoughtful review of an existing diagnosis or treatment plan.',
      ar: 'مراجعة متأنية لتشخيص قائم أو خطة علاج.',
    },
    durationMinutes: 30,
    startingPrice: 75,
  },
  {
    id: 'nutrition',
    icon: 'leaf',
    name: { en: 'Nutrition Guidance', ar: 'إرشاد غذائي' },
    description: {
      en: 'Personalized nutrition support to help you feel your best.',
      ar: 'دعم غذائي شخصي يساعدك على الشعور بأفضل حالاتك.',
    },
    durationMinutes: 30,
    startingPrice: 55,
  },
  {
    id: 'online',
    icon: 'video',
    name: { en: 'Online Consultation', ar: 'استشارة أونلاين' },
    description: {
      en: 'A secure video consultation from the comfort of your home.',
      ar: 'استشارة فيديو آمنة من راحة منزلك.',
    },
    durationMinutes: 30,
    startingPrice: 60,
  },
]

export const consultationTypes: ConsultationType[] = [
  {
    id: 'consult-30',
    name: { en: '30-Minute Consultation', ar: 'استشارة 30 دقيقة' },
    description: {
      en: 'A comprehensive session to discuss your medical concerns, review your health history, and receive guidance.',
      ar: 'جلسة استشارية متكاملة لمناقشة مخاوفك الصحية، مراجعة تاريخك الطبي، والحصول على التوجيه اللازم.',
    },
    durationMinutes: 30,
    price: 60,
  },
  {
    id: 'consult-60',
    name: { en: '60-Minute Deep-Dive Consultation', ar: 'استشارة تفصيلية 60 دقيقة' },
    description: {
      en: 'An extended, in-depth consultation giving ample time to explore complex health concerns and questions thoroughly.',
      ar: 'جلسة موسّعة ومُفصّلة توفّر وقتاً كافياً لبحث واستكشاف مختلف المخاوف والاستفسارات الصحية بشكل شامل.',
    },
    durationMinutes: 60,
    price: 110,
  },
]

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    initials: 'ر.ع',
    name: { en: 'Verified Patient', ar: 'مريضة استشارة أونلاين' },
    country: { en: 'Online Consultation', ar: 'استشارة أونلاين' },
    quote: {
      en: 'I really loved the consultation; Dr. Dalia listens to all concerns patiently and explains everything in thorough detail.',
      ar: 'عجبتنى اوى والدكتور بتسمع كل المشاكل وبتشرح باستفاضة واهتمام كبير.',
    },
    rating: 5,
    source: { en: 'Feedback Form', ar: 'استمارة تقييم معتمدة' },
  },
  {
    id: 't2',
    initials: 'س.م',
    name: { en: 'Verified Patient', ar: 'مريضة استشارة أونلاين' },
    country: { en: 'Online Consultation', ar: 'استشارة أونلاين' },
    quote: {
      en: 'Really wonderful! I felt so comfortable, learned so much, and truly benefited from the session, elhamdulillah ❤️🙏',
      ar: 'حلو أوي أوي اتبسطت واستفدت وكنت مرتاحة كدة الحمد لله ❤️🙏',
    },
    rating: 5,
    source: { en: 'Feedback Form', ar: 'استمارة تقييم معتمدة' },
  },
  {
    id: 't3',
    initials: 'ن.ق',
    name: { en: 'Verified Patient', ar: 'مريضة استشارة أونلاين' },
    country: { en: 'Online Consultation', ar: 'استشارة أونلاين' },
    quote: {
      en: 'Everything went so smoothly. Honestly, Dr. Dalia is exceptional and listens very attentively.',
      ar: 'لا تمام جداً حقيقي الدكتورة شاطرة جداً وبتسمعني كويس جداً.',
    },
    rating: 5,
    source: { en: 'Feedback Form', ar: 'استمارة تقييم معتمدة' },
  },
  {
    id: 't4',
    initials: 'أ.هـ',
    name: { en: 'Verified Patient', ar: 'مريضة استشارة أونلاين' },
    country: { en: 'Online Consultation', ar: 'استشارة أونلاين' },
    quote: {
      en: 'More than perfect! The consultation was calm, clear, and reassuring from start to finish.',
      ar: 'أكثر من رائعة (More than perfect)! كانت الاستشارة مريحة وهادئة وواضحة جداً.',
    },
    rating: 5,
    source: { en: 'Feedback Form', ar: 'استمارة تقييم معتمدة' },
  },
  {
    id: 't5',
    initials: 'م.ك',
    name: { en: 'Verified Patient', ar: 'مريضة استشارة أونلاين' },
    country: { en: 'Online Consultation', ar: 'استشارة أونلاين' },
    quote: {
      en: 'Extremely satisfied! I felt genuinely heard and guided with so much clarity and warmth.',
      ar: 'راضية للغاية (Extremely satisfied)، دكتورة متميزة ومستمعة رائعة تهتم بأدق التفاصيل.',
    },
    rating: 5,
    source: { en: 'Feedback Form', ar: 'استمارة تقييم معتمدة' },
  },
  {
    id: 't6',
    initials: 'د.ي',
    name: { en: 'Verified Patient', ar: 'مريضة استشارة أونلاين' },
    country: { en: 'Online Consultation', ar: 'استشارة أونلاين' },
    quote: {
      en: '100% satisfied! Feeling genuinely heard and guided with so much warmth and expertise.',
      ar: 'رضا تام بنسبة 100% (100% satisfied)! تجربة أونلاين سلسة ومطمئنة بكل المقاييس.',
    },
    rating: 5,
    source: { en: 'Feedback Form', ar: 'استمارة تقييم معتمدة' },
  },
]

export function localizedField(field: Localized, locale: Locale): string {
  return field[locale] ?? field.en
}
