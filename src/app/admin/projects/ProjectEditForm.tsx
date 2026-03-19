"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Upload } from "lucide-react"

const STATUSES = ["Open","Fundraising","Goal Reached","Closed","Coming Soon"]
const SECTORS  = ["Real Estate","Private Equity","Technology","Healthcare","Energy","Infrastructure","Other"]
const RISKS    = ["Low","Medium","Medium-High","High"]

export function ProjectEditForm({ project }: { project: any | null }) {
  const router = useRouter()
  const isNew = !project
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [f, setF] = useState({
    name: project?.name ?? "",
    slug: project?.slug ?? "",
    summary: project?.summary ?? "",
    description: project?.description ?? "",
    country: project?.country ?? "",
    sector: project?.sector ?? "",
    status: project?.status ?? "Open",
    minTicket: project?.minTicket ?? "",
    irrTargetBps: project?.irrTargetBps ?? "",
    investmentType: project?.investmentType ?? "",
    targetRaise: project?.targetRaise ?? "",
    raisedAmount: project?.raisedAmount ?? "",
    currency: project?.currency ?? "USD",
    expectedDuration: project?.expectedDuration ?? "",
    riskLevel: project?.riskLevel ?? "",
    ndaText: project?.ndaText ?? "",
    videoUrl: project?.videoUrl ?? "",
    closingDate: project?.closingDate ? new Date(project.closingDate).toISOString().split("T")[0] : "",
    isFeatured: project?.isFeatured ?? false,
    teaserPublic: project?.teaserPublic ?? false,
    seoIndexable: project?.seoIndexable ?? false,
    ndaRequired: project?.ndaRequired ?? true,
    twoFaRequired: project?.twoFaRequired ?? false,
    notifyOnOpen: project?.notifyOnOpen ?? false,
    sortOrder: project?.sortOrder ?? 0,
    brandColor: project?.brandColor ?? "",
    brandName: project?.brandName ?? "",
    highlights: Array.isArray(project?.highlights) ? project.highlights.join("\n") : "",
    pmIrr: (project?.publicMetrics as any)?.irr !== false,
    pmTicket: (project?.publicMetrics as any)?.minTicket !== false,
  })
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))

  async function uploadFile(file: File, type: string): Promise<string | null> {
    const fd = new FormData(); fd.append("file", file); fd.append("projectId", project?.id ?? "temp"); fd.append("type", type)
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd }); const d = await r.json()
    return d.path ?? null
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true)
    const payload = {
      ...(isNew ? {} : { id: project.id }),
      name: f.name, slug: f.slug || undefined, summary: f.summary || null, description: f.description || null,
      country: f.country || null, sector: f.sector || null, status: f.status,
      minTicket: f.minTicket ? Number(f.minTicket) : null,
      irrTargetBps: f.irrTargetBps ? Number(f.irrTargetBps) : null,
      investmentType: f.investmentType || null,
      targetRaise: f.targetRaise ? BigInt(f.targetRaise).toString() : null,
      raisedAmount: f.raisedAmount ? BigInt(f.raisedAmount).toString() : null,
      currency: f.currency, expectedDuration: f.expectedDuration || null, riskLevel: f.riskLevel || null,
      ndaText: f.ndaText || null, videoUrl: f.videoUrl || null,
      closingDate: f.closingDate ? new Date(f.closingDate).toISOString() : null,
      isFeatured: f.isFeatured, teaserPublic: f.teaserPublic, seoIndexable: f.seoIndexable,
      ndaRequired: f.ndaRequired, twoFaRequired: f.twoFaRequired, notifyOnOpen: f.notifyOnOpen,
      sortOrder: Number(f.sortOrder),
      brandColor: f.brandColor || null, brandName: f.brandName || null,
      highlights: f.highlights.split("\n").map(s => s.trim()).filter(Boolean),
      publicMetrics: { irr: f.pmIrr, minTicket: f.pmTicket },
    }
    const r = await fetch("/api/admin/projects", { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const d = await r.json(); setLoading(false)
    if (!r.ok) { setError(d.error ?? "Failed"); return }
    if (isNew) router.push(`/admin/projects/${d.project.id}`)
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh() }
  }

  const Input = ({ name, label, type = "text", placeholder }: any) => (
    <div className="space-y-1.5">
      <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>{label}</label>
      <input type={type} value={(f as any)[name] ?? ""} onChange={e => set(name, e.target.value)} placeholder={placeholder} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 85%)" }}/>
    </div>
  )
  const Toggle = ({ name, label }: { name: string; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={() => set(name, !(f as any)[name])} className="relative w-9 h-5 rounded-full transition-colors" style={{ background: (f as any)[name] ? "hsl(0 0% 75%)" : "hsl(0 0% 18%)" }}>
        <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: (f as any)[name] ? "translateX(16px)" : "translateX(0)" }}/>
      </div>
      <span className="text-sm" style={{ color: "hsl(0 0% 65%)" }}>{label}</span>
    </label>
  )

  return (
    <form onSubmit={submit} className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/projects" className="text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>← Projects</Link>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>{isNew ? "New Project" : `Edit — ${project.name}`}</h1>
        {!isNew && <Link href={`/projects/${project.slug}?preview=1`} target="_blank" className="ml-auto text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>👁 Preview</Link>}
      </div>

      {error && <div className="alert-error">{error}</div>}
      {saved && <div className="alert-success">✓ Saved.</div>}

      {/* Basic */}
      <section className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
        <h3 className="text-sm font-medium">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input name="name" label="Project Name *" placeholder="Alcazar Fund I" />
          <Input name="slug" label="Slug (auto-generated)" placeholder="alcazar-fund-i" />
        </div>
        <Input name="summary" label="Summary (shown on cards)" placeholder="One-sentence description…" />
        <div className="space-y-1.5">
          <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Description (shown after access)</label>
          <textarea value={f.description} onChange={e => set("description", e.target.value)} rows={5} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 85%)" }}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Sector</label><select value={f.sector} onChange={e => set("sector", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 80%)", appearance: "auto" }}><option value="">Select…</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select></div>
          <Input name="country" label="Country" placeholder="UAE" />
          <div className="space-y-1.5"><label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Status</label><select value={f.status} onChange={e => set("status", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 80%)", appearance: "auto" }}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
      </section>

      {/* Investment */}
      <section className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
        <h3 className="text-sm font-medium">Investment Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Input name="minTicket" label="Min. Ticket" type="number" placeholder="250000" />
          <Input name="irrTargetBps" label="IRR bps (1800=18%)" type="number" placeholder="1800" />
          <Input name="investmentType" label="Type" placeholder="Private Equity" />
          <Input name="targetRaise" label="Target Raise" type="number" placeholder="50000000" />
          <Input name="raisedAmount" label="Amount Raised" type="number" placeholder="12000000" />
          <Input name="currency" label="Currency" placeholder="USD" />
          <Input name="expectedDuration" label="Duration" placeholder="5–7 years" />
          <div className="space-y-1.5"><label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Risk</label><select value={f.riskLevel} onChange={e => set("riskLevel", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 80%)", appearance: "auto" }}><option value="">Select…</option>{RISKS.map(r => <option key={r}>{r}</option>)}</select></div>
          <Input name="closingDate" label="Closing Date" type="date" />
        </div>
        <div className="pt-2 border-t space-y-2" style={{ borderColor: "hsl(0 0% 10%)" }}>
          <p className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>Show on public teaser:</p>
          <div className="flex gap-6"><Toggle name="pmIrr" label="Show IRR" /><Toggle name="pmTicket" label="Show Min. Ticket" /></div>
        </div>
      </section>

      {/* Visibility */}
      <section className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
        <h3 className="text-sm font-medium">Visibility & Security</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle name="teaserPublic"  label="Public teaser (visible without login)" />
          <Toggle name="seoIndexable"  label="SEO indexable (Google)" />
          <Toggle name="ndaRequired"   label="NDA required for data room" />
          <Toggle name="isFeatured"    label="Featured (pinned at top)" />
          <Toggle name="twoFaRequired" label="2FA required for investors" />
          <Toggle name="notifyOnOpen"  label="Notify on first document open" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input name="sortOrder" label="Sort order (lower = first)" type="number" />
        </div>
      </section>

      {/* White-label */}
      <section className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
        <h3 className="text-sm font-medium">White-Label</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input name="brandName" label="Portal name" placeholder="Alcazar Capital" />
          <div className="space-y-1.5"><label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Brand color</label><div className="flex gap-2"><input type="color" value={f.brandColor || "#ffffff"} onChange={e => set("brandColor", e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)" }}/><input value={f.brandColor} onChange={e => set("brandColor", e.target.value)} placeholder="#ffffff" className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 80%)" }}/></div></div>
        </div>
      </section>

      {/* Highlights */}
      <section className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
        <h3 className="text-sm font-medium">Key Highlights <span style={{ color: "hsl(0 0% 40%)", fontWeight: 400 }}>(one per line)</span></h3>
        <textarea value={f.highlights} onChange={e => set("highlights", e.target.value)} rows={5} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none font-mono" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 75%)" }} placeholder="Target IRR of 18% per annum&#10;Minimum investment: $250,000"/>
      </section>

      {/* NDA */}
      <section className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
        <h3 className="text-sm font-medium">NDA Text</h3>
        <textarea value={f.ndaText} onChange={e => set("ndaText", e.target.value)} rows={10} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none font-mono" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 70%)" }}/>
      </section>

      <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)", opacity: loading ? 0.7 : 1 }}>
        {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
        {isNew ? "Create Project" : "Save Changes"}
      </button>
    </form>
  )
}
