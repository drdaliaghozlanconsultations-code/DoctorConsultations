import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import {
  getBookingsCollection,
  getConsultationsCollection,
  getPaymentProcessesCollection,
  BookingItem,
  ConsultationItem,
  withRetry,
} from '@/lib/db'
import { BookingsManager } from '@/components/dashboard/bookings-manager'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15

export default async function BookingsDashboardPage() {
  const session = await verifySession()

  const [totalCount, bookingsDocs, consultationsDocs] = await withRetry(async () => {
    const bookingsCollection = await getBookingsCollection()
    const consultationsCollection = await getConsultationsCollection()

    return Promise.all([
      bookingsCollection.countDocuments({}),
      bookingsCollection.find({}).sort({ createdAt: -1 }).limit(PAGE_SIZE).toArray(),
      consultationsCollection.find({ isActive: true }).sort({ sortOrder: 1 }).toArray(),
    ])
  })

  // Enrich any failed booking missing kashierResponseMessage from paymentProcesses
  const missingRefs = bookingsDocs
    .filter((b) => !b.kashierResponseMessage && (b.paymentStatus === 'failed' || b.status === 'failed'))
    .map((b) => b.reference)

  let procMap = new Map<string, string>()
  if (missingRefs.length > 0) {
    const paymentProcessesCollection = await getPaymentProcessesCollection()
    const processes = await paymentProcessesCollection
      .find({ bookingReference: { $in: missingRefs }, kashierResponseMessage: { $exists: true } })
      .toArray()
    procMap = new Map(processes.map((p) => [p.bookingReference, p.kashierResponseMessage || '']))
  }

  const initialBookings: BookingItem[] = bookingsDocs.map((b) => ({
    ...b,
    _id: b._id?.toString() || '',
    kashierResponseMessage: b.kashierResponseMessage || procMap.get(b.reference) || undefined,
  }))

  const consultations: ConsultationItem[] = consultationsDocs.map((c) => ({
    ...c,
    _id: c._id?.toString() || '',
  }))

  return (
    <BookingsManager
      initialBookings={initialBookings}
      initialTotalCount={totalCount}
      initialTotalPages={Math.ceil(totalCount / PAGE_SIZE)}
      consultations={consultations}
      userRole={session.role}
    />
  )
}

