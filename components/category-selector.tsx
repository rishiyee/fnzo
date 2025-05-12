"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCategories } from "@/contexts/category-context"

interface CategorySelectorProps {
  id?: string
  type: "income" | "expense" | "savings"
  value: string
  onChange: (value: string) => void
}

export function CategorySelector({ id, type, value, onChange }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const { categories, isLoading } = useCategories()

  // Use useMemo to filter and sort categories to prevent recalculation on every render
  const sortedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return []

    return categories
      .filter((cat) => cat.type === type)
      .sort((a, b) => {
        // First sort by usage count (descending)
        if ((b.usageCount || 0) !== (a.usageCount || 0)) {
          return (b.usageCount || 0) - (a.usageCount || 0)
        }
        // Then by last used date (most recent first)
        const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0
        const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0
        return dateB - dateA
      })
  }, [categories, type])

  // Use useMemo to find the selected category to prevent recalculation on every render
  const selectedCategory = useMemo(() => {
    if (!categories || categories.length === 0) return undefined
    return categories.find((cat) => cat.name === value && cat.type === type)
  }, [categories, value, type])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" id={id}>
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              {selectedCategory.color && (
                <span
                  className="flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: selectedCategory.color || "#cbd5e1" }}
                />
              )}
              <span>{selectedCategory.name}</span>
            </div>
          ) : (
            "Select category..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading categories...</div>
              ) : (
                sortedCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === category.name ? "opacity-100" : "opacity-0")} />
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <span
                          className="flex h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color || "#cbd5e1" }}
                        />
                      )}
                      <span>{category.name}</span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
