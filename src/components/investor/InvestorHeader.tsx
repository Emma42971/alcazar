"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { LogOut, User, ChevronDown, LayoutDashboard, FolderOpen, Sun, Moon } from "lucide-react"

type Props = {
  brandName?: string | null
  brandColor?: string | null
  brandLogo?: string | null
}

function applyTheme(theme: "dark" | "light") {
  const html = document.documentElement
  if (theme === "dark") html.classList.add("dark")
  else html.classList.remove("dark")
  localStorage.setItem("alcazar-investor-theme", theme)
}

export function InvestorHeader({ brandName, brandColor, brandLogo }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("alcazar-investor-theme") ?? "light"
    setIsDark(saved === "dark")
    applyTheme(saved as "dark" | "light")
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    applyTheme(next ? "dark" : "light")
  }

  const accent = brandColor ?? "var(--blue)"

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center px-4 sm:px-6 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="h-7 w-7 rounded-md object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: accent }}>
            {(brandName ?? "A").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold hidden sm:block" style={{ color: "var(--text-primary)" }}>
          {brandName ?? "Investor Portal"}
        </span>
      </Link>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-1 ml-8">
        {[
          { href: "/dashboard", label: "My Projects", icon: LayoutDashboard },
          { href: "/projects",  label: "Catalogue",   icon: FolderOpen },
        ].map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium transition-colors"
              style={{
                background: active ? "var(--blue-light)" : "transparent",
                color: active ? "var(--blue)" : "var(--text-secondary)",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn-ghost p-2 h-8 w-8" style={{ color: "var(--text-muted)" }}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-2.5 h-8 rounded-md text-sm transition-colors btn-ghost">
            <div className="avatar h-6 w-6 text-xs">U</div>
            <ChevronDown className="h-3 w-3 hidden sm:block" style={{ color: "var(--text-muted)" }} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="dropdown">
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="dropdown-item">
                  <User className="h-3.5 w-3.5" />My Profile
                </Link>
                <div className="dropdown-divider" />
                <button onClick={() => signOut({ callbackUrl: "/" })} className="dropdown-item text-sm" style={{ color: "var(--red)" }}>
                  <LogOut className="h-3.5 w-3.5" />Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
