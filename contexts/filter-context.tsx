"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import type { Expense, ExpenseType } from "@/types/expense"
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  isWithinInterval,
} from "date-fns"

// Define time period filter options
export type TimePeriod =
  | "all"
  | "today"
  | "yesterday"
  | "last7days"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom"

// Define amount range filter options
export type AmountRange = "all" | "under500" | "500to1000" | "1000to5000" | "over5000" | "custom"

// Filter state interface
export interface FilterState {
  timePeriod: TimePeriod
  customDateFrom: Date | null
  customDateTo: Date | null
  type: ExpenseType | "all"
  category: string | "all"
  amountRange: AmountRange
  customAmountMin: number | null
  customAmountMax: number | null
}

// Filter context interface
interface FilterContextType {
  filters: FilterState
  setTimePeriod: (period: TimePeriod) => void
  setCustomDateRange: (from: Date | null, to: Date | null) => void
  setType: (type: ExpenseType | "all") => void
  setCategory: (category: string | "all") => void
  setAmountRange: (range: AmountRange) => void
  setCustomAmountRange: (min: number | null, max: number | null) => void
  resetFilters: () => void
  applyFilters: (expenses: Expense[]) => Expense[]
  activeFilterCount: number
}

// Default filter state
const defaultFilters: FilterState = {
  timePeriod: "all",
  customDateFrom: null,
  customDateTo: null,
  type: "all",
  category: "all",
  amountRange: "all",
  customAmountMin: null,
  customAmountMax: null,
}

// Create the context
const FilterContext = createContext<FilterContextType | undefined>(undefined)

// Provider component
export function FilterProvider({ children }: { children: ReactNode }) {
  // Initialize state with default filters
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  // Calculate the number of active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.timePeriod !== "all") count++
    if (filters.type !== "all") count++
    if (filters.category !== "all") count++
    if (filters.amountRange !== "all") count++
    return count
  }, [filters])

  // Filter setters
  const setTimePeriod = useCallback((period: TimePeriod) => {
    setFilters((prev) => ({
      ...prev,
      timePeriod: period,
      // Reset custom date range if not using custom
      customDateFrom: period !== "custom" ? null : prev.customDateFrom,
      customDateTo: period !== "custom" ? null : prev.customDateTo,
    }))
  }, [])

  const setCustomDateRange = useCallback((from: Date | null, to: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      timePeriod: "custom",
      customDateFrom: from,
      customDateTo: to,
    }))
  }, [])

  const setType = useCallback((type: ExpenseType | "all") => {
    setFilters((prev) => ({ ...prev, type }))
  }, [])

  const setCategory = useCallback((category: string | "all") => {
    setFilters((prev) => ({ ...prev, category }))
  }, [])

  const setAmountRange = useCallback((range: AmountRange) => {
    setFilters((prev) => ({
      ...prev,
      amountRange: range,
      // Reset custom amount range if not using custom
      customAmountMin: range !== "custom" ? null : prev.customAmountMin,
      customAmountMax: range !== "custom" ? null : prev.customAmountMax,
    }))
  }, [])

  const setCustomAmountRange = useCallback((min: number | null, max: number | null) => {
    setFilters((prev) => ({
      ...prev,
      amountRange: "custom",
      customAmountMin: min,
      customAmountMax: max,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  // Main filter function to apply all filters to an expense array
  const applyFilters = useCallback(
    (expenses: Expense[]): Expense[] => {
      if (!expenses) return []

      return expenses.filter((expense) => {
        // Date/time period filter
        const expenseDate = new Date(expense.date)
        let passesTimeFilter = true

        if (filters.timePeriod !== "all") {
          const today = new Date()
          let fromDate: Date
          let toDate: Date = endOfDay(today)

          switch (filters.timePeriod) {
            case "today":
              fromDate = startOfDay(today)
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "yesterday":
              const yesterday = subDays(today, 1)
              fromDate = startOfDay(yesterday)
              toDate = endOfDay(yesterday)
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "last7days":
              fromDate = startOfDay(subDays(today, 6))
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "thisWeek":
              fromDate = startOfWeek(today, { weekStartsOn: 1 }) // Week starts on Monday
              toDate = endOfWeek(today, { weekStartsOn: 1 })
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "lastWeek":
              const lastWeek = subWeeks(today, 1)
              fromDate = startOfWeek(lastWeek, { weekStartsOn: 1 })
              toDate = endOfWeek(lastWeek, { weekStartsOn: 1 })
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "thisMonth":
              fromDate = startOfMonth(today)
              toDate = endOfMonth(today)
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "lastMonth":
              const lastMonth = subMonths(today, 1)
              fromDate = startOfMonth(lastMonth)
              toDate = endOfMonth(lastMonth)
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "thisYear":
              fromDate = startOfYear(today)
              passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              break

            case "custom":
              if (filters.customDateFrom && filters.customDateTo) {
                fromDate = startOfDay(filters.customDateFrom)
                toDate = endOfDay(filters.customDateTo)
                passesTimeFilter = isWithinInterval(expenseDate, { start: fromDate, end: toDate })
              }
              break
          }
        }

        // Type filter
        const passesTypeFilter = filters.type === "all" || expense.type === filters.type

        // Category filter
        const passesCategoryFilter = filters.category === "all" || expense.category === filters.category

        // Amount range filter
        let passesAmountFilter = true

        if (filters.amountRange !== "all") {
          switch (filters.amountRange) {
            case "under500":
              passesAmountFilter = expense.amount < 500
              break

            case "500to1000":
              passesAmountFilter = expense.amount >= 500 && expense.amount <= 1000
              break

            case "1000to5000":
              passesAmountFilter = expense.amount > 1000 && expense.amount <= 5000
              break

            case "over5000":
              passesAmountFilter = expense.amount > 5000
              break

            case "custom":
              const min = filters.customAmountMin ?? Number.MIN_SAFE_INTEGER
              const max = filters.customAmountMax ?? Number.MAX_SAFE_INTEGER
              passesAmountFilter = expense.amount >= min && expense.amount <= max
              break
          }
        }

        return passesTimeFilter && passesTypeFilter && passesCategoryFilter && passesAmountFilter
      })
    },
    [filters],
  )

  // Create memoized context value to prevent unnecessary renders
  const contextValue = useMemo(
    () => ({
      filters,
      setTimePeriod,
      setCustomDateRange,
      setType,
      setCategory,
      setAmountRange,
      setCustomAmountRange,
      resetFilters,
      applyFilters,
      activeFilterCount,
    }),
    [
      filters,
      setTimePeriod,
      setCustomDateRange,
      setType,
      setCategory,
      setAmountRange,
      setCustomAmountRange,
      resetFilters,
      applyFilters,
      activeFilterCount,
    ],
  )

  return <FilterContext.Provider value={contextValue}>{children}</FilterContext.Provider>
}

// Custom hook to use the filter context
export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider")
  }
  return context
}
