'use client'

import React, { useState } from 'react'
import {
  BarChart3,
  Globe2,
  TrendingUp,
  MapPin,
  Compass,
  FileText,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Info,
  Clock,
  Sparkles,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  Eye,
} from 'lucide-react'
import type { UserRole } from '@/lib/db'
import { SmoothAreaChart, ChartSeries } from './smooth-area-chart'

interface MonthVisitItem {
  monthKey: string
  label: string
  fullLabel: string
  year: number
  month: number
  count: number
  egyptCount?: number
  intlCount?: number
}

interface MonthProfitItem {
  monthKey: string
  label: string
  fullLabel: string
  year: number
  month: number
  revenueEGP: number
  revenueUSD: number
  bookingsCount: number
}

interface AnalyticsDashboardProps {
  initialData: {
    role: UserRole
    isAdmin: boolean
    visits: {
      total: number
      today: number
      last7Days: number
      last30Days: number
      byMonth?: MonthVisitItem[]
      byCountry: { country: string; count: number; percentage: number }[]
      topPages: { path: string; count: number }[]
      topReferrers: { referrer: string; count: number }[]
      recent: {
        id: string
        path: string
        country: string
        city?: string
        region?: string
        referrer?: string
        timestamp: string | Date
      }[]
    }
    profitAnalytics: {
      totalRevenueEGP: number
      totalRevenueUSD: number
      confirmedCount: number
      pendingCount: number
      cancelledCount: number
      totalBookings: number
      breakdownByConsultation: {
        titleEn: string
        titleAr: string
        count: number
        revenueEGP: number
        revenueUSD: number
      }[]
      profitByMonth?: MonthProfitItem[]
    } | null
  }
}

export function AnalyticsDashboard({ initialData }: AnalyticsDashboardProps) {
  const [data, setData] = useState(initialData)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLatest = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/dashboard/analytics')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to refresh analytics:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const { visits, profitAnalytics, isAdmin } = data
  const monthlyVisits = visits.byMonth || []
  const monthlyProfits = profitAnalytics?.profitByMonth || []

  const monthLabels = monthlyVisits.map((m) => m.label)

  // 1. Visits Spline Series (Total, Egypt, International)
  const visitsSeries: ChartSeries[] = [
    {
      id: 'total-visits',
      name: 'Total Visits',
      color: '#e11d48', // Rose / Crimson
      fillGradientId: 'grad-total-visits',
      gradientColor: '#e11d48',
      data: monthlyVisits.map((m) => m.count),
      unit: 'visits',
    },
    {
      id: 'egypt-visits',
      name: 'Egypt (Local)',
      color: '#0d9488', // Teal
      fillGradientId: 'grad-egypt-visits',
      gradientColor: '#0d9488',
      data: monthlyVisits.map((m) => m.egyptCount ?? m.count),
      unit: 'visits',
    },
    {
      id: 'intl-visits',
      name: 'International',
      color: '#ec4899', // Vibrant Pink
      fillGradientId: 'grad-intl-visits',
      gradientColor: '#ec4899',
      data: monthlyVisits.map((m) => m.intlCount ?? 0),
      unit: 'visits',
    },
  ]

  // 2. Profit Spline Series (2 distinct colors: Local EGP & Global USD)
  const profitLabels = monthlyProfits.map((m) => m.label)
  const profitSeries: ChartSeries[] = [
    {
      id: 'revenue-egp',
      name: 'Local Revenue (EGP)',
      color: '#e11d48', // Crimson / Rose
      fillGradientId: 'grad-rev-egp',
      gradientColor: '#e11d48',
      data: monthlyProfits.map((m) => m.revenueEGP),
      unit: 'EGP',
      formatValue: (val) => `${val.toLocaleString()} EGP`,
    },
    {
      id: 'revenue-usd',
      name: 'Global Revenue ($ USD)',
      color: '#0d9488', // Teal / Mint
      fillGradientId: 'grad-rev-usd',
      gradientColor: '#0d9488',
      data: monthlyProfits.map((m) => m.revenueUSD),
      unit: 'USD',
      formatValue: (val) => `$${val.toLocaleString()} USD`,
    },
  ]

  const getCountryName = (code: string) => {
    const map: Record<string, string> = {
      EG: '🇪🇬 Egypt',
      SA: '🇸🇦 Saudi Arabia',
      AE: '🇦🇪 United Arab Emirates',
      KW: '🇰🇼 Kuwait',
      QA: '🇶🇦 Qatar',
      US: '🇺🇸 United States',
      GB: '🇬🇧 United Kingdom',
      CA: '🇨🇦 Canada',
      DE: '🇩🇪 Germany',
      FR: '🇫🇷 France',
      IT: '🇮🇹 Italy',
      UNKNOWN: '🌐 Unknown / Dev',
    }
    return map[code?.toUpperCase()] || `🌐 ${code}`
  }

  const getSourceBadge = (source: string) => {
    const s = (source || 'Direct').toLowerCase()
    if (s.includes('instagram')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-600 border border-pink-500/20">
          📸 Instagram
        </span>
      )
    }
    if (s.includes('facebook')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          👥 Facebook
        </span>
      )
    }
    if (s.includes('tiktok')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
          🎵 TikTok
        </span>
      )
    }
    if (s.includes('whatsapp')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          💬 WhatsApp
        </span>
      )
    }
    if (s.includes('google')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          🔍 Google Search
        </span>
      )
    }
    if (s.includes('twitter') || s.includes('x.com')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
          𝕏 X (Twitter)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        🔗 {source || 'Direct / None'}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Analytics & Traffic Insights
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Visitor geolocation breakdown, monthly traffic spline trends, and revenue growth.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLatest}
          disabled={refreshing}
          className="p-2.5 px-4 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto shadow-xs active:scale-95"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Local Testing Geolocation Notice */}
      {/* <div className="rounded-3xl border border-primary/20 bg-secondary/30 p-5 text-xs text-foreground flex items-start gap-3.5">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-foreground">
            How Vercel Geolocation & Local Testing Works:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            In production on Vercel, visitor country & city are detected automatically via edge headers (<code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono text-primary">x-vercel-ip-country</code>).
            When testing locally on <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono">localhost</code>, Next.js falls back to <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono text-primary">MOCK_GEO_COUNTRY=EG</code> in your <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono">.env.local</code>.
          </p>
        </div>
      </div> */}

      {/* 4 Visits Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Today's Visits
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-foreground">
              {visits.today}
            </span>
            <span className="text-xs text-primary font-medium">pageviews</span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Last 7 Days
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-foreground">
              {visits.last7Days}
            </span>
            <span className="text-xs text-muted-foreground">pageviews</span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Last 30 Days
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-foreground">
              {visits.last30Days}
            </span>
            <span className="text-xs text-muted-foreground">pageviews</span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            All-Time Visits
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-primary">
              {visits.total}
            </span>
            <span className="text-xs text-muted-foreground">recorded</span>
          </div>
        </div>
      </div>

      {/* 📈 GRAPH 1: VISITS / MONTH (Smooth Spline Area Chart) */}
      <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Visits / Month (All 12 Months)
              </h2>
              <p className="text-xs text-muted-foreground">
                Smooth spline area chart of monthly traffic trends (Hover points for exact breakdown)
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold bg-secondary/60 px-4 py-2 rounded-full border border-border self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-500" />
              <span className="text-foreground">Total Visits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-teal-500" />
              <span className="text-muted-foreground">Egypt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-pink-500" />
              <span className="text-muted-foreground">International</span>
            </div>
          </div>
        </div>

        {/* Smooth Area Spline Chart */}
        <div className="pt-2">
          <SmoothAreaChart
            labels={monthLabels}
            series={visitsSeries}
            height={320}
          />
        </div>
      </div>

      {/* 💰 GRAPH 2: PROFIT / MONTH (Admin Only Smooth Spline Area Chart) */}
      {isAdmin && profitAnalytics ? (
        <div className="rounded-[2.5rem] border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign className="size-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                  Profit / Month & Financial Analytics
                </h2>
                <p className="text-xs text-muted-foreground">
                  Month-by-month revenue curve from confirmed consultations (Admin Only)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold bg-card px-4 py-2 rounded-full border border-border shadow-xs self-start sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-rose-500" />
                <span className="text-foreground">Local Revenue (EGP)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-teal-500" />
                <span className="text-muted-foreground">Global Revenue (USD)</span>
              </div>
            </div>
          </div>

          {/* Revenue Figures Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-secondary/50 p-5 border border-border/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Local (EGP)
              </span>
              <span className="font-serif text-2xl font-bold text-foreground mt-2 block">
                {profitAnalytics.totalRevenueEGP.toLocaleString()} EGP
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 block">From confirmed local bookings</span>
            </div>

            <div className="rounded-2xl bg-secondary/50 p-5 border border-border/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Global (USD)
              </span>
              <span className="font-serif text-2xl font-bold text-primary mt-2 block">
                ${profitAnalytics.totalRevenueUSD.toLocaleString()} USD
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 block">From international patients</span>
            </div>

            <div className="rounded-2xl bg-secondary/50 p-5 border border-border/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Confirmed Bookings
              </span>
              <span className="font-serif text-2xl font-bold text-emerald-600 mt-2 block">
                {profitAnalytics.confirmedCount}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 block">Completed & verified</span>
            </div>

            <div className="rounded-2xl bg-secondary/50 p-5 border border-border/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Pending Bookings
              </span>
              <span className="font-serif text-2xl font-bold text-amber-600 mt-2 block">
                {profitAnalytics.pendingCount}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 block">Awaiting receipt verification</span>
            </div>
          </div>

          {/* Smooth Spline Area Chart for Monthly Profit */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span>Monthly Revenue Spline (All 12 Months)</span>
            </h3>

            <SmoothAreaChart
              labels={profitLabels}
              series={profitSeries}
              height={320}
            />
          </div>

          {/* Revenue by Consultation */}
          {profitAnalytics.breakdownByConsultation.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-bold text-foreground mb-3">
                Revenue by Consultation Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profitAnalytics.breakdownByConsultation.map((c, idx) => (
                  <div key={idx} className="rounded-2xl bg-card p-4 border border-border">
                    <p className="font-serif font-bold text-sm text-foreground">{c.titleEn}</p>
                    <p className="text-xs text-primary font-serif dir-rtl text-right mt-0.5">{c.titleAr}</p>
                    <div className="mt-3 flex items-center justify-between text-xs border-t border-border/60 pt-2 text-muted-foreground">
                      <span>{c.count} bookings</span>
                      <span className="font-bold text-foreground">
                        {c.revenueEGP > 0 && `${c.revenueEGP.toLocaleString()} EGP `}
                        {c.revenueUSD > 0 && `$${c.revenueUSD} USD`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-xs flex items-center gap-3 text-muted-foreground">
          <ShieldAlert className="size-6 text-muted-foreground/60 shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">Financial Analytics Restricted</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Profit and financial revenue analytics are restricted to Administrator accounts.
            </p>
          </div>
        </div>
      )}

      {/* Geolocation & Visitor Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Countries Breakdown (7 Cols) */}
        <div className="lg:col-span-7 rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-xs">
          {/* <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <Globe2 className="size-5 text-primary" />
            <h2 className="font-serif text-lg font-bold text-foreground">
              Visitors by Country (Vercel Geolocation)
            </h2>
          </div> */}

          {visits.byCountry.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No country data logged yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visits.byCountry.map((c, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">{getCountryName(c.country)}</span>
                    <span className="text-muted-foreground font-mono">
                      {c.count} visits ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(c.percentage, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pages & Referrers (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Pages */}
          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border">
              <FileText className="size-5 text-primary" />
              <h2 className="font-serif text-base font-bold text-foreground">
                Top Visited Pages
              </h2>
            </div>
            <div className="mt-4 space-y-2.5">
              {visits.topPages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No page data yet</p>
              ) : (
                visits.topPages.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-mono text-primary truncate max-w-[200px]">
                      {p.path}
                    </span>
                    <span className="font-semibold text-muted-foreground font-mono">
                      {p.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border">
              <Compass className="size-5 text-primary" />
              <h2 className="font-serif text-base font-bold text-foreground">
                Traffic Sources / Referrers
              </h2>
            </div>
            <div className="mt-4 space-y-2.5">
              {visits.topReferrers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No referrer data yet</p>
              ) : (
                visits.topReferrers.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div>{getSourceBadge(r.referrer)}</div>
                    <span className="font-semibold text-muted-foreground font-mono">
                      {r.count} visits
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Recent Visits Log */}
      <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <Clock className="size-5 text-primary" />
          <h2 className="font-serif text-lg font-bold text-foreground">
            Recent Traffic Log (Last 30 Visits)
          </h2>
        </div>

        {visits.recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No recent visits recorded.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold">Page Path</th>
                  <th className="pb-3 font-semibold">Traffic Source</th>
                  <th className="pb-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {visits.recent.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-semibold text-foreground">
                      {getCountryName(v.country)}
                      {v.city && v.city !== 'Unknown' && (
                        <span className="text-muted-foreground font-normal ml-1">({v.city})</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-primary">{v.path}</td>
                    <td className="py-3">
                      {getSourceBadge(v.referrer || 'Direct')}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(v.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
