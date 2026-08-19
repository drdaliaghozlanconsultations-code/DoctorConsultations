import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { UserRole } from '@/lib/db'

export interface SessionPayload {
  userId: string
  username: string
  displayName: string
  role: UserRole
  expiresAt: Date
}

const secretKey =
  process.env.SESSION_SECRET ||
  'dr_dalia_fallback_secret_key_change_in_production_2026'
const encodedKey = new TextEncoder().encode(secretKey)

const COOKIE_NAME = 'drdalia_session'
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000 // 30 days (1 month)

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    displayName: payload.displayName,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encodedKey)
}

export async function decrypt(
  session: string | undefined = '',
): Promise<{
  userId: string
  username: string
  displayName: string
  role: UserRole
} | null> {
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      displayName: payload.displayName as string,
      role: payload.role as UserRole,
    }
  } catch {
    return null
  }
}

export async function createSession(user: {
  id: string
  username: string
  displayName: string
  role: UserRole
}) {
  const expiresAt = new Date(Date.now() + ONE_MONTH_MS)
  const sessionToken = await encrypt({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    expiresAt,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

  return sessionToken
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value
  if (!sessionCookie) return null
  return await decrypt(sessionCookie)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
