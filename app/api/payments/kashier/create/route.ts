import { NextResponse } from 'next/server'
import {
  getBookingsCollection,
  getPaymentProcessesCollection,
  getConsultationsCollection,
  type BookingDoc,
} from '@/lib/db'
import { createPaymentSession } from '@/lib/kashier'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/kashier/create
 *
 * Creates a pending booking in MongoDB and initiates a Kashier
 * Payment Session (hosted checkout). Returns the sessionUrl so the
 * client can redirect the patient to Kashier.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      consultationId,
      patientName,
      email,
      phone,
      whatsapp,
      country,
      date,
      time,
      notes,
      amount,
      currency = 'USD',
      locale = 'en',
    } = body

    // Validate required fields
    if (!patientName || !email || !phone || !date || !time) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required fields' },
        { status: 400 },
      )
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount' },
        { status: 400 },
      )
    }

    // Generate unique reference
    const reference = `DR.DALIA-${Math.floor(100000 + Math.random() * 900000)}`

    // Lookup consultation details
    let consultationTitle = { en: 'Medical Consultation', ar: 'استشارة طبية' }
    if (consultationId) {
      try {
        const consultationsCol = await getConsultationsCollection()
        const consult = await consultationsCol.findOne({
          _id: new ObjectId(consultationId),
        })
        if (consult) {
          consultationTitle = consult.title
        }
      } catch {
        // fallback to default if not an ObjectId
      }
    }

    // 1. Create a pending booking in MongoDB
    const bookingsCollection = await getBookingsCollection()
    const newBooking: BookingDoc = {
      reference,
      consultationId: consultationId || '',
      consultationTitle,
      patientName: patientName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: (whatsapp || phone).trim(),
      country: country || 'US',
      date,
      time,
      notes: notes?.trim() || '',
      status: 'pending',
      paymentMethod: 'card',
      amount: Number(amount),
      currency: (currency?.toUpperCase() === 'EGP' ? 'EGP' : 'USD') as 'EGP' | 'USD',
      paymentStatus: 'awaiting_payment',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const insertResult = await bookingsCollection.insertOne(newBooking)

    // 2. Create payment process record
    const paymentProcessesCollection = await getPaymentProcessesCollection()
    await paymentProcessesCollection.insertOne({
      bookingId: insertResult.insertedId.toString(),
      bookingReference: reference,
      method: 'card',
      amount: Number(amount),
      currency: newBooking.currency,
      status: 'awaiting_payment',
      createdAt: new Date(),
    })

    // 3. Build merchant redirect URL (Kashier requires HTTPS)
    const rawOrigin =
      request.headers.get('origin') ||
      (request.headers.get('referer') ? new URL(request.headers.get('referer')!).origin : null) ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      ''
    const publicDomain =
      (process.env.KASHIER_WEBHOOK_URL?.startsWith('https://') ? process.env.KASHIER_WEBHOOK_URL : null) ||
      (rawOrigin.startsWith('https://') ? rawOrigin : null) ||
      (process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://') ? process.env.NEXT_PUBLIC_BASE_URL : null) ||
      'https://drdaliaghozlan.com'

    const merchantRedirect = `${publicDomain.replace(/\/$/, '')}/api/payments/kashier/return?locale=${locale}&ref=${reference}`

    // 4. Create Kashier payment session
    const sessionResponse = await createPaymentSession({
      order: reference,
      amount: Number(amount),
      currency: newBooking.currency,
      merchantRedirect,
      customer: {
        reference: email.trim(),
        name: patientName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      },
      display: locale === 'ar' ? 'ar' : 'en',
    })

    const sessionId = sessionResponse.sessionId || ''

    // 5. Store the Kashier session reference
    await bookingsCollection.updateOne(
      { _id: insertResult.insertedId },
      {
        $set: {
          kashierSessionId: sessionId,
          updatedAt: new Date(),
        },
      },
    )

    await paymentProcessesCollection.updateOne(
      { bookingReference: reference },
      {
        $set: {
          kashierSessionId: sessionId,
        },
      },
    )

    return NextResponse.json({
      success: true,
      sessionUrl: sessionResponse.sessionUrl,
      redirectUrl: sessionResponse.sessionUrl,
      reference,
      sessionId,
    })
  } catch (error: any) {
    console.error('Kashier create payment error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate payment' },
      { status: 500 },
    )
  }
}
