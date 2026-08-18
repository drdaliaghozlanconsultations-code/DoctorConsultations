'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { consultationTypes, type ConsultationType } from '@/lib/data/site'
import { StepIndicator } from './step-indicator'
import { StepConsultation } from './step-consultation'
import { StepSchedule } from './step-schedule'
import { StepDetails, type PatientDetails } from './step-details'
import { StepReview } from './step-review'
import { StepPayment } from './step-payment'
import { StepConfirmation } from './step-confirmation'
import { Button } from '@/components/ui/button'

export function BookingFlow({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const searchParams = useSearchParams()
  const initialConsultationParam = searchParams.get('consultation')

  // Step state: 1 to 6
  const [currentStep, setCurrentStep] = React.useState(1)

  // Booking data state
  const [selectedConsultation, setSelectedConsultation] =
    React.useState<ConsultationType | null>(() => {
      if (initialConsultationParam) {
        return (
          consultationTypes.find((c) => c.id === initialConsultationParam) ??
          consultationTypes[0]
        )
      }
      return consultationTypes[0]
    })

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)

  const [patientDetails, setPatientDetails] = React.useState<PatientDetails>({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: '',
    notes: '',
  })

  const [errors, setErrors] = React.useState<Partial<Record<keyof PatientDetails, string>>>({})
  const [stepError, setStepError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [bookingReference, setBookingReference] = React.useState<string>('')

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

  // Step 5 Submit Payment
  const handleSubmitPayment = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      const ref = `DALIA-${Math.floor(100000 + Math.random() * 900000)}`
      setBookingReference(ref)
      setIsSubmitting(false)
      setCurrentStep(6)
      window.scrollTo({ top: 100, behavior: 'smooth' })
    }, 1500)
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
      country: '',
      notes: '',
    })
    setErrors({})
    setBookingReference('')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
      {/* Stepper Header */}
      {currentStep < 6 && (
        <div className="mb-12">
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
            selectedId={selectedConsultation?.id ?? null}
            onSelect={handleSelectConsultation}
          />
        )}

        {currentStep === 2 && (
          <StepSchedule
            locale={locale}
            dict={dict}
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
          />
        )}

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
              onClick={handleNext}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:translate-y-px"
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
