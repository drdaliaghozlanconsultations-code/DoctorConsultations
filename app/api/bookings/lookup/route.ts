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

    // Return only safe, limited fields for the public-facing confirmation page
    return NextResponse.json({
      success: true,
      data: {
        reference: booking.reference,
        consultationTitle: booking.consultationTitle,
        date: booking.date,
        time: booking.time,
        patientName: booking.patientName,
        email: booking.email,
        whatsapp: booking.whatsapp,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        currency: booking.currency,
        amount: booking.amount,
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
