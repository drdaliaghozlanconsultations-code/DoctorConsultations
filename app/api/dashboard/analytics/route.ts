import { NextResponse } from 'next/server'
import { getVisitsCollection, getBookingsCollection } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

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

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const visitsCollection = await getVisitsCollection()
    const bookingsCollection = await getBookingsCollection()

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // 1. Visit Counts
    const totalVisits = await visitsCollection.countDocuments()
    const visitsToday = await visitsCollection.countDocuments({
      timestamp: { $gte: startOfToday },
    })
    const visitsLast7Days = await visitsCollection.countDocuments({
      timestamp: { $gte: sevenDaysAgo },
    })
    const visitsLast30Days = await visitsCollection.countDocuments({
      timestamp: { $gte: thirtyDaysAgo },
    })

    // 2. Rolling 12-Month Visits Aggregation
    const rolling12Months = getRolling12Months(now)
    const startOf12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const monthlyVisitsAggregation = await visitsCollection
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
      .toArray()

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

    // 3. Visits by Country
    const countryAggregation = await visitsCollection
      .aggregate([
        {
          $group: {
            _id: '$country',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    const visitsByCountry = countryAggregation.map((c) => ({
      country: c._id || 'Unknown',
      count: c.count,
      percentage: totalVisits > 0 ? Math.round((c.count / totalVisits) * 100) : 0,
    }))

    // 4. Top Visited Pages
    const pagesAggregation = await visitsCollection
      .aggregate([
        {
          $group: {
            _id: '$path',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray()

    const topPages = pagesAggregation.map((p) => ({
      path: p._id || '/',
      count: p.count,
    }))

    // 5. Top Referrers
    const referrersAggregation = await visitsCollection
      .aggregate([
        {
          $group: {
            _id: '$referrer',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ])
      .toArray()

    const topReferrers = referrersAggregation.map((r) => ({
      referrer: r._id || 'Direct',
      count: r.count,
    }))

    // 6. Recent Visits Log
    const recentVisitsDocs = await visitsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(30)
      .toArray()

    const recentVisits = recentVisitsDocs.map((v) => ({
      id: v._id?.toString(),
      path: v.path,
      country: v.country,
      city: v.city,
      region: v.region,
      referrer: v.referrer,
      timestamp: v.timestamp,
    }))

    // 7. Profit & Financial Analytics (ADMIN ONLY)
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

          // By Consultation breakdown
          const cId = b.consultationId || 'other'
          if (!revenueByConsultationMap[cId]) {
            revenueByConsultationMap[cId] = {
              titleEn: b.consultationTitle?.en || 'General Consultation',
              titleAr: b.consultationTitle?.ar || 'استشارة عامة',
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

          // Monthly Profit breakdown
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

    return NextResponse.json({
      success: true,
      data: {
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
          recent: recentVisits,
        },
        profitAnalytics,
      },
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 },
    )
  }
}
