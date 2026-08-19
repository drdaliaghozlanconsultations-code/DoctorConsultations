import { NextResponse } from 'next/server'
import { getBookingsCollection, getPaymentProcessesCollection, getConsultationsCollection, BookingDoc } from '@/lib/db'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

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
      paymentMethod = 'instapay',
      paymentReceiptUrl,
      paymentReceiptPublicId,
      amount,
      currency = 'EGP',
    } = body

    if (!patientName || !email || !phone || !date || !time) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required fields' },
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

    const bookingsCollection = await getBookingsCollection()
    const newBooking: BookingDoc = {
      reference,
      consultationId: consultationId || '',
      consultationTitle,
      patientName: patientName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: (whatsapp || phone).trim(),
      country: country || 'EG',
      date,
      time,
      notes: notes?.trim() || '',
      status: 'pending',
      paymentMethod: paymentMethod as 'instapay' | 'card',
      amount: Number(amount) || 0,
      currency: (currency?.toUpperCase() === 'USD' ? 'USD' : 'EGP') as 'EGP' | 'USD',
      paymentReceiptUrl: paymentReceiptUrl || '',
      paymentReceiptPublicId: paymentReceiptPublicId || '',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const insertResult = await bookingsCollection.insertOne(newBooking)

    // Also record in payment_processes collection
    const paymentProcessesCollection = await getPaymentProcessesCollection()
    await paymentProcessesCollection.insertOne({
      bookingId: insertResult.insertedId.toString(),
      bookingReference: reference,
      method: paymentMethod as 'instapay' | 'card',
      amount: Number(amount) || 0,
      currency: (currency?.toUpperCase() === 'USD' ? 'USD' : 'EGP') as 'EGP' | 'USD',
      receiptUrl: paymentReceiptUrl || '',
      receiptPublicId: paymentReceiptPublicId || '',
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      reference,
      bookingId: insertResult.insertedId.toString(),
    })
  } catch (error: any) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 500 },
    )
  }
}
