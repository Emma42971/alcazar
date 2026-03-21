import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"

export const metadata: Metadata = {
  title: { default: "Investor Portal", template: "%s — Investor Portal" },
  description: "Secure investment data room and investor portal.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "hsl(var(--surface))",
                color: "hsl(var(--text))",
                border: "1px solid hsl(var(--border))",
                fontSize: "14px",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
