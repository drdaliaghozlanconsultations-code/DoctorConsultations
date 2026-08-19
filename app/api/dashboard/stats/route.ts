import { NextResponse } from 'next/server'
import { getBookingsCollection, getConsultationsCollection, getVisitsCollection } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const bookingsCollection = await getBookingsCollection()
    const consultationsCollection = await getConsultationsCollection()
    const visitsCollection = await getVisitsCollection()

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      pendingBookings,
      confirmedBookings,
      totalBookings,
      activeSessions,
      visitsToday,
      totalVisits,
      recentBookings,
    ] = await Promise.all([
      bookingsCollection.countDocuments({ status: 'pending' }),
      bookingsCollection.countDocuments({ status: 'confirmed' }),
      bookingsCollection.countDocuments({}),
      consultationsCollection.countDocuments({ isActive: true }),
      visitsCollection.countDocuments({ timestamp: { $gte: startOfToday } }),
      visitsCollection.countDocuments({}),
      bookingsCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        pendingBookings,
        confirmedBookings,
        totalBookings,
        activeSessions,
        visitsToday,
        totalVisits,
        recentBookings: recentBookings.map((b) => ({
          ...b,
          _id: b._id?.toString(),
        })),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 },
    )
  }
}
