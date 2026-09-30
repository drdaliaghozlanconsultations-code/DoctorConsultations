import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import { getConsultationsCollection, ConsultationItem, withRetry } from '@/lib/db'
import { ConsultationsManager } from '@/components/dashboard/consultations-manager'

export const dynamic = 'force-dynamic'

export default async function ConsultationsDashboardPage() {
  const session = await verifySession()

  const items = await withRetry(async () => {
    const consultationsCollection = await getConsultationsCollection()
    return consultationsCollection
      .find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray()
  })

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
