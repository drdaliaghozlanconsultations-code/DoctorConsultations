'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CalendarCheck2,
  CalendarClock,
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
  Video,
  Phone,
  Mail,
  Edit2,
  Trash2,
  MessageSquare,
  ExternalLink,
  ArrowRightLeft,
} from 'lucide-react'
import type { BookingItem, UserRole } from '@/lib/db'

function formatCreatedDate(date?: string | Date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatTodayDate(dateStr?: string) {
  if (!dateStr) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date())
  }
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

interface DashboardOverviewProps {
  initialStats: {
    pendingBookings: number
    confirmedBookings: number
    totalBookings: number
    activeSessions: number
    visitsToday: number
    totalVisits: number
    todayDate?: string
    todayBookings?: BookingItem[]
    recentBookings: BookingItem[]
  }
  user: {
    username: string
    displayName: string
    role: UserRole
  }
}

export function DashboardOverview({ initialStats, user }: DashboardOverviewProps) {
  const [stats, setStats] = useState({
    ...initialStats,
    todayBookings: initialStats.todayBookings || [],
  })
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
            b._id === id
              ? {
                  ...b,
                  status,
                  paymentStatus,
                  ...(data.data?.googleMeetLink ? { googleMeetLink: data.data.googleMeetLink } : {}),
                }
              : b,
          ),
          todayBookings: prev.todayBookings.map((b) =>
            b._id === id
              ? {
                  ...b,
                  status,
                  paymentStatus,
                  ...(data.data?.googleMeetLink ? { googleMeetLink: data.data.googleMeetLink } : {}),
                }
              : b,
          ),
        }))
      }
    } catch (err) {
      console.error('Failed to update booking:', err)
    } finally {
      setLoadingId(null)
    }
  }

  const isAdmin = user.role === 'admin'

  // Edit / Reschedule Modal State
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editPatientName, setEditPatientName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState<BookingItem['status']>('confirmed')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const openEditModal = (b: BookingItem) => {
    setEditingBooking(b)
    setEditDate(b.date || '')
    setEditTime(b.time || '10:00')
    setEditPatientName(b.patientName || '')
    setEditPhone(b.phone || '')
    setEditWhatsapp(b.whatsapp || '')
    setEditEmail(b.email || '')
    setEditNotes(b.notes || '')
    setEditStatus(b.status || 'confirmed')
    setEditError(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBooking) return
    setEditLoading(true)
    setEditError(null)

    try {
      const res = await fetch('/api/dashboard/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBooking._id,
          date: editDate,
          time: editTime,
          patientName: editPatientName,
          phone: editPhone,
          whatsapp: editWhatsapp,
          email: editEmail,
          notes: editNotes,
          status: editStatus,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setStats((prev) => ({
          ...prev,
          recentBookings: prev.recentBookings.map((b) =>
            b._id === editingBooking._id
              ? {
                  ...b,
                  date: editDate,
                  time: editTime,
                  patientName: editPatientName,
                  phone: editPhone,
                  whatsapp: editWhatsapp,
                  email: editEmail,
                  notes: editNotes,
                  status: editStatus,
                  googleMeetLink: data.meetLink || b.googleMeetLink,
                }
              : b,
          ),
          todayBookings: prev.todayBookings.map((b) =>
            b._id === editingBooking._id
              ? {
                  ...b,
                  date: editDate,
                  time: editTime,
                  patientName: editPatientName,
                  phone: editPhone,
                  whatsapp: editWhatsapp,
                  email: editEmail,
                  notes: editNotes,
                  status: editStatus,
                  googleMeetLink: data.meetLink || b.googleMeetLink,
                }
              : b,
          ),
        }))
        setEditingBooking(null)
      } else {
        setEditError(data.error || 'Failed to update booking')
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update booking')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking?')) {
      return
    }
    try {
      const res = await fetch(`/api/dashboard/bookings?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setStats((prev) => ({
          ...prev,
          totalBookings: Math.max(0, prev.totalBookings - 1),
          recentBookings: prev.recentBookings.filter((b) => b._id !== id),
          todayBookings: prev.todayBookings.filter((b) => b._id !== id),
        }))
      } else {
        alert(data.error || 'Failed to delete booking')
      }
    } catch {
      alert('Network error while deleting booking')
    }
  }

  return (
    <div className="space-y-8">
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

      {/* Today's Bookings Section */}
      <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <Calendar className="size-3.5" />
              <span>{formatTodayDate(stats.todayDate)}</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
              <span>Today&apos;s Appointments</span>
              <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {stats.todayBookings.length} {stats.todayBookings.length === 1 ? 'Booking' : 'Bookings'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Schedule of consultations and patient sessions happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={stats.todayDate ? `/dashboard/bookings?date=${stats.todayDate}` : '/dashboard/bookings'}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-semibold transition-all shadow-2xs"
            >
              <span>Manage Today</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {stats.todayBookings.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <div className="size-12 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60 mb-3">
              <Calendar className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No appointments scheduled for today</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Any patient bookings scheduled for today will appear right here in chronological order.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {stats.todayBookings.map((b) => {
              const cleanWhatsapp = b.whatsapp?.replace(/[^0-9]/g, '')
              const waUrl = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : null

              return (
                <div
                  key={b._id}
                  className="rounded-3xl border border-border/80 bg-background/50 hover:bg-muted/30 p-5 flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Time & Status header */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary font-bold text-sm tracking-tight">
                        <Clock className="size-3.5" />
                        <span>{b.time}</span>
                      </div>
                      <div>
                        {b.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 className="size-3" />
                            Confirmed
                          </span>
                        ) : b.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <XCircle className="size-3" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Clock className="size-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Patient & Consultation Info */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-base tracking-tight">
                          {b.patientName}
                        </h3>
                        <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          {b.reference}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-primary font-medium">
                          {b.consultationTitle?.en || 'Consultation Session'}
                        </span>
                        {b.amount ? (
                          <span className="font-semibold text-foreground">
                            {b.amount.toLocaleString()} {b.currency}
                          </span>
                        ) : null}
                      </div>
                      {b.originalAmount && b.originalCurrency && b.originalCurrency !== b.currency && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span className="text-muted-foreground/80">Original USD:</span>
                          <span className="text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                            <ArrowRightLeft className="size-2.5 shrink-0" />
                            <span>{b.originalAmount.toLocaleString()} {b.originalCurrency}</span>
                            {b.exchangeRate && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                (@ {b.exchangeRate.toFixed(2)})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="pt-2 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground/70 shrink-0" />
                          <span className="truncate">{b.phone}</span>
                        </div>
                        {b.email && (
                          <div className="flex items-center gap-1.5 truncate text-muted-foreground/80">
                            <span className="truncate">{b.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Meet Link */}
                  <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                    {/* Google Meet Link if present */}
                    {b.googleMeetLink && (
                      <a
                        href={b.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <Video className="size-3.5" />
                        <span>Join Google Meet</span>
                        <ExternalLink className="size-3 opacity-70" />
                      </a>
                    )}

                    {/* Secondary links (WhatsApp, Receipt, Accept/Reject) */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline font-semibold"
                          >
                            <MessageSquare className="size-3" />
                            WhatsApp
                          </a>
                        )}
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

                      {b.status === 'pending' && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={loadingId === b._id}
                            onClick={() => handleUpdateStatus(b._id, 'confirmed', 'verified')}
                            className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all disabled:opacity-50"
                          >
                            {loadingId === b._id ? '...' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === b._id}
                            onClick={() => handleUpdateStatus(b._id, 'cancelled', 'rejected')}
                            className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-200 transition-all disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
                <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6 font-semibold">Reference & Patient</th>
                  <th className="py-4 px-4 font-semibold">Consultation</th>
                  <th className="py-4 px-4 font-semibold">Date & Time</th>
                  <th className="py-4 px-4 font-semibold">Amount & Method</th>
                  <th className="py-4 px-4 font-semibold">Receipt</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-muted/30 transition-colors">
                    {/* Patient */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground">{b.patientName}</div>
                      <div className="text-xs font-mono text-primary mt-0.5">{b.reference}</div>
                      {b.createdAt && (
                        <div
                          className="text-[11px] text-muted-foreground/75 mt-1 flex items-center gap-1 font-mono"
                          title="Date when booking was submitted"
                        >
                          <CalendarClock className="size-3 text-muted-foreground/70" />
                          <span>Created: {formatCreatedDate(b.createdAt)}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground" />
                          {b.phone}
                        </span>
                        {b.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3 text-muted-foreground" />
                            {b.email}
                          </span>
                        )}
                        {b.country && (
                          <span className="text-[10px] text-muted-foreground/80 uppercase">
                            Country: {b.country}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Consultation */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground">
                        {b.consultationTitle?.en || 'Consultation'}
                      </div>
                      <div className="text-xs text-primary font-serif dir-rtl text-right mt-0.5">
                        {b.consultationTitle?.ar || ''}
                      </div>
                      {b.notes && (
                        <div className="mt-1.5 text-xs text-muted-foreground bg-muted/60 p-2 rounded-xl max-w-xs">
                          <span className="font-semibold">Notes:</span> {b.notes}
                        </div>
                      )}
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-foreground">{b.date}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" />
                        {b.time}
                      </div>
                      {b.googleMeetLink && (
                        <a
                          href={b.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all shadow-2xs"
                          title="Open Google Meet Video Call"
                        >
                          <Video className="size-3" />
                          <span>Join Meet</span>
                        </a>
                      )}
                    </td>

                    {/* Amount & Method */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-foreground">
                        {b.amount ? `${b.amount.toLocaleString()} ${b.currency}` : '—'}
                      </div>
                      {b.originalAmount && b.originalCurrency && b.originalCurrency !== b.currency ? (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md w-fit"
                            title={`Originally charged ${b.originalAmount} ${b.originalCurrency}`}
                          >
                            <ArrowRightLeft className="size-2.5 shrink-0" />
                            <span>{b.originalAmount.toLocaleString()} {b.originalCurrency}</span>
                          </span>
                          {b.exchangeRate && (
                            <span
                              className="text-[10px] text-muted-foreground font-mono pl-0.5"
                              title={`Conversion Rate: 1 ${b.originalCurrency} = ${b.exchangeRate.toFixed(2)} EGP`}
                            >
                              1 {b.originalCurrency} = {b.exchangeRate.toFixed(2)} EGP
                            </span>
                          )}
                        </div>
                      ) : null}
                      <span className="inline-block text-[10px] uppercase font-semibold bg-secondary/80 px-2 py-0.5 rounded-md text-secondary-foreground mt-1">
                        {b.paymentMethod || 'InstaPay'}
                      </span>
                    </td>

                    {/* Receipt */}
                    <td className="py-4 px-4">
                      {b.paymentReceiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(b.paymentReceiptUrl!)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                        >
                          <Eye className="size-3" />
                          <span>View Receipt</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No receipt</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {b.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          Confirmed
                        </span>
                      ) : b.paymentStatus === 'failed' || b.paymentStatus === 'rejected' || b.status === 'failed' ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <XCircle className="size-3" />
                            Failed
                          </span>
                          {b.kashierResponseMessage && (
                            <span
                              className="text-[10px] text-rose-500/90 font-mono truncate max-w-[130px]"
                              title={`Failure Reason: ${b.kashierResponseMessage}`}
                            >
                              {b.kashierResponseMessage}
                            </span>
                          )}
                        </div>
                      ) : b.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <XCircle className="size-3" />
                          Cancelled
                        </span>
                      ) : b.paymentStatus === 'awaiting_payment' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="size-3" />
                          Awaiting Payment
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="size-3" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {b.status === 'pending' && (b.paymentMethod === 'instapay' || !b.paymentMethod) && (
                          <>
                            <button
                              type="button"
                              disabled={loadingId === b._id}
                              onClick={() => handleUpdateStatus(b._id, 'confirmed', 'verified')}
                              className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                            >
                              {loadingId === b._id ? '...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              disabled={loadingId === b._id}
                              onClick={() => handleUpdateStatus(b._id, 'cancelled', 'rejected')}
                              className="px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-200 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit & Reschedule Appointment"
                        >
                          <Edit2 className="size-4" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(b._id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete booking"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Edit & Reschedule Booking */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card max-h-[94vh] overflow-y-scroll rounded-[2.5rem] border border-border p-6 sm:p-8 max-w-lg w-full relative shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Edit & Reschedule Appointment
                </h3>
                <p className="text-xs font-mono text-primary mt-0.5">
                  {editingBooking.reference} — {editingBooking.consultationTitle?.en}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-6">
              {editError && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                  {editError}
                </div>
              )}

              {/* Payment & Conversion Info Card */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment & Billing Details
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block text-[10px] uppercase font-semibold bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">
                      {editingBooking.paymentMethod || 'InstaPay'}
                    </span>
                    <span
                      className={`inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md ${
                        editingBooking.paymentStatus === 'verified'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : editingBooking.paymentStatus === 'failed' || editingBooking.paymentStatus === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {editingBooking.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-base font-bold text-foreground">
                      {editingBooking.amount
                        ? `${editingBooking.amount.toLocaleString()} ${editingBooking.currency}`
                        : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1.5">
                      (Billed Amount)
                    </span>
                  </div>
                  {editingBooking.originalAmount &&
                    editingBooking.originalCurrency &&
                    editingBooking.originalCurrency !== editingBooking.currency && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <ArrowRightLeft className="size-3" />
                        Original: {editingBooking.originalAmount.toLocaleString()}{' '}
                        {editingBooking.originalCurrency}
                      </span>
                    )}
                </div>

                {editingBooking.exchangeRate && (
                  <div className="text-xs text-muted-foreground flex items-center justify-between border-t border-border/60 pt-2">
                    <span>Kashier Exchange Rate:</span>
                    <span className="font-mono font-medium text-foreground">
                      1 {editingBooking.originalCurrency || 'USD'} ={' '}
                      {editingBooking.exchangeRate.toFixed(4)} EGP
                    </span>
                  </div>
                )}
                {editingBooking.kashierResponseMessage &&
                  (editingBooking.paymentStatus === 'failed' ||
                    editingBooking.paymentStatus === 'rejected' ||
                    editingBooking.status === 'failed') && (
                    <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-start gap-2 border-t border-border/60 pt-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-500" />
                      <div className="flex-1">
                        <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-300">
                          Kashier Failure Reason:
                        </span>
                        <span className="font-mono text-xs break-all text-rose-600 dark:text-rose-400">
                          {editingBooking.kashierResponseMessage}
                        </span>
                      </div>
                    </div>
                  )}

                {editingBooking.kashierSessionId && (
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/60 pt-1.5 font-mono">
                    <span>Kashier Session ID:</span>
                    <span
                      className="text-foreground/80 truncate max-w-[220px]"
                      title={editingBooking.kashierSessionId}
                    >
                      {editingBooking.kashierSessionId}
                    </span>
                  </div>
                )}
              </div>

              {/* Reschedule Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPatientName}
                    onChange={(e) => setEditPatientName(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as BookingItem['status'])}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {editingBooking.googleCalendarEventId && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <CalendarClock className="size-4 shrink-0" />
                  <span>
                    Google Calendar is connected. Updating date/time will automatically reschedule the Google Meet and notify the patient.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-md disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save & Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
