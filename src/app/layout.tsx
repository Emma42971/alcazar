import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: { default: "Investor Portal", template: "%s — Investor Portal" },
  description: "Secure investor data room",
  robots: { index: false, follow: false }, // overridden per-page for public projects
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <SessionProvider>
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "hsl(0 0% 6%)",
                border: "1px solid hsl(0 0% 14%)",
                color: "hsl(0 0% 98%)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
