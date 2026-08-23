'use client'

import React, { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Stethoscope,
  Clock,
  Coffee,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { ConsultationItem, UserRole } from '@/lib/db'

interface ConsultationsManagerProps {
  initialItems: ConsultationItem[]
  userRole: UserRole
}

export function ConsultationsManager({ initialItems, userRole }: ConsultationsManagerProps) {
  const [items, setItems] = useState(initialItems)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ConsultationItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descAr, setDescAr] = useState('')
  const [duration, setDuration] = useState('30')
  const [breakAfter, setBreakAfter] = useState('0')
  const [priceEGP, setPriceEGP] = useState('1500')
  const [priceUSD, setPriceUSD] = useState('60')
  const [isActive, setIsActive] = useState(true)
  const [isMostBooked, setIsMostBooked] = useState(false)

  const isAdmin = userRole === 'admin'

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const newItems = [...items]
    const [moved] = newItems.splice(index, 1)
    newItems.splice(targetIndex, 0, moved)

    setItems(newItems)

    try {
      const orderedIds = newItems.map((it) => it._id)
      await fetch('/api/dashboard/consultations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })
    } catch (err) {
      console.error('Failed to persist reordering:', err)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setTitleEn('')
    setTitleAr('')
    setDescEn('')
    setDescAr('')
    setDuration('30')
    setBreakAfter('0')
    setPriceEGP('1500')
    setPriceUSD('60')
    setIsActive(true)
    setIsMostBooked(false)
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: ConsultationItem) => {
    setEditingItem(item)
    setTitleEn(item.title?.en || '')
    setTitleAr(item.title?.ar || '')
    setDescEn(item.description?.en || '')
    setDescAr(item.description?.ar || '')
    setDuration(String(item.durationMinutes || 30))
    setBreakAfter(String(item.breakAfterMinutes || 0))
    setPriceEGP(String(item.priceEGP || 0))
    setPriceUSD(String(item.priceUSD || 0))
    setIsActive(item.isActive !== false)
    setIsMostBooked(Boolean(item.isMostBooked))
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    setError(null)
    setLoading(true)

    try {
      const payload = {
        title: { en: titleEn, ar: titleAr },
        description: { en: descEn, ar: descAr },
        durationMinutes: Number(duration),
        breakAfterMinutes: Number(breakAfter) || 0,
        priceEGP: Number(priceEGP),
        priceUSD: Number(priceUSD),
        isActive,
        isMostBooked: Boolean(isMostBooked),
      }

      if (editingItem) {
        // Update
        const res = await fetch('/api/dashboard/consultations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem._id, ...payload }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to update consultation')
          setLoading(false)
          return
        }

        setItems((prev) =>
          prev.map((item) => {
            if (item._id === editingItem._id) {
              return { ...item, ...payload, updatedAt: new Date() }
            }
            return isMostBooked ? { ...item, isMostBooked: false } : item
          }),
        )
      } else {
        // Create
        const res = await fetch('/api/dashboard/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, sortOrder: items.length + 1 }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to create consultation')
          setLoading(false)
          return
        }

        setItems((prev) => {
          const mapped = isMostBooked ? prev.map((it) => ({ ...it, isMostBooked: false })) : prev
          return [...mapped, data.data]
        })
      }

      setIsModalOpen(false)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) return
    if (!confirm('Are you sure you want to delete this consultation session?')) return

    try {
      const res = await fetch(`/api/dashboard/consultations?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => prev.filter((item) => item._id !== id))
      } else {
        alert(data.error || 'Failed to delete')
      }
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Consultation Sessions & Pricing
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Configure consultation types, durations, and dual currency pricing (EGP for Egypt / USD globally).
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            <Plus className="size-4" />
            <span>Add New Session</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground border border-border">
            <ShieldAlert className="size-3.5" />
            <span>View Only (Staff)</span>
          </div>
        )}
      </div>

      {/* Consultations Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <div
            key={item._id}
            className={`rounded-[2.5rem] border bg-card p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
              item.isActive ? 'border-border' : 'border-border/40 opacity-75 bg-muted/20'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Stethoscope className="size-5" />
                </div>
                <div className="flex items-center gap-2">
                  {item.isMostBooked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      <Sparkles className="size-3 fill-current" />
                      Most Booked
                    </span>
                  )}
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="size-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                      <XCircle className="size-3" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Duration */}
              <div className="mt-4">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  {item.title?.en || 'Untitled Session'}
                </h3>
                <p className="text-sm font-semibold text-primary font-serif dir-rtl text-right mt-0.5">
                  {item.title?.ar || ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    <Clock className="size-3" />
                    <span>{item.durationMinutes} Minutes</span>
                  </div>
                  {Boolean(item.breakAfterMinutes && item.breakAfterMinutes > 0) && (
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      <Coffee className="size-3" />
                      <span>{item.breakAfterMinutes} Mins Break</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 space-y-1 text-xs text-muted-foreground line-clamp-3">
                <p>{item.description?.en}</p>
                {item.description?.ar && (
                  <p className="dir-rtl text-right text-muted-foreground/80">{item.description?.ar}</p>
                )}
              </div>
            </div>

            {/* Pricing Details */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl bg-secondary/40 p-3 border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Local (Egypt)
                  </span>
                  <span className="font-serif text-base font-bold text-foreground">
                    {item.priceEGP.toLocaleString()} EGP
                  </span>
                </div>

                <div className="rounded-2xl bg-secondary/40 p-3 border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Global (Int'l)
                  </span>
                  <span className="font-serif text-base font-bold text-primary">
                    ${item.priceUSD} USD
                  </span>
                </div>
              </div>

              {isAdmin ? (
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Move Earlier"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <span className="text-[11px] font-bold text-muted-foreground px-1">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      title="Move Later"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Edit2 className="size-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit Consultation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card rounded-[2.5rem] border border-border p-6 sm:p-8 max-w-xl w-full relative shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="font-serif text-xl font-bold text-foreground">
                {editingItem ? 'Edit Consultation Session' : 'Create New Consultation'}
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

              {/* Title EN & AR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. 30-Minute Consultation"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Title (Arabic) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: استشارة 30 دقيقة"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-right font-serif"
                  />
                </div>
              </div>

              {/* Description EN & AR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={3}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Comprehensive medical discussion..."
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    placeholder="جلسة استشارية متكاملة لمناقشة مخاوفك..."
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-right font-serif"
                  />
                </div>
              </div>

              {/* Duration, Break & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Duration (Mins) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Break After (Mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={breakAfter}
                    onChange={(e) => setBreakAfter(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Local Price (EGP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={priceEGP}
                    onChange={(e) => setPriceEGP(e.target.value)}
                    placeholder="1500"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Global Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    placeholder="60"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="isActiveToggle"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded accent-primary text-primary"
                  />
                  <label htmlFor="isActiveToggle" className="text-sm font-medium text-foreground cursor-pointer">
                    Active (Visible on public booking page)
                  </label>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                  <input
                    id="isMostBookedToggle"
                    type="checkbox"
                    checked={isMostBooked}
                    onChange={(e) => setIsMostBooked(e.target.checked)}
                    className="mt-0.5 size-4 rounded accent-primary text-primary"
                  />
                  <div>
                    <label htmlFor="isMostBookedToggle" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary fill-current" />
                      Mark as "Most Booked" (الأكثر حجزاً)
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Displays the "Most Booked" badge on this consultation across the website and booking flow. Setting this automatically unsets it from any other consultation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  {loading ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
