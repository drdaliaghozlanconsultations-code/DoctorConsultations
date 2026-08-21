'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  CalendarOff,
  Sparkles,
  RefreshCw,
  Sun,
  Coffee,
  X,
} from 'lucide-react'
import type {
  DaySchedule,
  BreakInterval,
  DateOverrideItem,
  DateOverrideType,
  UserRole,
} from '@/lib/db'
import {
  DEFAULT_WEEKLY_SCHEDULE,
  DEFAULT_SLOT_INTERVAL,
} from '@/lib/data/availability'

const WEEKDAYS = [
  { day: 0, name: 'Sunday', arName: 'الأحد' },
  { day: 1, name: 'Monday', arName: 'الاثنين' },
  { day: 2, name: 'Tuesday', arName: 'الثلاثاء' },
  { day: 3, name: 'Wednesday', arName: 'الأربعاء' },
  { day: 4, name: 'Thursday', arName: 'الخميس' },
  { day: 5, name: 'Friday', arName: 'الجمعة (عطلة)', isWeekend: true },
  { day: 6, name: 'Saturday', arName: 'السبت' },
]

interface AvailabilityManagerProps {
  initialWeeklySchedule: Record<number, DaySchedule>
  initialSlotInterval: number
  initialOverrides: DateOverrideItem[]
  userRole: UserRole
}

export function AvailabilityManager({
  initialWeeklySchedule,
  initialSlotInterval,
  initialOverrides,
  userRole,
}: AvailabilityManagerProps) {
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DaySchedule>>(
    initialWeeklySchedule || DEFAULT_WEEKLY_SCHEDULE,
  )
  const [slotInterval, setSlotInterval] = useState<number>(
    initialSlotInterval || DEFAULT_SLOT_INTERVAL,
  )
  const [overrides, setOverrides] = useState<DateOverrideItem[]>(initialOverrides || [])

  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  // Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideType, setOverrideType] = useState<DateOverrideType>('closed')
  const [overrideStartTime, setOverrideStartTime] = useState('09:00')
  const [overrideEndTime, setOverrideEndTime] = useState('17:00')
  const [overrideBreaks, setOverrideBreaks] = useState<BreakInterval[]>([])
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [overrideError, setOverrideError] = useState<string | null>(null)

  const isAdmin = userRole === 'admin'

  // Toggle Day Open/Closed
  const handleToggleDay = (dayIndex: number) => {
    setWeeklySchedule((prev) => {
      const current = prev[dayIndex] || DEFAULT_WEEKLY_SCHEDULE[dayIndex]
      return {
        ...prev,
        [dayIndex]: {
          ...current,
          enabled: !current.enabled,
        },
      }
    })
  }

  // Update Day Working Hours
  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklySchedule((prev) => {
      const current = prev[dayIndex] || DEFAULT_WEEKLY_SCHEDULE[dayIndex]
      return {
        ...prev,
        [dayIndex]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  // Add Break to a Weekday
  const handleAddBreak = (dayIndex: number) => {
    setWeeklySchedule((prev) => {
      const current = prev[dayIndex] || DEFAULT_WEEKLY_SCHEDULE[dayIndex]
      const newBreak: BreakInterval = {
        id: `break-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        start: '13:00',
        end: '14:00',
        label: 'Break',
      }
      return {
        ...prev,
        [dayIndex]: {
          ...current,
          breaks: [...(current.breaks || []), newBreak],
        },
      }
    })
  }

  // Update Break in a Weekday
  const handleUpdateBreak = (
    dayIndex: number,
    breakId: string,
    field: 'start' | 'end' | 'label',
    value: string,
  ) => {
    setWeeklySchedule((prev) => {
      const current = prev[dayIndex] || DEFAULT_WEEKLY_SCHEDULE[dayIndex]
      return {
        ...prev,
        [dayIndex]: {
          ...current,
          breaks: (current.breaks || []).map((b) =>
            b.id === breakId ? { ...b, [field]: value } : b,
          ),
        },
      }
    })
  }

  // Remove Break from a Weekday
  const handleRemoveBreak = (dayIndex: number, breakId: string) => {
    setWeeklySchedule((prev) => {
      const current = prev[dayIndex] || DEFAULT_WEEKLY_SCHEDULE[dayIndex]
      return {
        ...prev,
        [dayIndex]: {
          ...current,
          breaks: (current.breaks || []).filter((b) => b.id !== breakId),
        },
      }
    })
  }

  // Save Weekly Schedule
  const handleSaveSchedule = async () => {
    setSavingSchedule(true)
    setScheduleSuccess(null)
    setScheduleError(null)

    try {
      const res = await fetch('/api/dashboard/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklySchedule,
          slotIntervalMinutes: slotInterval,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setScheduleSuccess('Weekly schedule and interval saved successfully!')
        setTimeout(() => setScheduleSuccess(null), 4000)
      } else {
        setScheduleError(data.error || 'Failed to save schedule')
      }
    } catch (err: any) {
      setScheduleError(err.message || 'An unexpected error occurred')
    } finally {
      setSavingSchedule(false)
    }
  }

  // Add Override Submit
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!overrideDate) {
      setOverrideError('Please select a date')
      return
    }

    setOverrideLoading(true)
    setOverrideError(null)

    try {
      const res = await fetch('/api/dashboard/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: overrideDate,
          type: overrideType,
          startTime: overrideStartTime,
          endTime: overrideEndTime,
          breaks: overrideBreaks,
          reason: overrideReason,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Refresh overrides list
        setOverrides((prev) => {
          const filtered = prev.filter((o) => o.date !== overrideDate)
          return [...filtered, data.data].sort((a, b) => a.date.localeCompare(b.date))
        })
        setIsOverrideModalOpen(false)
        setOverrideDate('')
        setOverrideReason('')
        setOverrideBreaks([])
      } else {
        setOverrideError(data.error || 'Failed to save date override')
      }
    } catch (err: any) {
      setOverrideError(err.message || 'An unexpected error occurred')
    } finally {
      setOverrideLoading(false)
    }
  }

  // Delete Override
  const handleDeleteOverride = async (id?: string, date?: string) => {
    if (!confirm('Are you sure you want to delete this date override?')) return

    try {
      const url = id
        ? `/api/dashboard/availability?id=${id}`
        : `/api/dashboard/availability?date=${date}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setOverrides((prev) => prev.filter((o) => (id ? o._id !== id : o.date !== date)))
      } else {
        alert(data.error || 'Failed to delete override')
      }
    } catch {
      alert('Failed to delete override')
    }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Clinic Working Hours & Availability
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage weekly recurring schedule, closed breaks/intervals, vacation days, and single-date exceptions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSchedule}
          disabled={savingSchedule}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {savingSchedule ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span>Save Weekly Schedule</span>
        </button>
      </div>

      {/* Alerts */}
      {scheduleSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          <span>{scheduleSuccess}</span>
        </div>
      )}

      {scheduleError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span>{scheduleError}</span>
        </div>
      )}

      {/* Slot Interval Settings */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span>Time Slot Step (Interval)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Determines how frequently starting times appear (e.g. every 30 minutes: 10:00, 10:30, 11:00). A 60-minute consultation will automatically occupy 2 consecutive 30-min slots!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none shadow-2xs"
            >
              <option value={15}>Every 15 Minutes</option>
              <option value={20}>Every 20 Minutes</option>
              <option value={30}>Every 30 Minutes (Recommended)</option>
              <option value={45}>Every 45 Minutes</option>
              <option value={60}>Every 60 Minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 1: Weekly Template */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground">
              Weekly Recurring Schedule
            </h2>
            <p className="text-xs text-muted-foreground">
              Set standard working hours and recurring closed breaks for each day of the week.
            </p>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-border bg-card shadow-xs overflow-hidden divide-y divide-border/60">
          {WEEKDAYS.map(({ day, name, arName, isWeekend }) => {
            const config = weeklySchedule[day] || DEFAULT_WEEKLY_SCHEDULE[day]
            const isEnabled = config?.enabled ?? false
            const breaks = config?.breaks || []

            return (
              <div
                key={day}
                className={`p-5 sm:p-6 transition-colors ${
                  isEnabled ? 'bg-card' : 'bg-muted/20 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Day Info & Toggle */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm sm:text-base">
                          {name}
                        </span>
                        <span className="text-xs text-primary font-serif dir-rtl">{arName}</span>
                        {isWeekend && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/20">
                            Weekend / Vacation
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isEnabled ? 'Available for bookings' : 'Closed / Off'}
                      </span>
                    </div>
                  </div>

                  {/* Hours & Breaks when Open */}
                  {isEnabled && (
                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-end gap-4">
                      {/* Shift Hours */}
                      <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-2xl border border-border/60">
                        <Sun className="size-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-muted-foreground">Hours:</span>
                        <input
                          type="time"
                          value={config.startTime || '09:00'}
                          onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                          className="px-2 py-1 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={config.endTime || '17:00'}
                          onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                          className="px-2 py-1 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* Add Break Button */}
                      <button
                        type="button"
                        onClick={() => handleAddBreak(day)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
                      >
                        <Coffee className="size-3 text-primary" />
                        <span>Add Break / Closed Interval</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Breaks List if configured */}
                {isEnabled && breaks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/40 pl-0 sm:pl-14 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Closed Intervals / Break Windows (No bookings accepted during these times):
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {breaks.map((b) => (
                        <div
                          key={b.id}
                          className="inline-flex items-center gap-2 bg-secondary/60 border border-border/80 px-3 py-1.5 rounded-2xl text-xs"
                        >
                          <Coffee className="size-3 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Label (e.g. Lunch)"
                            value={b.label || ''}
                            onChange={(e) =>
                              handleUpdateBreak(day, b.id, 'label', e.target.value)
                            }
                            className="w-24 bg-transparent border-b border-border/60 text-xs text-foreground focus:outline-none focus:border-primary"
                          />
                          <input
                            type="time"
                            value={b.start}
                            onChange={(e) =>
                              handleUpdateBreak(day, b.id, 'start', e.target.value)
                            }
                            className="px-1.5 py-0.5 rounded-lg border border-border/60 bg-background text-[11px] font-medium"
                          />
                          <span className="text-[10px] text-muted-foreground">-</span>
                          <input
                            type="time"
                            value={b.end}
                            onChange={(e) =>
                              handleUpdateBreak(day, b.id, 'end', e.target.value)
                            }
                            className="px-1.5 py-0.5 rounded-lg border border-border/60 bg-background text-[11px] font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBreak(day, b.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-1"
                            title="Remove break"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: Date Overrides (Exceptions) */}
      <div className="space-y-4 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground">
              Date Overrides & Vacation Exceptions
            </h2>
            <p className="text-xs text-muted-foreground">
              Close clinic for public holidays / personal vacations, or open a specific Friday/weekend only once.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOverrideDate('')
              setOverrideReason('')
              setOverrideType('closed')
              setOverrideBreaks([])
              setOverrideError(null)
              setIsOverrideModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground border border-border text-xs font-semibold hover:bg-muted transition-all shadow-xs active:scale-95"
          >
            <Plus className="size-4 text-primary" />
            <span>Add Date Override</span>
          </button>
        </div>

        {/* Overrides Table */}
        <div className="rounded-[2.5rem] border border-border bg-card shadow-xs overflow-hidden">
          {overrides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="size-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">No date overrides configured</p>
              <p className="text-xs mt-0.5">
                All upcoming days will strictly follow the weekly schedule above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-6 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Type</th>
                    <th className="py-3.5 px-4 font-semibold">Hours & Breaks</th>
                    <th className="py-3.5 px-4 font-semibold">Reason / Notes</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {overrides.map((o) => (
                    <tr key={o._id || o.date} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-foreground">
                        {o.date}
                      </td>
                      <td className="py-4 px-4">
                        {o.type === 'closed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <CalendarOff className="size-3" />
                            Closed / Day Off
                          </span>
                        ) : o.type === 'open' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Sparkles className="size-3" />
                            Special Open Day
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            <Clock className="size-3" />
                            Modified Hours
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {o.type === 'closed' ? (
                          <span>Full day off</span>
                        ) : (
                          <div>
                            <span className="font-medium text-foreground">
                              {o.startTime} - {o.endTime}
                            </span>
                            {o.breaks && o.breaks.length > 0 && (
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                Breaks: {o.breaks.map((b) => `${b.start}-${b.end}`).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-foreground font-medium">
                        {o.reason || '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteOverride(o._id, o.date)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete override"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Date Override */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card rounded-[2.5rem] border border-border p-6 sm:p-8 max-w-lg w-full relative shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Add Single-Date Override
              </h3>
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4 mt-6">
              {overrideError && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                  {overrideError}
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Specific Date *
                </label>
                <input
                  type="date"
                  required
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Override Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideType('closed')}
                    className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      overrideType === 'closed'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 shadow-2xs font-bold'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Close Day (Off)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideType('open')}
                    className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      overrideType === 'open'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-2xs font-bold'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Open Friday / Off-day
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideType('custom')}
                    className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      overrideType === 'custom'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 shadow-2xs font-bold'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Custom Hours
                  </button>
                </div>
              </div>

              {/* Hours if Open or Custom */}
              {overrideType !== 'closed' && (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={overrideStartTime}
                      onChange={(e) => setOverrideStartTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={overrideEndTime}
                      onChange={(e) => setOverrideEndTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Reason / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eid Holiday, Vacation, Emergency Off, Open Friday shift..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-border text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-md disabled:opacity-50"
                >
                  {overrideLoading ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
