import { NextResponse } from 'next/server'
import { getUpcomingDays, getSlotsForDate } from '@/lib/availability-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'days'
    const duration = Number(searchParams.get('duration')) || 30
    const count = Number(searchParams.get('count')) || 14
    const date = searchParams.get('date')

    if (action === 'slots') {
      if (!date) {
        return NextResponse.json(
          { success: false, error: 'Date parameter is required for slots' },
          { status: 400 },
        )
      }
      const slots = await getSlotsForDate(date, duration)
      return NextResponse.json({ success: true, data: slots })
    }

    // Default action: days
    const days = await getUpcomingDays(count, duration)
    return NextResponse.json({ success: true, data: days })
  } catch (error: any) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch availability' },
      { status: 500 },
    )
  }
}
