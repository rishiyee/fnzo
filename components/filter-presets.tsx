"use client"

import type React from "react"

import { useState } from "react"
import { useFilter, type TimePeriod, type AmountRange } from "@/contexts/filter-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Wallet,
  PiggyBank,
  ShoppingCart,
  Coffee,
  Home,
  Car,
  Utensils,
  Sparkles,
  Clock,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ExpenseType } from "@/types/expense"

// Define preset types
export interface FilterPreset {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  filters: {
    timePeriod?: TimePeriod
    customDateFrom?: Date | null
    customDateTo?: Date | null
    type?: ExpenseType | "all"
    category?: string | "all"
    amountRange?: AmountRange
    customAmountMin?: number | null
    customAmountMax?: number | null
  }
  badge?: {
    text: string
    variant: "default" | "secondary" | "destructive" | "outline"
    className?: string
  }
}

interface FilterPresetsProps {
  className?: string
  onPresetApplied?: (presetId: string) => void
}

export function FilterPresets({ className, onPresetApplied }: FilterPresetsProps) {
  const {
    setTimePeriod,
    setCustomDateRange,
    setType,
    setCategory,
    setAmountRange,
    setCustomAmountRange,
    resetFilters,
  } = useFilter()

  const [lastAppliedPreset, setLastAppliedPreset] = useState<string | null>(null)

  // Define common filter presets
  const presets: FilterPreset[] = [
    {
      id: "this-month-expenses",
      name: "This Month's Expenses",
      description: "View all expenses for the current month",
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
      filters: {
        timePeriod: "thisMonth",
        type: "expense",
      },
      badge: {
        text: "Common",
        variant: "secondary",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      },
    },
    {
      id: "recent-transactions",
      name: "Recent Transactions",
      description: "View all transactions from the last 7 days",
      icon: <Clock className="h-4 w-4 text-green-500" />,
      filters: {
        timePeriod: "last7days",
        type: "all",
      },
      badge: {
        text: "Common",
        variant: "secondary",
        className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      },
    },
    {
      id: "high-value",
      name: "High-Value Transactions",
      description: "View transactions over ₹5,000",
      icon: <DollarSign className="h-4 w-4 text-amber-500" />,
      filters: {
        timePeriod: "all",
        type: "all",
        amountRange: "over5000",
      },
      badge: {
        text: "Analysis",
        variant: "secondary",
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
      },
    },
    {
      id: "monthly-income",
      name: "Monthly Income",
      description: "View all income for the current month",
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      filters: {
        timePeriod: "thisMonth",
        type: "income",
      },
      badge: {
        text: "Income",
        variant: "secondary",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
      },
    },
    {
      id: "monthly-savings",
      name: "Monthly Savings",
      description: "View all savings for the current month",
      icon: <PiggyBank className="h-4 w-4 text-purple-500" />,
      filters: {
        timePeriod: "thisMonth",
        type: "savings",
      },
      badge: {
        text: "Savings",
        variant: "secondary",
        className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      },
    },
    {
      id: "grocery-expenses",
      name: "Grocery Expenses",
      description: "View all grocery expenses",
      icon: <ShoppingCart className="h-4 w-4 text-orange-500" />,
      filters: {
        timePeriod: "all",
        type: "expense",
        category: "Groceries",
      },
      badge: {
        text: "Category",
        variant: "secondary",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      },
    },
    {
      id: "dining-expenses",
      name: "Dining Expenses",
      description: "View all dining and restaurant expenses",
      icon: <Utensils className="h-4 w-4 text-red-500" />,
      filters: {
        timePeriod: "all",
        type: "expense",
        category: "Dining",
      },
      badge: {
        text: "Category",
        variant: "secondary",
        className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      },
    },
    {
      id: "coffee-expenses",
      name: "Coffee Expenses",
      description: "View all coffee and cafe expenses",
      icon: <Coffee className="h-4 w-4 text-brown-500" />,
      filters: {
        timePeriod: "all",
        type: "expense",
        category: "Coffee",
      },
      badge: {
        text: "Category",
        variant: "secondary",
        className: "bg-yellow-800/20 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200",
      },
    },
    {
      id: "housing-expenses",
      name: "Housing Expenses",
      description: "View all housing and rent expenses",
      icon: <Home className="h-4 w-4 text-indigo-500" />,
      filters: {
        timePeriod: "all",
        type: "expense",
        category: "Housing",
      },
      badge: {
        text: "Category",
        variant: "secondary",
        className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
      },
    },
    {
      id: "transport-expenses",
      name: "Transport Expenses",
      description: "View all transportation expenses",
      icon: <Car className="h-4 w-4 text-cyan-500" />,
      filters: {
        timePeriod: "all",
        type: "expense",
        category: "Transport",
      },
      badge: {
        text: "Category",
        variant: "secondary",
        className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
      },
    },
    {
      id: "last-month-comparison",
      name: "Last Month Comparison",
      description: "Compare expenses with last month",
      icon: <TrendingDown className="h-4 w-4 text-pink-500" />,
      filters: {
        timePeriod: "lastMonth",
        type: "expense",
      },
      badge: {
        text: "Analysis",
        variant: "secondary",
        className: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
      },
    },
    {
      id: "small-expenses",
      name: "Small Expenses",
      description: "View all small expenses under ₹500",
      icon: <Wallet className="h-4 w-4 text-gray-500" />,
      filters: {
        timePeriod: "all",
        type: "expense",
        amountRange: "under500",
      },
      badge: {
        text: "Analysis",
        variant: "secondary",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      },
    },
  ]

  // Apply a preset
  const applyPreset = (preset: FilterPreset) => {
    // First reset all filters
    resetFilters()

    // Then apply the preset filters
    const { filters } = preset

    // Apply time period filter
    if (filters.timePeriod) {
      setTimePeriod(filters.timePeriod)
    }

    // Apply custom date range if present
    if (filters.customDateFrom !== undefined && filters.customDateTo !== undefined) {
      setCustomDateRange(filters.customDateFrom, filters.customDateTo)
    }

    // Apply type filter
    if (filters.type) {
      setType(filters.type)
    }

    // Apply category filter
    if (filters.category) {
      setCategory(filters.category)
    }

    // Apply amount range filter
    if (filters.amountRange) {
      setAmountRange(filters.amountRange)
    }

    // Apply custom amount range if present
    if (filters.customAmountMin !== undefined && filters.customAmountMax !== undefined) {
      setCustomAmountRange(filters.customAmountMin, filters.customAmountMax)
    }

    // Update last applied preset
    setLastAppliedPreset(preset.id)

    // Call the callback if provided
    if (onPresetApplied) {
      onPresetApplied(preset.id)
    }
  }

  // Group presets by type
  const groupedPresets = {
    common: presets.filter((preset) => preset.badge?.text === "Common"),
    income: presets.filter((preset) => preset.badge?.text === "Income"),
    savings: presets.filter((preset) => preset.badge?.text === "Savings"),
    category: presets.filter((preset) => preset.badge?.text === "Category"),
    analysis: presets.filter((preset) => preset.badge?.text === "Analysis"),
  }

  return (
    <div className={cn("", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1 transition-all duration-200 hover:shadow-md",
              lastAppliedPreset &&
                "border-violet-400 bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span>Presets</span>
            {lastAppliedPreset && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                >
                  1
                </Badge>
              </motion.div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-72 animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <DropdownMenuLabel className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span>Filter Presets</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Common Presets */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Common</DropdownMenuLabel>
            {groupedPresets.common.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="flex items-start py-2 cursor-pointer"
              >
                <div className="flex-shrink-0 mt-0.5">{preset.icon}</div>
                <div className="ml-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {preset.name}
                    {preset.badge && (
                      <Badge
                        variant={preset.badge.variant}
                        className={cn("text-[10px] px-1 py-0", preset.badge.className)}
                      >
                        {preset.badge.text}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Income Presets */}
          {groupedPresets.income.length > 0 && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Income</DropdownMenuLabel>
                {groupedPresets.income.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="flex items-start py-2 cursor-pointer"
                  >
                    <div className="flex-shrink-0 mt-0.5">{preset.icon}</div>
                    <div className="ml-2">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Savings Presets */}
          {groupedPresets.savings.length > 0 && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Savings</DropdownMenuLabel>
                {groupedPresets.savings.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="flex items-start py-2 cursor-pointer"
                  >
                    <div className="flex-shrink-0 mt-0.5">{preset.icon}</div>
                    <div className="ml-2">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Category Presets */}
          {groupedPresets.category.length > 0 && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Categories</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-1 p-1">
                  {groupedPresets.category.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="justify-start h-auto py-2 px-2 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">{preset.icon}</div>
                        <div className="text-xs font-medium">{preset.name.replace(" Expenses", "")}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Analysis Presets */}
          {groupedPresets.analysis.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Analysis</DropdownMenuLabel>
              {groupedPresets.analysis.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="flex items-start py-2 cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-0.5">{preset.icon}</div>
                  <div className="ml-2">
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
