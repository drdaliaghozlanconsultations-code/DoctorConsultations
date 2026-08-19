import { ObjectId } from 'mongodb'
import clientPromise from './mongodb'

export type UserRole = 'admin' | 'staff'

export interface UserDoc {
  _id?: ObjectId
  username: string
  passwordHash: string
  displayName: string
  role: UserRole
  createdAt: Date
  updatedAt?: Date
}

export interface LocalizedText {
  en: string
  ar: string
}

export interface ConsultationDoc {
  _id?: ObjectId
  title: LocalizedText
  description: LocalizedText
  durationMinutes: number
  priceEGP: number
  priceUSD: number
  isActive: boolean
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'
export type PaymentMethod = 'instapay' | 'card'

export interface BookingDoc {
  _id?: ObjectId
  reference: string
  consultationId: string
  consultationTitle: LocalizedText
  patientName: string
  email: string
  phone: string
  whatsapp: string
  country: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  notes?: string
  status: BookingStatus
  paymentMethod: PaymentMethod
  amount: number
  currency: 'EGP' | 'USD'
  paymentReceiptUrl?: string
  paymentReceiptPublicId?: string
  paymentStatus: PaymentStatus
  verifiedBy?: string
  verifiedAt?: Date
  googleMeetLink?: string
  googleCalendarEventId?: string
  googleCalendarEventLink?: string
  createdAt: Date
  updatedAt: Date
}

export type BookingItem = Omit<BookingDoc, '_id'> & { _id: string }
export type ConsultationItem = Omit<ConsultationDoc, '_id'> & { _id: string }

export interface VisitDoc {
  _id?: ObjectId
  path: string
  country: string
  city?: string
  region?: string
  ip?: string
  referrer?: string
  userAgent?: string
  timestamp: Date
}

export interface PaymentProcessDoc {
  _id?: ObjectId
  bookingId: string
  bookingReference: string
  method: PaymentMethod
  amount: number
  currency: 'EGP' | 'USD'
  receiptUrl?: string
  receiptPublicId?: string
  status: PaymentStatus
  verifiedBy?: string
  verifiedAt?: Date
  notes?: string
  createdAt: Date
}

export async function getDb() {
  const client = await clientPromise
  return client.db()
}

export async function getUsersCollection() {
  const db = await getDb()
  return db.collection<UserDoc>('users')
}

export async function getConsultationsCollection() {
  const db = await getDb()
  return db.collection<ConsultationDoc>('consultations')
}

export async function getBookingsCollection() {
  const db = await getDb()
  return db.collection<BookingDoc>('bookings')
}

export async function getVisitsCollection() {
  const db = await getDb()
  return db.collection<VisitDoc>('visits')
}

export async function getPaymentProcessesCollection() {
  const db = await getDb()
  return db.collection<PaymentProcessDoc>('payment_processes')
}

export interface SettingDoc {
  _id?: ObjectId
  key: string
  value: any
  updatedAt: Date
}

export async function getSettingsCollection() {
  const db = await getDb()
  return db.collection<SettingDoc>('settings')
}

