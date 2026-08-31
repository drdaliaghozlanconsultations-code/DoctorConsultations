import { NextRequest, NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'
import { queryTransaction, isPaymentSuccessful } from '@/lib/paytabs'

export const dynamic = 'force-dynamic'

/**
 * Handle PayTabs Return (both GET and POST).
 *
 * PayTabs redirects the customer's browser here after completing payment.
 * We extract tranRef / cartId, query PayTabs API to verify status if needed,
 * update the database, and redirect to the confirmation page.
 */
async function handleReturn(request: NextRequest) {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') || 'en'

  let tranRef =
    url.searchParams.get('tranRef') ||
    url.searchParams.get('tran_ref') ||
    url.searchParams.get('tranId') ||
    url.searchParams.get('tran_id')

  let cartId =
    url.searchParams.get('ref') ||
    url.searchParams.get('cartId') ||
    url.searchParams.get('cart_id') ||
    url.searchParams.get('cartID')

  // If PayTabs returned data via POST body
  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData()
        tranRef =
          (formData.get('tranRef') as string) ||
          (formData.get('tran_ref') as string) ||
          (formData.get('tranId') as string) ||
          (formData.get('tran_id') as string) ||
          tranRef

        cartId =
          (formData.get('ref') as string) ||
          (formData.get('cartId') as string) ||
          (formData.get('cart_id') as string) ||
          (formData.get('cartID') as string) ||
          cartId
      } else if (contentType.includes('application/json')) {
        const body = await request.json()
        tranRef = body.tranRef || body.tran_ref || body.tranId || body.tran_id || tranRef
        cartId = body.ref || body.cartId || body.cart_id || body.cartID || cartId
      }
    } catch (e) {
      console.warn('[PayTabs Return] Could not parse POST body:', e)
    }
  }

  console.log('[PayTabs Return] Received:', { method: request.method, cartId, tranRef, url: request.url })

  const bookingsCollection = await getBookingsCollection()
  const paymentProcessesCollection = await getPaymentProcessesCollection()

  let booking = null
  if (cartId) {
    booking = await bookingsCollection.findOne({ reference: cartId })
  }
  if (!booking && tranRef) {
    booking = await bookingsCollection.findOne({ paytabsTranRef: tranRef })
  }

  if (!booking) {
    console.error('[PayTabs Return] Booking not found for:', { tranRef, cartId })
    return NextResponse.redirect(
      new URL(`/${locale}/booking?error=payment_not_found`, request.url),
    )
  }

  // If status is still awaiting_payment and we have tranRef, query PayTabs directly
  if (booking.paymentStatus === 'awaiting_payment' && tranRef) {
    try {
      const queryResult = await queryTransaction(tranRef)
      const success = isPaymentSuccessful(queryResult)
      const now = new Date()

      if (success) {
        const { confirmBookingAndCreateCalendar } = await import('@/lib/google-calendar')
        const updated = await confirmBookingAndCreateCalendar(booking.reference, tranRef)
        if (updated) {
          booking = updated
        }
      } else {
        await bookingsCollection.updateOne(
          { _id: booking._id },
          {
            $set: {
              paytabsTranRef: tranRef,
              paymentStatus: 'failed',
              status: 'failed',
              updatedAt: now,
            },
          },
        )
        booking.paymentStatus = 'failed'
        booking.status = 'failed'
      }

      await paymentProcessesCollection.updateOne(
        { bookingReference: booking.reference },
        {
          $set: {
            paytabsTranRef: tranRef,
            paytabsResponseCode: queryResult.payment_result?.response_code || '',
            paytabsResponseMessage: queryResult.payment_result?.response_message || '',
            status: success ? 'verified' : 'failed',
            processedAt: now,
          },
        },
      )
    } catch (queryErr) {
      console.error('[PayTabs Return] Failed to query transaction:', queryErr)
    }
  } else if (booking.paymentStatus === 'verified' && !booking.googleCalendarEventId) {
    // If webhook verified the payment but calendar event wasn't created yet
    try {
      const { confirmBookingAndCreateCalendar } = await import('@/lib/google-calendar')
      const updated = await confirmBookingAndCreateCalendar(booking.reference, tranRef || booking.paytabsTranRef)
      if (updated) {
        booking = updated
      }
    } catch (e) {
      console.error('[PayTabs Return] Error creating calendar event:', e)
    }
  }

  const finalStatus =
    booking.paymentStatus === 'verified'
      ? 'success'
      : booking.paymentStatus === 'rejected' || booking.paymentStatus === 'failed'
      ? 'failed'
      : 'pending'

  return NextResponse.redirect(
    new URL(
      `/${locale}/booking/confirmation?ref=${booking.reference}&status=${finalStatus}`,
      request.url,
    ),
  )
}

export async function GET(request: NextRequest) {
  return handleReturn(request)
}

export async function POST(request: NextRequest) {
  return handleReturn(request)
}
