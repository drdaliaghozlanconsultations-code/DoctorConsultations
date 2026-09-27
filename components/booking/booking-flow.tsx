'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import type { ConsultationType } from '@/lib/data/site'
import { StepIndicator } from './step-indicator'
import { StepConsultation } from './step-consultation'
import { StepSchedule } from './step-schedule'
import { StepDetails, type PatientDetails } from './step-details'
import { StepReview } from './step-review'
import { StepPayment } from './step-payment'
import { StepConfirmation } from './step-confirmation'
import { BookingResultModal, type BookingModalData } from './booking-result-modal'

interface BookingFlowProps {
  locale: Locale
  dict: Dictionary
  initialConsultations?: (ConsultationType & { priceEGP?: number; priceUSD?: number })[]
  initialCurrency?: 'EGP' | 'USD'
  initialCountry?: string
}

export function BookingFlow({
  locale,
  dict,
  initialConsultations,
  initialCurrency = 'EGP',
  initialCountry = 'EG',
}: BookingFlowProps) {
  const searchParams = useSearchParams()
  const initialConsultationParam = searchParams.get('consultation')

  // Step state: 1 to 6
  const [currentStep, setCurrentStep] = React.useState(1)

  // Geo & Currency State
  const [currency, setCurrency] = React.useState<'EGP' | 'USD'>(initialCurrency)
  const [userCountry, setUserCountry] = React.useState(initialCountry)

  const [loadingConsultations, setLoadingConsultations] = React.useState<boolean>(
    !initialConsultations || initialConsultations.length === 0,
  )

  // Consultations list from DB or initial SSR prop (never show dummy mockups with prices during loading)
  const [consultationsList, setConsultationsList] = React.useState<
    (ConsultationType & { priceEGP?: number; priceUSD?: number })[]
  >(initialConsultations && initialConsultations.length > 0 ? initialConsultations : [])

  // Helper to find most booked consultation (by isMostBooked flag or fallback highest price)
  const getMostWanted = (
    list: (ConsultationType & { priceEGP?: number; priceUSD?: number; isMostBooked?: boolean })[],
    curr: 'EGP' | 'USD',
  ) => {
    if (!list || list.length === 0) return null
    const marked = list.find((c) => c.isMostBooked)
    if (marked) return marked
    return list.reduce((prev, current) => {
      const prevPrice = curr === 'USD' ? (prev.priceUSD ?? prev.price) : (prev.priceEGP ?? prev.price)
      const currPrice = curr === 'USD' ? (current.priceUSD ?? current.price) : (current.priceEGP ?? current.price)
      return (currPrice || 0) > (prevPrice || 0) ? current : prev
    }, list[0])
  }

  // Booking data state
  const [selectedConsultation, setSelectedConsultation] =
    React.useState<(ConsultationType & { priceEGP?: number; priceUSD?: number; isMostBooked?: boolean }) | null>(
      () => {
        const sourceList = initialConsultations && initialConsultations.length > 0 ? initialConsultations : []
        if (sourceList.length === 0) return null
        if (initialConsultationParam) {
          const found = sourceList.find((c) => c.id === initialConsultationParam)
          if (found) return found
        }
        return getMostWanted(sourceList, initialCurrency)
      },
    )

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)

  const [patientDetails, setPatientDetails] = React.useState<PatientDetails>({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: initialCountry,
    notes: '',
  })

  const [errors, setErrors] = React.useState<Partial<Record<keyof PatientDetails, string>>>({})
  const [stepError, setStepError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [bookingReference, setBookingReference] = React.useState<string>('')

  // Payment Return Modal State (from Kashier / Paytabs redirect)
  const urlRef = searchParams.get('ref')
  const urlStatus = searchParams.get('status')
  const [resultModalOpen, setResultModalOpen] = React.useState(false)
  const [resultModalStatus, setResultModalStatus] = React.useState<'success' | 'failed'>('success')
  const [resultModalData, setResultModalData] = React.useState<BookingModalData | null>(null)

  // Detect payment return in URL and open Success or Failure Modal
  React.useEffect(() => {
    if (!urlRef || !urlStatus) return

    if (urlStatus === 'success') {
      setResultModalStatus('success')
      setResultModalOpen(true)
      setBookingReference(urlRef)
      setCurrentStep(6)

      fetch(`/api/bookings/lookup?ref=${encodeURIComponent(urlRef)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const b = data.data
            setResultModalData({
              reference: b.reference,
              consultationTitle: b.consultationTitle,
              date: b.date,
              time: b.time,
              patientName: b.patientName,
              email: b.email,
              googleMeetLink: b.googleMeetLink,
              paymentStatus: b.paymentStatus,
              status: b.status,
            })
            if (b.date) setSelectedDate(b.date)
            if (b.time) setSelectedTime(b.time)
            if (b.patientName || b.email) {
              setPatientDetails((prev) => ({
                ...prev,
                fullName: b.patientName || prev.fullName,
                email: b.email || prev.email,
                whatsapp: b.whatsapp || prev.whatsapp,
              }))
            }
          }
        })
        .catch(() => {})
    } else if (urlStatus === 'failed') {
      setResultModalStatus('failed')
      setResultModalData({ reference: urlRef })
      setResultModalOpen(true)
      setCurrentStep(5)
      setStepError(
        locale === 'ar'
          ? 'تعذر إتمام عملية الدفع. يمكنك إعادة المحاولة أو اختيار إنستاباي.'
          : 'Payment could not be completed. You can try again or choose InstaPay.',
      )
    }
  }, [urlRef, urlStatus, locale])

  // 1. Fetch Geolocation and Currency preference on mount
  React.useEffect(() => {
    fetch('/api/geo')
      .then((res) => res.json())
      .then((data) => {
        if (data.country) {
          setUserCountry(data.country)
          setCurrency(data.currency || (data.country === 'EG' ? 'EGP' : 'USD'))
          setPatientDetails((prev) => ({
            ...prev,
            country: prev.country || data.country,
          }))
        }
      })
      .catch(() => { })
  }, [])

  // 2. Fetch Active Consultations from DB
  React.useEffect(() => {
    fetch('/api/dashboard/consultations?activeOnly=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((c: any) => ({
            id: c._id,
            name: c.title,
            description: c.description,
            durationMinutes: c.durationMinutes,
            breakAfterMinutes: c.breakAfterMinutes,
            isMostBooked: c.isMostBooked,
            price: currency === 'USD' ? c.priceUSD : c.priceEGP,
            priceEGP: c.priceEGP,
            priceUSD: c.priceUSD,
          }))
          setConsultationsList(mapped)
          setLoadingConsultations(false)

          // If consultation was specified via URL param, use it; otherwise default to Most Wanted (highest price)
          if (initialConsultationParam) {
            const found = mapped.find((item: any) => item.id === initialConsultationParam)
            if (found) {
              setSelectedConsultation(found)
              return
            }
          }

          setSelectedConsultation((prev) => {
            if (prev) {
              const matched = mapped.find((item: any) => item.id === prev.id)
              if (matched) return matched
            }
            return getMostWanted(mapped, currency)
          })
        } else {
          setLoadingConsultations(false)
        }
      })
      .catch(() => {
        setLoadingConsultations(false)
      })
  }, [currency, initialConsultationParam])

  const stepsLabels = [
    dict.booking.steps.consultation,
    dict.booking.steps.schedule,
    dict.booking.steps.details,
    dict.booking.steps.review,
    dict.booking.steps.payment,
    dict.booking.steps.confirmation,
  ]

  const BackIcon = locale === 'ar' ? ChevronRight : ChevronLeft
  const NextIcon = locale === 'ar' ? ChevronLeft : ChevronRight

  // Step 1: Select consultation
  const handleSelectConsultation = (consultation: ConsultationType) => {
    setSelectedConsultation(consultation)
    setStepError(null)
  }

  // Step 2: Select date & time
  const handleSelectSlot = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setStepError(null)
  }

  // Step 3 Validation
  const validateDetails = (): boolean => {
    const newErrors: Partial<Record<keyof PatientDetails, string>> = {}
    const v = dict.booking.validation

    if (!patientDetails.fullName.trim()) {
      newErrors.fullName = v.nameShort
    }
    if (!patientDetails.email.trim() || !patientDetails.email.includes('@')) {
      newErrors.email = v.emailInvalid
    }
    if (!patientDetails.phone.trim()) {
      newErrors.phone = v.phoneInvalid
    }
    if (!patientDetails.whatsapp.trim()) {
      newErrors.whatsapp = v.whatsappInvalid
    }
    if (!patientDetails.country) {
      newErrors.country = v.required
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Step Navigation
  const handleNext = () => {
    setStepError(null)

    if (currentStep === 1) {
      if (!selectedConsultation) {
        setStepError(dict.booking.validation.selectConsultation)
        return
      }
    } else if (currentStep === 2) {
      if (!selectedDate || !selectedTime) {
        setStepError(dict.booking.validation.selectSlot)
        return
      }
    } else if (currentStep === 3) {
      if (!validateDetails()) {
        return
      }
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 100, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setStepError(null)
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 100, behavior: 'smooth' })
    }
  }

  // Step 5: Submit Payment & Create Booking in MongoDB
  const handleSubmitPayment = async (paymentData: {
    receiptUrl?: string
    receiptPublicId?: string
    paymentMethod: 'instapay' | 'card'
  }) => {
    setIsSubmitting(true)
    setStepError(null)

    try {
      const priceAmount =
        currency === 'USD' && selectedConsultation?.priceUSD !== undefined
          ? selectedConsultation.priceUSD
          : currency === 'EGP' && selectedConsultation?.priceEGP !== undefined
            ? selectedConsultation.priceEGP
            : selectedConsultation?.price || 0

      // ─── Card Payment (Kashier redirect) ───
      if (paymentData.paymentMethod === 'card') {
        const payload = {
          consultationId: selectedConsultation?.id,
          patientName: patientDetails.fullName,
          email: patientDetails.email,
          phone: patientDetails.phone,
          whatsapp: patientDetails.whatsapp,
          country: patientDetails.country || userCountry,
          date: selectedDate,
          time: selectedTime,
          notes: patientDetails.notes,
          amount: priceAmount,
          currency,
          locale,
        }

        const res = await fetch('/api/payments/kashier/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        const redirectTarget = data.sessionUrl || data.redirectUrl

        if (!res.ok || !data.success || !redirectTarget) {
          setStepError(data.error || 'Failed to initiate payment. Please try again.')
          setIsSubmitting(false)
          return
        }

        // Redirect to Kashier hosted checkout session
        window.location.href = redirectTarget
        return // page will navigate away
      }

      // ─── InstaPay Payment (existing flow) ───
      const payload = {
        consultationId: selectedConsultation?.id,
        patientName: patientDetails.fullName,
        email: patientDetails.email,
        phone: patientDetails.phone,
        whatsapp: patientDetails.whatsapp,
        country: patientDetails.country || userCountry,
        date: selectedDate,
        time: selectedTime,
        notes: patientDetails.notes,
        paymentMethod: paymentData.paymentMethod,
        paymentReceiptUrl: paymentData.receiptUrl,
        paymentReceiptPublicId: paymentData.receiptPublicId,
        amount: priceAmount,
        currency,
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setStepError(data.error || 'Failed to submit booking. Please try again.')
        setIsSubmitting(false)
        return
      }

      setBookingReference(data.reference)
      setIsSubmitting(false)
      setCurrentStep(6)
      window.scrollTo({ top: 100, behavior: 'smooth' })
    } catch (err: any) {
      console.error('Booking submission error:', err)
      setStepError('An error occurred while confirming your booking. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedDate(null)
    setSelectedTime(null)
    setPatientDetails({
      fullName: '',
      email: '',
      phone: '',
      whatsapp: '',
      country: userCountry || 'EG',
      notes: '',
    })
    setErrors({})
    setBookingReference('')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 md:py-10">
      {/* Stepper Header */}
      {currentStep < 6 && (
        <div className="mb-6">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={5}
            steps={stepsLabels.slice(0, 5)}
            stepLabel={dict.booking.stepLabel}
            ofLabel={dict.booking.of}
          />
        </div>
      )}

      {/* Main Step Container */}
      <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-12">
        {stepError && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            {stepError}
          </div>
        )}

        {currentStep === 1 && (
          <StepConsultation
            locale={locale}
            dict={dict}
            consultationsList={consultationsList}
            currency={currency}
            selectedId={selectedConsultation?.id ?? null}
            onSelect={handleSelectConsultation}
            isLoading={loadingConsultations}
          />
        )}

        {currentStep === 2 && (
          <StepSchedule
            locale={locale}
            dict={dict}
            durationMinutes={selectedConsultation?.durationMinutes || 30}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectSlot={handleSelectSlot}
          />
        )}

        {currentStep === 3 && (
          <StepDetails
            locale={locale}
            dict={dict}
            details={patientDetails}
            errors={errors}
            onChange={setPatientDetails}
          />
        )}

        {currentStep === 4 && (
          <StepReview
            locale={locale}
            dict={dict}
            consultation={selectedConsultation}
            date={selectedDate}
            time={selectedTime}
            currency={currency}
            details={patientDetails}
            onJumpToStep={setCurrentStep}
          />
        )}

        {currentStep === 5 && (
          <StepPayment
            locale={locale}
            dict={dict}
            consultation={selectedConsultation}
            date={selectedDate}
            time={selectedTime}
            currency={currency}
            isSubmitting={isSubmitting}
            onSubmitPayment={handleSubmitPayment}
          />
        )}

        {currentStep === 6 && (
          <StepConfirmation
            locale={locale}
            dict={dict}
            reference={bookingReference}
            consultation={selectedConsultation}
            date={selectedDate}
            time={selectedTime}
            details={patientDetails}
            onReset={handleReset}
            isVerified={resultModalData?.paymentStatus === 'verified'}
            meetLink={resultModalData?.googleMeetLink}
          />
        )}

        {/* Modal: Payment Success / Failure Popup */}
        <BookingResultModal
          isOpen={resultModalOpen}
          onClose={() => setResultModalOpen(false)}
          status={resultModalStatus}
          bookingData={resultModalData}
          locale={locale}
          dict={dict}
          onRetry={() => {
            setResultModalOpen(false)
            setCurrentStep(5)
          }}
        />

        {/* Navigation Buttons for Steps 1–4 */}
        {currentStep <= 4 && (
          <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handleBack}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <BackIcon className="size-4" />
              <span>{dict.common.back}</span>
            </button>

            <button
              type="button"
              disabled={currentStep === 1 && (loadingConsultations || !selectedConsultation)}
              onClick={handleNext}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:translate-y-px disabled:pointer-events-none disabled:opacity-40"
            >
              <span>{currentStep === 4 ? dict.common.continue : dict.common.next}</span>
              <NextIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
