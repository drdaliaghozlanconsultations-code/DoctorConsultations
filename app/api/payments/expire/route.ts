import { NextRequest, NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'
import { getPaymentSession, isPaymentFailed, isPaymentSuccessful } from '@/lib/kashier'

export const dynamic = 'force-dynamic'

/**
 * GET/POST /api/payments/expire
 *
 * Cleanup routine & Cron Job:
 * 1. Checks active awaiting_payment card bookings with Kashier API to see if they concluded (failed/expired).
 * 2. Automatically marks card payment bookings that have been in "awaiting_payment"
 *    status for more than 30 minutes as "failed".
 *
 * Protected by CRON_SECRET in production so only authorized callers/Vercel can trigger it.
 * In development, the authorization check is skipped.
 */
async function handleExpire(request: NextRequest) {
  // Verify Vercel CRON_SECRET in production
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }
  }

  try {
    const now = new Date()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    const bookingsCollection = await getBookingsCollection()
    const paymentProcessesCollection = await getPaymentProcessesCollection()

    // 1. Check recent awaiting_payment bookings (created >5m ago) that have a kashierSessionId
    const recentCardBookings = await bookingsCollection
      .find({
        paymentMethod: 'card',
        paymentStatus: 'awaiting_payment',
        kashierSessionId: { $exists: true, $ne: '' },
        createdAt: { $lt: fiveMinutesAgo, $gte: thirtyMinutesAgo },
      })
      .limit(20)
      .toArray()

    const verifiedFailedRefs: string[] = []

    for (const b of recentCardBookings) {
      if (!b.kashierSessionId) continue
      try {
        const session = await getPaymentSession(b.kashierSessionId)
        if (isPaymentFailed(session) || (session.expireAt && new Date(session.expireAt as string) < now)) {
          verifiedFailedRefs.push(b.reference)
        } else if (isPaymentSuccessful(session)) {
          // If customer actually paid, confirm booking
          const { confirmBookingAndCreateCalendar } = await import(
            '@/lib/google-calendar'
          )
          await confirmBookingAndCreateCalendar(b.reference, b.kashierSessionId)
        }
      } catch (err) {
        // Ignore individual query error
      }
    }

    // 2. Find all card payment bookings that are still awaiting_payment after 30 minutes
    const staleBookings = await bookingsCollection
      .find({
        paymentMethod: 'card',
        paymentStatus: 'awaiting_payment',
        createdAt: { $lt: thirtyMinutesAgo },
      })
      .toArray()

    const allExpiredRefs = Array.from(
      new Set([...staleBookings.map((b) => b.reference), ...verifiedFailedRefs]),
    )

    if (allExpiredRefs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stale payments to expire',
        expired: 0,
      })
    }

    // Batch update all expired bookings
    await bookingsCollection.updateMany(
      {
        reference: { $in: allExpiredRefs },
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
        bookingReference: { $in: allExpiredRefs },
        status: 'awaiting_payment',
      },
      {
        $set: {
          status: 'failed',
          kashierResponseMessage: 'EXPIRED',
          processedAt: now,
        },
      },
    )

    console.log(
      `[Payment Expire] Expired ${allExpiredRefs.length} stale/failed payments:`,
      allExpiredRefs,
    )

    return NextResponse.json({
      success: true,
      message: `Expired ${allExpiredRefs.length} payment(s)`,
      expired: allExpiredRefs.length,
      references: allExpiredRefs,
    })
  } catch (error: any) {
    console.error('[Payment Expire] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handleExpire(request)
}

export async function POST(request: NextRequest) {
  return handleExpire(request)
}
