'use client'

import Link from 'next/link'
import { CheckCircle2, Calendar, Clock, Mail, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react'
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

  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* Animated Checkmark */}
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-primary animate-fade-in">
        <CheckCircle2 className="size-12" />
      </div>

      <h2 className="mt-6 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        {d.title}
      </h2>
      <p className="mt-3 text-base text-muted-foreground">
        {d.subtitle}
      </p>

      {/* Reference Badge */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-accent/50 px-5 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {d.reference}:
        </span>
        <span className="font-mono text-base font-bold text-primary">
          {reference}
        </span>
      </div>

      {/* Booking Summary Box */}
      <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-start shadow-sm sm:p-8">
        <h3 className="font-serif text-xl font-semibold text-foreground border-b border-border pb-4">
          Appointment Details
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
        <ol className="mt-4 space-y-3">
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
