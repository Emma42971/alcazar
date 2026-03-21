"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { LogOut, User, ChevronDown, LayoutDashboard, Compass, Database, MessageSquare, Sun, Moon } from "lucide-react"

type Props = { brandName?: string | null; brandColor?: string | null; brandLogo?: string | null }

export function InvestorHeader({ brandName, brandColor, brandLogo }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("alcazar-theme") ?? "light"
    const dark = saved === "dark"
    setIsDark(dark)
    if (dark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("alcazar-theme", next ? "dark" : "light")
    if (next) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }

  const NAV = [
    { href: "/dashboard", label: "Dashboard",        icon: LayoutDashboard },
    { href: "/projects",  label: "Explore Projects", icon: Compass },
    { href: "/dashboard", label: "Secure Data Room", icon: Database },
    { href: "/dashboard", label: "Messages",         icon: MessageSquare },
  ]

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center px-4 sm:px-6"
      style={{ background: "hsl(var(--surface))", borderBottom: "1px solid hsl(var(--border))" }}>
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-8">
        {brandLogo
          ? <img src={brandLogo} alt="" className="h-7 w-7 rounded-lg object-cover" />
          : <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: brandColor ?? "hsl(var(--navy))" }}>
              {(brandName ?? "A").charAt(0).toUpperCase()}
            </div>}
        <span className="font-bold text-sm hidden sm:block" style={{ color: "hsl(var(--text))" }}>
          {brandName ?? "Investor Portal"}
        </span>
      </Link>

      {/* Nav — like mockup sidebar labels but horizontal */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = label === "Dashboard" ? pathname === "/dashboard" : pathname.startsWith(href) && href !== "/dashboard"
          return (
            <Link key={label} href={href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          )
        })}
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn btn-ghost btn-sm gap-2">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "hsl(var(--navy))" }}>A</div>
            <ChevronDown className="h-3 w-3 hidden sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-44 z-20 card py-1 shadow-md">
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="nav-item mx-1 my-0.5">
                  <User className="h-3.5 w-3.5" />My Profile
                </Link>
                <div className="divider my-1" />
                <button onClick={() => signOut({ callbackUrl: "/" })} className="nav-item w-full mx-1 my-0.5">
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
