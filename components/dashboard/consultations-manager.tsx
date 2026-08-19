'use client'

import React, { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Stethoscope,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ShieldAlert,
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
  const [priceEGP, setPriceEGP] = useState('1500')
  const [priceUSD, setPriceUSD] = useState('60')
  const [isActive, setIsActive] = useState(true)

  const isAdmin = userRole === 'admin'

  const openCreateModal = () => {
    setEditingItem(null)
    setTitleEn('')
    setTitleAr('')
    setDescEn('')
    setDescAr('')
    setDuration('30')
    setPriceEGP('1500')
    setPriceUSD('60')
    setIsActive(true)
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
    setPriceEGP(String(item.priceEGP || 0))
    setPriceUSD(String(item.priceUSD || 0))
    setIsActive(item.isActive !== false)
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
        priceEGP: Number(priceEGP),
        priceUSD: Number(priceUSD),
        isActive,
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
          prev.map((item) =>
            item._id === editingItem._id
              ? { ...item, ...payload, updatedAt: new Date() }
              : item,
          ),
        )
      } else {
        // Create
        const res = await fetch('/api/dashboard/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to create consultation')
          setLoading(false)
          return
        }

        setItems((prev) => [data.data, ...prev])
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
        {items.map((item) => (
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
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  <Clock className="size-3" />
                  <span>{item.durationMinutes} Minutes</span>
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

              {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-2">
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
              )}
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

              {/* Duration & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              {/* Active Toggle */}
              <div className="pt-2 flex items-center gap-3">
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
