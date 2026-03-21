import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | bigint | null | undefined, currency = "USD"): string {
  if (!amount) return "—"
  const n = typeof amount === "bigint" ? Number(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatIrr(bps: number | null | undefined): string | null {
  if (!bps) return null
  return `${(bps / 100).toFixed(1)}%`
}

export function countdownDays(closingDate: Date | string | null | undefined): number | null {
  if (!closingDate) return null
  const diff = new Date(closingDate).getTime() - Date.now()
  if (diff < 0) return -1
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function fundraisingPercent(raised: bigint | null, target: bigint | null): number | null {
  if (!raised || !target || target === BigInt(0)) return null
  return Math.min(100, Math.round((Number(raised) / Number(target)) * 100))
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
