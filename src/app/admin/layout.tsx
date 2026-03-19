import { requireAdmin } from "@/lib/session"
import { AdminNav } from "@/components/admin/AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="flex min-h-screen" style={{ background: "hsl(0 0% 3.5%)" }}>
      <AdminNav />
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
