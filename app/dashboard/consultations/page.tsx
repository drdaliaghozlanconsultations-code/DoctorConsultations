import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import { getConsultationsCollection, ConsultationItem } from '@/lib/db'
import { ConsultationsManager } from '@/components/dashboard/consultations-manager'

export const dynamic = 'force-dynamic'

export default async function ConsultationsDashboardPage() {
  const session = await verifySession()

  const consultationsCollection = await getConsultationsCollection()
  const items = await consultationsCollection
    .find({})
    .sort({ sortOrder: 1, createdAt: -1 })
    .toArray()

  const formatted: ConsultationItem[] = items.map((item) => ({
    ...item,
    _id: item._id?.toString() || '',
  }))

  return (
    <ConsultationsManager
      initialItems={formatted}
      userRole={session.role}
    />
  )
}
