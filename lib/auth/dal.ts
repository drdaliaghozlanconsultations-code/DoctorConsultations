import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { ObjectId } from 'mongodb'
import { getSession } from './session'
import { getUsersCollection } from '@/lib/db'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) {
    redirect('/dashboard/login')
  }
  return session
})

export const requireAdmin = cache(async () => {
  const session = await verifySession()
  if (session.role !== 'admin') {
    redirect('/dashboard')
  }
  return session
})

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session?.userId) return null

  try {
    const usersCollection = await getUsersCollection()
    const user = await usersCollection.findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { passwordHash: 0 } },
    )
    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
})
