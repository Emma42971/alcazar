"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Building2, Users, BarChart2,
  Settings, LogOut, Menu, X, Sun, Moon,
  RefreshCw, Shield, Zap, UserCog, ChevronRight,
  Globe, DollarSign, Lock, ShoppingBag, Crown
} from "lucide-react"
import { NotificationBell } from "@/components/shared/NotificationBell"

const NAV = [
  {
    group: "PRINCIPAL",
    items: [
      { href: "/admin",              label: "Dashboard",       icon: LayoutDashboard },
      { href: "/admin/projects",     label: "Projets",         icon: Building2 },
      { href: "/admin/investors",    label: "Investisseurs",   icon: Users },
      { href: "/admin/investments",  label: "Investissements", icon: DollarSign },
      { href: "/admin/compliance",   label: "Compliance",      icon: Shield },
      { href: "/admin/analytics",    label: "Analytics",       icon: BarChart2 },
    ]
  },
  {
    group: "MARKETPLACE",
    items: [
      { href: "/admin/listings",     label: "Listings",        icon: Globe },
      { href: "/marketplace",        label: "Voir marketplace",icon: ShoppingBag, external: true },
    ]
  },
  {
    group: "OUTILS",
    items: [
      { href: "/admin/security",     label: "Sécurité",        icon: Lock },
      { href: "/admin/workflows",    label: "Automatisation",  icon: Zap },
      { href: "/admin/team",         label: "Équipe",          icon: UserCog },
      { href: "/admin/settings",     label: "Paramètres",      icon: Settings },
      { href: "/admin/updates",      label: "Mises à jour",    icon: RefreshCw },
      { href: "/super-admin",          label: "Super Admin",     icon: Crown, superOnly: true },
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
    document.documentElement.classList.toggle("dark", dark)
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("alcazar-theme", next ? "dark" : "light")
    document.documentElement.classList.toggle("dark", next)
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "hsl(var(--surface))", borderRight: "1px solid hsl(var(--border))" }}>
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "hsl(var(--emerald))" }}>A</div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Alcazar</p>
        </div>
        <div className="flex items-center gap-0.5">
          <NotificationBell />
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm">
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-icon-sm lg:hidden">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV.map(group => (
          <div key={group.group}>
            <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, external }: any) => {
                const active = isActive(href)
                if (external) {
                  return (
                    <Link key={href} href={href} target="_blank"
                      className="nav-item opacity-70 hover:opacity-100">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>↗</span>
                    </Link>
                  )
                }
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={`nav-item ${active ? "active" : ""}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--emerald))" }} />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Signout */}
      <div className="p-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="nav-item w-full text-left">
          <LogOut className="h-4 w-4" /><span>Déconnexion</span>
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
        <span className="ml-3 text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Alcazar</span>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[200px] shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside className={`admin-sidebar lg:hidden ${open ? "open" : ""}`}>
        <SidebarContent />
      </aside>
    </>
  )
}
