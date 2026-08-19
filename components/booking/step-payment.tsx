'use client'

import * as React from 'react'
import {
  Lock,
  Info,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle,
  QrCode,
  ShieldCheck,
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

  const [paymentMethod, setPaymentMethod] = React.useState<'instapay' | 'card'>('instapay')
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadedData, setUploadedData] = React.useState<{
    url: string
    publicId: string
  } | null>(null)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

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
          {isArabic
            ? 'يرجى إتمام التحويل عبر إنستاباي ورفع صورة الإيصال ليقوم فريق العمل بمراجعة موعدك وتأكيده عبر البريد الإلكتروني.'
            : 'Please complete the transfer via InstaPay and upload the receipt. Our staff will review it and send a confirmation email.'}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
          {/* Payment Method Selector (InstaPay active) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {isArabic ? 'طريقة الدفع المتاحة' : 'Available Payment Method'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPaymentMethod('instapay')}
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'instapay'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                    : 'border-border bg-card'
                  }`}
              >
                <div className="size-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
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

              <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-muted/30 opacity-60 cursor-not-allowed">
                <div className="size-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isArabic ? 'بطاقة بنكية' : 'Credit / Debit Card'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isArabic ? 'قريباً' : 'Coming Soon'}
                  </p>
                </div>
              </div>
            </div>
          </div>

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
                <span className="font-mono font-bold text-primary text-sm">dalia.ghozlan@instapay</span>
              </div>

              <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border">
                <span className="text-muted-foreground">{isArabic ? 'رقم الهاتف المعتمد:' : 'Phone Number:'}</span>
                <span className="font-mono font-semibold text-foreground">+20 100 000 0000</span>
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
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
