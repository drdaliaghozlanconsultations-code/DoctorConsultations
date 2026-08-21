'use client'

import React, { useState } from 'react'
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Video,
} from 'lucide-react'
import type { BookingItem, ConsultationItem, UserRole } from '@/lib/db'

interface BookingsManagerProps {
  initialBookings: BookingItem[]
  consultations: ConsultationItem[]
  userRole: UserRole
}

export function BookingsManager({ initialBookings, consultations, userRole }: BookingsManagerProps) {
  const [bookings, setBookings] = useState(initialBookings)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Add Booking Form State
  const [patientName, setPatientName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [country, setCountry] = useState('EG')
  const [consultationId, setConsultationId] = useState(consultations[0]?._id || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [amount, setAmount] = useState('1500')
  const [currency, setCurrency] = useState<'EGP' | 'USD'>('EGP')
  const [notes, setNotes] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const isAdmin = userRole === 'admin'

  const fetchBookings = async () => {
    setRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      if (dateFilter) params.set('date', dateFilter)

      const res = await fetch(`/api/dashboard/bookings?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setBookings(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setRefreshing(false)
    }
  }

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
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status, paymentStatus } : b)),
        )
      } else {
        alert(data.error || 'Failed to update booking')
      }
    } catch (err) {
      alert('Failed to update booking')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) return
    if (!confirm('Are you sure you want to permanently delete this booking?')) return

    try {
      const res = await fetch(`/api/dashboard/bookings?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b._id !== id))
      } else {
        alert(data.error || 'Failed to delete')
      }
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setModalLoading(true)

    try {
      const res = await fetch('/api/dashboard/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          email,
          phone,
          whatsapp,
          country,
          consultationId,
          date,
          time,
          amount: Number(amount),
          currency,
          notes,
          status: 'confirmed',
          paymentStatus: 'verified',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setModalError(data.error || 'Failed to add booking')
        setModalLoading(false)
        return
      }

      setBookings((prev) => [data.data, ...prev])
      setIsAddModalOpen(false)
      // reset
      setPatientName('')
      setEmail('')
      setPhone('')
      setWhatsapp('')
      setNotes('')
    } catch (err: any) {
      setModalError(err.message || 'An unexpected error occurred')
    } finally {
      setModalLoading(false)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (dateFilter && b.date !== dateFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matchName = b.patientName?.toLowerCase().includes(q)
      const matchEmail = b.email?.toLowerCase().includes(q)
      const matchPhone = b.phone?.includes(q)
      const matchRef = b.reference?.toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchPhone && !matchRef) return false
    }
    return true
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Patient Bookings & Payments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Review incoming appointments, verify InstaPay payment receipts, and manage clinic schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">



          <button
            type="button"
            onClick={fetchBookings}
            disabled={refreshing}
            className="p-2.5 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors text-xs font-semibold inline-flex items-center gap-1.5"
            title="Refresh bookings"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            <Plus className="size-4" />
            <span>Add Booking</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, reference, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center rounded-2xl bg-muted/60 p-1 border border-border/60">
            {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl border border-border bg-background text-xs text-foreground focus:border-primary focus:outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-[2.5rem] border border-border bg-card shadow-xs overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-base font-semibold text-foreground">No bookings found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-muted/30 transition-colors">
                    {/* Patient */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground">{b.patientName}</div>
                      <div className="text-xs font-mono text-primary mt-0.5">{b.reference}</div>
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

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {b.status === 'pending' && (
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

      {/* Modal for viewing Payment Receipt */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-card rounded-[2.5rem] border border-border p-6 max-w-xl w-full relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-foreground">
                Payment Receipt (InstaPay Upload)
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
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Stored securely on Cloudinary</span>
              <a
                href={selectedReceipt}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Open high-res image</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add Booking Manually */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card rounded-[2.5rem] border border-border p-6 sm:p-8 max-w-xl w-full relative shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Add Patient Booking Manually
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-4 mt-6">
              {modalError && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
                  {modalError}
                </div>
              )}

              {/* Consultation Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Consultation Type *
                </label>
                <select
                  value={consultationId}
                  onChange={(e) => {
                    setConsultationId(e.target.value)
                    const c = consultations.find((item) => item._id === e.target.value)
                    if (c) {
                      setAmount(String(currency === 'USD' ? c.priceUSD : c.priceEGP))
                    }
                  }}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                >
                  {consultations.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title?.en} ({c.priceEGP} EGP / ${c.priceUSD})
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Date, Time & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="EG">Egypt (EG)</option>
                    <option value="SA">Saudi Arabia (SA)</option>
                    <option value="AE">UAE (AE)</option>
                    <option value="US">USA (US)</option>
                    <option value="GB">UK (GB)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'EGP' | 'USD')}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="EGP">EGP (Egyptian Pound)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Medical / Administrative Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any patient preferences or history..."
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-md disabled:opacity-50"
                >
                  {modalLoading ? 'Adding...' : 'Confirm & Add Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
