"use client"

import { useState, useEffect } from "react"
import { useFilter } from "@/contexts/filter-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, CalendarIcon, X, Filter, Check } from "lucide-react"
import { format } from "date-fns"
import { useCategories } from "@/contexts/category-context"

export function UnifiedFilter() {
  const {
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    selectedTypes,
    setSelectedTypes,
    selectedCategories,
    setSelectedCategories,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    clearFilters,
  } = useFilter()

  const { categories } = useCategories()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [localDateRange, setLocalDateRange] = useState(dateRange)
  const [localMinAmount, setLocalMinAmount] = useState(minAmount?.toString() || "")
  const [localMaxAmount, setLocalMaxAmount] = useState(maxAmount?.toString() || "")

  // Update local state when filter context changes
  useEffect(() => {
    setLocalDateRange(dateRange)
    setLocalMinAmount(minAmount?.toString() || "")
    setLocalMaxAmount(maxAmount?.toString() || "")
  }, [dateRange, minAmount, maxAmount])

  // Apply date range filter
  const handleApplyDateRange = () => {
    setDateRange(localDateRange)
    setIsCalendarOpen(false)
  }

  // Apply amount filters
  const handleApplyAmountFilters = () => {
    setMinAmount(localMinAmount ? Number(localMinAmount) : undefined)
    setMaxAmount(localMaxAmount ? Number(localMaxAmount) : undefined)
  }

  // Clear date range filter
  const handleClearDateRange = () => {
    setLocalDateRange({ from: undefined, to: undefined })
    setDateRange({ from: undefined, to: undefined })
    setIsCalendarOpen(false)
  }

  // Toggle transaction type filter
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  // Toggle category filter
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  // Get unique categories for the filter
  const uniqueCategories = Array.from(new Set(categories.map((category) => category.name))).sort()

  // Count active filters
  const activeFilterCount =
    (dateRange.from || dateRange.to ? 1 : 0) +
    (selectedTypes.length > 0 ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0)

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={dateRange.from || dateRange.to ? "default" : "outline"}
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={localDateRange}
                onSelect={setLocalDateRange}
                numberOfMonths={2}
                className="w-full"
              />
              <div className="flex items-center justify-between p-3 border-t">
                <Button variant="ghost" size="sm" onClick={handleClearDateRange}>
                  Clear
                </Button>
                <Button size="sm" onClick={handleApplyDateRange}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant={activeFilterCount > 0 ? "default" : "outline"} className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 px-1 min-w-[20px] flex items-center justify-center">{activeFilterCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <div className="p-4 border-b">
                <h4 className="font-medium">Filter Transactions</h4>
                <p className="text-sm text-muted-foreground">Narrow down transactions by type, category, and amount</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Transaction Type</h5>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedTypes.includes("expense") ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleType("expense")}
                    >
                      Expense
                      {selectedTypes.includes("expense") && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                    <Badge
                      variant={selectedTypes.includes("income") ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleType("income")}
                    >
                      Income
                      {selectedTypes.includes("income") && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                    <Badge
                      variant={selectedTypes.includes("savings") ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleType("savings")}
                    >
                      Savings
                      {selectedTypes.includes("savings") && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Amount Range</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="min-amount" className="text-xs">
                        Min Amount
                      </Label>
                      <Input
                        id="min-amount"
                        type="number"
                        placeholder="Min"
                        value={localMinAmount}
                        onChange={(e) => setLocalMinAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-amount" className="text-xs">
                        Max Amount
                      </Label>
                      <Input
                        id="max-amount"
                        type="number"
                        placeholder="Max"
                        value={localMaxAmount}
                        onChange={(e) => setLocalMaxAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2 w-full" onClick={handleApplyAmountFilters}>
                    Apply Amount Filter
                  </Button>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Categories</h5>
                  <div className="max-h-[150px] overflow-y-auto pr-2 space-y-1">
                    {uniqueCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer flex-1 truncate">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border-t">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium">Active Filters:</span>

              {(dateRange.from || dateRange.to) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {dateRange.from
                    ? dateRange.to
                      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                      : `From ${format(dateRange.from, "MMM d")}`
                    : `Until ${format(dateRange.to!, "MMM d")}`}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={handleClearDateRange}>
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear date filter</span>
                  </Button>
                </Badge>
              )}

              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Types: {selectedTypes.join(", ")}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => setSelectedTypes([])}>
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear type filter</span>
                  </Button>
                </Badge>
              )}

              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Categories: {selectedCategories.length} selected
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0"
                    onClick={() => setSelectedCategories([])}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear category filter</span>
                  </Button>
                </Badge>
              )}

              {(minAmount || maxAmount) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Amount: {minAmount ? `₹${minAmount}` : "₹0"} - {maxAmount ? `₹${maxAmount}` : "any"}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0"
                    onClick={() => {
                      setMinAmount(undefined)
                      setMaxAmount(undefined)
                      setLocalMinAmount("")
                      setLocalMaxAmount("")
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear amount filter</span>
                  </Button>
                </Badge>
              )}

              <Button variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
