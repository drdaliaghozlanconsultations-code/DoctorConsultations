import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUsersCollection } from '@/lib/db'
import { createSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 },
      )
    }

    const usersCollection = await getUsersCollection()
    const user = await usersCollection.findOne({
      username: username.trim().toLowerCase(),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 },
      )
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 },
      )
    }

    // Create JWT Session (valid for 1 month)
    await createSession({
      id: user._id!.toString(),
      username: user.username,
      displayName: user.displayName || user.username,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user._id!.toString(),
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 },
    )
  }
}
