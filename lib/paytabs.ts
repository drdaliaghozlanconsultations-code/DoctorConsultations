/**
 * PayTabs Server-Side API Client
 *
 * Uses the Hosted Payment Page (HPP) flow:
 *   1. Server creates a payment page → receives redirect_url
 *   2. Patient is redirected to PayTabs to enter card details
 *   3. PayTabs posts the result to our callback URL (server-to-server)
 *   4. Patient is redirected back to our return URL
 */

// Regional endpoint mapping
const REGION_ENDPOINTS: Record<string, string> = {
  egypt: 'https://secure-egypt.paytabs.com',
  global: 'https://secure-global.paytabs.com',
  saudi: 'https://secure.paytabs.sa',
  uae: 'https://secure.paytabs.com',
  jordan: 'https://secure-jordan.paytabs.com',
  oman: 'https://secure-oman.paytabs.com',
}

function getBaseUrl(): string {
  const region = process.env.PAYTABS_REGION || 'egypt'
  return REGION_ENDPOINTS[region] || REGION_ENDPOINTS.egypt
}

function getServerKey(): string {
  const key = process.env.PAYTABS_SERVER_KEY
  if (!key) throw new Error('PAYTABS_SERVER_KEY is not configured')
  return key
}

function getProfileId(): string {
  const id = process.env.PAYTABS_PROFILE_ID
  if (!id) throw new Error('PAYTABS_PROFILE_ID is not configured')
  return id
}

export interface PayTabsCustomer {
  name: string
  email: string
  phone: string
  country: string // ISO 2-letter code (e.g. "EG", "US")
}

export interface CreatePaymentParams {
  cartId: string // booking reference (e.g. "DR.DALIA-123456")
  cartAmount: number
  cartCurrency: 'EGP' | 'USD'
  cartDescription: string
  customer: PayTabsCustomer
  callbackUrl: string
  returnUrl: string
}

export interface PayTabsPaymentResponse {
  tran_ref: string
  tran_type: string
  cart_id: string
  cart_description: string
  cart_currency: string
  cart_amount: string
  redirect_url: string
  // ... other fields from PayTabs
  [key: string]: unknown
}

export interface PayTabsCallbackData {
  tran_ref: string
  merchant_id: number
  profile_id: number
  cart_id: string
  cart_description: string
  cart_currency: string
  cart_amount: string
  tran_currency: string
  tran_total: string
  tran_type: string
  tran_class: string
  token: string
  customer_details: {
    name: string
    email: string
    phone: string
    street1: string
    city: string
    state: string
    country: string
    ip: string
  }
  payment_result: {
    response_status: string // "A" = Authorized, "D" = Declined, "E" = Error
    response_code: string
    response_message: string
    transaction_time: string
  }
  payment_info: {
    payment_method: string
    card_type: string
    card_scheme: string
    payment_description: string
    expiryMonth: number
    expiryYear: number
  }
  [key: string]: unknown
}

/**
 * Create a hosted payment page via PayTabs API.
 * Returns the full PayTabs response including redirect_url.
 */
export async function createPaymentPage(
  params: CreatePaymentParams,
): Promise<PayTabsPaymentResponse> {
  const baseUrl = getBaseUrl()
  const serverKey = getServerKey()
  const profileId = getProfileId()

  const body = {
    profile_id: Number(profileId),
    tran_type: 'sale',
    tran_class: 'ecom',
    cart_id: params.cartId,
    cart_currency: params.cartCurrency,
    cart_amount: params.cartAmount,
    cart_description: params.cartDescription,
    callback: params.callbackUrl,
    return: params.returnUrl,
    customer_details: {
      name: params.customer.name,
      email: params.customer.email,
      phone: params.customer.phone,
      country: params.customer.country,
    },
    // Hide the shipping info since this is a service, not a product
    hide_shipping: true,
  }

  const response = await fetch(`${baseUrl}/payment/request`, {
    method: 'POST',
    headers: {
      Authorization: serverKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('PayTabs payment request failed:', response.status, text)
    throw new Error(`PayTabs API error: ${response.status}`)
  }

  const data = (await response.json()) as PayTabsPaymentResponse

  if (!data.redirect_url) {
    console.error('PayTabs response missing redirect_url:', data)
    throw new Error('PayTabs did not return a redirect URL')
  }

  return data
}

/**
 * Query a transaction by its reference to verify its status.
 */
export async function queryTransaction(tranRef: string): Promise<PayTabsCallbackData> {
  const baseUrl = getBaseUrl()
  const serverKey = getServerKey()
  const profileId = getProfileId()

  const response = await fetch(`${baseUrl}/payment/query`, {
    method: 'POST',
    headers: {
      Authorization: serverKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile_id: Number(profileId),
      tran_ref: tranRef,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('PayTabs query failed:', response.status, text)
    throw new Error(`PayTabs query error: ${response.status}`)
  }

  return (await response.json()) as PayTabsCallbackData
}

/**
 * Check if a PayTabs callback indicates a successful payment.
 * response_status "A" = Authorized (success)
 */
export function isPaymentSuccessful(data: PayTabsCallbackData): boolean {
  return data.payment_result?.response_status === 'A'
}
