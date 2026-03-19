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

    // Git pull
    logs.push("→ git pull origin main")
    const { stdout: pullOut, stderr: pullErr } = await execAsync(
      "cd /docker/alcazar && git pull origin main 2>&1",
      { timeout: 60_000 }
    )
    logs.push(...(pullOut || pullErr).split("\n").filter(Boolean))

    // Docker compose rebuild (en arrière-plan pour ne pas timeout)
    logs.push("→ docker compose up -d --build")
    execAsync(
      "cd /docker/alcazar && docker compose up -d --build 2>&1",
      { timeout: 300_000 }
    ).catch(() => {}) // fire and forget

    logs.push("✓ Update triggered — rebuild running in background")
    logs.push("✓ Refresh this page in ~2 minutes")

    return NextResponse.json({ success: true, logs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
