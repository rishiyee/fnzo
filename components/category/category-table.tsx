"use client"

import { useState } from "react"
import { Edit, Trash2, ArrowUpDown, Check, Clock, Hash } from "lucide-react"
import { format } from "date-fns"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { Category } from "@/lib/category-service"

type CategoryTableProps = {
  categories: (Category & { spending: number })[]
  onEdit: (category: Category & { spending: number }) => void
  onDelete: (category: Category & { spending: number }) => void
  isMergeMode?: boolean
  selectedCategories?: string[]
  onToggleSelect?: (category: Category & { spending: number }) => void
  sortConfig?: {
    key: string
    direction: "asc" | "desc"
  }
  onSort?: (field: string) => void
}

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
  isMergeMode = false,
  selectedCategories = [],
  onToggleSelect,
  sortConfig,
  onSort,
}: CategoryTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "expense":
        return "destructive"
      case "income":
        return "success"
      case "savings":
        return "blue"
      default:
        return "secondary"
    }
  }

  const getSortIcon = (field: string) => {
    if (sortConfig && sortConfig.key === field) {
      return sortConfig.direction === "asc" ? "↑" : "↓"
    }
    return null
  }

  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return "Never"

    try {
      return format(new Date(lastUsed), "MMM d, yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  return (
    <div className="border rounded-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {isMergeMode && <TableHead className="w-[50px]">Select</TableHead>}
              <TableHead className="cursor-pointer" onClick={() => onSort && onSort("name")}>
                Name {getSortIcon("name")}
                {onSort && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort && onSort("type")}>
                Type {getSortIcon("type")}
                {onSort && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort && onSort("usageCount")}>
                Usage {getSortIcon("usageCount")}
                {onSort && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort && onSort("lastUsed")}>
                Last Used {getSortIcon("lastUsed")}
                {onSort && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => onSort && onSort("spending")}>
                Spending {getSortIcon("spending")}
                {onSort && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => onSort && onSort("budget")}>
                Budget {getSortIcon("budget")}
                {onSort && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id)
              const isActive = (category.usageCount || 0) > 0

              return (
                <TableRow
                  key={category.id}
                  onMouseEnter={() => setHoveredRow(category.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`${isActive ? "bg-muted/30" : ""} ${isSelected ? "bg-primary/10" : ""}`}
                >
                  {isMergeMode && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect && onToggleSelect(category)}
                        aria-label={`Select ${category.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-medium">{category.name}</span>
                      {category.isDefault && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="ml-2">
                                Default
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This is a default category</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isActive && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="ml-2">
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This category is used in transactions</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {category.description && (
                      <div className="text-xs text-muted-foreground mt-1">{category.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(category.type)}>
                      {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Hash className="h-3.5 w-3.5 mr-1" />
                      <span>{category.usageCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>{formatLastUsed(category.lastUsed)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(category.spending)}</TableCell>
                  <TableCell className="text-right">
                    {category.budget ? formatCurrency(category.budget) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(category)} disabled={isMergeMode}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(category)} disabled={isMergeMode}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
