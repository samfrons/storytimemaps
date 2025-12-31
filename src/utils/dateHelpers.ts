/**
 * Date handling utilities for consistent date operations across the application
 *
 * Provides centralized date parsing, formatting, and comparison functions
 * to ensure consistent handling of historical dates (1920-1945 era).
 */

/**
 * Parse a date string or Date object to a Date object
 * Returns null for invalid or missing dates
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string') {
    // Handle "Unknown" strings
    if (value.toLowerCase() === 'unknown') return null

    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

/**
 * Convert a date to timestamp (milliseconds since epoch)
 * Returns 0 for invalid dates
 */
export function toTimestamp(date: Date | string | null | undefined): number {
  const parsed = parseDate(date)
  return parsed ? parsed.getTime() : 0
}

/**
 * Format a date for display in the UI
 * Format: MM.YYYY (e.g., "03.1933")
 */
export function formatDisplayDate(date: Date | string | null | undefined): string {
  const parsed = parseDate(date)
  if (!parsed) return 'Unknown'

  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = parsed.getFullYear()
  return `${month}.${year}`
}

/**
 * Format a date for display with full month name
 * Format: "March 1933"
 */
export function formatFullDate(date: Date | string | null | undefined, locale = 'en-US'): string {
  const parsed = parseDate(date)
  if (!parsed) return 'Unknown'

  return parsed.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

/**
 * Get just the year from a date
 */
export function getYear(date: Date | string | null | undefined): number | null {
  const parsed = parseDate(date)
  return parsed ? parsed.getFullYear() : null
}

/**
 * Format a date range for display
 * Examples: "1920 - 1935", "1920 - Unknown", "Unknown - 1935"
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): string {
  const startYear = getYear(startDate)
  const endYear = getYear(endDate)

  const startStr = startYear?.toString() ?? 'Unknown'
  const endStr = endYear?.toString() ?? 'Unknown'

  return `${startStr} - ${endStr}`
}

/**
 * Check if a date falls within a range (inclusive)
 */
export function isDateInRange(
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean {
  const dateTs = toTimestamp(date)
  const startTs = startDate ? toTimestamp(startDate) : 0
  const endTs = endDate ? toTimestamp(endDate) : Infinity

  return dateTs >= startTs && dateTs <= endTs
}

/**
 * Determine business state based on current date and business dates
 */
export type BusinessState = 'active' | 'declining' | 'closed' | 'future'

export function getBusinessState(
  currentDate: Date,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): BusinessState {
  const now = currentDate.getTime()
  const start = toTimestamp(startDate) || 0
  const end = toTimestamp(endDate) || Infinity

  if (now < start) return 'future'
  if (now > end) return 'closed'

  // Check if business is in "declining" state (within 2 years of closing)
  if (end !== Infinity) {
    const twoYearsBeforeEnd = end - 2 * 365 * 24 * 60 * 60 * 1000
    if (now >= twoYearsBeforeEnd) return 'declining'
  }

  return 'active'
}

/**
 * Pre-compute date timestamps for a business to avoid repeated parsing
 */
export interface PrecomputedDates {
  startTimestamp: number
  endTimestamp: number
  startYear: number | null
  endYear: number | null
}

export function precomputeDates(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): PrecomputedDates {
  return {
    startTimestamp: toTimestamp(startDate),
    endTimestamp: toTimestamp(endDate) || Infinity,
    startYear: getYear(startDate),
    endYear: getYear(endDate),
  }
}

/**
 * Get a safe Date object, ensuring it's within valid historical range
 */
export function getSafeDate(date: Date | string | null | undefined): Date {
  const parsed = parseDate(date)
  if (!parsed) return new Date('1920-01-01')

  const minDate = new Date('1900-01-01')
  const maxDate = new Date('1950-12-31')

  if (parsed < minDate) return minDate
  if (parsed > maxDate) return maxDate

  return parsed
}

/**
 * Compare two dates, handling null values
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareDates(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined
): number {
  const aTs = toTimestamp(a)
  const bTs = toTimestamp(b)

  if (aTs < bTs) return -1
  if (aTs > bTs) return 1
  return 0
}
