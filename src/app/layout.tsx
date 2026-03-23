import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "Investor Portal", template: "%s — Investor Portal" },
  description: "Secure investment data room and investor portal.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
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
                fontSize: "13px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
