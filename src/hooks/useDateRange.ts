'use client'

import { useState, useCallback } from 'react'

interface UseDateRangeProps {
  initialDate?: Date
  minDate?: Date
  maxDate?: Date
}

interface UseDateRangeReturn {
  currentDate: Date
  minDate: Date
  maxDate: Date
  setCurrentDate: (date: Date) => void
  setYear: (year: number) => void
  incrementYear: () => void
  decrementYear: () => void
  isAtMin: boolean
  isAtMax: boolean
}

// Default date range for historical Berlin Jewish businesses
const DEFAULT_MIN_DATE = new Date('1920-01-01')
const DEFAULT_MAX_DATE = new Date('1945-12-31')
const DEFAULT_INITIAL_DATE = new Date('1920-01-01')

/**
 * Hook for managing date range state for the timeline.
 * Provides utilities for navigating within the date range.
 */
export function useDateRange({
  initialDate = DEFAULT_INITIAL_DATE,
  minDate = DEFAULT_MIN_DATE,
  maxDate = DEFAULT_MAX_DATE,
}: UseDateRangeProps = {}): UseDateRangeReturn {
  const [currentDate, setCurrentDateState] = useState<Date>(initialDate)

  // Clamp date to valid range
  const clampDate = useCallback(
    (date: Date): Date => {
      if (date < minDate) return minDate
      if (date > maxDate) return maxDate
      return date
    },
    [minDate, maxDate]
  )

  // Set current date with clamping
  const setCurrentDate = useCallback(
    (date: Date) => {
      setCurrentDateState(clampDate(date))
    },
    [clampDate]
  )

  // Set year directly
  const setYear = useCallback(
    (year: number) => {
      const newDate = new Date(currentDate)
      newDate.setFullYear(year)
      setCurrentDate(newDate)
    },
    [currentDate, setCurrentDate]
  )

  // Increment year by 1
  const incrementYear = useCallback(() => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(newDate.getFullYear() + 1)
    setCurrentDate(newDate)
  }, [currentDate, setCurrentDate])

  // Decrement year by 1
  const decrementYear = useCallback(() => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(newDate.getFullYear() - 1)
    setCurrentDate(newDate)
  }, [currentDate, setCurrentDate])

  return {
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    setYear,
    incrementYear,
    decrementYear,
    isAtMin: currentDate.getFullYear() <= minDate.getFullYear(),
    isAtMax: currentDate.getFullYear() >= maxDate.getFullYear(),
  }
}

export { DEFAULT_MIN_DATE, DEFAULT_MAX_DATE, DEFAULT_INITIAL_DATE }
