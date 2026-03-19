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
  const accent = brandColor ?? "hsl(0 0% 98%)"

  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center px-4 sm:px-6 border-b"
      style={{ background: "hsl(0 0% 3.5%)", borderColor: "hsl(0 0% 10%)" }}
    >
      {/* Logo / brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="h-7 w-7 rounded-md object-cover" />
        ) : (
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: accent, color: "hsl(0 0% 5%)" }}
          >
            {(brandName ?? "A").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium hidden sm:block" style={{ color: "hsl(0 0% 85%)" }}>
          {brandName ?? "Investor Portal"}
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 ml-8">
        {[
          { href: "/dashboard", label: "My Projects", icon: LayoutDashboard },
          { href: "/projects",  label: "Catalogue",   icon: FolderOpen },
        ].map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: active ? "hsl(0 0% 90%)" : "hsl(0 0% 45%)" }}
              onMouseEnter={e => !active && (e.currentTarget.style.color = "hsl(0 0% 75%)")}
              onMouseLeave={e => !active && (e.currentTarget.style.color = "hsl(0 0% 45%)")}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="ml-auto relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors"
          style={{ color: "hsl(0 0% 50%)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "hsl(0 0% 80%)")}
          onMouseLeave={e => (e.currentTarget.style.color = "hsl(0 0% 50%)")}
        >
          <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "hsl(0 0% 12%)" }}>
            <User className="h-3 w-3" />
          </div>
          <ChevronDown className="h-3 w-3 hidden sm:block" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div
              className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border py-1 z-20"
              style={{ background: "hsl(0 0% 7%)", borderColor: "hsl(0 0% 13%)" }}
            >
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                style={{ color: "hsl(0 0% 60%)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "hsl(0 0% 90%)")}
                onMouseLeave={e => (e.currentTarget.style.color = "hsl(0 0% 60%)")}
              >
                <User className="h-3.5 w-3.5" />
                My Profile
              </Link>
              <div className="my-1 border-t" style={{ borderColor: "hsl(0 0% 12%)" }} />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors"
                style={{ color: "hsl(0 0% 60%)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "hsl(0 0% 90%)")}
                onMouseLeave={e => (e.currentTarget.style.color = "hsl(0 0% 60%)")}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
