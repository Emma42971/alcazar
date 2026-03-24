"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { LogOut, User, ChevronDown, LayoutDashboard, Compass, Briefcase, Bell, Sun, Moon, MessageSquare } from "lucide-react"

type Props = { brandName?: string | null; brandColor?: string | null; brandLogo?: string | null }

export function InvestorHeader({ brandName, brandColor, brandLogo }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [userName, setUserName] = useState("")
  const [userInitial, setUserInitial] = useState("?")

  useEffect(() => {
    const saved = localStorage.getItem("alcazar-theme") ?? "light"
    const dark = saved === "dark"
    setIsDark(dark)
    if (dark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")

    // Load user info + notification count
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d?.profile) {
        const name = `${d.profile.firstName} ${d.profile.lastName}`.trim()
        setUserName(name || d.email)
        setUserInitial((name || d.email).charAt(0).toUpperCase())
      } else if (d?.email) {
        setUserName(d.email)
        setUserInitial(d.email.charAt(0).toUpperCase())
      }
    }).catch(() => {})

    fetch("/api/notifications").then(r => r.json()).then(notifs => {
      if (Array.isArray(notifs)) {
        setNotifCount(notifs.filter((n: any) => !n.readAt).length)
      }
    }).catch(() => {})
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("alcazar-theme", next ? "dark" : "light")
    if (next) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }

  const NAV = [
    { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
    { href: "/projects",   label: "Opportunities", icon: Compass },
    { href: "/portfolio",  label: "My Portfolio",  icon: Briefcase },
  ]

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

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

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className={`nav-item ${isActive(href) ? "active" : ""}`}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications bell */}
        <Link href="/dashboard" className="btn btn-ghost btn-icon-sm relative">
          <Bell className="h-4 w-4" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "hsl(var(--danger))", fontSize: "0.6rem" }}>
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn btn-ghost btn-sm gap-2">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "hsl(var(--navy))" }}>{userInitial}</div>
            <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate" style={{ color: "hsl(var(--text))" }}>
              {userName.split(" ")[0] || "Account"}
            </span>
            <ChevronDown className="h-3 w-3 hidden sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-48 z-20 card py-1 shadow-md">
                <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                  <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--text))" }}>{userName}</p>
                </div>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="nav-item mx-1 my-0.5">
                  <User className="h-3.5 w-3.5" />My Profile
                </Link>
                <Link href="/portfolio" onClick={() => setMenuOpen(false)} className="nav-item mx-1 my-0.5">
                  <Briefcase className="h-3.5 w-3.5" />My Portfolio
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
