import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getConsultationsCollection } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// GET: List all consultations
export async function GET(request: Request) {
  try {
    const consultationsCollection = await getConsultationsCollection()
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const query = activeOnly ? { isActive: true } : {}
    const items = await consultationsCollection
      .find(query)
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray()

    const formatted = items.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch consultations' },
      { status: 500 },
    )
  }
}

// PATCH: Reorder consultations (Admin only)
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedIds array is required' },
        { status: 400 },
      )
    }

    const consultationsCollection = await getConsultationsCollection()

    const bulkOps = orderedIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: { $set: { sortOrder: index + 1, updatedAt: new Date() } },
      },
    }))

    if (bulkOps.length > 0) {
      await consultationsCollection.bulkWrite(bulkOps)
    }

    return NextResponse.json({ success: true, message: 'Consultations reordered successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reorder consultations' },
      { status: 500 },
    )
  }
}

// POST: Create consultation (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { title, description, durationMinutes, breakAfterMinutes, priceEGP, priceUSD, isActive, isMostBooked, sortOrder } = body

    if (!title?.en || !title?.ar || !durationMinutes) {
      return NextResponse.json(
        { success: false, error: 'Title in English & Arabic and duration are required' },
        { status: 400 },
      )
    }

    const consultationsCollection = await getConsultationsCollection()

    // If marked as most booked, unset on all other consultations so only one is chosen
    if (isMostBooked) {
      await consultationsCollection.updateMany({}, { $set: { isMostBooked: false } })
    }

    const doc = {
      title: {
        en: title.en.trim(),
        ar: title.ar.trim(),
      },
      description: {
        en: description?.en?.trim() || '',
        ar: description?.ar?.trim() || '',
      },
      durationMinutes: Number(durationMinutes) || 30,
      breakAfterMinutes: Number(breakAfterMinutes) || 0,
      priceEGP: Number(priceEGP) || 0,
      priceUSD: Number(priceUSD) || 0,
      isActive: isActive !== false,
      isMostBooked: Boolean(isMostBooked),
      sortOrder: Number(sortOrder) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await consultationsCollection.insertOne(doc)

    return NextResponse.json({
      success: true,
      data: { ...doc, _id: result.insertedId.toString() },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create consultation' },
      { status: 500 },
    )
  }
}

// PUT: Update consultation (Admin only)
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { id, title, description, durationMinutes, breakAfterMinutes, priceEGP, priceUSD, isActive, isMostBooked, sortOrder } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Consultation ID is required' },
        { status: 400 },
      )
    }

    const consultationsCollection = await getConsultationsCollection()

    // If setting as most booked, unset on all others
    if (isMostBooked) {
      await consultationsCollection.updateMany(
        { _id: { $ne: new ObjectId(id) } },
        { $set: { isMostBooked: false } },
      )
    }

    const updateDoc: any = {
      updatedAt: new Date(),
    }

    if (title) {
      updateDoc.title = {
        en: title.en?.trim() || '',
        ar: title.ar?.trim() || '',
      }
    }
    if (description) {
      updateDoc.description = {
        en: description.en?.trim() || '',
        ar: description.ar?.trim() || '',
      }
    }
    if (durationMinutes !== undefined) updateDoc.durationMinutes = Number(durationMinutes)
    if (breakAfterMinutes !== undefined) updateDoc.breakAfterMinutes = Number(breakAfterMinutes)
    if (priceEGP !== undefined) updateDoc.priceEGP = Number(priceEGP)
    if (priceUSD !== undefined) updateDoc.priceUSD = Number(priceUSD)
    if (isActive !== undefined) updateDoc.isActive = Boolean(isActive)
    if (isMostBooked !== undefined) updateDoc.isMostBooked = Boolean(isMostBooked)
    if (sortOrder !== undefined) updateDoc.sortOrder = Number(sortOrder)

    const result = await consultationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Consultation not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, message: 'Consultation updated successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update consultation' },
      { status: 500 },
    )
  }
}

// DELETE: Delete consultation (Admin only)
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Consultation ID is required' },
        { status: 400 },
      )
    }

    const consultationsCollection = await getConsultationsCollection()
    const result = await consultationsCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Consultation not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, message: 'Consultation deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete consultation' },
      { status: 500 },
    )
  }
}
