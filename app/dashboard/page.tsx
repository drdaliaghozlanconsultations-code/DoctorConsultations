import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import {
  getBookingsCollection,
  getConsultationsCollection,
  getVisitsCollection,
  getPaymentProcessesCollection,
  BookingItem,
} from '@/lib/db'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await verifySession()

  const bookingsCollection = await getBookingsCollection()
  const consultationsCollection = await getConsultationsCollection()
  const visitsCollection = await getVisitsCollection()

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const todayDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const [
    pendingBookings,
    confirmedBookings,
    totalBookings,
    activeSessions,
    visitsToday,
    totalVisits,
    recentBookingsDocs,
    todayBookingsDocs,
  ] = await Promise.all([
    bookingsCollection.countDocuments({ status: 'pending' }),
    bookingsCollection.countDocuments({ status: 'confirmed' }),
    bookingsCollection.countDocuments({}),
    consultationsCollection.countDocuments({ isActive: true }),
    visitsCollection.countDocuments({ timestamp: { $gte: startOfToday } }),
    visitsCollection.countDocuments({}),
    bookingsCollection.find({}).sort({ createdAt: -1 }).limit(6).toArray(),
    bookingsCollection.find({ date: todayDateStr }).sort({ time: 1 }).toArray(),
  ])

  // Enrich any failed booking missing kashierResponseMessage from paymentProcesses
  const allDocs = [...recentBookingsDocs, ...todayBookingsDocs]
  const missingRefs = allDocs
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

  const initialStats = {
    pendingBookings,
    confirmedBookings,
    totalBookings,
    activeSessions,
    visitsToday,
    totalVisits,
    todayDate: todayDateStr,
    todayBookings: todayBookingsDocs.map((b): BookingItem => ({
      ...b,
      _id: b._id?.toString() || '',
      kashierResponseMessage: b.kashierResponseMessage || procMap.get(b.reference) || undefined,
    })),
    recentBookings: recentBookingsDocs.map((b): BookingItem => ({
      ...b,
      _id: b._id?.toString() || '',
      kashierResponseMessage: b.kashierResponseMessage || procMap.get(b.reference) || undefined,
    })),
  }

  return (
    <DashboardOverview
      initialStats={initialStats}
      user={{
        username: session.username,
        displayName: session.displayName,
        role: session.role,
      }}
    />
  )
}
