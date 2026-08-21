import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth/session'
import {
  getSettingsCollection,
  getDateOverridesCollection,
  type BreakInterval,
  type DaySchedule,
  type DateOverrideType,
} from '@/lib/db'
import {
  getAvailabilitySettings,
} from '@/lib/availability-server'
import {
  DEFAULT_WEEKLY_SCHEDULE,
  DEFAULT_SLOT_INTERVAL,
} from '@/lib/data/availability'

export const dynamic = 'force-dynamic'

// GET: Fetch weekly template and all date overrides
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getAvailabilitySettings()
    const overridesCol = await getDateOverridesCollection()
    
    // Fetch overrides from today onwards (or all)
    const overridesDocs = await overridesCol.find({}).sort({ date: 1 }).toArray()
    const overrides = overridesDocs.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        weeklySchedule: settings.weeklySchedule,
        slotIntervalMinutes: settings.slotIntervalMinutes,
        overrides,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load availability' },
      { status: 500 },
    )
  }
}

// PUT: Update weekly template settings
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { weeklySchedule, slotIntervalMinutes } = body

    if (!weeklySchedule) {
      return NextResponse.json(
        { success: false, error: 'Weekly schedule is required' },
        { status: 400 },
      )
    }

    const settingsCol = await getSettingsCollection()
    await settingsCol.updateOne(
      { key: 'availability_schedule' },
      {
        $set: {
          key: 'availability_schedule',
          value: {
            weeklySchedule,
            slotIntervalMinutes: Number(slotIntervalMinutes) || DEFAULT_SLOT_INTERVAL,
          },
          updatedAt: new Date(),
          updatedBy: session.username,
        },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      message: 'Weekly schedule updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update schedule' },
      { status: 500 },
    )
  }
}

// POST: Add or update a date override (Close day / Open Friday / Custom hours & breaks)
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, date, type, startTime, endTime, breaks, reason } = body

    if (!date || !type) {
      return NextResponse.json(
        { success: false, error: 'Date and override type are required' },
        { status: 400 },
      )
    }

    const overridesCol = await getDateOverridesCollection()

    const updateDoc = {
      date,
      type: type as DateOverrideType,
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      breaks: Array.isArray(breaks) ? breaks : [],
      reason: (reason || '').trim(),
      updatedAt: new Date(),
      updatedBy: session.username,
    }

    if (id) {
      await overridesCol.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateDoc },
      )
      return NextResponse.json({
        success: true,
        message: 'Date override updated',
        data: { _id: id, ...updateDoc },
      })
    } else {
      // Upsert by date
      const res = await overridesCol.updateOne(
        { date },
        {
          $set: updateDoc,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      )

      return NextResponse.json({
        success: true,
        message: 'Date override saved',
        data: {
          _id: res.upsertedId ? res.upsertedId.toString() : undefined,
          ...updateDoc,
        },
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save date override' },
      { status: 500 },
    )
  }
}

// DELETE: Remove a date override
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const date = searchParams.get('date')

    if (!id && !date) {
      return NextResponse.json(
        { success: false, error: 'ID or date is required to delete an override' },
        { status: 400 },
      )
    }

    const overridesCol = await getDateOverridesCollection()
    if (id) {
      await overridesCol.deleteOne({ _id: new ObjectId(id) })
    } else if (date) {
      await overridesCol.deleteOne({ date })
    }

    return NextResponse.json({
      success: true,
      message: 'Date override deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete date override' },
      { status: 500 },
    )
  }
}
