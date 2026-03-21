export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  await requireAdmin()

  try {
    const logs: string[] = []

    // Configurer git pour accepter le répertoire
    await execAsync("git config --global --add safe.directory /docker/alcazar").catch(() => {})

    // Git pull
    logs.push("→ git pull origin main")
    const { stdout: pullOut, stderr: pullErr } = await execAsync(
      "cd /docker/alcazar && git pull origin main 2>&1",
      { timeout: 60_000 }
    )
    const pullOutput = (pullOut || pullErr || "").trim()
    logs.push(...pullOutput.split("\n").filter(Boolean))

    if (pullOutput.includes("Already up to date")) {
      logs.push("✓ Already up to date — no rebuild needed")
      return NextResponse.json({ success: true, logs })
    }

    // Docker compose rebuild
    logs.push("→ docker compose up -d --build (running in background)")
    execAsync(
      "cd /docker/alcazar && docker compose up -d --build 2>&1",
      { timeout: 300_000 }
    ).catch((err) => console.error("Rebuild error:", err))

    logs.push("✓ Rebuild triggered — wait ~2-3 minutes then refresh")

    return NextResponse.json({ success: true, logs })
  } catch (err: any) {
    console.error("UPDATE ERROR:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
