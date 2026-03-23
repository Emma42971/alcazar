export const dynamic = "force-dynamic"
import { UpdatesClient } from "./UpdatesClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Updates" }
export default function UpdatesPage() {
  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="page-title">Mises à jour</h1>
        <p className="mt-1 text-sm" style={{ color: "hsl(var(--text-muted))" }}>
          Pull the latest version from GitHub and rebuild the application.
        </p>
      </div>
      <UpdatesClient />
    </div>
  )
}
