// Stripe is optional — enabled via Settings > Billing toggle
// When STRIPE_SECRET_KEY is not set, all stripe functions are no-ops

export const STRIPE_ENABLED = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "placeholder" &&
  process.env.STRIPE_SECRET_KEY.startsWith("sk_")
)

export const PLANS = {
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER ?? "",
    price: 99,
    maxProjects: 1,
    maxInvestors: 10,
    maxStorageGb: 5,
    features: ["1 project", "10 investors", "5GB storage", "Basic analytics", "Email support"],
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    price: 299,
    maxProjects: 10,
    maxInvestors: 100,
    maxStorageGb: 50,
    features: ["10 projects", "100 investors", "50GB storage", "Advanced analytics", "Workflows", "Priority support"],
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
    price: 999,
    maxProjects: 999,
    maxInvestors: 9999,
    maxStorageGb: 500,
    features: ["Unlimited projects", "Unlimited investors", "500GB storage", "White-label", "Custom domain", "Dedicated support"],
  },
} as const

export type PlanName = keyof typeof PLANS

// Lazy-load Stripe only when enabled
let _stripe: any = null
async function getStripe() {
  if (!STRIPE_ENABLED) throw new Error("Stripe is not enabled. Configure STRIPE_SECRET_KEY in environment.")
  if (!_stripe) {
    const Stripe = (await import("stripe")).default
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia", typescript: true })
  }
  return _stripe
}

export async function createCheckoutSession({
  tenantId, planName, email, successUrl, cancelUrl
}: {
  tenantId: string
  planName: PlanName
  email: string
  successUrl: string
  cancelUrl: string
}) {
  const stripe = await getStripe()
  const plan = PLANS[planName]
  if (!plan.priceId) throw new Error(`No priceId configured for plan ${planName}. Add STRIPE_PRICE_${planName} to environment.`)

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    metadata: { tenantId, planName },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: { trial_period_days: 14, metadata: { tenantId, planName } },
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = await getStripe()
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
}

export async function constructWebhookEvent(body: string, sig: string, secret: string) {
  const stripe = await getStripe()
  return stripe.webhooks.constructEvent(body, sig, secret)
}

export async function retrieveSubscription(id: string) {
  const stripe = await getStripe()
  return stripe.subscriptions.retrieve(id)
}
