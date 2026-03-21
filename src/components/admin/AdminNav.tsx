"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Building2, Users, FileCheck, FileText,
  MessageSquare, BarChart2, HelpCircle, Settings, LogOut,
  UserCog, Menu, X, ChevronRight, Sun, Moon, RefreshCw,
  GitBranch,
} from "lucide-react"

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics",  icon: BarChart2 },
      { href: "/admin/pipeline",  label: "Pipeline",   icon: GitBranch },
    ],
  },
  {
    label: "Deal Room",
    items: [
      { href: "/admin/projects",  label: "Projects",   icon: Building2 },
      { href: "/admin/documents", label: "Documents",  icon: FileText },
      { href: "/admin/ndas",      label: "NDAs",       icon: FileCheck },
    ],
  },
  {
    label: "Investors",
    items: [
      { href: "/admin/investors", label: "Investors",  icon: Users },
      { href: "/admin/questions", label: "Q&A",        icon: HelpCircle },
      { href: "/admin/inquiries", label: "Inquiries",  icon: MessageSquare },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/team",     label: "Team",        icon: UserCog },
      { href: "/admin/settings", label: "Settings",    icon: Settings },
      { href: "/admin/updates",  label: "Updates",     icon: RefreshCw },
    ],
  },
]

function applyTheme(theme: "dark" | "light") {
  const html = document.documentElement
  if (theme === "dark") {
    html.classList.add("dark")
  } else {
    html.classList.remove("dark")
  }
  localStorage.setItem("alcazar-theme", theme)
}

export function AdminNav() {
  const pathname  = usePathname()
  const [open, setOpen]     = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("alcazar-theme") ?? "light"
    setIsDark(saved === "dark")
    applyTheme(saved as "dark" | "light")
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    applyTheme(next ? "dark" : "light")
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--blue)" }}>A</div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Admin Panel</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="btn-ghost btn-sm p-2 h-8 w-8" title={isDark ? "Light mode" : "Dark mode"} style={{ color: "var(--text-muted)" }}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(false)} className="btn-ghost btn-sm p-2 h-8 w-8 lg:hidden" style={{ color: "var(--text-muted)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`nav-item ${active ? "active" : ""}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="nav-item w-full"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center px-4 border-b" style={{ background: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}>
        <button onClick={() => setOpen(true)} className="btn-ghost p-2 h-8 w-8" style={{ color: "var(--text-muted)" }}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--blue)" }}>A</div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Admin</span>
        </div>
        <button onClick={toggleTheme} className="ml-auto btn-ghost p-2 h-8 w-8" style={{ color: "var(--text-muted)" }}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar lg:block w-[220px] shrink-0 ${open ? "admin-sidebar-mobile open" : "hidden lg:block"}`}
        style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)", height: "100vh", position: "sticky", top: 0 }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
