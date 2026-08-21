import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getBookingsCollection, getPaymentProcessesCollection, getConsultationsCollection } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

// GET: List bookings with filters + server-side pagination (admin + staff)
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
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 15))

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

    const [totalCount, items] = await Promise.all([
      bookingsCollection.countDocuments(query),
      bookingsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ])

    const formatted = items.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    })
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
    let durationMinutes = 30
    if (consultationId) {
      try {
        const consultCol = await getConsultationsCollection()
        const c = await consultCol.findOne({ _id: new ObjectId(consultationId) })
        if (c) {
          consultationTitle = c.title
          if (c.durationMinutes) durationMinutes = c.durationMinutes
        }
      } catch {}
    }

    const reference = `DR.DALIA-${Math.floor(100000 + Math.random() * 900000)}`
    const bookingsCollection = await getBookingsCollection()

    let googleMeetLink = ''
    let googleCalendarEventId = ''
    let googleCalendarEventLink = ''

    // If adding directly as confirmed, auto-generate Google Calendar & Meet
    if (status === 'confirmed') {
      try {
        const calendarResult = await createCalendarEvent({
          summary: `Dr. Dalia Ghozlan - ${consultationTitle.en} with ${patientName.trim()}`,
          description: [
            `Patient: ${patientName.trim()}`,
            `Email: ${email?.trim() || ''}`,
            `Phone: ${phone.trim()}`,
            `WhatsApp: ${(whatsapp || phone).trim()}`,
            `Consultation: ${consultationTitle.en}`,
            `Reference: ${reference}`,
            notes ? `Notes: ${notes.trim()}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          date,
          time,
          durationMinutes,
          patientEmail: email?.trim() || undefined,
          patientName: patientName.trim(),
        })

        googleMeetLink = calendarResult.meetLink
        googleCalendarEventId = calendarResult.eventId
        googleCalendarEventLink = calendarResult.eventLink
      } catch (calErr: any) {
        console.error('Manual booking calendar creation failed:', calErr.message)
      }
    }

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
      googleMeetLink,
      googleCalendarEventId,
      googleCalendarEventLink,
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

// PATCH: Update booking status, reschedule date/time, verify receipt (admin + staff)
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      status,
      paymentStatus,
      date,
      time,
      patientName,
      phone,
      whatsapp,
      email,
      notes,
    } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    const bookingsCollection = await getBookingsCollection()
    const existingBooking = await bookingsCollection.findOne({ _id: new ObjectId(id) })

    if (!existingBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
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

    if (date) updateDoc.date = date
    if (time) updateDoc.time = time
    if (patientName) updateDoc.patientName = patientName.trim()
    if (phone) updateDoc.phone = phone.trim()
    if (whatsapp !== undefined) updateDoc.whatsapp = whatsapp.trim()
    if (email !== undefined) updateDoc.email = email.trim()
    if (notes !== undefined) updateDoc.notes = notes

    const targetDate = date || existingBooking.date
    const targetTime = time || existingBooking.time
    const targetPatientName = patientName || existingBooking.patientName
    const targetEmail = email !== undefined ? email : existingBooking.email
    const targetPhone = phone || existingBooking.phone
    const targetWhatsapp = whatsapp || existingBooking.whatsapp

    // Lookup consultation duration
    let durationMinutes = 30
    if (existingBooking.consultationId) {
      try {
        const consultCol = await getConsultationsCollection()
        const consultation = await consultCol.findOne({
          _id: new ObjectId(existingBooking.consultationId),
        })
        if (consultation?.durationMinutes) {
          durationMinutes = consultation.durationMinutes
        }
      } catch {}
    }

    const consultTitle = existingBooking.consultationTitle?.en || 'Medical Consultation'

    // Case 1: Status changed to 'confirmed' and no calendar event exists yet
    if (status === 'confirmed' && !existingBooking.googleCalendarEventId) {
      try {
        const calendarResult = await createCalendarEvent({
          summary: `Dr. Dalia Ghozlan - ${consultTitle} with ${targetPatientName}`,
          description: [
            `Patient: ${targetPatientName}`,
            `Email: ${targetEmail}`,
            `Phone: ${targetPhone}`,
            `WhatsApp: ${targetWhatsapp}`,
            `Consultation: ${consultTitle}`,
            `Reference: ${existingBooking.reference}`,
            updateDoc.notes ?? existingBooking.notes ? `Notes: ${updateDoc.notes ?? existingBooking.notes}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          date: targetDate,
          time: targetTime,
          durationMinutes,
          patientEmail: targetEmail || undefined,
          patientName: targetPatientName,
        })

        updateDoc.googleMeetLink = calendarResult.meetLink
        updateDoc.googleCalendarEventId = calendarResult.eventId
        updateDoc.googleCalendarEventLink = calendarResult.eventLink
      } catch (calError: any) {
        console.error('Google Calendar event creation failed:', calError.message)
      }
    }

    // Case 2: Rescheduled (date or time changed) on an already confirmed booking with Google Calendar event
    if ((date || time) && existingBooking.googleCalendarEventId && status !== 'cancelled') {
      try {
        const updatedCal = await updateCalendarEvent(existingBooking.googleCalendarEventId, {
          date: targetDate,
          time: targetTime,
          durationMinutes,
          summary: `Dr. Dalia Ghozlan - ${consultTitle} with ${targetPatientName}`,
        })
        if (updatedCal?.meetLink) {
          updateDoc.googleMeetLink = updatedCal.meetLink
        }
      } catch (calError: any) {
        console.error('Failed to sync rescheduled date/time with Google Calendar:', calError.message)
      }
    }

    // Case 3: Cancelled → remove Google Calendar event
    if (status === 'cancelled' && existingBooking.googleCalendarEventId) {
      try {
        await deleteCalendarEvent(existingBooking.googleCalendarEventId)
        updateDoc.googleMeetLink = ''
        updateDoc.googleCalendarEventId = ''
        updateDoc.googleCalendarEventLink = ''
      } catch (calError: any) {
        console.error('Google Calendar event deletion failed:', calError.message)
      }
    }

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
