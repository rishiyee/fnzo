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
        <Badge key="time" variant="outline" className="mr-1 mb-1">
          <CalendarDays className="mr-1 h-3 w-3" />
          {label}
        </Badge>,
      )
    }

    if (filters.type !== "all") {
      activeFilters.push(
        <Badge key="type" variant="outline" className="mr-1 mb-1">
          <PiggyBank className="mr-1 h-3 w-3" />
          {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
        </Badge>,
      )
    }

    if (filters.category !== "all") {
      activeFilters.push(
        <Badge key="category" variant="outline" className="mr-1 mb-1">
          <ArrowDownUp className="mr-1 h-3 w-3" />
          {filters.category}
        </Badge>,
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
        <Badge key="amount" variant="outline" className="mr-1 mb-1">
          <CircleDollarSign className="mr-1 h-3 w-3" />
          {label}
        </Badge>,
      )
    }

    return (
      <div className="flex flex-wrap mt-2">
        {activeFilters}
        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={resetFilters}>
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Time Period Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={cn(filters.timePeriod !== "all" && "border-primary bg-primary/10", "gap-1")}
            >
              <CalendarDays className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              <span>{compact ? "" : timePeriodLabels[filters.timePeriod]}</span>
              {compact && filters.timePeriod !== "all" && (
                <Badge variant="secondary" className="h-5 ml-1 px-1.5 text-xs">
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
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
              className={cn(filters.type !== "all" && "border-primary bg-primary/10", "gap-1")}
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
                <Badge variant="secondary" className="h-5 ml-1 px-1.5 text-xs">
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
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
              className={cn(filters.category !== "all" && "border-primary bg-primary/10", "gap-1")}
            >
              <ArrowDownUp className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              <span>{compact ? "" : filters.category === "all" ? "All Categories" : filters.category}</span>
              {compact && filters.category !== "all" && (
                <Badge variant="secondary" className="h-5 ml-1 px-1.5 text-xs">
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
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
              className={cn(filters.amountRange !== "all" && "border-primary bg-primary/10", "gap-1")}
            >
              <CircleDollarSign className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              <span>{compact ? "" : amountRangeLabels[filters.amountRange]}</span>
              {compact && filters.amountRange !== "all" && (
                <Badge variant="secondary" className="h-5 ml-1 px-1.5 text-xs">
                  •
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
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
            className="gap-1"
          >
            <X className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
            <span>{compact ? "" : "Reset"}</span>
          </Button>
        )}

        {/* Active Filter Count Badge */}
        {!compact && activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
          </Badge>
        )}
      </div>

      {/* Active Filter Pills (for compact view) */}
      {compact && renderActiveFilters()}
    </div>
  )
}
