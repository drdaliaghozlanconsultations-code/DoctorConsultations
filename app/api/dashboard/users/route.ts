import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { getUsersCollection } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// GET: List all users (Admin only)
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 })
    }

    const usersCollection = await getUsersCollection()
    const users = await usersCollection
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray()

    const formatted = users.map((u) => ({
      id: u._id?.toString(),
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt,
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 },
    )
  }
}

// POST: Create new user (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, displayName, role = 'staff' } = body

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Username, password, and display name are required' },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 },
      )
    }

    const validRole = role === 'admin' ? 'admin' : 'staff'
    const cleanUsername = username.trim().toLowerCase()

    const usersCollection = await getUsersCollection()
    const existing = await usersCollection.findOne({ username: cleanUsername })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await usersCollection.insertOne({
      username: cleanUsername,
      passwordHash,
      displayName: displayName.trim(),
      role: validRole,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        username: cleanUsername,
        displayName: displayName.trim(),
        role: validRole,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 },
    )
  }
}

// PUT: Update existing user (Admin only)
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { id, username, displayName, role, password } = body

    if (!id || !username || !displayName) {
      return NextResponse.json(
        { success: false, error: 'User ID, username, and display name are required' },
        { status: 400 },
      )
    }

    const cleanUsername = username.trim().toLowerCase()
    const usersCollection = await getUsersCollection()

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // If username changed, ensure it's not taken by someone else
    if (cleanUsername !== user.username) {
      const existing = await usersCollection.findOne({
        username: cleanUsername,
        _id: { $ne: new ObjectId(id) },
      })
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken by another account' },
          { status: 400 },
        )
      }
    }

    // Safety: Admin cannot demote themselves from admin role
    let validRole = role === 'admin' ? 'admin' : 'staff'
    if (session.userId === id && validRole !== 'admin') {
      validRole = 'admin'
    }

    const updateDoc: any = {
      username: cleanUsername,
      displayName: displayName.trim(),
      role: validRole,
      updatedAt: new Date(),
    }

    // If new password provided, hash it
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters' },
          { status: 400 },
        )
      }
      updateDoc.passwordHash = await bcrypt.hash(password, 10)
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
    )

    return NextResponse.json({
      success: true,
      data: {
        id,
        username: cleanUsername,
        displayName: displayName.trim(),
        role: validRole,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 },
    )
  }
}

// DELETE: Delete user (Admin only, cannot delete oneself)
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    if (session.userId === id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 400 },
      )
    }

    const usersCollection = await getUsersCollection()
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 },
    )
  }
}
