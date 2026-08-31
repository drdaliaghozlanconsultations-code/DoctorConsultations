import { NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payments/expire
 *
 * Cron-style endpoint — should be called every 30 minutes.
 * Marks card payment bookings that have been in "awaiting_payment"
 * status for more than 1 hour as "failed".
 *
 * Can be triggered by:
 * - Vercel Cron Jobs (vercel.json)
 * - External cron service (e.g. cron-job.org)
 * - Manual call: GET /api/payments/expire
 */
export async function GET() {
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
