import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  format,
} from "date-fns"
import { ptBR } from "date-fns/locale"

// ── Tailwind Merge ─────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Currency Formatting ────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return brlFormatter.format(value)
}

export function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  if (abs >= 1_000_000) {
    return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")}K`
  }
  return formatCurrency(value)
}

// ── Date Formatting ────────────────────────────────────────────────

function toDate(date: Date | Timestamp): Date {
  if (date instanceof Timestamp) {
    return date.toDate()
  }
  return date
}

export function formatDate(date: Date | Timestamp): string {
  return format(toDate(date), "dd/MM/yyyy", { locale: ptBR })
}

export function formatDateShort(date: Date | Timestamp): string {
  return format(toDate(date), "dd/MM", { locale: ptBR })
}

// ── Currency Parsing ───────────────────────────────────────────────

export function parseBRLCurrency(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

// ── Timestamp / Date Conversion ────────────────────────────────────

export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate()
}

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}

// ── Date Range Helper ──────────────────────────────────────────────

export function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date()

  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) }

    case "this_week":
      return {
        start: startOfWeek(now, { locale: ptBR }),
        end: endOfWeek(now, { locale: ptBR }),
      }

    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) }

    case "last_month": {
      const lastMonth = subMonths(now, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    }

    case "this_quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) }

    case "this_year":
      return { start: startOfYear(now), end: endOfYear(now) }

    case "last_year": {
      const lastYear = subYears(now, 1)
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) }
    }

    default:
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

// ── Percentage Change ──────────────────────────────────────────────

export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

// ── ID Generation ──────────────────────────────────────────────────

export function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${randomPart}`
}
