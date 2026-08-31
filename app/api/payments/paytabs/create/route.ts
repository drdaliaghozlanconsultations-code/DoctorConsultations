import { NextResponse } from 'next/server'
import {
  getBookingsCollection,
  getPaymentProcessesCollection,
  getConsultationsCollection,
  type BookingDoc,
} from '@/lib/db'
import { createPaymentPage } from '@/lib/paytabs'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/paytabs/create
 *
 * Creates a pending booking in MongoDB and initiates a PayTabs
 * hosted-payment-page session. Returns the redirect URL so the
 * client can send the patient to PayTabs.
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

    // 3. Build callback and return URLs
    // Supports ngrok (e.g. PAYTABS_CALLBACK_URL or NEXT_PUBLIC_BASE_URL) in dev, and https://drdaliaghozlan.com in production.
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const publicDomain =
      process.env.PAYTABS_CALLBACK_URL ||
      (process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://') ? process.env.NEXT_PUBLIC_BASE_URL : null) ||
      'https://drdaliaghozlan.com'

    const callbackUrl = `${publicDomain.replace(/\/$/, '')}/api/payments/paytabs/callback`
    const returnUrl = `${origin.replace(/\/$/, '')}/api/payments/paytabs/return?locale=${locale}&ref=${reference}`

    // 4. Create PayTabs payment session
    const consultationName = locale === 'ar' ? consultationTitle.ar : consultationTitle.en
    const paytabsResponse = await createPaymentPage({
      cartId: reference,
      cartAmount: Number(amount),
      cartCurrency: newBooking.currency,
      cartDescription: `Consultation: ${consultationName} - ${reference}`,
      customer: {
        name: patientName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: (country || 'EG').toUpperCase(),
      },
      callbackUrl,
      returnUrl,
    })

    // 5. Store the PayTabs transaction reference
    await bookingsCollection.updateOne(
      { _id: insertResult.insertedId },
      {
        $set: {
          paytabsTranRef: paytabsResponse.tran_ref,
          updatedAt: new Date(),
        },
      },
    )

    await paymentProcessesCollection.updateOne(
      { bookingReference: reference },
      {
        $set: {
          paytabsTranRef: paytabsResponse.tran_ref,
        },
      },
    )

    return NextResponse.json({
      success: true,
      redirectUrl: paytabsResponse.redirect_url,
      reference,
      tranRef: paytabsResponse.tran_ref,
    })
  } catch (error: any) {
    console.error('PayTabs create payment error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate payment' },
      { status: 500 },
    )
  }
}
