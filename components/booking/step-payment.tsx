'use client'

import * as React from 'react'
import { Lock, Info, CreditCard } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import type { ConsultationType } from '@/lib/data/site'
import { localizedField } from '@/lib/data/site'
import { formatFullDate, formatSlotLabel } from '@/lib/data/availability'
import { formatPrice } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface StepPaymentProps {
  locale: Locale
  dict: Dictionary
  consultation: ConsultationType | null
  date: string | null
  time: string | null
  isSubmitting: boolean
  onSubmitPayment: () => void
}

export function StepPayment({
  locale,
  dict,
  consultation,
  date,
  time,
  isSubmitting,
  onSubmitPayment,
}: StepPaymentProps) {
  const d = dict.booking.payment

  const [cardName, setCardName] = React.useState('John Doe')
  const [cardNumber, setCardNumber] = React.useState('4242 •••• •••• 4242')
  const [expiry, setExpiry] = React.useState('12/28')
  const [cvc, setCvc] = React.useState('123')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitPayment()
  }

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

      {/* Demo notice banner */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-accent/40 p-4 text-xs leading-relaxed text-foreground/80">
        <Info className="size-4 shrink-0 text-primary mt-0.5" />
        <span>{d.demoNotice}</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-7">
          <div>
            <Label htmlFor="cardName">{d.cardName}</Label>
            <Input
              id="cardName"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">{d.cardNumber}</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={isSubmitting}
              />
              <CreditCard className="absolute inset-e-4 top-3.5 size-5 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">{d.expiry}</Label>
              <Input
                id="expiry"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="cvc">{d.cvc}</Label>
              <Input
                id="cvc"
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-13 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {d.processing}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="size-4" />
                  {d.pay} ({consultation ? formatPrice(consultation.price, locale) : ''})
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-primary" />
            <span>{d.secure}</span>
          </div>
        </form>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-serif text-lg font-semibold text-foreground border-b border-border pb-4">
              {d.summary}
            </h3>

            <dl className="mt-4 space-y-3.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{dict.booking.review.consultation}</dt>
                <dd className="font-semibold text-foreground">
                  {consultation ? localizedField(consultation.name, locale) : '—'}
                </dd>
              </div>

              {date && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{dict.booking.review.date}</dt>
                  <dd className="font-medium text-foreground">{formatFullDate(date, locale)}</dd>
                </div>
              )}

              {time && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{dict.booking.review.time}</dt>
                  <dd className="font-medium text-foreground">{formatSlotLabel(time, locale)}</dd>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-4 text-base font-semibold">
                <dt className="text-foreground">{d.total}</dt>
                <dd className="font-serif text-2xl font-semibold text-primary">
                  {consultation ? formatPrice(consultation.price, locale) : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
