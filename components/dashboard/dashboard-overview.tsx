'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  Users,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react'
import type { BookingItem, UserRole } from '@/lib/db'

interface DashboardOverviewProps {
  initialStats: {
    pendingBookings: number
    confirmedBookings: number
    totalBookings: number
    activeSessions: number
    visitsToday: number
    totalVisits: number
    recentBookings: BookingItem[]
  }
  user: {
    username: string
    displayName: string
    role: UserRole
  }
}

export function DashboardOverview({ initialStats, user }: DashboardOverviewProps) {
  const [stats, setStats] = useState(initialStats)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

  const handleUpdateStatus = async (
    id: string,
    status: 'confirmed' | 'cancelled',
    paymentStatus: 'verified' | 'rejected',
  ) => {
    setLoadingId(id)
    try {
      const res = await fetch('/api/dashboard/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, paymentStatus }),
      })
      const data = await res.json()
      if (data.success) {
        // Update local state
        setStats((prev) => ({
          ...prev,
          pendingBookings: Math.max(0, prev.pendingBookings - (status === 'confirmed' ? 1 : 0)),
          confirmedBookings: prev.confirmedBookings + (status === 'confirmed' ? 1 : 0),
          recentBookings: prev.recentBookings.map((b) =>
            b._id === id ? { ...b, status, paymentStatus } : b,
          ),
        }))
      }
    } catch (err) {
      console.error('Failed to update booking:', err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-[2.5rem] bg-gradient-to-r from-primary/15 via-accent/30 to-secondary/40 border border-primary/20 p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <Sparkles className="size-3.5" />
            <span>Welcome back, {user.displayName}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Clinic Control Center
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Manage your patient bookings, consultation types, pricing variants, and monitor website traffic in real-time.
          </p>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pending Bookings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-colors">
          {stats.pendingBookings > 0 && (
            <div className="absolute top-4 right-4 size-3 bg-amber-500 rounded-full animate-ping" />
          )}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending Bookings
              </span>
              <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-foreground">
                {stats.pendingBookings}
              </span>
              <span className="text-xs text-muted-foreground">awaiting confirmation</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60">
            <Link
              href="/dashboard/bookings?status=pending"
              className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              Review pending <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between group hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirmed Bookings
              </span>
              <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-foreground">
                {stats.confirmedBookings}
              </span>
              <span className="text-xs text-muted-foreground">of {stats.totalBookings} total</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60">
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              All bookings <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between group hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Sessions
              </span>
              <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Stethoscope className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-foreground">
                {stats.activeSessions}
              </span>
              <span className="text-xs text-muted-foreground">consultation types</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60">
            <Link
              href="/dashboard/consultations"
              className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              Manage sessions <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Visits Today */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between group hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Visits Today
              </span>
              <div className="size-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-foreground">
                {stats.visitsToday}
              </span>
              <span className="text-xs text-muted-foreground">({stats.totalVisits} all-time)</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60">
            <Link
              href="/dashboard/analytics"
              className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              View analytics <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Recent Patient Bookings
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Review and confirm bookings submitted by patients through the website.
            </p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <span>View All Bookings</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {stats.recentBookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarCheck2 className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No bookings yet</p>
            <p className="text-xs mt-1">New appointments will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-semibold">Reference & Patient</th>
                  <th className="pb-3 font-semibold">Consultation</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Payment</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-4">
                      <div className="font-semibold text-foreground">{b.patientName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-primary font-medium">{b.reference}</span>
                        <span>•</span>
                        <span>{b.phone}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-foreground font-medium">
                        {b.consultationTitle?.en || 'Consultation'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.amount ? `${b.amount} ${b.currency}` : 'Unspecified'}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-foreground font-medium">{b.date}</div>
                      <div className="text-xs text-muted-foreground">{b.time}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-medium bg-muted px-2 py-0.5 rounded-md text-foreground">
                          {b.paymentMethod || 'InstaPay'}
                        </span>
                        {b.paymentReceiptUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(b.paymentReceiptUrl!)}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                          >
                            <Eye className="size-3" />
                            Receipt
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      {b.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          Confirmed
                        </span>
                      ) : b.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <XCircle className="size-3" />
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="size-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {b.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            disabled={loadingId === b._id}
                            onClick={() => handleUpdateStatus(b._id, 'confirmed', 'verified')}
                            className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {loadingId === b._id ? '...' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === b._id}
                            onClick={() => handleUpdateStatus(b._id, 'cancelled', 'rejected')}
                            className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-200 transition-all disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing Payment Receipt */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-card rounded-[2rem] border border-border p-6 max-w-lg w-full relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-foreground">
                Payment Receipt (InstaPay)
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-4 flex justify-center bg-muted/40 rounded-2xl p-2 max-h-[70vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedReceipt}
                alt="InstaPay Receipt"
                className="max-h-[60vh] object-contain rounded-xl shadow-xs"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={selectedReceipt}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Open full image in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
