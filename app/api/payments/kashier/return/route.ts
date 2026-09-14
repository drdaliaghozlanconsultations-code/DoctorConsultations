import { NextRequest, NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection } from '@/lib/db'
import { getPaymentSession, isPaymentSuccessful } from '@/lib/kashier'

export const dynamic = 'force-dynamic'

function getRedirectBaseUrl(request: NextRequest, clientOrigin?: string | null): string {
  // Check x-forwarded-host from reverse proxy / ngrok first
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  // Check host header
  const host = request.headers.get('host')
  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')
    const proto = isLocal ? 'http' : (request.headers.get('x-forwarded-proto') || 'https')
    return `${proto}://${host}`
  }

  // Fallback to request URL origin if valid
  try {
    const parsedOrigin = new URL(request.url).origin
    if (parsedOrigin && !parsedOrigin.includes('undefined')) {
      return parsedOrigin
    }
  } catch {}

  // Only use clientOrigin if it's HTTPS (never downgrade from HTTPS to HTTP localhost)
  if (clientOrigin && clientOrigin.startsWith('https://')) {
    return clientOrigin.replace(/\/$/, '')
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  }

  return 'http://localhost:3000'
}

/**
 * Handle Kashier Return (both GET and POST).
 *
 * Kashier redirects the customer's browser here after completing payment.
 * We extract order / ref / sessionId, query Kashier API to verify status if needed,
 * update the database, and redirect directly to the booking confirmation page.
 */
async function handleReturn(request: NextRequest) {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') || 'en'
  const clientOrigin = url.searchParams.get('origin')

  let ref =
    url.searchParams.get('ref') ||
    url.searchParams.get('order') ||
    url.searchParams.get('orderId') ||
    url.searchParams.get('merchantOrderId')

  let sessionId =
    url.searchParams.get('sessionId') ||
    url.searchParams.get('id') ||
    url.searchParams.get('session_id')

  let paymentStatus =
    url.searchParams.get('paymentStatus') ||
    url.searchParams.get('status')

  let transactionId =
    url.searchParams.get('transactionId') ||
    url.searchParams.get('kashierTxId')

  // If Kashier returned data via POST body
  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || ''
      if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')
      ) {
        const formData = await request.formData()
        ref =
          (formData.get('ref') as string) ||
          (formData.get('order') as string) ||
          (formData.get('orderId') as string) ||
          ref

        sessionId =
          (formData.get('sessionId') as string) ||
          (formData.get('id') as string) ||
          sessionId

        paymentStatus =
          (formData.get('paymentStatus') as string) ||
          (formData.get('status') as string) ||
          paymentStatus

        transactionId =
          (formData.get('transactionId') as string) ||
          (formData.get('kashierTxId') as string) ||
          transactionId
      } else if (contentType.includes('application/json')) {
        const body = await request.json()
        ref = body.ref || body.order || body.orderId || ref
        sessionId = body.sessionId || body.id || sessionId
        paymentStatus = body.paymentStatus || body.status || paymentStatus
        transactionId = body.transactionId || body.kashierTxId || transactionId
      }
    } catch (e) {
      console.warn('[Kashier Return] Could not parse POST body:', e)
    }
  }

  console.log('[Kashier Return] Received:', {
    method: request.method,
    ref,
    sessionId,
    paymentStatus,
    transactionId,
    url: request.url,
  })

  const bookingsCollection = await getBookingsCollection()
  const paymentProcessesCollection = await getPaymentProcessesCollection()

  let booking = null
  if (ref) {
    booking = await bookingsCollection.findOne({ reference: ref })
  }
  if (!booking && sessionId) {
    booking = await bookingsCollection.findOne({ kashierSessionId: sessionId })
  }

  const baseUrl = getRedirectBaseUrl(request, clientOrigin)

  if (!booking) {
    console.error('[Kashier Return] Booking not found for:', { ref, sessionId })
    return NextResponse.redirect(`${baseUrl}/${locale}/booking/confirmation?error=payment_not_found`, 303)
  }

  const activeSessionId = sessionId || booking.kashierSessionId
  const now = new Date()

  const rawStatus = (paymentStatus || '').toUpperCase()
  const isSuccess = ['SUCCESS', 'APPROVED', 'PAID'].includes(rawStatus)
  const isFailed = ['FAILED', 'DECLINED', 'REJECTED', 'EXPIRED', 'ABANDONED', 'CANCELLED'].includes(rawStatus)

  if (isSuccess) {
    // 1. Confirm booking and create calendar event + Meet link
    try {
      const { confirmBookingAndCreateCalendar } = await import(
        '@/lib/google-calendar'
      )
      const updated = await confirmBookingAndCreateCalendar(
        booking.reference,
        activeSessionId,
      )
      if (updated) {
        booking = updated
      }
    } catch (calErr) {
      console.error('[Kashier Return] Error in confirmBookingAndCreateCalendar:', calErr)
    }

    // 2. Update payment process record to verified
    await paymentProcessesCollection.updateOne(
      { bookingReference: booking.reference },
      {
        $set: {
          kashierSessionId: activeSessionId,
          kashierTransactionId: transactionId || '',
          kashierResponseMessage: paymentStatus || 'SUCCESS',
          status: 'verified',
          verifiedAt: now,
          processedAt: now,
        },
      },
    )
    booking.paymentStatus = 'verified'
    booking.status = 'confirmed'
  } else if (isFailed) {
    // 1. Mark booking as failed
    await bookingsCollection.updateOne(
      { _id: booking._id },
      {
        $set: {
          paymentStatus: 'failed',
          status: 'failed',
          updatedAt: now,
        },
      },
    )
    booking.paymentStatus = 'failed'
    booking.status = 'failed'

    // 2. Mark payment process record as failed
    await paymentProcessesCollection.updateOne(
      { bookingReference: booking.reference },
      {
        $set: {
          kashierSessionId: activeSessionId,
          kashierTransactionId: transactionId || '',
          kashierResponseMessage: paymentStatus || 'FAILED',
          status: 'failed',
          processedAt: now,
        },
      },
    )
  } else if (
    booking.paymentStatus === 'verified' &&
    !booking.googleCalendarEventId
  ) {
    // If already verified but calendar event wasn't created yet
    try {
      const { confirmBookingAndCreateCalendar } = await import(
        '@/lib/google-calendar'
      )
      const updated = await confirmBookingAndCreateCalendar(
        booking.reference,
        activeSessionId,
      )
      if (updated) {
        booking = updated
      }
    } catch (e) {
      console.error('[Kashier Return] Error creating calendar event:', e)
    }
  }

  const finalStatus =
    booking.paymentStatus === 'verified'
      ? 'success'
      : booking.paymentStatus === 'rejected' ||
        booking.paymentStatus === 'failed'
      ? 'failed'
      : 'pending'

  const targetUrl = `${baseUrl}/${locale}/booking/confirmation?ref=${booking.reference}&status=${finalStatus}`

  console.log('[Kashier Return] Redirecting directly to:', targetUrl)
  return NextResponse.redirect(targetUrl, 303)
}

export async function GET(request: NextRequest) {
  return handleReturn(request)
}

export async function POST(request: NextRequest) {
  return handleReturn(request)
}
