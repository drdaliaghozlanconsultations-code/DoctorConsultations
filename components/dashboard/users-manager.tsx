'use client'

import React, { useState } from 'react'
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  Key,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import type { UserRole } from '@/lib/db'

interface UserItem {
  id: string
  username: string
  displayName: string
  role: UserRole
  createdAt: string | Date
}

interface UsersManagerProps {
  initialUsers: UserItem[]
  currentUserId: string
}

export function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('staff')

  const openCreateModal = () => {
    setEditingUser(null)
    setUsername('')
    setDisplayName('')
    setPassword('')
    setRole('staff')
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (u: UserItem) => {
    setEditingUser(u)
    setUsername(u.username)
    setDisplayName(u.displayName)
    setPassword('')
    setRole(u.role)
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (editingUser) {
        // Edit User
        const res = await fetch('/api/dashboard/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            username,
            displayName,
            role,
            password: password ? password : undefined,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to update user')
          setLoading(false)
          return
        }

        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  username: data.data.username,
                  displayName: data.data.displayName,
                  role: data.data.role,
                }
              : u,
          ),
        )
      } else {
        // Create User
        if (!password) {
          setError('Password is required for new accounts')
          setLoading(false)
          return
        }

        const res = await fetch('/api/dashboard/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            displayName,
            password,
            role,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to create user')
          setLoading(false)
          return
        }

        setUsers((prev) => [
          {
            id: data.data.id,
            username: data.data.username,
            displayName: data.data.displayName,
            role: data.data.role,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }

      setIsModalOpen(false)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUserId) {
      alert('You cannot delete your own account.')
      return
    }

    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return

    try {
      const res = await fetch(`/api/dashboard/users?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id))
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch (err) {
      alert('Failed to delete user')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Clinic Team & Staff Accounts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage admin and staff logins. Staff members can accept bookings and view visits, but cannot modify consultations or see profit analytics.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          <Plus className="size-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Users List Card */}
      <div className="rounded-[2.5rem] border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Users2 className="size-5 text-primary" />
            <h2 className="font-serif text-lg font-bold text-foreground">
              Active Team Members ({users.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6 font-semibold">User Details</th>
                <th className="py-4 px-4 font-semibold">Username</th>
                <th className="py-4 px-4 font-semibold">Role</th>
                <th className="py-4 px-4 font-semibold">Permissions</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.map((u) => {
                const isSelf = u.id === currentUserId

                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                          {u.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-2">
                            <span>{u.displayName}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-foreground font-semibold">
                      @{u.username}
                    </td>

                    <td className="py-4 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/20">
                          <Shield className="size-3" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                          <UserCheck className="size-3" />
                          STAFF
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs text-muted-foreground">
                      {u.role === 'admin' ? (
                        <span className="text-foreground font-medium">Full Access (All features + Profits)</span>
                      ) : (
                        <span>Bookings & Visits (No profit analytics / No session edit)</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-xs font-semibold inline-flex items-center gap-1"
                          title="Edit user"
                        >
                          <Edit2 className="size-3.5" />
                          <span>Edit</span>
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id, u.displayName)}
                            className="p-2 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors text-xs font-semibold inline-flex items-center gap-1"
                            title="Delete user"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating or Editing User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-card rounded-[2.5rem] border border-border p-6 sm:p-8 max-w-md w-full relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="font-serif text-xl font-bold text-foreground">
                {editingUser ? `Edit Account: @${editingUser.username}` : 'Add Team Member'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Dalia Assistant"
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sara_staff"
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '* (min 6 chars)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? '•••••••• (unchanged)' : '••••••••'}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="staff">Staff (Can manage bookings & view traffic)</option>
                  <option value="admin">Administrator (Full Access & Profit Analytics)</option>
                </select>
                {editingUser && editingUser.id === currentUserId && role !== 'admin' && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Note: You cannot remove your own admin role.
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-md disabled:opacity-50"
                >
                  {loading
                    ? 'Saving...'
                    : editingUser
                    ? 'Save Changes'
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
