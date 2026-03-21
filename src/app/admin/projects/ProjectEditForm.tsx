"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

const STATUSES = ["Open","Fundraising","Goal Reached","Closed","Coming Soon"]
const SECTORS  = ["Real Estate","Private Equity","Technology","Healthcare","Energy","Infrastructure","Other"]
const RISKS    = ["Low","Medium","Medium-High","High"]

// Standalone Toggle component — hors du composant parent pour éviter re-renders
function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={onChange} className="relative w-9 h-5 rounded-full transition-colors" style={{ background: value ? "hsl(var(--foreground) / 0.8)" : "hsl(var(--border))" }}>
        <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: value ? "translateX(16px)" : "translateX(0)" }}/>
      </div>
      <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
    </label>
  )
}

export function ProjectEditForm({ project }: { project: any | null }) {
  const router = useRouter()
  const isNew = !project
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState(project?.name ?? "")
  const [slug, setSlug] = useState(project?.slug ?? "")
  const [summary, setSummary] = useState(project?.summary ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [country, setCountry] = useState(project?.country ?? "")
  const [sector, setSector] = useState(project?.sector ?? "")
  const [status, setStatus] = useState(project?.status ?? "Open")
  const [minTicket, setMinTicket] = useState(project?.minTicket ?? "")
  const [irrTargetBps, setIrrTargetBps] = useState(project?.irrTargetBps ?? "")
  const [investmentType, setInvestmentType] = useState(project?.investmentType ?? "")
  const [targetRaise, setTargetRaise] = useState(project?.targetRaise ?? "")
  const [raisedAmount, setRaisedAmount] = useState(project?.raisedAmount ?? "")
  const [currency, setCurrency] = useState(project?.currency ?? "USD")
  const [expectedDuration, setExpectedDuration] = useState(project?.expectedDuration ?? "")
  const [riskLevel, setRiskLevel] = useState(project?.riskLevel ?? "")
  const [ndaText, setNdaText] = useState(project?.ndaText ?? "")
  const [videoUrl, setVideoUrl] = useState(project?.videoUrl ?? "")
  const [closingDate, setClosingDate] = useState(project?.closingDate ? new Date(project.closingDate).toISOString().split("T")[0] : "")
  const [isFeatured, setIsFeatured] = useState(project?.isFeatured ?? false)
  const [teaserPublic, setTeaserPublic] = useState(project?.teaserPublic ?? false)
  const [seoIndexable, setSeoIndexable] = useState(project?.seoIndexable ?? false)
  const [ndaRequired, setNdaRequired] = useState(project?.ndaRequired ?? true)
  const [twoFaRequired, setTwoFaRequired] = useState(project?.twoFaRequired ?? false)
  const [notifyOnOpen, setNotifyOnOpen] = useState(project?.notifyOnOpen ?? false)
  const [sortOrder, setSortOrder] = useState(project?.sortOrder ?? 0)
  const [brandColor, setBrandColor] = useState(project?.brandColor ?? "")
  const [brandName, setBrandName] = useState(project?.brandName ?? "")
  const [highlights, setHighlights] = useState(
    Array.isArray(project?.highlights) ? project.highlights.join("\n") : ""
  )
  const pm = project?.publicMetrics as any
  const [pmIrr, setPmIrr] = useState(pm?.irr !== false)
  const [pmTicket, setPmTicket] = useState(pm?.minTicket !== false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      ...(isNew ? {} : { id: project.id }),
      name, slug: slug || undefined, summary: summary || null,
      description: description || null, country: country || null,
      sector: sector || null, status,
      minTicket: minTicket ? Number(minTicket) : null,
      irrTargetBps: irrTargetBps ? Number(irrTargetBps) : null,
      investmentType: investmentType || null,
      targetRaise: targetRaise ? String(targetRaise) : null,
      raisedAmount: raisedAmount ? String(raisedAmount) : null,
      currency, expectedDuration: expectedDuration || null,
      riskLevel: riskLevel || null, ndaText: ndaText || null,
      videoUrl: videoUrl || null,
      closingDate: closingDate ? new Date(closingDate).toISOString() : null,
      isFeatured, teaserPublic, seoIndexable, ndaRequired,
      twoFaRequired, notifyOnOpen, sortOrder: Number(sortOrder),
      brandColor: brandColor || null, brandName: brandName || null,
      highlights: highlights.split("\n").map((s: string) => s.trim()).filter(Boolean),
      publicMetrics: { irr: pmIrr, minTicket: pmTicket },
    }

    const r = await fetch("/api/admin/projects", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const d = await r.json()
    setLoading(false)

    if (!r.ok) { setError(d.error ?? "Failed"); return }

    if (isNew) {
      router.push(`/admin/projects/${d.project.id}`)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }
  const inp = "w-full rounded-lg px-3 py-2 text-sm outline-none"
  const inpStyle = { background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 85%)" }
  const section = "rounded-xl border p-5 space-y-4"
  const sectionStyle = { background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }

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
      <section className={section} style={sectionStyle}>
        <h3 className="text-sm font-medium">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Project Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Alcazar Fund I" className={inp} style={inpStyle} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Slug (auto-generated)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="alcazar-fund-i" className={inp} style={inpStyle} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Summary (shown on cards)</label>
          <input value={summary} onChange={e => setSummary(e.target.value)} placeholder="One-sentence description…" className={inp} style={inpStyle} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Description (shown after access)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className={inp} style={{ ...inpStyle, resize: "none" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} className={inp} style={{ ...inpStyle, appearance: "auto" }}>
              <option value="">Select…</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="UAE" className={inp} style={inpStyle} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inp} style={{ ...inpStyle, appearance: "auto" }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Investment */}
      <section className={section} style={sectionStyle}>
        <h3 className="text-sm font-medium">Investment Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            ["Min. Ticket", minTicket, setMinTicket, "number", "250000"],
            ["IRR bps (1800=18%)", irrTargetBps, setIrrTargetBps, "number", "1800"],
            ["Type", investmentType, setInvestmentType, "text", "Private Equity"],
            ["Target Raise", targetRaise, setTargetRaise, "number", "50000000"],
            ["Amount Raised", raisedAmount, setRaisedAmount, "number", "12000000"],
            ["Currency", currency, setCurrency, "text", "USD"],
            ["Duration", expectedDuration, setExpectedDuration, "text", "5–7 years"],
            ["Closing Date", closingDate, setClosingDate, "date", ""],
          ].map(([label, val, setter, type, ph]: any) => (
            <div key={label} className="space-y-1.5">
              <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>{label}</label>
              <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph} className={inp} style={inpStyle} />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Risk</label>
            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className={inp} style={{ ...inpStyle, appearance: "auto" }}>
              <option value="">Select…</option>
              {RISKS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="pt-2 border-t space-y-2" style={{ borderColor: "hsl(0 0% 10%)" }}>
          <p className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>Show on public teaser:</p>
          <div className="flex gap-6">
            <Toggle value={pmIrr} onChange={() => setPmIrr(!pmIrr)} label="Show IRR" />
            <Toggle value={pmTicket} onChange={() => setPmTicket(!pmTicket)} label="Show Min. Ticket" />
          </div>
        </div>
      </section>

      {/* Visibility */}
      <section className={section} style={sectionStyle}>
        <h3 className="text-sm font-medium">Visibility & Security</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle value={teaserPublic}  onChange={() => setTeaserPublic(!teaserPublic)}   label="Public teaser (visible without login)" />
          <Toggle value={seoIndexable}  onChange={() => setSeoIndexable(!seoIndexable)}   label="SEO indexable (Google)" />
          <Toggle value={ndaRequired}   onChange={() => setNdaRequired(!ndaRequired)}     label="NDA required for data room" />
          <Toggle value={isFeatured}    onChange={() => setIsFeatured(!isFeatured)}       label="Featured (pinned at top)" />
          <Toggle value={twoFaRequired} onChange={() => setTwoFaRequired(!twoFaRequired)} label="2FA required for investors" />
          <Toggle value={notifyOnOpen}  onChange={() => setNotifyOnOpen(!notifyOnOpen)}   label="Notify on first document open" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Sort order (lower = first)</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inp} style={{ ...inpStyle, maxWidth: "120px" }} />
        </div>
      </section>

      {/* White-label */}
      <section className={section} style={sectionStyle}>
        <h3 className="text-sm font-medium">White-Label</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Portal name</label>
            <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Alcazar Capital" className={inp} style={inpStyle} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "hsl(0 0% 45%)" }}>Brand color</label>
            <div className="flex gap-2">
              <input type="color" value={brandColor || "#ffffff"} onChange={e => setBrandColor(e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer" style={{ border: "1px solid hsl(0 0% 15%)" }} />
              <input value={brandColor} onChange={e => setBrandColor(e.target.value)} placeholder="#ffffff" className={inp} style={inpStyle} />
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className={section} style={sectionStyle}>
        <h3 className="text-sm font-medium">Key Highlights <span style={{ color: "hsl(0 0% 40%)", fontWeight: 400 }}>(one per line)</span></h3>
        <textarea value={highlights} onChange={e => setHighlights(e.target.value)} rows={5} className={inp} style={{ ...inpStyle, resize: "none", fontFamily: "monospace", fontSize: "13px" }} placeholder="Target IRR of 18% per annum&#10;Minimum investment: $250,000" />
      </section>

      {/* NDA */}
      <section className={section} style={sectionStyle}>
        <h3 className="text-sm font-medium">NDA Text</h3>
        <textarea value={ndaText} onChange={e => setNdaText(e.target.value)} rows={10} className={inp} style={{ ...inpStyle, resize: "none", fontFamily: "monospace", fontSize: "13px" }} />
      </section>

      {/* Video */}
      <section className={section} style={sectionStyle}>
        <h3 className="text-sm font-medium">Video URL (YouTube or Vimeo)</h3>
        <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inp} style={inpStyle} />
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)", opacity: loading ? 0.7 : 1 }}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isNew ? "Create Project" : "Save Changes"}
        </button>
        {!isNew && (
          <>
            <Link href={`/admin/documents?project=${project.id}`} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>Manage Documents</Link>
            <Link href={`/admin/investors?project=${project.id}`} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>Manage Investors</Link>
          </>
        )}
      </div>
    </form>
  )
}
