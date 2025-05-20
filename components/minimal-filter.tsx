"use client"

import { useState } from "react"
import { Filter, Calendar, ArrowDownUp, X, Search, PiggyBank, Sparkles } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { Expense, ExpenseType } from "@/types/expense"
import { FilterPresets } from "@/components/filter-presets"

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
    searchTerm: string
  }>({
    type: "all",
    dateRange: "all",
    customDateFrom: undefined,
    customDateTo: undefined,
    searchTerm: "",
  })

  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [lastAppliedPreset, setLastAppliedPreset] = useState<string | null>(null)

  // Apply filters to expenses
  const applyFilters = (filters = activeFilters) => {
    let filtered = [...expenses]
    let filterCount = 0

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower) ||
          expense.amount.toString().includes(searchLower),
      )
      filterCount++
    }

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
    setLastAppliedPreset(null)
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
    setLastAppliedPreset(null)
  }

  // Handle search term changes
  const handleSearchChange = (value: string) => {
    const newFilters = { ...activeFilters, searchTerm: value }
    setActiveFilters(newFilters)
    applyFilters(newFilters)
    setLastAppliedPreset(null)
  }

  // Reset all filters
  const resetFilters = () => {
    const defaultFilters = {
      type: "all" as const,
      dateRange: "all" as const,
      customDateFrom: undefined,
      customDateTo: undefined,
      searchTerm: "",
    }
    setActiveFilters(defaultFilters)
    setActiveFilterCount(0)
    onFilterChange(expenses)
    setLastAppliedPreset(null)
  }

  // Handle preset application
  const handlePresetApplied = (presetId: string) => {
    // This will be called when a preset is applied
    // We'll update our state to reflect this
    setLastAppliedPreset(presetId)

    // The actual filter changes will be handled by the FilterPresets component
    // which will call the filter context methods directly

    // We just need to update our local state to reflect the new filter count
    // This will be done automatically when the filters change
  }

  // Get active filter badges
  const getActiveFilterBadges = () => {
    const badges = []

    if (activeFilters.type !== "all") {
      badges.push(
        <motion.div
          key="type"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <Badge
            variant="outline"
            className="mr-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          >
            <PiggyBank className="mr-1 h-3 w-3 text-green-500" />
            {activeFilters.type.charAt(0).toUpperCase() + activeFilters.type.slice(1)}
          </Badge>
        </motion.div>,
      )
    }

    if (activeFilters.dateRange !== "all") {
      let label = ""
      switch (activeFilters.dateRange) {
        case "today":
          label = "Today"
          break
        case "week":
          label = "Last 7 days"
          break
        case "month":
          label = "Last 30 days"
          break
        case "custom":
          if (activeFilters.customDateFrom && activeFilters.customDateTo) {
            label = `${format(activeFilters.customDateFrom, "MMM d")} - ${format(activeFilters.customDateTo, "MMM d")}`
          } else {
            label = "Custom range"
          }
          break
      }

      badges.push(
        <motion.div
          key="date"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Badge variant="outline" className="mr-1 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Calendar className="mr-1 h-3 w-3 text-blue-500" />
            {label}
          </Badge>
        </motion.div>,
      )
    }

    if (lastAppliedPreset) {
      badges.push(
        <motion.div
          key="preset"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Badge
            variant="outline"
            className="mr-1 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
          >
            <Sparkles className="mr-1 h-3 w-3 text-violet-500" />
            Preset Applied
          </Badge>
        </motion.div>,
      )
    }

    return badges
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <motion.div
        className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search transactions..."
            className="pl-10 h-9 bg-white dark:bg-gray-950 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-0"
            value={activeFilters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {activeFilters.searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => handleSearchChange("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Presets */}
        <FilterPresets onPresetApplied={handlePresetApplied} />

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1 transition-all duration-200 hover:shadow-md",
                activeFilterCount > 0 && "border-primary bg-primary/10",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <DropdownMenuLabel>Filter Transactions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  <span>Transaction Type</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
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
                  <DropdownMenuSubContent className="animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
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
            <DropdownMenuItem
              onClick={resetFilters}
              disabled={activeFilterCount === 0 && !lastAppliedPreset}
              className={
                activeFilterCount > 0 || lastAppliedPreset
                  ? "text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50"
                  : ""
              }
            >
              <X className="mr-2 h-4 w-4" />
              <span>Reset Filters</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset button - only shown when filters are active */}
        {(activeFilterCount > 0 || lastAppliedPreset) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Active filter badges */}
      <AnimatePresence>
        {(activeFilterCount > 0 || lastAppliedPreset) && (
          <motion.div
            className="flex flex-wrap gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {getActiveFilterBadges()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
