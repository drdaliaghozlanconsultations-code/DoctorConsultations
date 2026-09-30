import { NextRequest, NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'
import { getPaymentSession, isPaymentSuccessful, isPaymentFailed } from '@/lib/kashier'

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
    if (currentBooking.paymentStatus === 'awaiting_payment' && currentBooking.paymentMethod === 'card') {
      const now = new Date()
      const isStale =
        currentBooking.createdAt &&
        now.getTime() - new Date(currentBooking.createdAt).getTime() > 30 * 60 * 1000

      if (currentBooking.kashierSessionId) {
        try {
          const sessionDetails = await getPaymentSession(currentBooking.kashierSessionId)
          const isPaid = isPaymentSuccessful(sessionDetails)
          const isFailed =
            isPaymentFailed(sessionDetails) ||
            (sessionDetails.expireAt && new Date(sessionDetails.expireAt as string) < now)

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
            const failureMsg =
              (sessionDetails as any).declinedReason ||
              (sessionDetails as any).status ||
              'FAILED'
            await bookingsCollection.updateOne(
              { _id: currentBooking._id },
              {
                $set: {
                  paymentStatus: 'failed',
                  status: 'failed',
                  kashierResponseMessage: failureMsg,
                  updatedAt: now,
                },
              },
            )
            const paymentProcessesCollection = await getPaymentProcessesCollection()
            await paymentProcessesCollection.updateOne(
              { bookingReference: currentBooking.reference },
              {
                $set: {
                  status: 'failed',
                  kashierResponseMessage: failureMsg,
                  processedAt: now,
                },
              },
            )
            currentBooking = {
              ...currentBooking,
              paymentStatus: 'failed',
              status: 'failed',
              kashierResponseMessage: failureMsg,
            }
          }
        } catch (sessionErr) {
          console.warn('[Booking Lookup] Session query warning:', sessionErr)
          // If query fails but the booking is already stale (>30 mins), expire it
          if (isStale) {
            await bookingsCollection.updateOne(
              { _id: currentBooking._id },
              {
                $set: {
                  paymentStatus: 'failed',
                  status: 'failed',
                  kashierResponseMessage: 'EXPIRED',
                  updatedAt: now,
                },
              },
            )
            const paymentProcessesCollection = await getPaymentProcessesCollection()
            await paymentProcessesCollection.updateOne(
              { bookingReference: currentBooking.reference },
              {
                $set: {
                  status: 'failed',
                  kashierResponseMessage: 'EXPIRED',
                  processedAt: now,
                },
              },
            )
            currentBooking = {
              ...currentBooking,
              paymentStatus: 'failed',
              status: 'failed',
              kashierResponseMessage: 'EXPIRED',
            }
          }
        }
      } else if (isStale) {
        // No sessionId and stale (>30m)
        await bookingsCollection.updateOne(
          { _id: currentBooking._id },
          {
            $set: {
              paymentStatus: 'failed',
              status: 'failed',
              kashierResponseMessage: 'EXPIRED',
              updatedAt: now,
            },
          },
        )
        const paymentProcessesCollection = await getPaymentProcessesCollection()
        await paymentProcessesCollection.updateOne(
          { bookingReference: currentBooking.reference },
          {
            $set: {
              status: 'failed',
              kashierResponseMessage: 'EXPIRED',
              processedAt: now,
            },
          },
        )
        currentBooking = {
          ...currentBooking,
          paymentStatus: 'failed',
          status: 'failed',
          kashierResponseMessage: 'EXPIRED',
        }
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
