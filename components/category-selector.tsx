"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Category = {
  id: string
  name: string
  type: string
  usage_count: number
  last_used: string
  color: string
  icon: string
}

interface CategorySelectorProps {
  type: "income" | "expense"
  value: string
  onChange: (value: string) => void
  categories: Category[]
}

export function CategorySelector({ type, value, onChange, categories }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [sortedCategories, setSortedCategories] = useState<Category[]>([])

  // Sort categories by usage count (most used first) then by last used (most recent first)
  useEffect(() => {
    if (categories) {
      const filtered = categories.filter((cat) => cat.type === type)
      const sorted = [...filtered].sort((a, b) => {
        // First sort by usage count (descending)
        if (b.usage_count !== a.usage_count) {
          return b.usage_count - a.usage_count
        }
        // Then by last used date (most recent first)
        const dateA = a.last_used ? new Date(a.last_used).getTime() : 0
        const dateB = b.last_used ? new Date(b.last_used).getTime() : 0
        return dateB - dateA
      })
      setSortedCategories(sorted)
    }
  }, [categories, type])

  const selectedCategory = categories.find((cat) => cat.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              {selectedCategory.icon && (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: selectedCategory.color || "#cbd5e1" }}
                >
                  {selectedCategory.icon}
                </span>
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
              {sortedCategories.map((category) => (
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
                    {category.icon && (
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: category.color || "#cbd5e1" }}
                      >
                        {category.icon}
                      </span>
                    )}
                    <span>{category.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
