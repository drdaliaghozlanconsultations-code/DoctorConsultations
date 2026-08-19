import { NextResponse } from 'next/server'
import { getSettingsCollection } from '@/lib/db'
import { createCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, any> = {}

  // 1. Check env vars
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  results.envVars = {
    GOOGLE_CLIENT_ID: clientId ? `✅ Set (${clientId.slice(0, 15)}...)` : '❌ Missing',
    GOOGLE_CLIENT_SECRET: clientSecret ? '✅ Set' : '❌ Missing',
    GOOGLE_REDIRECT_URI: redirectUri ? `✅ ${redirectUri}` : '❌ Missing',
  }

  // 2. Check token in DB
  try {
    const settingsCol = await getSettingsCollection()
    const tokenDoc = await settingsCol.findOne({ key: 'google_calendar_token' })

    if (tokenDoc?.value?.refresh_token) {
      results.databaseToken = '✅ Refresh Token is connected and saved in MongoDB!'
    } else {
      results.databaseToken =
        '⚠️ Not connected yet. Please visit http://localhost:3000/api/auth/google/connect in your browser to sign in with Google once.'
      return NextResponse.json({ success: false, results })
    }
  } catch (e: any) {
    results.databaseToken = `❌ DB Error: ${e.message}`
    return NextResponse.json({ success: false, results })
  }

  // 3. Test creating a sample event with Google Meet
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const testEvent = await createCalendarEvent({
      summary: 'Test Consultation with Dr. Dalia (Diagnostic)',
      description: 'This is a test event created to verify Google Meet generation.',
      date: dateStr,
      time: '14:00',
      durationMinutes: 30,
      patientName: 'Test Patient',
      // omitting patientEmail in test so we don't spam emails
    })

    results.testEvent = {
      status: '✅ SUCCESS!',
      eventId: testEvent.eventId,
      googleMeetLink: testEvent.meetLink || '⚠️ No meet link returned',
      calendarEventLink: testEvent.eventLink,
    }
  } catch (e: any) {
    results.testEvent = {
      status: '❌ Event creation failed',
      error: e.message,
    }
    return NextResponse.json({ success: false, results })
  }

  return NextResponse.json({ success: true, results })
}
