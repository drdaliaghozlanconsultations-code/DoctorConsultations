import { NextRequest, NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payments/expire
 *
 * Vercel Cron Job — runs once a day (configured in vercel.json).
 * Marks card payment bookings that have been in "awaiting_payment"
 * status for more than 1 hour as "failed".
 *
 * Protected by CRON_SECRET in production so only Vercel can trigger it.
 * In development, the check is skipped for manual testing.
 */
export async function GET(request: NextRequest) {
  // Verify Vercel CRON_SECRET in production
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }
  }
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const bookingsCollection = await getBookingsCollection()
    const paymentProcessesCollection = await getPaymentProcessesCollection()

    // Find bookings with card payment that are still awaiting_payment after 1 hour
    const staleBookings = await bookingsCollection
      .find({
        paymentMethod: 'card',
        paymentStatus: 'awaiting_payment',
        createdAt: { $lt: oneHourAgo },
      })
      .toArray()

    if (staleBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stale payments to expire',
        expired: 0,
      })
    }

    const now = new Date()
    const references = staleBookings.map((b) => b.reference)

    // Batch update all stale bookings
    await bookingsCollection.updateMany(
      {
        reference: { $in: references },
        paymentStatus: 'awaiting_payment',
      },
      {
        $set: {
          paymentStatus: 'failed',
          status: 'failed',
          updatedAt: now,
        },
      },
    )

    // Batch update all related payment processes
    await paymentProcessesCollection.updateMany(
      {
        bookingReference: { $in: references },
        status: 'awaiting_payment',
      },
      {
        $set: {
          status: 'failed',
          processedAt: now,
        },
      },
    )

    console.log(
      `[Payment Expire Cron] Expired ${staleBookings.length} stale payments:`,
      references,
    )

    return NextResponse.json({
      success: true,
      message: `Expired ${staleBookings.length} stale payment(s)`,
      expired: staleBookings.length,
      references,
    })
  } catch (error: any) {
    console.error('[Payment Expire Cron] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
