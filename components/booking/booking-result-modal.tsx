'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Video,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { formatFullDate, formatSlotLabel } from '@/lib/data/availability'

export interface BookingModalData {
  reference: string
  consultationTitle?: { en: string; ar: string }
  date?: string
  time?: string
  patientName?: string
  email?: string
  googleMeetLink?: string
  paymentStatus?: string
  status?: string
}

interface BookingResultModalProps {
  isOpen: boolean
  onClose: () => void
  status: 'success' | 'failed'
  bookingData: BookingModalData | null
  locale: Locale
  dict: Dictionary
  onRetry?: () => void
}

export function BookingResultModal({
  isOpen,
  onClose,
  status,
  bookingData,
  locale,
  dict,
  onRetry,
}: BookingResultModalProps) {
  const [copied, setCopied] = React.useState(false)
  const isArabic = locale === 'ar'

  if (!isOpen) return null

  const isSuccess = status === 'success'
  const consultationTitle = bookingData?.consultationTitle
    ? isArabic
      ? bookingData.consultationTitle.ar
      : bookingData.consultationTitle.en
    : null

  const handleCopy = () => {
    if (!bookingData?.reference) return
    navigator.clipboard.writeText(bookingData.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95 fade-in duration-300 sm:p-8">
        {/* Glow Header Accent */}
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 size-36 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isSuccess ? 'bg-emerald-500' : 'bg-destructive'
          }`}
        />

        {/* Icon & Status */}
        <div className="text-center">
          {isSuccess ? (
            <div className="relative mx-auto inline-flex">
              <div className="grid size-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="size-10 stroke-[2.2]" />
              </div>
              <span className="absolute -top-1 -right-1 flex size-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-5 bg-emerald-500 text-white items-center justify-center">
                  <Sparkles className="size-3" />
                </span>
              </span>
            </div>
          ) : (
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 shadow-inner">
              <XCircle className="size-10 stroke-[2.2]" />
            </div>
          )}

          {/* Badge */}
          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border ${
                isSuccess
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                  : 'bg-destructive/10 text-destructive border-destructive/25'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isSuccess ? 'bg-emerald-500' : 'bg-destructive animate-pulse'
                }`}
              />
              {isSuccess
                ? isArabic
                  ? 'تم تأكيد الحجز بنجاح'
                  : 'Booking Confirmed'
                : isArabic
                ? 'تعذر إتمام الدفع'
                : 'Payment Incomplete'}
            </span>
          </div>

          {/* Heading */}
          <h3 className="mt-3 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            {isSuccess
              ? isArabic
                ? 'شكراً لك، تم استلام حجزك!'
                : 'Thank You! Your Booking Is Confirmed'
              : isArabic
              ? 'لم تكتمل عملية الدفع'
              : 'Payment Could Not Be Processed'}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {isSuccess
              ? isArabic
                ? 'تم حجز موعد استشارتك مع د. داليا غزلان بنجاح. تم إرسال كافة التفاصيل ورابط الاجتماع إلى بريدك الإلكتروني.'
                : 'Your consultation with Dr. Dalia Ghozlan is confirmed. Details and meeting links have been sent to your email.'
              : isArabic
              ? 'لم يتم خصم أي مبالغ من بطاقتك. يمكنك إعادة المحاولة أو اختيار طريقة دفع أخرى مثل إنستاباي.'
              : 'No charges were made to your account. You can retry card payment or switch to InstaPay.'}
          </p>

          {/* Reference Badge */}
          {bookingData?.reference && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-accent/60 px-4 py-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                {isArabic ? 'رقم الحجز' : 'Ref'}:
              </span>
              <span className="font-mono font-bold text-primary text-sm">
                {bookingData.reference}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title={isArabic ? 'نسخ رقم الحجز' : 'Copy reference'}
                className="ms-1 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Appointment Summary Box (if success) */}
        {isSuccess && bookingData && (
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 text-start space-y-3.5 text-xs sm:text-sm">
            {consultationTitle && (
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">
                  {isArabic ? 'نوع الاستشارة' : 'Consultation'}
                </span>
                <span className="font-semibold text-foreground text-end">
                  {consultationTitle}
                </span>
              </div>
            )}

            {bookingData.date && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5 text-primary" />
                  {isArabic ? 'التاريخ' : 'Date'}
                </span>
                <span className="font-semibold text-foreground">
                  {formatFullDate(bookingData.date, locale)}
                </span>
              </div>
            )}

            {bookingData.time && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5 text-primary" />
                  {isArabic ? 'الوقت' : 'Time'}
                </span>
                <span className="font-semibold text-foreground">
                  {formatSlotLabel(bookingData.time, locale)}
                </span>
              </div>
            )}

            {bookingData.googleMeetLink && (
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Video className="size-3.5 text-primary" />
                    Google Meet
                  </span>
                  <a
                    href={bookingData.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>{isArabic ? 'رابط المقابلة' : 'Join Link'}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          {isSuccess ? (
            <>
              {bookingData?.reference && (
                <Link
                  href={`/${locale}/booking/confirmation?ref=${encodeURIComponent(
                    bookingData.reference,
                  )}&status=success`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <span>{isArabic ? 'عرض صفحة التأكيد كاملة' : 'View Full Details'}</span>
                  <ArrowRight
                    className={`size-3.5 ms-1.5 ${isArabic ? 'rotate-180' : ''}`}
                  />
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                {isArabic ? 'حسناً، تم' : 'Done'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {isArabic ? 'إعادة محاولة الدفع' : 'Retry Payment'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
