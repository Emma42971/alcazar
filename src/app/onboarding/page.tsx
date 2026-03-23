"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Check, Loader2, Palette, CreditCard, ArrowRight } from "lucide-react"
import { PLANS } from "@/lib/stripe"

// Stripe is optional — if not enabled, skip billing step
const STRIPE_ENABLED = !!(
  typeof window !== "undefined"
    ? true // checked server-side in the API
    : process.env.STRIPE_SECRET_KEY
)

const STEPS_WITH_STRIPE = [
  { id: 1, label: "Votre portail", icon: Building2 },
  { id: 2, label: "Apparence",     icon: Palette },
  { id: 3, label: "Plan & billing", icon: CreditCard },
]
const STEPS_WITHOUT_STRIPE = [
  { id: 1, label: "Votre portail", icon: Building2 },
  { id: 2, label: "Apparence",     icon: Palette },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [step, setStep]       = useState(1)
  const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null)

  const [portal, setPortal]     = useState({ name: "", slug: "", description: "" })
  const [branding, setBranding] = useState({ primaryColor: "#1a7a4a", secondaryColor: "#1a2a4a", tagline: "" })
  const [selectedPlan, setSelectedPlan] = useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO")
  const [tenantId, setTenantId] = useState("")

  const STEPS = stripeAvailable ? STEPS_WITH_STRIPE : STEPS_WITHOUT_STRIPE

  function slugify(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  async function createTenant() {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/onboarding/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...portal, primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor, tagline: branding.tagline }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erreur") }
      const data = await res.json()
      setTenantId(data.id)
      setStripeAvailable(data.stripeEnabled)

      if (data.stripeEnabled) {
        setStep(3) // Go to billing step
      } else {
        // Stripe not enabled — portal created, redirect to admin
        router.push("/admin?onboarding=success")
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function startCheckout() {
    setLoading(true)
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, planName: selectedPlan }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "Erreur Stripe")
      setLoading(false)
      return
    }
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-white"
            style={{ background: "hsl(var(--emerald))" }}>A</div>
          <span className="font-semibold text-lg" style={{ color: "hsl(var(--text))" }}>Alcazar</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all`}
                  style={{
                    background: step >= s.id ? "hsl(var(--emerald))" : "hsl(var(--bg-subtle))",
                    border: `2px solid ${step >= s.id ? "hsl(var(--emerald))" : "hsl(var(--border))"}`,
                  }}>
                  {step > s.id
                    ? <Check className="h-4 w-4 text-white" />
                    : <s.icon className="h-4 w-4" style={{ color: step >= s.id ? "white" : "hsl(var(--text-muted))" }} />
                  }
                </div>
                <span className="text-xs" style={{ color: step >= s.id ? "hsl(var(--emerald))" : "hsl(var(--text-muted))" }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-16 h-0.5 mb-5 mx-2" style={{ background: step > s.id ? "hsl(var(--emerald))" : "hsl(var(--border))" }} />
              )}
            </div>
          ))}
        </div>

        <div className="card card-p space-y-5">

          {/* Step 1 — Portal info */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "hsl(var(--text))" }}>Créez votre portail</h2>
                <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>Configurez les informations de base</p>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="space-y-3">
                <div className="field">
                  <label className="label">Nom du portail *</label>
                  <input value={portal.name} onChange={e => setPortal(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                    placeholder="Ex: Alcazar Capital" className="input" />
                </div>
                <div className="field">
                  <label className="label">Slug URL *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm shrink-0" style={{ color: "hsl(var(--text-muted))" }}>alcazar.io/</span>
                    <input value={portal.slug} onChange={e => setPortal(p => ({ ...p, slug: slugify(e.target.value) }))}
                      placeholder="mon-portail" className="input flex-1" />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Description</label>
                  <textarea value={portal.description} onChange={e => setPortal(p => ({ ...p, description: e.target.value }))}
                    placeholder="Décrivez votre portail..." className="input textarea" rows={2} />
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!portal.name || !portal.slug} className="btn btn-primary w-full">
                Continuer →
              </button>
            </>
          )}

          {/* Step 2 — Branding */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "hsl(var(--text))" }}>Apparence</h2>
                <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>Personnalisez les couleurs de votre portail</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "primaryColor", label: "Couleur principale" },
                    { key: "secondaryColor", label: "Couleur secondaire" },
                  ].map(({ key, label }) => (
                    <div key={key} className="field">
                      <label className="label">{label}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={(branding as any)[key]}
                          onChange={e => setBranding(p => ({ ...p, [key]: e.target.value }))}
                          className="h-9 w-12 rounded cursor-pointer border" style={{ borderColor: "hsl(var(--border))", padding: "2px" }} />
                        <input type="text" value={(branding as any)[key]}
                          onChange={e => setBranding(p => ({ ...p, [key]: e.target.value }))}
                          className="input flex-1" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="field">
                  <label className="label">Slogan</label>
                  <input value={branding.tagline} onChange={e => setBranding(p => ({ ...p, tagline: e.target.value }))}
                    placeholder="Exclusive investment opportunities" className="input" />
                </div>
                {/* Live preview */}
                <div className="rounded-xl p-4 text-white text-center" style={{ background: branding.secondaryColor }}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold mx-auto mb-2"
                    style={{ background: branding.primaryColor }}>A</div>
                  <p className="font-semibold text-sm">{portal.name || "Votre portail"}</p>
                  {branding.tagline && <p className="text-xs opacity-70 mt-1">{branding.tagline}</p>}
                </div>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">← Retour</button>
                <button onClick={createTenant} disabled={loading} className="btn btn-primary flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {loading ? "Création…" : "Créer le portail"}
                </button>
              </div>
            </>
          )}

          {/* Step 3 — Billing (only if Stripe enabled) */}
          {step === 3 && stripeAvailable && (
            <>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "hsl(var(--text))" }}>Choisissez votre plan</h2>
                <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>14 jours d'essai gratuit — Annulable à tout moment</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.entries(PLANS) as [string, any][]).map(([key, plan]) => (
                  <button key={key} onClick={() => setSelectedPlan(key as any)}
                    className="text-left p-4 rounded-xl border-2 transition-all space-y-3"
                    style={{
                      borderColor: selectedPlan === key ? "hsl(var(--emerald))" : "hsl(var(--border))",
                      background: selectedPlan === key ? "hsl(var(--emerald-light))" : "hsl(var(--surface))"
                    }}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm" style={{ color: "hsl(var(--text))" }}>{plan.name}</p>
                      {selectedPlan === key && <Check className="h-4 w-4" style={{ color: "hsl(var(--emerald))" }} />}
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>
                      ${plan.price}<span className="text-sm font-normal" style={{ color: "hsl(var(--text-muted))" }}>/mo</span>
                    </p>
                    <ul className="space-y-1">
                      {plan.features.map((f: string) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--text-subtle))" }}>
                          <Check className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--emerald))" }} />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button onClick={startCheckout} disabled={loading} className="btn btn-primary w-full btn-lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Commencer l'essai gratuit
              </button>
              <p className="text-xs text-center" style={{ color: "hsl(var(--text-muted))" }}>
                Redirigé vers Stripe. Aucun débit pendant les 14 premiers jours.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
