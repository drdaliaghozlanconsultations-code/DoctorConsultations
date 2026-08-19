import React from 'react'
import { verifySession } from '@/lib/auth/dal'
import { getVisitsCollection, getBookingsCollection } from '@/lib/db'
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard'

export const dynamic = 'force-dynamic'

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function getRolling12Months(now: Date = new Date()) {
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const mo = d.getMonth() + 1
    const monthKey = `${y}-${String(mo).padStart(2, '0')}`
    const label = `${monthNames[mo - 1]}`
    const fullLabel = `${monthNames[mo - 1]} ${y}`
    months.push({ monthKey, label, fullLabel, year: y, month: mo })
  }
  return months
}

export default async function AnalyticsPage() {
  const session = await verifySession()

  const visitsCollection = await getVisitsCollection()
  const bookingsCollection = await getBookingsCollection()

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const startOf12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [
    totalVisits,
    visitsToday,
    visitsLast7Days,
    visitsLast30Days,
    countryAggregation,
    pagesAggregation,
    referrersAggregation,
    monthlyVisitsAggregation,
    recentVisitsDocs,
  ] = await Promise.all([
    visitsCollection.countDocuments(),
    visitsCollection.countDocuments({ timestamp: { $gte: startOfToday } }),
    visitsCollection.countDocuments({ timestamp: { $gte: sevenDaysAgo } }),
    visitsCollection.countDocuments({ timestamp: { $gte: thirtyDaysAgo } }),
    visitsCollection
      .aggregate([
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray(),
    visitsCollection
      .aggregate([
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
    visitsCollection
      .aggregate([
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ])
      .toArray(),
    visitsCollection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: startOf12Months },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              country: '$country',
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    visitsCollection.find({}).sort({ timestamp: -1 }).limit(30).toArray(),
  ])

  const rolling12Months = getRolling12Months(now)

  const visitsMap: Record<
    string,
    { total: number; egypt: number; international: number }
  > = {}

  for (const item of monthlyVisitsAggregation) {
    if (!item._id || !item._id.year || !item._id.month) continue
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
    if (!visitsMap[key]) {
      visitsMap[key] = { total: 0, egypt: 0, international: 0 }
    }
    visitsMap[key].total += item.count || 0
    if (item._id.country === 'EG') {
      visitsMap[key].egypt += item.count || 0
    } else {
      visitsMap[key].international += item.count || 0
    }
  }

  const visitsByMonth = rolling12Months.map((m) => {
    const stats = visitsMap[m.monthKey] || { total: 0, egypt: 0, international: 0 }
    return {
      monthKey: m.monthKey,
      label: m.label,
      fullLabel: m.fullLabel,
      year: m.year,
      month: m.month,
      count: stats.total,
      egyptCount: stats.egypt,
      intlCount: stats.international,
    }
  })

  const visitsByCountry = countryAggregation.map((c) => ({
    country: c._id || 'Unknown',
    count: c.count,
    percentage: totalVisits > 0 ? Math.round((c.count / totalVisits) * 100) : 0,
  }))

  const topPages = pagesAggregation.map((p) => ({
    path: p._id || '/',
    count: p.count,
  }))

  const topReferrers = referrersAggregation.map((r) => ({
    referrer: r._id || 'Direct',
    count: r.count,
  }))

  const recent = recentVisitsDocs.map((v) => ({
    id: v._id?.toString() || '',
    path: v.path,
    country: v.country,
    city: v.city,
    region: v.region,
    referrer: v.referrer,
    timestamp: v.timestamp.toISOString(),
  }))

  // Profit Analytics (ADMIN ONLY)
  let profitAnalytics = null
  const isAdmin = session.role === 'admin'

  if (isAdmin) {
    const allBookings = await bookingsCollection.find({}).toArray()

    let totalRevenueEGP = 0
    let totalRevenueUSD = 0
    let confirmedCount = 0
    let pendingCount = 0
    let cancelledCount = 0

    const revenueByConsultationMap: Record<
      string,
      { titleEn: string; titleAr: string; count: number; revenueEGP: number; revenueUSD: number }
    > = {}

    const monthlyProfitMap: Record<
      string,
      { revenueEGP: number; revenueUSD: number; bookingsCount: number }
    > = {}

    for (const b of allBookings) {
      const isConfirmed = b.status === 'confirmed' || b.paymentStatus === 'verified'
      const bDate = b.createdAt ? new Date(b.createdAt) : now
      const bYear = bDate.getFullYear()
      const bMonth = bDate.getMonth() + 1
      const monthKey = `${bYear}-${String(bMonth).padStart(2, '0')}`

      if (isConfirmed) {
        confirmedCount++
        if (b.currency === 'USD') {
          totalRevenueUSD += b.amount || 0
        } else {
          totalRevenueEGP += b.amount || 0
        }

        const cId = b.consultationId || 'other'
        if (!revenueByConsultationMap[cId]) {
          revenueByConsultationMap[cId] = {
            titleEn: b.consultationTitle?.en || 'Consultation',
            titleAr: b.consultationTitle?.ar || 'استشارة',
            count: 0,
            revenueEGP: 0,
            revenueUSD: 0,
          }
        }
        revenueByConsultationMap[cId].count++
        if (b.currency === 'USD') {
          revenueByConsultationMap[cId].revenueUSD += b.amount || 0
        } else {
          revenueByConsultationMap[cId].revenueEGP += b.amount || 0
        }

        if (!monthlyProfitMap[monthKey]) {
          monthlyProfitMap[monthKey] = {
            revenueEGP: 0,
            revenueUSD: 0,
            bookingsCount: 0,
          }
        }
        if (b.currency === 'USD') {
          monthlyProfitMap[monthKey].revenueUSD += b.amount || 0
        } else {
          monthlyProfitMap[monthKey].revenueEGP += b.amount || 0
        }
        monthlyProfitMap[monthKey].bookingsCount++
      } else if (b.status === 'pending') {
        pendingCount++
      } else if (b.status === 'cancelled') {
        cancelledCount++
      }
    }

    const profitByMonth = rolling12Months.map((m) => {
      const stats = monthlyProfitMap[m.monthKey] || {
        revenueEGP: 0,
        revenueUSD: 0,
        bookingsCount: 0,
      }
      return {
        monthKey: m.monthKey,
        label: m.label,
        fullLabel: m.fullLabel,
        year: m.year,
        month: m.month,
        revenueEGP: stats.revenueEGP,
        revenueUSD: stats.revenueUSD,
        bookingsCount: stats.bookingsCount,
      }
    })

    profitAnalytics = {
      totalRevenueEGP,
      totalRevenueUSD,
      confirmedCount,
      pendingCount,
      cancelledCount,
      totalBookings: allBookings.length,
      breakdownByConsultation: Object.values(revenueByConsultationMap),
      profitByMonth,
    }
  }

  const initialData = {
    role: session.role,
    isAdmin,
    visits: {
      total: totalVisits,
      today: visitsToday,
      last7Days: visitsLast7Days,
      last30Days: visitsLast30Days,
      byMonth: visitsByMonth,
      byCountry: visitsByCountry,
      topPages,
      topReferrers,
      recent,
    },
    profitAnalytics,
  }

  return <AnalyticsDashboard initialData={initialData} />
}
