/**
 * Kashier Server-Side API Client
 *
 * Uses the Payment Sessions V3 API (Hosted Checkout):
 *   1. Server creates a payment session -> receives sessionUrl
 *   2. Patient is redirected to Kashier hosted checkout to pay
 *   3. Kashier redirects back to merchantRedirect URL
 *   4. Kashier posts webhooks for asynchronous transaction notifications
 */

export interface KashierCustomer {
  name: string
  email: string
  reference: string
  phone?: string
}

export interface CreateSessionParams {
  order: string // booking reference (e.g. "DR.DALIA-123456")
  amount: number
  currency: 'EGP' | 'USD'
  merchantRedirect: string
  customer: KashierCustomer
  display?: 'en' | 'ar'
  expireMinutes?: number
}

export interface KashierSessionResponse {
  status: string
  sessionUrl: string
  sessionId?: string
  _id?: string
  merchantId?: string
  order?: string
  amount?: number
  currency?: string
  [key: string]: unknown
}

export interface KashierSessionDetails {
  status: 'CREATED' | 'PAID' | 'FAILED' | 'EXPIRED' | 'ABANDONED' | string
  order?: string
  amount?: number
  currency?: string
  transactionId?: string
  paymentStatus?: string
  sessionId?: string
  _id?: string
  customer?: {
    reference?: string
    email?: string
    name?: string
  }
  [key: string]: unknown
}

function getBaseUrl(): string {
  const mode = process.env.KASHIER_MODE?.toLowerCase()
  return mode === 'live'
    ? 'https://api.kashier.io'
    : 'https://test-api.kashier.io'
}

function getApiKey(): string {
  const key = process.env.KASHIER_API_KEY
  if (!key) throw new Error('KASHIER_API_KEY is not configured')
  return key.trim()
}

function getSecretKey(): string {
  const secret = process.env.KASHIER_SECRET_KEY
  if (!secret) throw new Error('KASHIER_SECRET_KEY is not configured')
  return secret.trim()
}

function getMerchantId(): string {
  const mid = process.env.KASHIER_MERCHANT_ID
  if (!mid) throw new Error('KASHIER_MERCHANT_ID is not configured')
  return mid.trim()
}

// ---------------------------------------------------------------------------
// Exchange Rate — Kashier's public, unauthenticated rate lookup
// GET /v3/payment/exchange-rate?from=USD&to=EGP
// Docs: https://developers.kashier.io/docs/accept-payments/currency-conversion
// ---------------------------------------------------------------------------

export interface ExchangeRateResponse {
  success: boolean
  timestamp: number
  base: string
  date: string
  rates: Record<string, number>
}

/** Simple in-memory cache so we don't hit the rate endpoint on every request. */
let _rateCache: { rate: number; fetchedAt: number } | null = null
const RATE_CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Fetch the live exchange rate from Kashier.
 * Public endpoint — no API key / secret required.
 *
 * @param from  Source currency (default `USD`)
 * @param to    Target currency (default `EGP`)
 * @returns     The exchange rate (multiply `from` amount by this to get `to` amount)
 */
export async function getExchangeRate(
  from = 'USD',
  to = 'EGP',
): Promise<number> {
  // Return cached rate if still fresh
  if (
    _rateCache &&
    from === 'USD' &&
    to === 'EGP' &&
    Date.now() - _rateCache.fetchedAt < RATE_CACHE_TTL_MS
  ) {
    return _rateCache.rate
  }

  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/v3/payment/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`

  const response = await fetch(url, { method: 'GET' })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Kashier exchange-rate lookup failed:', response.status, errorText)
    throw new Error(`Exchange rate lookup failed: ${response.status}`)
  }

  const data = (await response.json()) as ExchangeRateResponse

  if (!data.success || !data.rates?.[to]) {
    console.error('Kashier exchange-rate unexpected response:', data)
    throw new Error(`Exchange rate not available for ${from} → ${to}`)
  }

  const rate = data.rates[to]

  // Cache USD→EGP
  if (from === 'USD' && to === 'EGP') {
    _rateCache = { rate, fetchedAt: Date.now() }
  }

  return rate
}

/**
 * Convert a USD amount to EGP using Kashier's live exchange rate.
 * Returns the EGP amount rounded to 2 decimal places.
 */
export async function convertToEGP(usdAmount: number): Promise<{
  egpAmount: number
  rate: number
}> {
  const rate = await getExchangeRate('USD', 'EGP')
  const egpAmount = Math.round(usdAmount * rate * 100) / 100 // round to 2 decimals
  return { egpAmount, rate }
}

/**
 * Create a Kashier Payment Session (Hosted Checkout).
 * Returns the session object containing sessionUrl to redirect the user.
 */
export async function createPaymentSession(
  params: CreateSessionParams,
): Promise<KashierSessionResponse> {
  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()
  const secretKey = getSecretKey()
  const merchantId = getMerchantId()

  const expireMinutes = params.expireMinutes || 30
  const expireAt = new Date(Date.now() + expireMinutes * 60 * 1000).toISOString()

  // Kashier strictly requires HTTPS for merchantRedirect
  let merchantRedirect = params.merchantRedirect
  if (merchantRedirect.startsWith('http://localhost') || merchantRedirect.startsWith('http://127.0.0.1')) {
    const fallbackBase =
      (process.env.KASHIER_WEBHOOK_URL?.startsWith('https://') ? process.env.KASHIER_WEBHOOK_URL : null) ||
      (process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://') ? process.env.NEXT_PUBLIC_BASE_URL : null) ||
      'https://drdaliaghozlan.com'
    merchantRedirect = merchantRedirect.replace(/^http:\/\/[^/]+/, fallbackBase.replace(/\/$/, ''))
  }

  const payload = {
    expireAt,
    maxFailureAttempts: 3,
    amount: String(params.amount),
    currency: params.currency.toUpperCase(),
    order: params.order,
    merchantId,
    merchantRedirect,
    display: params.display === 'ar' ? 'ar' : 'en',
    type: 'one-time',
    allowedMethods: 'card,wallet',
    customer: {
      reference: params.customer.reference || params.customer.email,
      email: params.customer.email,
      name: params.customer.name,
    },
  }

  const response = await fetch(`${baseUrl}/v3/payment/sessions`, {
    method: 'POST',
    headers: {
      Authorization: secretKey,
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Kashier session creation failed:', response.status, errorText)
    throw new Error(`Kashier session error: ${response.status} - ${errorText}`)
  }

  const data = (await response.json()) as KashierSessionResponse

  if (!data.sessionUrl) {
    console.error('Kashier response missing sessionUrl:', data)
    throw new Error('Kashier did not return a session URL')
  }

  // Extract sessionId if not explicitly present
  if (!data.sessionId) {
    data.sessionId =
      (data._id as string) ||
      data.sessionUrl.split('/').filter(Boolean).pop() ||
      undefined
  }

  return data
}

/**
 * Retrieve session details to verify payment status.
 */
export async function getPaymentSession(
  sessionId: string,
): Promise<KashierSessionDetails> {
  const baseUrl = getBaseUrl()
  const apiKey = process.env.KASHIER_API_KEY?.trim()
  const secretKey = process.env.KASHIER_SECRET_KEY?.trim()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) headers['api-key'] = apiKey
  if (secretKey) headers['Authorization'] = secretKey

  const response = await fetch(`${baseUrl}/v3/payment/sessions/${sessionId}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Kashier query session failed (${sessionId}):`, response.status, errorText)
    throw new Error(`Kashier query error: ${response.status}`)
  }

  const data = (await response.json()) as KashierSessionDetails
  return data
}

/**
 * Check if a Kashier session or webhook payload indicates a successful payment.
 */
export function isPaymentSuccessful(data: KashierSessionDetails | Record<string, any>): boolean {
  if (!data) return false

  const status = typeof data.status === 'string' ? data.status.toUpperCase() : ''
  const paymentStatus =
    typeof data.paymentStatus === 'string' ? data.paymentStatus.toUpperCase() : ''

  return status === 'PAID' || paymentStatus === 'SUCCESS' || paymentStatus === 'PAID'
}
