"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import {
  LayoutDashboard, Building2, Users, FileCheck, FileText,
  MessageSquare, BarChart2, HelpCircle, Settings, LogOut,
  UserCog, Menu, X, ChevronRight,
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
]

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center px-5 border-b" style={{ borderColor: "hsl(0 0% 10%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)" }}>A</div>
          <span className="text-sm font-medium">Admin Panel</span>
        </div>
        <button onClick={() => setOpen(false)} className="ml-auto lg:hidden" style={{ color: "hsl(0 0% 40%)" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-100",
                active
                  ? "text-white"
                  : "hover:text-white"
              )}
              style={{
                background: active ? "hsl(0 0% 11%)" : "transparent",
                color: active ? "hsl(0 0% 95%)" : "hsl(0 0% 45%)",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" style={{ color: "hsl(0 0% 35%)" }} />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "hsl(0 0% 10%)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "hsl(0 0% 40%)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "hsl(0 0% 75%)")}
          onMouseLeave={e => (e.currentTarget.style.color = "hsl(0 0% 40%)")}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile topbar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center px-4 border-b"
        style={{ background: "hsl(0 0% 4%)", borderColor: "hsl(0 0% 10%)" }}
      >
        <button onClick={() => setOpen(true)} style={{ color: "hsl(0 0% 50%)" }}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-4 text-sm font-medium">Admin</span>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "admin-sidebar fixed lg:static top-0 left-0 h-full lg:h-screen w-64 flex flex-col z-50",
          open && "open"
        )}
        style={{ background: "hsl(0 0% 4.5%)", borderRight: "1px solid hsl(0 0% 10%)" }}
      >
        <NavContent />
      </aside>
    </>
  )
}
