export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  await requireAdmin()

  // Feature flag — disabled by default in production
  // Set ENABLE_ADMIN_SELF_UPDATE=true in .env to enable
  if (process.env.ENABLE_ADMIN_SELF_UPDATE !== "true") {
    return NextResponse.json(
      { error: "Self-update is disabled. Use CI/CD pipeline instead." },
      { status: 403 }
    )
  }

  try {
    const logs: string[] = []

    // Git pull — no global config modification
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

    // Docker compose rebuild in background
    logs.push("→ docker compose up -d --build (running in background)")
    execAsync(
      "cd /docker/alcazar && docker compose up -d --build 2>&1",
      { timeout: 300_000 }
    ).catch(() => console.error("[admin/update] Rebuild failed"))

    logs.push("✓ Rebuild triggered — wait ~2-3 minutes then refresh")
    return NextResponse.json({ success: true, logs })
  } catch (err: any) {
    console.error("[admin/update] error")
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
