import { google } from 'googleapis'
import { getSettingsCollection } from './db'

/**
 * Get an authenticated Google Calendar client using OAuth 2.0.
 * Retrieves the refresh token from MongoDB settings or environment variables.
 */
async function getOAuthCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)')
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  // Retrieve stored refresh token from MongoDB
  const settingsCol = await getSettingsCollection()
  const tokenDoc = await settingsCol.findOne({ key: 'google_calendar_token' })

  const refreshToken = tokenDoc?.value?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN

  if (!refreshToken) {
    throw new Error(
      'Google Calendar is not linked yet. Please visit /api/auth/google/connect in your browser to link Dr. Dalia\'s Google Account.',
    )
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    access_token: tokenDoc?.value?.access_token,
  })

  // Listen for refreshed tokens and save them back to MongoDB
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.refresh_token || newTokens.access_token) {
      await settingsCol.updateOne(
        { key: 'google_calendar_token' },
        {
          $set: {
            'value.access_token': newTokens.access_token,
            ...(newTokens.refresh_token ? { 'value.refresh_token': newTokens.refresh_token } : {}),
            'value.expiry_date': newTokens.expiry_date,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
    }
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export interface CalendarEventInput {
  summary: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  durationMinutes: number
  patientEmail?: string
  patientName?: string
}

export interface CalendarEventResult {
  eventId: string
  eventLink: string
  meetLink: string
}

/**
 * Create a Google Calendar event with an auto-generated Google Meet link.
 *
 * Runs with Dr. Dalia's actual Google Account authority via OAuth 2.0:
 * - Generates a real Google Meet video conference link
 * - Adds the patient as an attendee (patient receives calendar & email invite)
 * - Adds the event directly to Dr. Dalia's calendar
 */
export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<CalendarEventResult> {
  const calendar = await getOAuthCalendarClient()

  // Build start/end DateTimes in Africa/Cairo timezone
  const startDateTime = `${input.date}T${input.time}:00`

  // Calculate end time
  const startDate = new Date(`${input.date}T${input.time}:00`)
  startDate.setMinutes(startDate.getMinutes() + input.durationMinutes)
  const endHours = String(startDate.getHours()).padStart(2, '0')
  const endMinutes = String(startDate.getMinutes()).padStart(2, '0')
  const endDateTime = `${input.date}T${endHours}:${endMinutes}:00`

  // Build attendees list
  const attendees: { email: string; displayName?: string }[] = []

  if (input.patientEmail) {
    attendees.push({
      email: input.patientEmail,
      displayName: input.patientName || undefined,
    })
  }

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1, // Auto-creates Google Meet
    sendUpdates: input.patientEmail ? 'all' : 'none', // Send email invite with Meet link to patient
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: startDateTime,
        timeZone: 'Africa/Cairo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Africa/Cairo',
      },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: `drdalia-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    },
  })

  const eventData = event.data

  const meetLink =
    eventData.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
    eventData.conferenceData?.entryPoints?.[0]?.uri ||
    eventData.hangoutLink ||
    ''

  return {
    eventId: eventData.id || '',
    eventLink: eventData.htmlLink || '',
    meetLink,
  }
}

/**
 * Delete a Google Calendar event by its event ID when a booking is cancelled.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!eventId) return

  try {
    const calendar = await getOAuthCalendarClient()
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    })
  } catch (error: any) {
    console.error('Failed to delete Google Calendar event:', error.message)
  }
}
