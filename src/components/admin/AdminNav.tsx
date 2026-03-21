"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Building2, Users, FileCheck, FileText,
  MessageSquare, BarChart2, HelpCircle, Settings, LogOut,
  UserCog, Menu, X, Sun, Moon, RefreshCw, GitBranch,
  ChevronRight, ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  {
    group: "OVERVIEW",
    items: [
      { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics",  icon: BarChart2 },
      { href: "/admin/pipeline",  label: "Pipeline",   icon: GitBranch },
    ]
  },
  {
    group: "DEAL ROOM",
    items: [
      { href: "/admin/projects",  label: "Projects",   icon: Building2 },
      { href: "/admin/documents", label: "Documents",  icon: FileText },
      { href: "/admin/ndas",      label: "NDAs",       icon: FileCheck },
    ]
  },
  {
    group: "INVESTORS",
    items: [
      { href: "/admin/investors", label: "Investors",  icon: Users },
      { href: "/admin/questions", label: "Q&A",        icon: HelpCircle },
      { href: "/admin/inquiries", label: "Inquiries",  icon: MessageSquare },
    ]
  },
  {
    group: "ADMIN",
    items: [
      { href: "/admin/team",     label: "Team",        icon: UserCog },
      { href: "/admin/settings", label: "Settings",    icon: Settings },
      { href: "/admin/updates",  label: "Updates",     icon: RefreshCw },
    ]
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
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

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "hsl(var(--surface))", borderRight: "1px solid hsl(var(--border))" }}>
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "hsl(var(--accent))" }}>A</div>
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: "hsl(var(--text))" }}>Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm" title={isDark ? "Light" : "Dark"}>
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-icon-sm lg:hidden">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map(group => (
          <div key={group.group}>
            <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))", letterSpacing: "0.08em" }}>
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={cn("nav-item", active && "active")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-3 w-3" style={{ color: "hsl(var(--accent))" }} />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="nav-item w-full text-left">
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center px-4"
        style={{ background: "hsl(var(--surface))", borderBottom: "1px solid hsl(var(--border))" }}>
        <button onClick={() => setOpen(true)} className="btn btn-ghost btn-icon-sm">
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-3 text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Admin</span>
        <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm ml-auto">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className="admin-sidebar hidden lg:flex flex-col w-[220px] shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside className={cn("admin-sidebar lg:hidden", open && "open")}>
        <SidebarContent />
      </aside>
    </>
  )
}
