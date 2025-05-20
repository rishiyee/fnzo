"use client"

import { useState, useEffect } from "react"
import { useFilter, type TimePeriod, type AmountRange } from "@/contexts/filter-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, X, CalendarDays, PiggyBank, CircleDollarSign, ArrowDownUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ExpenseType } from "@/types/expense"
import { expenseService } from "@/lib/expense-service"
import { motion, AnimatePresence } from "framer-motion"
import { FilterPresets } from "@/components/filter-presets"

interface UnifiedFilterProps {
  className?: string
  compact?: boolean
}

export function UnifiedFilter({ className, compact = false }: UnifiedFilterProps) {
  const {
    filters,
    setTimePeriod,
    setCustomDateRange,
    setType,
    setCategory,
    setAmountRange,
    setCustomAmountRange,
    resetFilters,
    activeFilterCount,
  } = useFilter()

  const [availableCategories, setAvailableCategories] = useState<Record<string, string[]>>({
    expense: [],
    income: [],
    savings: [],
  })

  // Fetch available categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await expenseService.getCategories()
        setAvailableCategories(categories)
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }

    loadCategories()
  }, [])

  // Get all unique categories across all expense types
  const allCategories = Array.from(
    new Set([...availableCategories.expense, ...availableCategories.income, ...availableCategories.savings]),
  ).sort()

  // Format amount for display
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handler for custom amount range inputs
  const handleCustomAmountChange = (type: "min" | "max", value: string) => {
    const numValue = value === "" ? null : Number(value)

    if (type === "min") {
      setCustomAmountRange(numValue, filters.customAmountMax)
    } else {
      setCustomAmountRange(filters.customAmountMin, numValue)
    }
  }

  // Mapping for time period display names
  const timePeriodLabels: Record<TimePeriod, string> = {
    all: "All Time",
    today: "Today",
    yesterday: "Yesterday",
    last7days: "Last 7 Days",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    thisYear: "This Year",
    custom: "Custom Range",
  }

  // Mapping for amount range display names
  const amountRangeLabels: Record<AmountRange, string> = {
    all: "Any Amount",
    under500: "Under ₹500",
    "500to1000": "₹500 - ₹1,000",
    "1000to5000": "₹1,000 - ₹5,000",
    over5000: "Over ₹5,000",
    custom: "Custom Range",
  }

  // Check if filter is in base state
  const isDefaultFilter = activeFilterCount === 0

  // Render active filter pills for the compact view
  const renderActiveFilters = () => {
    if (isDefaultFilter) return null

    const activeFilters = []

    if (filters.timePeriod !== "all") {
      let label = timePeriodLabels[filters.timePeriod]
      if (filters.timePeriod === "custom" && filters.customDateFrom && filters.customDateTo) {
        label = `${format(filters.customDateFrom, "MMM d")} - ${format(filters.customDateTo, "MMM d")}`
      }
      activeFilters.push(
        <motion.div
          key="time"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <Badge
            variant="outline"
            className="mr-1 mb-1 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          >
            <CalendarDays className="mr-1 h-3 w-3 text-blue-500" />
            {label}
          </Badge>
        </motion.div>,
      )
    }

    if (filters.type !== "all") {
      activeFilters.push(
        <motion.div
          key="type"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Badge
            variant="outline"
            className="mr-1 mb-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          >
            <PiggyBank className="mr-1 h-3 w-3 text-green-500" />
            {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
          </Badge>
        </motion.div>,
      )
    }

    if (filters.category !== "all") {
      activeFilters.push(
        <motion.div
          key="category"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Badge
            variant="outline"
            className="mr-1 mb-1 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
          >
            <ArrowDownUp className="mr-1 h-3 w-3 text-purple-500" />
            {filters.category}
          </Badge>
        </motion.div>,
      )
    }

    if (filters.amountRange !== "all") {
      let label = amountRangeLabels[filters.amountRange]
      if (filters.amountRange === "custom" && (filters.customAmountMin !== null || filters.customAmountMax !== null)) {
        const min = filters.customAmountMin !== null ? formatAmount(filters.customAmountMin) : "Any"
        const max = filters.customAmountMax !== null ? formatAmount(filters.customAmountMax) : "Any"
        label = `${min} - ${max}`
      }
      activeFilters.push(
        <motion.div
          key="amount"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <Badge
            variant="outline"
            className="mr-1 mb-1 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          >
            <CircleDollarSign className="mr-1 h-3 w-3 text-amber-500" />
            {label}
          </Badge>
        </motion.div>,
      )
    }

    return (
      <motion.div
        className="flex flex-wrap mt-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {activeFilters}
          {activeFilters.length > 0 && (
            <motion.div
              key="clear"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                onClick={resetFilters}
              >
                <X className="mr-1 h-3 w-3" /> Clear
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <motion.div
        className="flex items-center gap-2 flex-wrap w-full p-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Filter Presets */}
        <FilterPresets />

        {/* Time Period Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={cn(
                filters.timePeriod !== "all" &&
                  "border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                "gap-1 transition-all duration-200 hover:shadow-md",
              )}
            >
              <CalendarDays className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              <span>{compact ? "" : timePeriodLabels[filters.timePeriod]}</span>
              {compact && filters.timePeriod !== "all" && (
                <Badge
                  variant="secondary"
                  className="h-5 ml-1 px-1.5 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                >
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <DropdownMenuLabel>Time Period</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filters.timePeriod}
              onValueChange={(value) => setTimePeriod(value as TimePeriod)}
            >
              <DropdownMenuRadioItem value="all">All Time</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="yesterday">Yesterday</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="last7days">Last 7 Days</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="thisWeek">This Week</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lastWeek">Last Week</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="thisMonth">This Month</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lastMonth">Last Month</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="thisYear">This Year</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="custom">Custom Range</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            {filters.timePeriod === "custom" && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium">From</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs flex gap-2">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {filters.customDateFrom ? format(filters.customDateFrom, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.customDateFrom || undefined}
                          onSelect={(date) => setCustomDateRange(date, filters.customDateTo)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">To</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs flex gap-2">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {filters.customDateTo ? format(filters.customDateTo, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.customDateTo || undefined}
                          onSelect={(date) => setCustomDateRange(filters.customDateFrom, date)}
                          initialFocus
                          disabled={(date) => (filters.customDateFrom ? date < filters.customDateFrom : false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={cn(
                filters.type !== "all" &&
                  "border-green-400 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
                "gap-1 transition-all duration-200 hover:shadow-md",
              )}
            >
              <PiggyBank className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              <span>
                {compact
                  ? ""
                  : filters.type === "all"
                    ? "All Types"
                    : filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
              </span>
              {compact && filters.type !== "all" && (
                <Badge
                  variant="secondary"
                  className="h-5 ml-1 px-1.5 text-xs bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                >
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filters.type}
              onValueChange={(value) => setType(value as ExpenseType | "all")}
            >
              <DropdownMenuRadioItem value="all">All Types</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="expense">Expense</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="income">Income</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="savings">Savings</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={cn(
                filters.category !== "all" &&
                  "border-purple-400 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
                "gap-1 transition-all duration-200 hover:shadow-md",
              )}
            >
              <ArrowDownUp className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              <span>{compact ? "" : filters.category === "all" ? "All Categories" : filters.category}</span>
              {compact && filters.category !== "all" && (
                <Badge
                  variant="secondary"
                  className="h-5 ml-1 px-1.5 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                >
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] overflow-y-auto animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <DropdownMenuLabel>Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={filters.category} onValueChange={(value) => setCategory(value)}>
              <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {allCategories.map((category) => (
                <DropdownMenuRadioItem key={category} value={category}>
                  {category}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Amount Range Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={cn(
                filters.amountRange !== "all" &&
                  "border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                "gap-1 transition-all duration-200 hover:shadow-md",
              )}
            >
              <CircleDollarSign className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              <span>{compact ? "" : amountRangeLabels[filters.amountRange]}</span>
              {compact && filters.amountRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="h-5 ml-1 px-1.5 text-xs bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
                >
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <DropdownMenuLabel>Amount Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filters.amountRange}
              onValueChange={(value) => setAmountRange(value as AmountRange)}
            >
              <DropdownMenuRadioItem value="all">Any Amount</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="under500">Under ₹500</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="500to1000">₹500 - ₹1,000</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="1000to5000">₹1,000 - ₹5,000</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="over5000">Over ₹5,000</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="custom">Custom Range</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            {filters.amountRange === "custom" && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center">
                      <Label htmlFor="amount-min" className="text-xs">
                        Min
                      </Label>
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            id="amount-min"
                            type="number"
                            placeholder="0"
                            className="pl-6 h-8 text-xs"
                            value={filters.customAmountMin === null ? "" : filters.customAmountMin}
                            onChange={(e) => handleCustomAmountChange("min", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                      <Label htmlFor="amount-max" className="text-xs">
                        Max
                      </Label>
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            id="amount-max"
                            type="number"
                            placeholder="Any"
                            className="pl-6 h-8 text-xs"
                            value={filters.customAmountMax === null ? "" : filters.customAmountMax}
                            onChange={(e) => handleCustomAmountChange("max", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset Filters Button - only shown when not compact or when there are no active filters */}
        {(!compact || !isDefaultFilter) && (
          <Button
            variant="ghost"
            size={compact ? "sm" : "default"}
            onClick={resetFilters}
            disabled={isDefaultFilter}
            className={cn(
              "gap-1 transition-all duration-200",
              !isDefaultFilter && "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20",
            )}
          >
            <X className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
            <span>{compact ? "" : "Reset"}</span>
          </Button>
        )}

        {/* Active Filter Count Badge */}
        {!compact && activeFilterCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
            </Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Active Filter Pills (for compact view) */}
      <AnimatePresence>{compact && renderActiveFilters()}</AnimatePresence>
    </div>
  )
}
