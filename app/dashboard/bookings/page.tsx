import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import { getBookingsCollection, getConsultationsCollection, BookingItem, ConsultationItem } from '@/lib/db'
import { BookingsManager } from '@/components/dashboard/bookings-manager'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15

export default async function BookingsDashboardPage() {
  const session = await verifySession()

  const bookingsCollection = await getBookingsCollection()
  const consultationsCollection = await getConsultationsCollection()

  const [totalCount, bookingsDocs, consultationsDocs] = await Promise.all([
    bookingsCollection.countDocuments({}),
    bookingsCollection.find({}).sort({ createdAt: -1 }).limit(PAGE_SIZE).toArray(),
    consultationsCollection.find({ isActive: true }).sort({ sortOrder: 1 }).toArray(),
  ])

  const initialBookings: BookingItem[] = bookingsDocs.map((b) => ({
    ...b,
    _id: b._id?.toString() || '',
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
