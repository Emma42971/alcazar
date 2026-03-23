"use client"
import { useState } from "react"
import Link from "next/link"
import { Search, Filter, TrendingUp, MapPin, DollarSign, Globe, Building2, Star } from "lucide-react"

const CURRENCIES = ["All", "USD", "EUR", "AED", "GBP", "CHF"]
const REGIONS = ["All", "Dubai/UAE", "Europe", "North America", "Asia Pacific", "Africa", "Latin America"]

export function MarketplaceClient({ listings, featured, categories }: {
  listings: any[]; featured: any[]; categories: any[]
}) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("All")
  const [selectedCurrency, setSelectedCurrency] = useState("All")

  const filtered = listings.filter(l => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.shortDesc.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCategory !== "all" && l.categoryId !== selectedCategory) return false
    if (selectedRegion !== "All" && l.region !== selectedRegion) return false
    if (selectedCurrency !== "All" && l.currency !== selectedCurrency) return false
    return true
  })

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      {/* Hero */}
      <div className="py-16 px-6 text-center" style={{ background: "hsl(var(--navy))" }}>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Investment Marketplace
        </h1>
        <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
          Discover exclusive opportunities across real estate, private equity and alternatives
        </p>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--text-muted))" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, sectors, regions…"
            className="input w-full pl-11"
            style={{ height: "3rem", fontSize: "1rem", borderRadius: "0.75rem" }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
              <h2 className="font-semibold text-lg" style={{ color: "hsl(var(--text))" }}>Featured Opportunities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map(l => <ListingCard key={l.id} listing={l} featured />)}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filters sidebar */}
          <aside className="w-56 shrink-0 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: "hsl(var(--text-muted))", letterSpacing: "0.08em" }}>Category</h3>
              <div className="space-y-1">
                <button onClick={() => setSelectedCategory("all")}
                  className={`nav-item w-full text-left text-sm ${selectedCategory === "all" ? "active" : ""}`}>
                  All Categories
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                    className={`nav-item w-full text-left text-sm ${selectedCategory === c.id ? "active" : ""}`}>
                    {c.icon && <span className="mr-1">{c.icon}</span>}{c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: "hsl(var(--text-muted))", letterSpacing: "0.08em" }}>Region</h3>
              <div className="space-y-1">
                {REGIONS.map(r => (
                  <button key={r} onClick={() => setSelectedRegion(r)}
                    className={`nav-item w-full text-left text-sm ${selectedRegion === r ? "active" : ""}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: "hsl(var(--text-muted))", letterSpacing: "0.08em" }}>Currency</h3>
              <div className="space-y-1">
                {CURRENCIES.map(c => (
                  <button key={c} onClick={() => setSelectedCurrency(c)}
                    className={`nav-item w-full text-left text-sm ${selectedCurrency === c ? "active" : ""}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                {filtered.length} opportunities
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="card p-16 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
                <p className="font-medium" style={{ color: "hsl(var(--text))" }}>No projects match your criteria</p>
                <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ListingCard({ listing, featured = false }: { listing: any; featured?: boolean }) {
  const pct = listing.project?.targetRaise && listing.project?.raisedAmount
    ? Math.min(100, Math.round((listing.project.raisedAmount / listing.project.targetRaise) * 100))
    : null

  return (
    <Link href={`/marketplace/${listing.seoSlug}`} className="project-card block">
      {/* Cover */}
      <div className="h-40 relative overflow-hidden" style={{ background: "hsl(var(--navy))" }}>
        {listing.project?.coverImage ? (
          <img src={listing.project.coverImage} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="h-12 w-12 opacity-20 text-white" />
          </div>
        )}
        {featured && (
          <div className="absolute top-2 left-2">
            <span className="badge badge-yellow"><Star className="h-2.5 w-2.5" />Featured</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="badge badge-green">{listing.status}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {listing.category && (
          <span className="text-xs font-medium" style={{ color: "hsl(var(--emerald))" }}>
            {listing.category.icon} {listing.category.name}
          </span>
        )}
        <h3 className="font-semibold text-sm leading-tight" style={{ color: "hsl(var(--text))" }}>{listing.title}</h3>
        <p className="text-xs line-clamp-2" style={{ color: "hsl(var(--text-muted))" }}>{listing.shortDesc}</p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {listing.targetReturn && (
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Target IRR</p>
              <p className="text-sm font-bold" style={{ color: "hsl(var(--emerald))" }}>{listing.targetReturn}%</p>
            </div>
          )}
          {listing.minTicketUsd && (
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Min. ticket</p>
              <p className="text-sm font-bold" style={{ color: "hsl(var(--text))" }}>
                {listing.currency} {(listing.minTicketUsd).toLocaleString()}
              </p>
            </div>
          )}
          {listing.region && (
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Region</p>
              <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--text))" }}>{listing.region}</p>
            </div>
          )}
        </div>

        {pct !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              <span>Funded</span><span>{pct}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill progress-emerald" style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        {listing.closingDate && (
          <p className="text-xs" style={{ color: "hsl(var(--warning))" }}>
            Closes {new Date(listing.closingDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  )
}
