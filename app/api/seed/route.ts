import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUsersCollection, getConsultationsCollection } from '@/lib/db'

export async function GET() {
  try {
    const usersCollection = await getUsersCollection()
    const consultationsCollection = await getConsultationsCollection()

    // 1. Check & Seed Admin User
    const existingAdmin = await usersCollection.findOne({ username: 'admin' })
    let adminCreated = false
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10)
      await usersCollection.insertOne({
        username: 'admin',
        passwordHash,
        displayName: 'Dr. Dalia Admin',
        role: 'admin',
        createdAt: new Date(),
      })
      adminCreated = true
    }

    // 2. Check & Seed Staff User
    const existingStaff = await usersCollection.findOne({ username: 'staff' })
    let staffCreated = false
    if (!existingStaff) {
      const passwordHash = await bcrypt.hash('staff123', 10)
      await usersCollection.insertOne({
        username: 'staff',
        passwordHash,
        displayName: 'Clinic Assistant',
        role: 'staff',
        createdAt: new Date(),
      })
      staffCreated = true
    }

    // 3. Check & Seed Default Consultations
    const count = await consultationsCollection.countDocuments()
    let consultationsSeeded = 0
    if (count === 0) {
      const defaultConsultations = [
        {
          title: {
            en: '30-Minute Consultation',
            ar: 'استشارة 30 دقيقة',
          },
          description: {
            en: 'A comprehensive session to discuss your medical concerns, review your health history, and receive guidance.',
            ar: 'جلسة استشارية متكاملة لمناقشة مخاوفك الصحية، مراجعة تاريخك الطبي، والحصول على التوجيه اللازم.',
          },
          durationMinutes: 30,
          priceEGP: 1500,
          priceUSD: 60,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: {
            en: '60-Minute Deep-Dive Consultation',
            ar: 'استشارة تفصيلية 60 دقيقة',
          },
          description: {
            en: 'An extended, in-depth consultation giving ample time to explore complex health concerns and questions thoroughly.',
            ar: 'جلسة موسّعة ومُفصّلة توفّر وقتاً كافياً لبحث واستكشاف مختلف المخاوف والاستفسارات الصحية بشكل شامل.',
          },
          durationMinutes: 60,
          priceEGP: 2800,
          priceUSD: 110,
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: {
            en: 'Follow-up Consultation',
            ar: 'استشارة متابعة',
          },
          description: {
            en: 'A focused session to review progress, test results, and adjust your care plan.',
            ar: 'جلسة مركّزة لمراجعة التقدّم، نتائج التحاليل، وتعديل خطة الرعاية.',
          },
          durationMinutes: 15,
          priceEGP: 900,
          priceUSD: 35,
          isActive: true,
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await consultationsCollection.insertMany(defaultConsultations)
      consultationsSeeded = defaultConsultations.length
    }

    return NextResponse.json({
      success: true,
      message: 'Seed check completed successfully.',
      details: {
        adminCreated,
        staffCreated,
        adminCredentials: { username: 'admin', password: 'admin123' },
        staffCredentials: { username: 'staff', password: 'staff123' },
        consultationsSeeded,
      },
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Seed failed' },
      { status: 500 },
    )
  }
}
