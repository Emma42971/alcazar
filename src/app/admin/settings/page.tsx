export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "./SettingsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Paramètres" }

export default async function SettingsPage() {
  const settings = await prisma.siteSetting.findMany()
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Configuration de la plateforme</p>
        </div>
      </div>
      <SettingsClient initialSettings={map} />
    </div>
  )
}
