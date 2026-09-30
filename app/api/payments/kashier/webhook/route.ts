import { NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'
import { isPaymentSuccessful, getPaymentSession, resolveFailureReason } from '@/lib/kashier'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/kashier/webhook
 *
 * Server-to-server webhook from Kashier after the patient completes
 * (or fails) a payment. Updates the booking and payment records in MongoDB,
 * and triggers Google Calendar event creation on success.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    let payload: Record<string, any> = {}

    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.warn('[Kashier Webhook] Non-JSON payload received:', rawBody)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log('[Kashier Webhook] Received payload:', JSON.stringify(payload))

    // Handle payload differences (nested in data or flat)
    const eventData = payload.data || payload

    const orderRef =
      eventData.order ||
      eventData.merchantOrderId ||
      eventData.orderId ||
      payload.order

    const sessionId =
      eventData.sessionId ||
      eventData.id ||
      payload.sessionId ||
      payload.id

    const transactionId =
      eventData.transactionId ||
      eventData.kashierTxId ||
      payload.transactionId

    if (!orderRef && !sessionId) {
      console.error('[Kashier Webhook] Missing order reference or sessionId')
      return NextResponse.json({ error: 'Missing identifiers' }, { status: 400 })
    }

    const bookingsCollection = await getBookingsCollection()
    const paymentProcessesCollection = await getPaymentProcessesCollection()

    let booking = null
    if (orderRef) {
      booking = await bookingsCollection.findOne({ reference: orderRef })
    }
    if (!booking && sessionId) {
      booking = await bookingsCollection.findOne({ kashierSessionId: sessionId })
    }

    if (!booking) {
      console.warn('[Kashier Webhook] Booking not found for:', { orderRef, sessionId })
      // Return 200 to acknowledge webhook even if booking not found
      return NextResponse.json({ received: true, note: 'booking_not_found' }, { status: 200 })
    }

    // Determine success
    let success = isPaymentSuccessful(eventData)

    // If indeterminate and we have a sessionId, query session directly from Kashier
    if (!success && (sessionId || booking.kashierSessionId)) {
      try {
        const sessionDetails = await getPaymentSession(sessionId || booking.kashierSessionId)
        success = isPaymentSuccessful(sessionDetails)
      } catch (err) {
        console.warn('[Kashier Webhook] Query session fallback error:', err)
      }
    }

    const now = new Date()
    const reference = booking.reference

    const incomingFailureMsg =
      eventData.failureReason ||
      eventData.declinedReason ||
      eventData.message ||
      eventData.status ||
      eventData.paymentStatus ||
      'FAILED'

    if (success) {
      // Auto-confirm booking and create Google Calendar event + Meet link
      const { confirmBookingAndCreateCalendar } = await import(
        '@/lib/google-calendar'
      )
      await confirmBookingAndCreateCalendar(
        reference,
        sessionId || transactionId || booking.kashierSessionId,
      )
    } else {
      // Resolve best failure message, protecting against late generic webhook overwrites (e.g. 'FAILED', 'EXPIRED')
      const finalFailureMsg = resolveFailureReason(
        incomingFailureMsg,
        booking.kashierResponseMessage,
      )

      // Only mark as failed if booking was not already verified or confirmed
      if (booking.paymentStatus !== 'verified' && booking.status !== 'confirmed') {
        const isAlreadyFailed =
          booking.paymentStatus === 'failed' && booking.status === 'failed'

        // Only update database if the booking isn't already failed or if we have a new/better failure reason
        const shouldUpdate =
          !isAlreadyFailed || (finalFailureMsg && finalFailureMsg !== booking.kashierResponseMessage)

        if (shouldUpdate) {
          await bookingsCollection.updateOne(
            { reference },
            {
              $set: {
                paymentStatus: 'failed',
                status: 'failed',
                kashierResponseMessage: finalFailureMsg,
                updatedAt: now,
              },
            },
          )
        }
      }
    }

    // Update payment process record, preserving any detailed failure reason
    const existingProc = await paymentProcessesCollection.findOne({
      bookingReference: reference,
    })
    const procFailureMsg = resolveFailureReason(
      incomingFailureMsg,
      existingProc?.kashierResponseMessage || booking.kashierResponseMessage,
    )

    await paymentProcessesCollection.updateOne(
      { bookingReference: reference },
      {
        $set: {
          ...(sessionId ? { kashierSessionId: sessionId } : {}),
          ...(transactionId ? { kashierTransactionId: transactionId } : {}),
          kashierResponseMessage: success ? (eventData.status || 'SUCCESS') : procFailureMsg,
          ...(booking.paymentStatus === 'verified' ? {} : { status: success ? 'verified' : 'failed' }),
          processedAt: now,
        },
      },
    )

    console.log(
      `[Kashier Webhook] Booking ${reference} processed. Success: ${success}`,
    )

    return NextResponse.json({ received: true, success })
  } catch (error: any) {
    console.error('[Kashier Webhook] Error handling webhook:', error)
    // Return 200 to prevent webhook spam on handler errors
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 200 },
    )
  }
}
