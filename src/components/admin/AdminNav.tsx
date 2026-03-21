"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Building2, Users, FileCheck, FileText,
  MessageSquare, BarChart2, HelpCircle, Settings, LogOut,
  UserCog, Menu, X, Sun, Moon, RefreshCw, GitBranch,
  ChevronRight, ClipboardList, PieChart, CheckSquare,
  Zap, Mail, Shield, Table2, MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  {
    group: "OVERVIEW",
    items: [
      { href: "/admin",              label: "Dashboard",     icon: LayoutDashboard },
      { href: "/admin/analytics",    label: "Analytics",     icon: BarChart2 },
      { href: "/admin/pipeline",     label: "Pipeline",      icon: GitBranch },
      { href: "/admin/reports",      label: "Reports",       icon: PieChart },
    ]
  },
  {
    group: "DEAL ROOM",
    items: [
      { href: "/admin/projects",     label: "Projects",      icon: Building2 },
      { href: "/admin/documents",    label: "Documents",     icon: FileText },
      { href: "/admin/checklist",    label: "DD Checklist",  icon: CheckSquare },
      { href: "/admin/captable",     label: "Cap Table",     icon: Table2 },
      { href: "/admin/ndas",         label: "NDAs",          icon: FileCheck },
    ]
  },
  {
    group: "INVESTORS",
    items: [
      { href: "/admin/investors",    label: "Investors",     icon: Users },
      { href: "/admin/kyc",          label: "KYC / AML",     icon: Shield },
      { href: "/admin/questions",    label: "Q&A",           icon: HelpCircle },
      { href: "/admin/inquiries",    label: "Inquiries",     icon: MessageSquare },
      { href: "/admin/chat",         label: "Messages",      icon: MessageCircle },
    ]
  },
  {
    group: "AUTOMATION",
    items: [
      { href: "/admin/workflows",    label: "Workflows",     icon: Zap },
      { href: "/admin/bulk-email",   label: "Bulk Email",    icon: Mail },
    ]
  },
  {
    group: "ADMIN",
    items: [
      { href: "/admin/team",         label: "Team",          icon: UserCog },
      { href: "/admin/settings",     label: "Settings",      icon: Settings },
      { href: "/admin/updates",      label: "Updates",       icon: RefreshCw },
    ]
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen]   = useState(false)
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
      <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "hsl(var(--emerald))" }}>A</div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Admin Panel</p>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm">
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-icon-sm lg:hidden">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {NAV.map(group => (
          <div key={group.group}>
            <p className="px-2 mb-1 text-xs font-semibold uppercase" style={{ color: "hsl(var(--text-muted))", letterSpacing: "0.08em" }}>
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={cn("nav-item", active && "active")}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-sm">{label}</span>
                    {active && <ChevronRight className="h-3 w-3" style={{ color: "hsl(var(--emerald))" }} />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="nav-item w-full text-left">
          <LogOut className="h-3.5 w-3.5" /><span className="text-sm">Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center px-4"
        style={{ background: "hsl(var(--surface))", borderBottom: "1px solid hsl(var(--border))" }}>
        <button onClick={() => setOpen(true)} className="btn btn-ghost btn-icon-sm"><Menu className="h-5 w-5" /></button>
        <span className="ml-3 text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Admin</span>
        <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm ml-auto">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
      {open && <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setOpen(false)} />}
      <aside className="admin-sidebar hidden lg:flex flex-col w-[220px] shrink-0 h-screen sticky top-0"><SidebarContent /></aside>
      <aside className={cn("admin-sidebar lg:hidden", open && "open")}><SidebarContent /></aside>
    </>
  )
}
