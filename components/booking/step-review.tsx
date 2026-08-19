'use client'

import Link from 'next/link'
import { Edit2, ShieldAlert } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import type { ConsultationType } from '@/lib/data/site'
import { localizedField } from '@/lib/data/site'
import { formatFullDate, formatSlotLabel } from '@/lib/data/availability'
import { countryName } from '@/lib/data/countries'
import { formatPrice } from '@/lib/format'
import type { PatientDetails } from './step-details'

interface StepReviewProps {
  locale: Locale
  dict: Dictionary
  consultation: (ConsultationType & { priceEGP?: number; priceUSD?: number }) | null
  date: string | null
  time: string | null
  currency: 'EGP' | 'USD'
  details: PatientDetails
  onJumpToStep: (step: number) => void
}

export function StepReview({
  locale,
  dict,
  consultation,
  date,
  time,
  currency = 'EGP',
  details,
  onJumpToStep,
}: StepReviewProps) {
  const d = dict.booking.review

  const priceValue =
    consultation
      ? currency === 'USD' && consultation.priceUSD !== undefined
        ? consultation.priceUSD
        : currency === 'EGP' && consultation.priceEGP !== undefined
        ? consultation.priceEGP
        : consultation.price
      : 0

  return (
    <div>
      <div className="text-center sm:text-start">
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          {d.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {d.subtitle}
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Consultation Section */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              {d.consultation}
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <Edit2 className="size-3.5" />
              <span>{d.editConsultation}</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-serif text-xl font-medium text-foreground">
                {consultation ? localizedField(consultation.name, locale) : '—'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {consultation ? `${consultation.durationMinutes} ${dict.common.minutes}` : '—'}
              </p>
            </div>
            <span className="font-serif text-2xl font-semibold text-foreground">
              {consultation ? formatPrice(priceValue, locale, currency) : '—'}
            </span>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              {d.date} & {d.time}
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <Edit2 className="size-3.5" />
              <span>{d.editSchedule}</span>
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs text-muted-foreground">{d.date}</span>
              <span className="mt-1 block text-base font-medium text-foreground">
                {date ? formatFullDate(date, locale) : '—'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">{d.time}</span>
              <span className="mt-1 block text-base font-medium text-foreground">
                {time ? formatSlotLabel(time, locale) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Details Section */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              {d.patient}
            </h3>
            <button
              type="button"
              onClick={() => onJumpToStep(3)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <Edit2 className="size-3.5" />
              <span>{d.editDetails}</span>
            </button>
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{dict.booking.details.fullName}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{details.fullName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{d.email}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{details.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{d.phone}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{details.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{d.whatsapp}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{details.whatsapp || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{d.country}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {details.country ? countryName(details.country, locale) : '—'}
              </dd>
            </div>
            {details.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">{d.notes}</dt>
                <dd className="mt-1 text-sm text-foreground">{details.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Policy reminder box */}
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-accent/40 p-4 text-xs leading-relaxed text-foreground/80">
          <ShieldAlert className="size-4 shrink-0 text-primary mt-0.5" />
          <div>
            <span>{d.policyReminder}</span>{' '}
            <Link
              href={`/${locale}/policies/cancellation-refund`}
              target="_blank"
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {d.viewPolicy}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
