'use client'

import * as React from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n'
import { countries, countryName } from '@/lib/data/countries'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface PatientDetails {
  fullName: string
  email: string
  phone: string
  whatsapp: string
  country: string
  notes: string
}

interface StepDetailsProps {
  locale: Locale
  dict: Dictionary
  details: PatientDetails
  errors: Partial<Record<keyof PatientDetails, string>>
  onChange: (details: PatientDetails) => void
}

export function StepDetails({
  locale,
  dict,
  details,
  errors,
  onChange,
}: StepDetailsProps) {
  const d = dict.booking.details

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    onChange({ ...details, [name]: value })
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

      <div className="mt-8 space-y-6">
        {/* Full Name */}
        <div>
          <Label htmlFor="fullName">{d.fullName} *</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            value={details.fullName}
            onChange={handleChange}
            placeholder={d.fullNamePlaceholder}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-destructive">{errors.fullName}</p>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">{d.email} *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={details.email}
              onChange={handleChange}
              placeholder={d.emailPlaceholder}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">{d.phone} *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={details.phone}
              onChange={handleChange}
              placeholder={d.phonePlaceholder}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* WhatsApp & Country */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="whatsapp">{d.whatsapp} *</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              value={details.whatsapp}
              onChange={handleChange}
              placeholder={d.whatsappPlaceholder}
              aria-invalid={!!errors.whatsapp}
            />
            {errors.whatsapp && (
              <p className="mt-1.5 text-xs text-destructive">{errors.whatsapp}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country">{d.country} *</Label>
            <select
              id="country"
              name="country"
              value={details.country}
              onChange={handleChange}
              aria-invalid={!!errors.country}
              className="flex h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground shadow-sm transition-colors focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
            >
              <option value="">{d.countryPlaceholder}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name[locale]}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1.5 text-xs text-destructive">{errors.country}</p>
            )}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <Label htmlFor="notes">{d.notes}</Label>
          <Textarea
            id="notes"
            name="notes"
            value={details.notes}
            onChange={handleChange}
            placeholder={d.notesPlaceholder}
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
