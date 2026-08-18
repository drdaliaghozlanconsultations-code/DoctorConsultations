/**
 * Placeholder availability generator.
 * In production this would come from a calendar/scheduling backend
 * (e.g. Google Calendar). Here we deterministically generate slots so the
 * booking UI has realistic available/unavailable states.
 */

export interface DayAvailability {
  date: string // YYYY-MM-DD
  hasSlots: boolean
}

export interface TimeSlot {
  time: string // "HH:mm" 24h
  available: boolean
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Next `count` selectable days starting tomorrow. Fridays are closed. */
export function getUpcomingDays(count = 14): DayAvailability[] {
  const days: DayAvailability[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  let offset = 1
  while (days.length < count) {
    const d = new Date(start)
    d.setDate(start.getDate() + offset)
    offset++
    const weekday = d.getDay() // 0 Sun ... 5 Fri 6 Sat
    const closed = weekday === 5 // clinic closed on Friday
    days.push({ date: toISODate(d), hasSlots: !closed })
  }
  return days
}

/** Deterministic pseudo-random based on a string seed. */
function seeded(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

const BASE_TIMES = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '16:00',
  '17:00',
]

export function getSlotsForDate(date: string): TimeSlot[] {
  const base = seeded(date)
  return BASE_TIMES.map((time, i) => {
    // deterministically mark some slots unavailable
    const available = (base + i * 7) % 3 !== 0
    return { time, available }
  })
}

export function formatSlotLabel(time: string, locale: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

export function formatDateLabel(date: string, locale: string): string {
  const d = new Date(date + 'T00:00:00')
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export function formatFullDate(date: string, locale: string): string {
  const d = new Date(date + 'T00:00:00')
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
