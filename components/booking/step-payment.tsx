'use client'

import * as React from 'react'
import {
  Lock,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Loader2,
  Info,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import type { ConsultationType } from '@/lib/data/site'
import { localizedField } from '@/lib/data/site'
import { formatFullDate, formatSlotLabel } from '@/lib/data/availability'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'

interface StepPaymentProps {
  locale: Locale
  dict: Dictionary
  consultation: (ConsultationType & { priceEGP?: number; priceUSD?: number }) | null
  date: string | null
  time: string | null
  currency: 'EGP' | 'USD'
  isSubmitting: boolean
  onSubmitPayment: (paymentData: {
    receiptUrl?: string
    receiptPublicId?: string
    paymentMethod: 'instapay' | 'card'
  }) => void
}

export function StepPayment({
  locale,
  dict,
  consultation,
  date,
  time,
  currency = 'EGP',
  isSubmitting,
  onSubmitPayment,
}: StepPaymentProps) {
  const d = dict.booking.payment
  const isArabic = locale === 'ar'

  // Payment method state (default based on currency, but allows switching)
  const [paymentMethod, setPaymentMethod] = React.useState<'instapay' | 'card'>(
    currency === 'USD' ? 'card' : 'instapay',
  )

  React.useEffect(() => {
    if (currency === 'USD') {
      setPaymentMethod('card')
    }
  }, [currency])

  const [receiptFile, setReceiptFile] = React.useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadedData, setUploadedData] = React.useState<{
    url: string
    publicId: string
  } | null>(null)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [cardError, setCardError] = React.useState<string | null>(null)

  // Determine display price
  const displayPrice = React.useMemo(() => {
    if (!consultation) return '—'
    if (currency === 'EGP' && consultation.priceEGP) {
      return `${consultation.priceEGP.toLocaleString()} EGP`
    }
    if (currency === 'USD' && consultation.priceUSD) {
      return `$${consultation.priceUSD} USD`
    }
    return formatPrice(consultation.price, locale)
  }, [consultation, currency, locale])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setUploadError(data.error || (isArabic ? 'فشل رفع الإيصال' : 'Failed to upload receipt'))
        setUploading(false)
        return
      }

      setUploadedData({
        url: data.url,
        publicId: data.publicId,
      })
    } catch (err: any) {
      setUploadError(isArabic ? 'حدث خطأ أثناء رفع الصورة' : 'Error uploading receipt')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === 'instapay' && !uploadedData?.url) {
      setUploadError(
        isArabic
          ? 'يرجى رفع إيصال تحويل إنستاباي لتأكيد الحجز'
          : 'Please upload your InstaPay transfer receipt before confirming.',
      )
      return
    }

    if (paymentMethod === 'card') {
      // Card payment is handled via redirect, so call onSubmitPayment
      // which will trigger the Kashier flow in booking-flow.tsx
      onSubmitPayment({ paymentMethod: 'card' })
      return
    }

    onSubmitPayment({
      receiptUrl: uploadedData?.url,
      receiptPublicId: uploadedData?.publicId,
      paymentMethod,
    })
  }

  return (
    <div>
      <div className="text-center sm:text-start">
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          {d.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {paymentMethod === 'instapay'
            ? (isArabic
              ? 'يرجى إتمام التحويل عبر إنستاباي ورفع صورة الإيصال ليقوم فريق العمل بمراجعة موعدك وتأكيده عبر البريد الإلكتروني.'
              : 'Please complete the transfer via InstaPay and upload the receipt. Our staff will review it and send a confirmation email.')
            : (isArabic
              ? 'سيتم تحويلك إلى صفحة الدفع الآمنة لإتمام العملية ببطاقتك البنكية.'
              : 'You will be redirected to a secure payment page to complete the transaction with your card.')}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {isArabic ? 'طريقة الدفع' : 'Payment Method'}
            </label>
            <div className={`grid gap-3 ${currency === 'EGP' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {/* InstaPay (only available for EGP) */}
              {currency === 'EGP' && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setPaymentMethod('instapay')}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPaymentMethod('instapay')}
                  className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'instapay'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                    : 'border-border bg-card hover:border-primary/40'
                    }`}
                >
                  <div className={`size-9 rounded-xl flex items-center justify-center font-bold text-xs ${paymentMethod === 'instapay' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                    IP
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {isArabic ? 'إنستاباي (InstaPay)' : 'InstaPay Transfer'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isArabic ? 'التحويل المباشر في مصر' : 'Direct Instant Transfer'}
                    </p>
                  </div>
                </div>
              )}

              {/* Card / Apple Pay (Available for both EGP & USD via Kashier) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setPaymentMethod('card')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPaymentMethod('card')}
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'card'
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border bg-card hover:border-primary/40'
                  }`}
              >
                <div className={`size-9 rounded-xl flex items-center justify-center ${paymentMethod === 'card' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                  <CreditCard className="size-5" />
                </div>
                <div>

                  <p className="text-sm font-bold text-foreground">
                    {isArabic ? 'بطاقة بنكية / Apple Pay' : 'Credit / Debit Card / Apple Pay'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isArabic ? 'Visa, Mastercard, Apple Pay عبر كاشير (Kashier)' : 'Visa, Mastercard, Apple Pay via Kashier'}
                  </p>
                </div>
              </div>
            </div>

            {/* USD Currency Exchange Notice */}
            {/* {currency === 'USD' && (
              <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-100/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="font-semibold text-xs text-amber-950 dark:text-amber-600">
                    {isArabic ? 'تنويه بشأن العملة وسعر الصرف:' : 'Currency & Exchange Notice:'}
                  </p>
                  <p className="leading-relaxed text-[11px] text-amber-800/90 dark:text-amber-500/90">
                    {isArabic
                      ? 'نظراً للوائح والتعليمات المصرفية في مصر، سيظهر المبلغ في صفحة الدفع بالجنيه المصري (EGP) بما يعادل قيمة الدولار الأمريكي وفقاً لسعر الصرف البنكي الرسمي لحظة الدفع.'
                      : 'Due to Egyptian banking regulations and local gateway rules, the transaction will be billed on the checkout page in Egyptian Pounds (EGP) equivalent to the USD amount at the official live exchange rate.'}
                  </p>
                </div>
              </div>
            )} */}
          </div>

          {/* ─── InstaPay Section (EGP only) ─── */}
          {paymentMethod === 'instapay' && (
            <>
              {/* InstaPay Transfer Instructions Box */}
              <div className="rounded-3xl border border-primary/25 bg-secondary/30 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-primary" />
                    <span className="font-serif font-bold text-foreground text-sm">
                      {isArabic ? 'بيانات التحويل عبر إنستاباي' : 'InstaPay Transfer Details'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {displayPrice}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-foreground">
                  <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border">
                    <span className="text-muted-foreground">{isArabic ? 'عنوان إنستاباي (IPA):' : 'InstaPay Username:'}</span>
                    <span className="font-mono font-bold text-primary text-sm">drdaliaghozlan@instapay</span>
                  </div>

                  <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border">
                    <span className="text-muted-foreground">{isArabic ? 'رقم الهاتف المعتمد:' : 'Phone Number:'}</span>
                    <span className="font-mono font-semibold text-foreground">+20 12 88000739</span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    {isArabic
                      ? 'يرجى تحويل المبلغ المطلوب ثم التقاط صورة/لقطة شاشة لإيصال التحويل ورفعها في المربع أدناه.'
                      : 'Please transfer the exact amount and upload a screenshot or photo of the confirmation receipt below.'}
                  </p>
                </div>
              </div>

              {/* Receipt Upload Section */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {isArabic ? 'رفع إيصال التحويل (صورة الإيصال) *' : 'Upload Payment Receipt Screenshot *'}
                </label>

                {uploadError && (
                  <div className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                    {uploadError}
                  </div>
                )}

                <div className="relative rounded-3xl border-2 border-dashed border-border hover:border-primary/50 bg-card p-6 text-center transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading || isSubmitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />

                  {receiptPreview ? (
                    <div className="space-y-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptPreview}
                        alt="Receipt Preview"
                        className="mx-auto max-h-40 rounded-xl object-contain border border-border shadow-xs"
                      />
                      <div className="flex items-center justify-center gap-2 text-xs">
                        {uploading ? (
                          <span className="text-primary font-semibold flex items-center gap-1.5">
                            <span className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            {isArabic ? 'جارٍ رفع الإيصال إلى السحابة...' : 'Uploading receipt to Cloudinary...'}
                          </span>
                        ) : uploadedData ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="size-4" />
                            {isArabic ? 'تم رفع الإيصال بنجاح' : 'Receipt uploaded successfully'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{receiptFile?.name}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground block">
                        {isArabic ? 'انقر لاختيار صورة أخرى' : 'Click to change image'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <div className="size-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <UploadCloud className="size-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {isArabic ? 'انقر أو اسحب صورة الإيصال هنا' : 'Click or drag receipt image here'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="h-13 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {isArabic ? 'جارٍ تسجيل الحجز...' : 'Confirming Booking...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isArabic ? 'تأكيد الحجز وتقديم الإيصال' : 'Confirm Booking & Submit Receipt'}
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ─── Card / Apple Pay Section (USD only) ─── */}
          {paymentMethod === 'card' && (
            <>
              {/* Secure Payment Notice */}
              <div className="rounded-3xl border border-primary/25 bg-secondary/30 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                  <ShieldCheck className="size-5 text-primary" />
                  <span className="font-serif font-bold text-foreground text-sm">
                    {isArabic ? 'دفع آمن عبر كاشير (Kashier)' : 'Secure Payment via Kashier'}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-foreground">
                  <p className="text-muted-foreground leading-relaxed">
                    {isArabic
                      ? 'بالنقر على الزر أدناه، سيتم تحويلك إلى صفحة الدفع الآمنة التابعة لـ كاشير (Kashier) لإدخال بيانات بطاقتك. لن يتم تخزين بيانات البطاقة على موقعنا.'
                      : 'By clicking the button below, you will be redirected to the secure Kashier payment page to enter your card details. Your card information is never stored on our servers.'}
                  </p>

                  {currency === 'USD' && (
                    <div className="rounded-2xl border dark:bg-amber-50 border-amber-500/25 bg-amber-200/30 p-3 text-[11px] text-amber-900 dark:text-amber-500 flex items-start gap-2">
                      <Info className="size-3.5 dark:bg-amber-200/30 bg-amber-200/30 shrink-0 mt-0.5 text-amber-600 dark:text-amber-600" />
                      <p className="leading-relaxed">
                        {isArabic
                          ? 'تنويه: ستظهر القيمة في صفحة كاشير بالجنيه المصري (EGP) بما يعادل قيمة الدولار الأمريكي التزاماً باللوائح والتعليمات المصرفية المحلية.'
                          : 'Note: The total will be billed on the Kashier checkout screen in Egyptian Pounds (EGP) equivalent to the USD amount in accordance with local banking regulations.'}
                      </p>
                    </div>
                  )}

                  {/* <div className="flex items-center gap-3 flex-wrap pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-card px-2.5 py-1 rounded-full border border-border">
                      <ShieldCheck className="size-3 text-emerald-500" /> PCI DSS Compliant
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-card px-2.5 py-1 rounded-full border border-border">
                      🔒 256-bit SSL Encryption
                    </span>
                  </div> */}
                </div>
              </div>

              {cardError && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{cardError}</span>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-13 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {isArabic ? 'جارٍ التحويل إلى صفحة الدفع...' : 'Redirecting to payment...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CreditCard className="size-5" />
                      {isArabic ? 'ادفع بالبطاقة البنكية بأمان' : 'Pay Securely with Card'}
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}

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
                  {displayPrice}
                </dd>
              </div>

              {currency === 'USD' && (
                <p className="pt-1 text-[11px] text-muted-foreground/80 leading-relaxed">
                  {isArabic
                    ? '* يُحصل بالجنيه المصري (EGP) بما يعادل قيمة الدولار وفقاً للوائح والتعليمات المصرفية'
                    : '* Billed in EGP equivalent per local banking regulations'}
                </p>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
