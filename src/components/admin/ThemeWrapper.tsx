"use client"
import { useEffect } from "react"

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("alcazar-theme") ?? "light"
    if (saved === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {children}
    </div>
  )
}
