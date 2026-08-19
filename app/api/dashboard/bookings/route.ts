import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getBookingsCollection, getPaymentProcessesCollection, getConsultationsCollection } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

// GET: List bookings with filters (admin + staff)
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const date = searchParams.get('date')

    const query: any = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (date) {
      query.date = date
    }

    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
      ]
    }

    const bookingsCollection = await getBookingsCollection()
    const items = await bookingsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    const formatted = items.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bookings' },
      { status: 500 },
    )
  }
}

// POST: Add manual booking from dashboard (admin + staff)
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      consultationId,
      patientName,
      email,
      phone,
      whatsapp,
      country = 'EG',
      date,
      time,
      notes,
      amount = 0,
      currency = 'EGP',
      status = 'confirmed',
      paymentStatus = 'verified',
    } = body

    if (!patientName || !phone || !date || !time) {
      return NextResponse.json(
        { success: false, error: 'Patient name, phone, date and time are required' },
        { status: 400 },
      )
    }

    let consultationTitle = { en: 'Direct Booking', ar: 'حجز مباشر' }
    if (consultationId) {
      try {
        const consultCol = await getConsultationsCollection()
        const c = await consultCol.findOne({ _id: new ObjectId(consultationId) })
        if (c) consultationTitle = c.title
      } catch {}
    }

    const reference = `DR.DALIA-${Math.floor(100000 + Math.random() * 900000)}`
    const bookingsCollection = await getBookingsCollection()

    const newDoc = {
      reference,
      consultationId: consultationId || '',
      consultationTitle,
      patientName: patientName.trim(),
      email: email?.trim() || '',
      phone: phone.trim(),
      whatsapp: (whatsapp || phone).trim(),
      country,
      date,
      time,
      notes: notes?.trim() || '',
      status,
      paymentMethod: 'instapay' as const,
      amount: Number(amount) || 0,
      currency: (currency === 'USD' ? 'USD' : 'EGP') as 'EGP' | 'USD',
      paymentStatus,
      verifiedBy: session.username,
      verifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const res = await bookingsCollection.insertOne(newDoc)

    return NextResponse.json({
      success: true,
      data: { ...newDoc, _id: res.insertedId.toString() },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add booking' },
      { status: 500 },
    )
  }
}

// PATCH: Update booking status or verify receipt (admin + staff)
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, paymentStatus, notes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    const updateDoc: any = {
      updatedAt: new Date(),
    }

    if (status) {
      updateDoc.status = status // 'pending' | 'confirmed' | 'cancelled'
    }

    if (paymentStatus) {
      updateDoc.paymentStatus = paymentStatus // 'pending' | 'verified' | 'rejected'
      updateDoc.verifiedBy = session.username
      updateDoc.verifiedAt = new Date()
    }

    if (notes !== undefined) {
      updateDoc.notes = notes
    }

    // If confirming → create Google Calendar event with Meet link
    if (status === 'confirmed') {
      try {
        const bookingsCollection = await getBookingsCollection()
        const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) })

        if (booking) {
          // Lookup consultation to get duration
          let durationMinutes = 30 // default
          if (booking.consultationId) {
            try {
              const consultCol = await getConsultationsCollection()
              const consultation = await consultCol.findOne({
                _id: new ObjectId(booking.consultationId),
              })
              if (consultation) {
                durationMinutes = consultation.durationMinutes
              }
            } catch {
              // use default duration
            }
          }

          const consultTitle =
            booking.consultationTitle?.en || 'Medical Consultation'

          const calendarResult = await createCalendarEvent({
            summary: `Dr. Dalia Ghozlan - ${consultTitle} with ${booking.patientName}`,
            description: [
              `Patient: ${booking.patientName}`,
              `Email: ${booking.email}`,
              `Phone: ${booking.phone}`,
              `WhatsApp: ${booking.whatsapp}`,
              `Consultation: ${consultTitle}`,
              `Reference: ${booking.reference}`,
              booking.notes ? `Notes: ${booking.notes}` : '',
            ]
              .filter(Boolean)
              .join('\n'),
            date: booking.date,
            time: booking.time,
            durationMinutes,
            patientEmail: booking.email || undefined,
            patientName: booking.patientName,
          })

          updateDoc.googleMeetLink = calendarResult.meetLink
          updateDoc.googleCalendarEventId = calendarResult.eventId
          updateDoc.googleCalendarEventLink = calendarResult.eventLink
        }
      } catch (calError: any) {
        console.error('Google Calendar event creation failed:', calError.message)
        // Don't block the confirmation — calendar is a nice-to-have
      }
    }

    // If cancelling → delete the Google Calendar event
    if (status === 'cancelled') {
      try {
        const bookingsCollection = await getBookingsCollection()
        const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) })

        if (booking?.googleCalendarEventId) {
          await deleteCalendarEvent(booking.googleCalendarEventId)
          updateDoc.googleMeetLink = ''
          updateDoc.googleCalendarEventId = ''
          updateDoc.googleCalendarEventLink = ''
        }
      } catch (calError: any) {
        console.error('Google Calendar event deletion failed:', calError.message)
      }
    }

    const bookingsCollection = await getBookingsCollection()
    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Also update payment_processes collection if paymentStatus was modified
    if (paymentStatus) {
      const paymentProcessesCollection = await getPaymentProcessesCollection()
      await paymentProcessesCollection.updateOne(
        { bookingId: id },
        {
          $set: {
            status: paymentStatus,
            verifiedBy: session.username,
            verifiedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      meetLink: updateDoc.googleMeetLink || null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update booking' },
      { status: 500 },
    )
  }
}

// DELETE: Delete booking (Admin only)
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required to delete bookings' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    const bookingsCollection = await getBookingsCollection()
    const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Also delete associated payment process record
    const paymentProcessesCollection = await getPaymentProcessesCollection()
    await paymentProcessesCollection.deleteMany({ bookingId: id })

    return NextResponse.json({ success: true, message: 'Booking deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete booking' },
      { status: 500 },
    )
  }
}
