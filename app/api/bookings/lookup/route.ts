import { NextRequest, NextResponse } from 'next/server'
import { getBookingsCollection } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/lookup?ref=DR.DALIA-XXXXXX
 *
 * Public endpoint to look up a booking by reference.
 * Returns limited fields for the confirmation page.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const ref = url.searchParams.get('ref')

  if (!ref) {
    return NextResponse.json(
      { success: false, error: 'Missing booking reference' },
      { status: 400 },
    )
  }

  try {
    const bookingsCollection = await getBookingsCollection()
    const booking = await bookingsCollection.findOne({ reference: ref })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      )
    }

    let currentBooking = booking

    // If still awaiting_payment with a Kashier session, check if it concluded
    if (currentBooking.paymentStatus === 'awaiting_payment' && currentBooking.kashierSessionId) {
      try {
        const kashierBase =
          process.env.KASHIER_MODE === 'live'
            ? 'https://api.kashier.io'
            : 'https://test-api.kashier.io'
        const res = await fetch(
          `${kashierBase}/v3/payment/sessions/${currentBooking.kashierSessionId}`,
          { cache: 'no-store' },
        )
        const json = await res.json()
        const session = json.data || json
        const now = new Date()

        const status = (session.status || '').toUpperCase()
        const isPaid =
          status === 'SUCCESS' ||
          status === 'PAID' ||
          status === 'APPROVED'

        const isExpired = session.expireAt && new Date(session.expireAt) < now
        const isFailed =
          status === 'FAILURE' ||
          status === 'FAILED' ||
          status === 'EXPIRED' ||
          status === 'ABANDONED' ||
          json.error?.cause === 'Session expired' ||
          isExpired

        if (isPaid) {
          const { confirmBookingAndCreateCalendar } = await import(
            '@/lib/google-calendar'
          )
          const updated = await confirmBookingAndCreateCalendar(
            currentBooking.reference,
            currentBooking.kashierSessionId,
          )
          if (updated) currentBooking = updated
        } else if (isFailed) {
          await bookingsCollection.updateOne(
            { _id: currentBooking._id },
            { $set: { paymentStatus: 'failed', status: 'failed', updatedAt: now } },
          )
          const { getPaymentProcessesCollection } = await import('@/lib/db')
          const paymentProcessesCollection = await getPaymentProcessesCollection()
          await paymentProcessesCollection.updateOne(
            { bookingReference: currentBooking.reference },
            {
              $set: {
                status: 'failed',
                kashierResponseMessage: session.declinedReason || 'FAILED',
                processedAt: now,
              },
            },
          )
          currentBooking = {
            ...currentBooking,
            paymentStatus: 'failed',
            status: 'failed',
          }
        }
      } catch (sessionErr) {
        console.warn('[Booking Lookup] Session query warning:', sessionErr)
      }
    }

    // Return only safe, limited fields for the public-facing confirmation page
    return NextResponse.json({
      success: true,
      data: {
        reference: currentBooking.reference,
        consultationTitle: currentBooking.consultationTitle,
        date: currentBooking.date,
        time: currentBooking.time,
        patientName: currentBooking.patientName,
        email: currentBooking.email,
        whatsapp: currentBooking.whatsapp,
        status: currentBooking.status,
        paymentStatus: currentBooking.paymentStatus,
        paymentMethod: currentBooking.paymentMethod,
        currency: currentBooking.currency,
        amount: currentBooking.amount,
        googleMeetLink: currentBooking.googleMeetLink,
      },
    })
  } catch (error: any) {
    console.error('Booking lookup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to look up booking' },
      { status: 500 },
    )
  }
}
