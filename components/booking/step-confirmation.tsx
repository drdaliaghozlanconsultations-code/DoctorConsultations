'use client'

import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  Calendar,
  Mail,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Hourglass,
  Info,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import type { ConsultationType } from '@/lib/data/site'
import { localizedField } from '@/lib/data/site'
import { formatFullDate, formatSlotLabel } from '@/lib/data/availability'
import { CtaLink } from '@/components/cta-link'
import type { PatientDetails } from './step-details'

interface StepConfirmationProps {
  locale: Locale
  dict: Dictionary
  reference: string
  consultation: ConsultationType | null
  date: string | null
  time: string | null
  details: PatientDetails
  onReset: () => void
}

export function StepConfirmation({
  locale,
  dict,
  reference,
  consultation,
  date,
  time,
  details,
  onReset,
}: StepConfirmationProps) {
  const d = dict.booking.confirmation
  const isArabic = locale === 'ar'

  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* Animated Status Icon */}
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-amber-500/10 text-amber-600 animate-fade-in border border-amber-500/20 shadow-inner">
        <Clock className="size-10" />
      </div>

      {/* Status Badge */}
      <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
        <span>{d.pendingBadge || (isArabic ? 'الحجز قيد المراجعة والتحقق' : 'Pending Staff Verification')}</span>
      </div>

      <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        {d.title}
      </h2>
      <p className="mt-2.5 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
        {d.subtitle}
      </p>

      {/* Reference Badge */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-accent/50 px-5 py-2.5 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {d.reference}:
        </span>
        <span className="font-mono text-base font-bold text-primary">
          {reference}
        </span>
      </div>

      {/* Staff Review Notice Box */}
      <div className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 text-start flex items-start gap-3.5">
        <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/90 space-y-1">
          <p className="font-bold text-foreground">
            {isArabic ? 'تأكيد الموعد عبر إنستاباي' : 'InstaPay Verification Notice'}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {d.pendingNotice ||
              (isArabic
                ? 'يقوم فريق العمل بمراجعة إيصال التحويل وسيتم إرسال بريد إلكتروني لتأكيد موعدك خلال ساعتين.'
                : 'Our staff will review your InstaPay transfer receipt and send a confirmation email with your appointment details within a couple of hours.')}
          </p>
        </div>
      </div>

      {/* Booking Summary Box */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-start shadow-sm sm:p-8">
        <h3 className="font-serif text-xl font-semibold text-foreground border-b border-border pb-4">
          {isArabic ? 'تفاصيل الموعد المطلوب' : 'Appointment Details'}
        </h3>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Calendar className="size-5 shrink-0 text-primary mt-0.5" />
            <div>
              <dt className="text-xs text-muted-foreground">{d.date}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {date ? formatFullDate(date, locale) : '—'}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="size-5 shrink-0 text-primary mt-0.5" />
            <div>
              <dt className="text-xs text-muted-foreground">{d.time}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {time ? formatSlotLabel(time, locale) : '—'}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="size-5 shrink-0 text-primary mt-0.5" />
            <div>
              <dt className="text-xs text-muted-foreground">{d.email}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {details.email || '—'}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare className="size-5 shrink-0 text-primary mt-0.5" />
            <div>
              <dt className="text-xs text-muted-foreground">WhatsApp</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {details.whatsapp || '—'}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      {/* Next Steps List */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-start shadow-sm sm:p-8">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          {d.nextStepsTitle}
        </h3>
        <ol className="mt-4 space-y-3.5">
          {d.nextSteps.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="mt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <CtaLink href={`/${locale}`}>
          {d.backHome}
        </CtaLink>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-13 items-center justify-center rounded-full border border-primary/30 bg-card px-7 text-base font-medium text-primary hover:bg-accent/60"
        >
          {d.bookAnother}
        </button>
      </div>
    </div>
  )
}
