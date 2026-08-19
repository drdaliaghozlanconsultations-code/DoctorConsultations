import React from 'react'
import { requireAdmin } from '@/lib/auth/dal'
import { getUsersCollection } from '@/lib/db'
import { UsersManager } from '@/components/dashboard/users-manager'

export const dynamic = 'force-dynamic'

export default async function UsersDashboardPage() {
  const session = await requireAdmin()

  const usersCollection = await getUsersCollection()
  const usersDocs = await usersCollection
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray()

  const initialUsers = usersDocs.map((u) => ({
    id: u._id?.toString() || '',
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <UsersManager
      initialUsers={initialUsers}
      currentUserId={session.userId}
    />
  )
}
