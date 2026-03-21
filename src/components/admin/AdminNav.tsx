"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Building2, Users, FileCheck, FileText,
  MessageSquare, BarChart2, HelpCircle, Settings, LogOut,
  UserCog, Menu, X, ChevronRight, Sun, Moon, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin/projects",   label: "Projects",    icon: Building2 },
  { href: "/admin/investors",  label: "Investors",   icon: Users },
  { href: "/admin/ndas",       label: "NDAs",        icon: FileCheck },
  { href: "/admin/documents",  label: "Documents",   icon: FileText },
  { href: "/admin/questions",  label: "Q&A",         icon: HelpCircle },
  { href: "/admin/analytics",  label: "Analytics",   icon: BarChart2 },
  { href: "/admin/inquiries",  label: "Inquiries",   icon: MessageSquare },
  { href: "/admin/team",       label: "Team",        icon: UserCog },
  { href: "/admin/settings",   label: "Settings",    icon: Settings },
  { href: "/admin/updates",    label: "Updates",     icon: RefreshCw },
]

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement
  if (theme === "light") {
    root.style.setProperty("--background", "0 0% 96%")
    root.style.setProperty("--foreground", "0 0% 8%")
    root.style.setProperty("--card", "0 0% 100%")
    root.style.setProperty("--border", "0 0% 82%")
    root.style.setProperty("--input", "0 0% 94%")
    root.style.setProperty("--muted", "0 0% 92%")
    root.style.setProperty("--muted-foreground", "0 0% 38%")
    root.style.setProperty("--accent", "0 0% 90%")
    root.style.setProperty("--accent-foreground", "0 0% 8%")
  } else {
    root.style.setProperty("--background", "0 0% 3.5%")
    root.style.setProperty("--foreground", "0 0% 98%")
    root.style.setProperty("--card", "0 0% 6%")
    root.style.setProperty("--border", "0 0% 14%")
    root.style.setProperty("--input", "0 0% 9%")
    root.style.setProperty("--muted", "0 0% 9%")
    root.style.setProperty("--muted-foreground", "0 0% 45%")
    root.style.setProperty("--accent", "0 0% 11%")
    root.style.setProperty("--accent-foreground", "0 0% 98%")
  }
}

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("alcazar-theme")
    const theme = saved === "light" ? "light" : "dark"
    setIsDark(theme === "dark")
    applyTheme(theme)
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    const theme = next ? "dark" : "light"
    localStorage.setItem("alcazar-theme", theme)
    applyTheme(theme)
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center px-5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>A</div>
          <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg transition-colors" style={{ color: "hsl(var(--muted-foreground))" }} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(false)} className="lg:hidden" style={{ color: "hsl(var(--muted-foreground))" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-100")}
              style={{
                background: active ? "hsl(var(--accent))" : "transparent",
                color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center px-4 border-b" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
        <button onClick={() => setOpen(true)} style={{ color: "hsl(var(--muted-foreground))" }}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-4 text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Admin</span>
        <button onClick={toggleTheme} className="ml-auto p-1.5 rounded-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setOpen(false)} />}

      <aside
        className={cn("admin-sidebar fixed lg:static top-0 left-0 h-full lg:h-screen w-64 flex flex-col z-50", open && "open")}
        style={{ background: "hsl(var(--background))", borderRight: "1px solid hsl(var(--border))" }}
      >
        <NavContent />
      </aside>
    </>
  )
}
