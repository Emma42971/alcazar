import { requireAdmin } from "@/lib/session"
import { AdminNav } from "@/components/admin/AdminNav"
import { ThemeWrapper } from "@/components/admin/ThemeWrapper"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <ThemeWrapper>
      <AdminNav />
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0" style={{ background: "var(--bg)" }}>
        {children}
      </main>
    </ThemeWrapper>
  )
}
