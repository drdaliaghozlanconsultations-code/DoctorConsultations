import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import { getDateOverridesCollection, DateOverrideItem } from '@/lib/db'
import { getAvailabilitySettings } from '@/lib/availability-server'
import { AvailabilityManager } from '@/components/dashboard/availability-manager'

export const dynamic = 'force-dynamic'

export default async function AvailabilityDashboardPage() {
  const session = await verifySession()

  const settings = await getAvailabilitySettings()

  const overridesCol = await getDateOverridesCollection()
  const overrideDocs = await overridesCol.find({}).sort({ date: 1 }).toArray()

  const formattedOverrides: DateOverrideItem[] = overrideDocs.map((doc) => ({
    ...doc,
    _id: doc._id?.toString() || '',
  }))

  return (
    <AvailabilityManager
      initialWeeklySchedule={settings.weeklySchedule}
      initialSlotInterval={settings.slotIntervalMinutes}
      initialOverrides={formattedOverrides}
      userRole={session.role}
    />
  )
}
