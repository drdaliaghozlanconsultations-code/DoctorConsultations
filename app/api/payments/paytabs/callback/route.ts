import { NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'
import { isPaymentSuccessful, type PayTabsCallbackData } from '@/lib/paytabs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/paytabs/callback
 *
 * Server-to-server callback from PayTabs after the patient completes
 * (or fails) a payment. This updates the booking and payment records
 * in MongoDB.
 *
 * PayTabs sends this regardless of payment outcome (success/fail/cancel).
 */
export async function POST(request: Request) {
  try {
    const data = (await request.json()) as PayTabsCallbackData

    console.log('[PayTabs Callback] Received:', {
      tran_ref: data.tran_ref,
      cart_id: data.cart_id,
      response_status: data.payment_result?.response_status,
      response_code: data.payment_result?.response_code,
      response_message: data.payment_result?.response_message,
    })

    const { tran_ref, cart_id, payment_result } = data

    if (!tran_ref || !cart_id) {
      console.error('[PayTabs Callback] Missing tran_ref or cart_id')
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const bookingsCollection = await getBookingsCollection()
    const paymentProcessesCollection = await getPaymentProcessesCollection()

    const success = isPaymentSuccessful(data)
    const now = new Date()

    if (success) {
      // Auto-confirm booking and create Google Calendar event + Meet link
      const { confirmBookingAndCreateCalendar } = await import('@/lib/google-calendar')
      await confirmBookingAndCreateCalendar(cart_id, tran_ref)
    } else {
      // Update booking to failed
      await bookingsCollection.updateOne(
        { reference: cart_id },
        {
          $set: {
            paytabsTranRef: tran_ref,
            paymentStatus: 'failed',
            status: 'failed',
            updatedAt: now,
          },
        },
      )
    }

    // Update the payment process record
    await paymentProcessesCollection.updateOne(
      { bookingReference: cart_id },
      {
        $set: {
          paytabsTranRef: tran_ref,
          paytabsResponseCode: payment_result?.response_code || '',
          paytabsResponseMessage: payment_result?.response_message || '',
          status: success ? 'verified' : 'failed',
          processedAt: now,
        },
      },
    )

    console.log(
      `[PayTabs Callback] Booking ${cart_id} ${success ? 'CONFIRMED' : 'REJECTED'} (tran_ref: ${tran_ref})`,
    )

    // PayTabs expects a 200 response
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[PayTabs Callback] Error:', error)
    // Still return 200 to avoid PayTabs retrying indefinitely
    return NextResponse.json({ success: false, error: error.message }, { status: 200 })
  }
}
