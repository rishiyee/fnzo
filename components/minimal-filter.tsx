"use client"

import { useState } from "react"
import { Filter, Calendar, ArrowDownUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import { Badge } from "@/components/ui/badge"
import type { Expense, ExpenseType } from "@/types/expense"

interface MinimalFilterProps {
  onFilterChange: (filteredExpenses: Expense[]) => void
  expenses: Expense[]
  className?: string
}

export function MinimalFilter({ onFilterChange, expenses, className }: MinimalFilterProps) {
  const [activeFilters, setActiveFilters] = useState<{
    type: ExpenseType | "all"
    dateRange: "all" | "today" | "week" | "month" | "custom"
    customDateFrom: Date | undefined
    customDateTo: Date | undefined
  }>({
    type: "all",
    dateRange: "all",
    customDateFrom: undefined,
    customDateTo: undefined,
  })

  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // Apply filters to expenses
  const applyFilters = (filters = activeFilters) => {
    let filtered = [...expenses]
    let filterCount = 0

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter((expense) => expense.type === filters.type)
      filterCount++
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const today = new Date()
      let fromDate: Date
      let toDate: Date = endOfDay(today)

      switch (filters.dateRange) {
        case "today":
          fromDate = startOfDay(today)
          break
        case "week":
          fromDate = startOfDay(subDays(today, 7))
          break
        case "month":
          fromDate = startOfDay(subDays(today, 30))
          break
        case "custom":
          if (filters.customDateFrom && filters.customDateTo) {
            fromDate = startOfDay(filters.customDateFrom)
            toDate = endOfDay(filters.customDateTo)
            filterCount++
          } else {
            // If custom dates are not set, don't filter by date
            fromDate = new Date(0) // Beginning of time
          }
          break
        default:
          fromDate = new Date(0) // Beginning of time
      }

      if (filters.dateRange !== "custom" && filters.dateRange !== "all") {
        filterCount++
      }

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return isWithinInterval(expenseDate, { start: fromDate, end: toDate })
      })
    }

    setActiveFilterCount(filterCount)
    onFilterChange(filtered)
  }

  // Handle filter changes
  const handleFilterChange = (type: "type" | "dateRange", value: string) => {
    const newFilters = { ...activeFilters }

    if (type === "type") {
      newFilters.type = value as ExpenseType | "all"
    } else if (type === "dateRange") {
      newFilters.dateRange = value as "all" | "today" | "week" | "month" | "custom"

      // Reset custom dates if not using custom range
      if (value !== "custom") {
        newFilters.customDateFrom = undefined
        newFilters.customDateTo = undefined
      }
    }

    setActiveFilters(newFilters)
    applyFilters(newFilters)
  }

  // Handle custom date changes
  const handleCustomDateChange = (type: "from" | "to", date: Date | undefined) => {
    const newFilters = { ...activeFilters }

    if (type === "from") {
      newFilters.customDateFrom = date
    } else {
      newFilters.customDateTo = date
    }

    setActiveFilters(newFilters)

    // Only apply if both dates are set
    if (newFilters.customDateFrom && newFilters.customDateTo) {
      applyFilters(newFilters)
    }
  }

  // Reset all filters
  const resetFilters = () => {
    const defaultFilters = {
      type: "all" as const,
      dateRange: "all" as const,
      customDateFrom: undefined,
      customDateTo: undefined,
    }
    setActiveFilters(defaultFilters)
    setActiveFilterCount(0)
    onFilterChange(expenses)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filter Transactions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowDownUp className="mr-2 h-4 w-4" />
                <span>Transaction Type</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={activeFilters.type}
                    onValueChange={(value) => handleFilterChange("type", value)}
                  >
                    <DropdownMenuRadioItem value="all">All Types</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="expense">Expense</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="income">Income</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="savings">Savings</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Date Range</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={activeFilters.dateRange}
                    onValueChange={(value) => handleFilterChange("dateRange", value)}
                  >
                    <DropdownMenuRadioItem value="all">All Time</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="week">Last 7 Days</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="month">Last 30 Days</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="custom">Custom Range</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>

                  {activeFilters.dateRange === "custom" && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs">From:</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                {activeFilters.customDateFrom ? format(activeFilters.customDateFrom, "PP") : "Select"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={activeFilters.customDateFrom}
                                onSelect={(date) => handleCustomDateChange("from", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">To:</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                {activeFilters.customDateTo ? format(activeFilters.customDateTo, "PP") : "Select"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={activeFilters.customDateTo}
                                onSelect={(date) => handleCustomDateChange("to", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={resetFilters} disabled={activeFilterCount === 0}>
            <X className="mr-2 h-4 w-4" />
            <span>Reset Filters</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
