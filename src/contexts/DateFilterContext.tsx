'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

/**
 * DateFilterContext
 *
 * Provides centralized date state management for the application.
 * Reduces prop drilling of currentDate, minDate, maxDate through multiple component levels.
 */

interface DateFilterContextValue {
  /** Current date being viewed in the timeline */
  currentDate: Date
  /** Minimum date in the available range */
  minDate: Date
  /** Maximum date in the available range */
  maxDate: Date
  /** Update the current date */
  setCurrentDate: (date: Date) => void
  /** Navigate to a specific year */
  goToYear: (year: number) => void
  /** Navigate forward/backward by months */
  navigateByMonths: (months: number) => void
  /** Check if at the start of the range */
  isAtStart: boolean
  /** Check if at the end of the range */
  isAtEnd: boolean
}

const DateFilterContext = createContext<DateFilterContextValue | null>(null)

interface DateFilterProviderProps {
  children: React.ReactNode
  /** Initial date (defaults to 1920-01-01) */
  initialDate?: Date
  /** Minimum date (defaults to 1920-01-01) */
  minDate?: Date
  /** Maximum date (defaults to 1945-12-31) */
  maxDate?: Date
}

export function DateFilterProvider({
  children,
  initialDate = new Date('1920-01-01'),
  minDate: propMinDate,
  maxDate: propMaxDate,
}: DateFilterProviderProps) {
  const minDate = useMemo(() => propMinDate ?? new Date('1920-01-01'), [propMinDate])
  const maxDate = useMemo(() => propMaxDate ?? new Date('1945-12-31'), [propMaxDate])

  const [currentDate, setCurrentDateState] = useState<Date>(initialDate)

  // Ensure date is within bounds
  const setCurrentDate = useCallback(
    (date: Date) => {
      let newDate = date
      if (date < minDate) newDate = minDate
      if (date > maxDate) newDate = maxDate
      setCurrentDateState(newDate)
    },
    [minDate, maxDate]
  )

  // Go to a specific year (January 1st of that year)
  const goToYear = useCallback(
    (year: number) => {
      const targetDate = new Date(year, 0, 1)
      setCurrentDate(targetDate)
    },
    [setCurrentDate]
  )

  // Navigate by a number of months
  const navigateByMonths = useCallback(
    (months: number) => {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + months)
      setCurrentDate(newDate)
    },
    [currentDate, setCurrentDate]
  )

  const isAtStart = useMemo(() => currentDate <= minDate, [currentDate, minDate])
  const isAtEnd = useMemo(() => currentDate >= maxDate, [currentDate, maxDate])

  const value = useMemo(
    (): DateFilterContextValue => ({
      currentDate,
      minDate,
      maxDate,
      setCurrentDate,
      goToYear,
      navigateByMonths,
      isAtStart,
      isAtEnd,
    }),
    [currentDate, minDate, maxDate, setCurrentDate, goToYear, navigateByMonths, isAtStart, isAtEnd]
  )

  return <DateFilterContext.Provider value={value}>{children}</DateFilterContext.Provider>
}

/**
 * Hook to access date filter context
 * Must be used within a DateFilterProvider
 */
export function useDateFilter(): DateFilterContextValue {
  const context = useContext(DateFilterContext)

  if (!context) {
    throw new Error('useDateFilter must be used within a DateFilterProvider')
  }

  return context
}

/**
 * Optional hook that returns null instead of throwing if outside provider
 * Useful for components that may optionally use the context
 */
export function useDateFilterOptional(): DateFilterContextValue | null {
  return useContext(DateFilterContext)
}

export default DateFilterContext
