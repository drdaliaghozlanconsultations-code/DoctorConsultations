'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Mail,
  MessageSquare,
  Info,
  Loader2,
  Video,
  ExternalLink,
} from 'lucide-react'
import { formatFullDate, formatSlotLabel } from '@/lib/data/availability'
import { CtaLink } from '@/components/cta-link'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'

interface BookingData {
  reference: string
  consultationTitle: { en: string; ar: string }
  date: string
  time: string
  patientName: string
  email: string
  whatsapp: string
  status: string
  paymentStatus: string
  paymentMethod: string
  currency: string
  amount: number
  googleMeetLink?: string
}

export function ConfirmationClient({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const urlStatus = searchParams.get('status') // success | failed | pending

  const [booking, setBooking] = React.useState<BookingData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const isArabic = locale === 'ar'
  const d = dict.booking.confirmation

  // Fetch booking data
  React.useEffect(() => {
    if (!ref) {
      setError(isArabic ? 'رقم الحجز غير موجود' : 'Booking reference not found')
      setLoading(false)
      return
    }

    fetch(`/api/bookings/lookup?ref=${encodeURIComponent(ref)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setBooking(data.data)
        } else {
          setError(data.error || (isArabic ? 'لم يتم العثور على الحجز' : 'Booking not found'))
        }
      })
      .catch(() => {
        setError(isArabic ? 'حدث خطأ أثناء تحميل بيانات الحجز' : 'Error loading booking data')
      })
      .finally(() => setLoading(false))
  }, [ref, isArabic])

  // Poll for status update if still pending (callback may arrive after redirect)
  React.useEffect(() => {
    if (!ref || !booking || booking.paymentStatus !== 'awaiting_payment') return

    const interval = setInterval(() => {
      fetch(`/api/bookings/lookup?ref=${encodeURIComponent(ref)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.paymentStatus !== 'awaiting_payment') {
            setBooking(data.data)
            clearInterval(interval)
          }
        })
        .catch(() => { })
    }, 3000) // poll every 3 seconds

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => clearInterval(interval), 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [ref, booking])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            {isArabic ? 'جارٍ تحميل بيانات الحجز...' : 'Loading booking details...'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <XCircle className="mx-auto size-16 text-destructive" />
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          {isArabic ? 'لم يتم العثور على الحجز' : 'Booking Not Found'}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-8">
          <CtaLink href={`/${locale}/booking`}>
            {isArabic ? 'حجز استشارة جديدة' : 'Book a Consultation'}
          </CtaLink>
        </div>
      </div>
    )
  }

  // Determine the effective status
  const paymentSuccess = booking.paymentStatus === 'verified' || urlStatus === 'success'
  const paymentFailed = booking.paymentStatus === 'rejected' || booking.paymentStatus === 'failed' || urlStatus === 'failed'
  const paymentPending = !paymentSuccess && !paymentFailed

  const consultationName = isArabic
    ? booking.consultationTitle.ar
    : booking.consultationTitle.en

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-center sm:px-6">
      {/* Status Icon */}
      {paymentSuccess ? (
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 animate-fade-in border border-emerald-500/20 shadow-inner">
          <CheckCircle2 className="size-10" />
        </div>
      ) : paymentFailed ? (
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-destructive/10 text-destructive animate-fade-in border border-destructive/20 shadow-inner">
          <XCircle className="size-10" />
        </div>
      ) : (
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-amber-500/10 text-amber-600 animate-fade-in border border-amber-500/20 shadow-inner">
          <Clock className="size-10" />
        </div>
      )}

      {/* Status Badge */}
      <div
        className={`mt-4 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold border ${paymentSuccess
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : paymentFailed
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
          }`}
      >
        <span
          className={`size-2 rounded-full ${paymentSuccess ? 'bg-emerald-500' : paymentFailed ? 'bg-destructive animate-pulse' : 'bg-amber-500 animate-pulse'
            }`}
        />
        <span>
          {paymentSuccess
            ? (isArabic ? 'تم الدفع والتأكيد بنجاح' : 'Payment Confirmed')
            : paymentFailed
              ? (isArabic ? 'فشل الدفع' : 'Payment Failed')
              : (isArabic ? 'جارٍ التحقق من الدفع...' : 'Verifying Payment...')}
        </span>
      </div>

      {/* Title */}
      <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        {paymentSuccess
          ? d.title
          : paymentFailed
            ? (isArabic ? 'تعذر إتمام الدفع' : 'Payment Could Not Be Completed')
            : (isArabic ? 'جارٍ التحقق من حالة الدفع' : 'Verifying Payment Status')}
      </h2>

      <p className="mt-2.5 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
        {paymentSuccess
          ? (isArabic
            ? 'تم استلام الدفع بنجاح. ستصلك رسالة تأكيد عبر البريد الإلكتروني قريباً مع تفاصيل الاستشارة.'
            : 'Your payment has been received successfully. You will receive a confirmation email shortly with your consultation details.')
          : paymentFailed
            ? (isArabic
              ? 'لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى أو اختيار طريقة دفع أخرى.'
              : 'No charge was made. You can try again or choose a different payment method.')
            : (isArabic
              ? 'يتم الآن التحقق من عملية الدفع. يرجى الانتظار قليلاً...'
              : 'Your payment is being verified. Please wait a moment...')}
      </p>

      {/* Reference Badge */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-accent/50 px-5 py-2.5 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {d.reference}:
        </span>
        <span className="font-mono text-base font-bold text-primary">
          {booking.reference}
        </span>
      </div>

      {/* Payment Success: Appointment Details */}
      {paymentSuccess && (
        <>
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-start shadow-sm sm:p-8">
            <h3 className="font-serif text-xl font-semibold text-foreground border-b border-border pb-4">
              {isArabic ? 'تفاصيل الموعد' : 'Appointment Details'}
            </h3>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <dt className="text-xs text-muted-foreground">{d.date}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">
                    {booking.date ? formatFullDate(booking.date, locale) : '—'}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <dt className="text-xs text-muted-foreground">{d.time}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">
                    {booking.time ? formatSlotLabel(booking.time, locale) : '—'}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <dt className="text-xs text-muted-foreground">{d.email}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">
                    {booking.email || '—'}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <dt className="text-xs text-muted-foreground">WhatsApp</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">
                    {booking.whatsapp || '—'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Google Meet Video Session Link */}
          {/* {booking.googleMeetLink && (
            <div className="mt-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-start shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 shrink-0">
                  <Video className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {isArabic ? 'رابط استشارة الفيديو (Google Meet)' : 'Google Meet Video Consultation'}
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground break-all">
                    {booking.googleMeetLink}
                  </p>
                </div>
              </div>
              <a
                href={booking.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition shrink-0"
              >
                <span>{isArabic ? 'الانضمام للاستشارة' : 'Join Session'}</span>
                <ExternalLink className="size-4" />
              </a>
            </div>
          )} */}

          {/* Next Steps */}
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-start shadow-sm sm:p-8">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              {d.nextStepsTitle}
            </h3>
            <ol className="mt-4 space-y-3.5">
              {(isArabic
                ? [
                  'تم تأكيد الدفع وحجز الموعد بنجاح.',
                  'ستصلك رسالة تأكيد عبر البريد الإلكتروني تتضمن تفاصيل الموعد.',
                  'سيتم إرسال رابط الاستشارة الأونلاين قبل الموعد المحدد.',
                ]
                : [
                  'Your payment has been confirmed and your appointment is booked.',
                  'You will receive a confirmation email with your appointment details.',
                  'A secure video consultation link will be sent to your email prior to your session.',
                ]
              ).map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="mt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {/* Payment Failed: Retry options */}
      {paymentFailed && (
        <div className="mt-8 rounded-3xl border border-destructive/30 bg-destructive/5 p-5 text-start flex items-start gap-3.5">
          <Info className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/90 space-y-1">
            <p className="font-bold text-foreground">
              {isArabic ? 'لم يتم إتمام عملية الدفع' : 'Payment Not Completed'}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {isArabic
                ? 'لم يتم خصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى بحجز استشارة جديدة.'
                : 'No charge was made to your account. You can try again by booking a new consultation.'}
            </p>
          </div>
        </div>
      )}

      {/* Pending: Waiting notice */}
      {paymentPending && (
        <div className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 text-start flex items-start gap-3.5">
          <div className="size-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/90 space-y-1">
            <p className="font-bold text-foreground">
              {isArabic ? 'جارٍ التحقق من عملية الدفع' : 'Verifying Your Payment'}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {isArabic
                ? 'يتم الآن التحقق من حالة الدفع. ستتحدث هذه الصفحة تلقائياً خلال لحظات.'
                : 'Your payment status is being verified. This page will update automatically in a moment.'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <CtaLink href={`/${locale}`}>
          {d.backHome}
        </CtaLink>
        <Link
          href={`/${locale}/booking`}
          className="inline-flex h-13 items-center justify-center rounded-full border border-primary/30 bg-card px-7 text-base font-medium text-primary hover:bg-accent/60"
        >
          {d.bookAnother}
        </Link>
      </div>
    </div>
  )
}
