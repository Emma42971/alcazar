import { prisma } from "@/lib/prisma"
import { SettingsClient } from "./SettingsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Settings" }
export default async function SettingsPage() {
  const settings = await prisma.siteSetting.findMany()
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Settings</h1>
      <SettingsClient initialSettings={map} />
    </div>
  )
}
