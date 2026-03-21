"use client"

import { useEffect, useState } from "react"

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("alcazar-theme")
    applyTheme(saved === "light" ? "light" : "dark")
  }, [])

  return (
    <div
      id="admin-wrapper"
      className="flex min-h-screen"
      style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
    >
      {children}
    </div>
  )
}

export function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement
  if (theme === "light") {
    root.style.setProperty("--background", "0 0% 96%")
    root.style.setProperty("--foreground", "0 0% 8%")
    root.style.setProperty("--card", "0 0% 100%")
    root.style.setProperty("--border", "0 0% 82%")
    root.style.setProperty("--input", "0 0% 94%")
    root.style.setProperty("--muted", "0 0% 92%")
    root.style.setProperty("--muted-foreground", "0 0% 38%")
    root.style.setProperty("--accent", "0 0% 90%")
    root.style.setProperty("--accent-foreground", "0 0% 8%")
  } else {
    root.style.setProperty("--background", "0 0% 3.5%")
    root.style.setProperty("--foreground", "0 0% 98%")
    root.style.setProperty("--card", "0 0% 6%")
    root.style.setProperty("--border", "0 0% 14%")
    root.style.setProperty("--input", "0 0% 9%")
    root.style.setProperty("--muted", "0 0% 9%")
    root.style.setProperty("--muted-foreground", "0 0% 45%")
    root.style.setProperty("--accent", "0 0% 11%")
    root.style.setProperty("--accent-foreground", "0 0% 98%")
  }
}
