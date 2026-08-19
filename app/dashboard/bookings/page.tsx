import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import { getBookingsCollection, getConsultationsCollection, BookingItem, ConsultationItem } from '@/lib/db'
import { BookingsManager } from '@/components/dashboard/bookings-manager'

export const dynamic = 'force-dynamic'

export default async function BookingsDashboardPage() {
  const session = await verifySession()

  const bookingsCollection = await getBookingsCollection()
  const consultationsCollection = await getConsultationsCollection()

  const [bookingsDocs, consultationsDocs] = await Promise.all([
    bookingsCollection.find({}).sort({ createdAt: -1 }).toArray(),
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
      consultations={consultations}
      userRole={session.role}
    />
  )
}
