"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { LogOut, User, ChevronDown, LayoutDashboard, FolderOpen } from "lucide-react"

type Props = {
  brandName?: string | null
  brandColor?: string | null
  brandLogo?: string | null
}

export function InvestorHeader({ brandName, brandColor, brandLogo }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const accent = brandColor ?? "hsl(var(--foreground))"

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center px-4 sm:px-6 border-b" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="h-7 w-7 rounded-md object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: accent, color: "hsl(var(--background))" }}>
            {(brandName ?? "A").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium hidden sm:block">{brandName ?? "Investor Portal"}</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 ml-8">
        {[
          { href: "/dashboard", label: "My Projects", icon: LayoutDashboard },
          { href: "/projects",  label: "Catalogue",   icon: FolderOpen },
        ].map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
            <User className="h-3 w-3" />
          </div>
          <ChevronDown className="h-3 w-3 hidden sm:block" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border py-1 z-20" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <User className="h-3.5 w-3.5" />My Profile
              </Link>
              <div className="my-1 border-t" style={{ borderColor: "hsl(var(--border))" }} />
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <LogOut className="h-3.5 w-3.5" />Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
