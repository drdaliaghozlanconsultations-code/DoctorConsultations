import {
  getSettingsCollection,
  getDateOverridesCollection,
  getBookingsCollection,
  getConsultationsCollection,
} from '@/lib/db'
import {
  type AvailabilitySettings,
  type DaySchedule,
  type BreakInterval,
  type DayAvailability,
  type TimeSlot,
  DEFAULT_WEEKLY_SCHEDULE,
  DEFAULT_SLOT_INTERVAL,
  timeToMinutes,
  minutesToTime,
} from '@/lib/data/availability'
import { ObjectId } from 'mongodb'

/**
 * Fetch availability settings from MongoDB (or return defaults)
 */
export async function getAvailabilitySettings(): Promise<AvailabilitySettings> {
  try {
    const settingsCol = await getSettingsCollection()
    const doc = await settingsCol.findOne({ key: 'availability_schedule' })
    if (doc?.value) {
      return {
        weeklySchedule: {
          ...DEFAULT_WEEKLY_SCHEDULE,
          ...doc.value.weeklySchedule,
        },
        slotIntervalMinutes: doc.value.slotIntervalMinutes || DEFAULT_SLOT_INTERVAL,
      }
    }
  } catch (err) {
    console.error('Error fetching availability settings:', err)
  }

  return {
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    slotIntervalMinutes: DEFAULT_SLOT_INTERVAL,
  }
}

export interface EffectiveDayInfo {
  isOpen: boolean
  startTime: string
  endTime: string
  breaks: BreakInterval[]
  reason?: string
}

/**
 * Compute the effective schedule for a specific date (combines Weekly Template + Date Overrides)
 */
export async function getEffectiveDaySchedule(
  dateStr: string,
  settings?: AvailabilitySettings,
): Promise<EffectiveDayInfo> {
  const config = settings || (await getAvailabilitySettings())

  // Check for date override first
  try {
    const overridesCol = await getDateOverridesCollection()
    const override = await overridesCol.findOne({ date: dateStr })

    if (override) {
      if (override.type === 'closed') {
        return {
          isOpen: false,
          startTime: '09:00',
          endTime: '17:00',
          breaks: [],
          reason: override.reason || 'Closed / Vacation',
        }
      }

      if (override.type === 'open' || override.type === 'custom') {
        return {
          isOpen: true,
          startTime: override.startTime || '09:00',
          endTime: override.endTime || '17:00',
          breaks: override.breaks || [],
          reason: override.reason,
        }
      }
    }
  } catch (err) {
    console.error('Error checking date override:', err)
  }

  // Fallback to weekly schedule
  const dateObj = new Date(`${dateStr}T00:00:00`)
  const dayOfWeek = dateObj.getDay() // 0 = Sun, 5 = Fri, 6 = Sat
  const dayTemplate = config.weeklySchedule[dayOfWeek] || DEFAULT_WEEKLY_SCHEDULE[dayOfWeek]

  if (!dayTemplate || !dayTemplate.enabled) {
    return {
      isOpen: false,
      startTime: '09:00',
      endTime: '17:00',
      breaks: [],
      reason: dayOfWeek === 5 ? 'Friday Weekend' : 'Day Off',
    }
  }

  return {
    isOpen: true,
    startTime: dayTemplate.startTime || '09:00',
    endTime: dayTemplate.endTime || '17:00',
    breaks: dayTemplate.breaks || [],
  }
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Generate time slots for a specific date, checking breaks, consultation duration, and existing bookings.
 */
export async function getSlotsForDate(
  dateStr: string,
  consultationDurationMinutes: number = 30,
): Promise<TimeSlot[]> {
  const settings = await getAvailabilitySettings()
  const dayInfo = await getEffectiveDaySchedule(dateStr, settings)

  if (!dayInfo.isOpen) {
    return []
  }

  const startMins = timeToMinutes(dayInfo.startTime)
  const endMins = timeToMinutes(dayInfo.endTime)
  const interval = settings.slotIntervalMinutes || DEFAULT_SLOT_INTERVAL
  const duration = consultationDurationMinutes > 0 ? consultationDurationMinutes : 30

  // 1. Fetch confirmed/pending bookings for this date to prevent collisions
  interface BusyInterval {
    start: number
    end: number
  }

  const busyIntervals: BusyInterval[] = []

  // Add breaks as busy intervals
  for (const b of dayInfo.breaks) {
    const bStart = timeToMinutes(b.start)
    const bEnd = timeToMinutes(b.end)
    if (bEnd > bStart) {
      busyIntervals.push({ start: bStart, end: bEnd })
    }
  }

  try {
    const bookingsCol = await getBookingsCollection()
    const consultCol = await getConsultationsCollection()

    const activeBookings = await bookingsCol
      .find({
        date: dateStr,
        status: { $in: ['pending', 'confirmed'] },
      })
      .toArray()

    // Pre-fetch consultation durations cache
    const consultDurations: Record<string, number> = {}
    for (const b of activeBookings) {
      let bDuration = 30 // default
      if (b.consultationId) {
        if (consultDurations[b.consultationId] !== undefined) {
          bDuration = consultDurations[b.consultationId]
        } else {
          try {
            const cDoc = await consultCol.findOne({ _id: new ObjectId(b.consultationId) })
            if (cDoc?.durationMinutes) {
              bDuration = cDoc.durationMinutes
            }
            consultDurations[b.consultationId] = bDuration
          } catch {
            consultDurations[b.consultationId] = 30
          }
        }
      }

      const bStart = timeToMinutes(b.time)
      const bEnd = bStart + bDuration
      busyIntervals.push({ start: bStart, end: bEnd })
    }
  } catch (err) {
    console.error('Error fetching booked intervals:', err)
  }

  // 2. Check if dateStr is today to disable past hours
  const now = new Date()
  const todayISO = toISODate(now)
  const isToday = dateStr === todayISO
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes() + 15 // 15 min buffer

  // 3. Generate candidate slots
  const slots: TimeSlot[] = []

  for (let t = startMins; t + duration <= endMins; t += interval) {
    const slotStart = t
    const slotEnd = t + duration
    const timeLabel = minutesToTime(slotStart)

    // Check past time if today
    if (isToday && slotStart <= currentMinutesFromMidnight) {
      slots.push({ time: timeLabel, available: false })
      continue
    }

    // Check collision with busy intervals (breaks or existing bookings)
    const hasCollision = busyIntervals.some(
      (busy) => Math.max(slotStart, busy.start) < Math.min(slotEnd, busy.end),
    )

    slots.push({
      time: timeLabel,
      available: !hasCollision,
    })
  }

  return slots
}

/**
 * Next `count` selectable days starting tomorrow (or today).
 *
 * LIGHTWEIGHT: Only checks the weekly schedule template + date overrides to
 * determine if a day is open. Does NOT query bookings to check whether slots
 * are actually free — that happens lazily when the user clicks a specific date.
 * This keeps the initial date-list response fast (single DB round-trip for
 * overrides instead of 14× getSlotsForDate).
 */
export async function getUpcomingDays(
  count = 14,
  _consultationDurationMinutes = 30,
): Promise<DayAvailability[]> {
  const days: DayAvailability[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const settings = await getAvailabilitySettings()

  // Build candidate date strings
  const candidateDates: string[] = []
  for (let offset = 1; candidateDates.length < count; offset++) {
    const d = new Date(start)
    d.setDate(start.getDate() + offset)
    candidateDates.push(toISODate(d))
  }

  // Batch-fetch all date overrides for the date range in one query
  let overridesMap: Record<string, { type: string; startTime?: string; endTime?: string; breaks?: BreakInterval[]; reason?: string }> = {}
  try {
    const overridesCol = await getDateOverridesCollection()
    const overrides = await overridesCol
      .find({ date: { $in: candidateDates } })
      .toArray()
    for (const ov of overrides) {
      overridesMap[ov.date] = ov
    }
  } catch (err) {
    console.error('Error batch-fetching date overrides:', err)
  }

  for (const dateStr of candidateDates) {
    const override = overridesMap[dateStr]

    if (override) {
      // Date override takes priority
      if (override.type === 'closed') {
        days.push({
          date: dateStr,
          hasSlots: false,
          reason: override.reason || 'Closed / Vacation',
        })
        continue
      }
      // 'open' or 'custom' override → day is available
      days.push({ date: dateStr, hasSlots: true })
      continue
    }

    // Fallback to weekly schedule template
    const dateObj = new Date(`${dateStr}T00:00:00`)
    const dayOfWeek = dateObj.getDay()
    const dayTemplate = settings.weeklySchedule[dayOfWeek] || DEFAULT_WEEKLY_SCHEDULE[dayOfWeek]

    if (!dayTemplate || !dayTemplate.enabled) {
      days.push({
        date: dateStr,
        hasSlots: false,
        reason: dayOfWeek === 5 ? 'Friday Weekend' : 'Day Off',
      })
    } else {
      days.push({ date: dateStr, hasSlots: true })
    }
  }

  return days
}
