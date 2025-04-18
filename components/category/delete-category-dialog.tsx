"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Category } from "@/lib/category-service"
import { Badge } from "@/components/ui/badge"

interface DeleteCategoryDialogProps {
  category: Category
  categories: Category[]
  onDelete: (id: string, replacementId?: string) => void
  isDeleting: boolean
}

export function DeleteCategoryDialog({ category, categories, onDelete, isDeleting }: DeleteCategoryDialogProps) {
  const [replacementCategoryId, setReplacementCategoryId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Filter categories to only show those of the same type as the one being deleted
  const compatibleCategories = categories.filter((cat) => cat.type === category.type && cat.id !== category.id)

  const handleDelete = () => {
    setError(null)

    // If there are transactions in this category, a replacement is required
    if (category.spending > 0 && !replacementCategoryId) {
      setError("Please select a replacement category for existing transactions")
      return
    }

    onDelete(category.id, replacementCategoryId || undefined)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium text-lg mb-2">Category Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Name:</div>
          <div className="flex items-center">
            {category.name}
            {category.isDefault && (
              <Badge variant="outline" className="ml-2">
                Default
              </Badge>
            )}
          </div>

          <div className="font-medium">Type:</div>
          <div>
            <Badge
              variant={category.type === "expense" ? "destructive" : category.type === "income" ? "success" : "blue"}
            >
              {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
            </Badge>
          </div>

          <div className="font-medium">Spending:</div>
          <div>{formatCurrency(category.spending)}</div>

          <div className="font-medium">Budget:</div>
          <div>{category.budget ? formatCurrency(category.budget) : "—"}</div>

          {category.description && (
            <>
              <div className="font-medium">Description:</div>
              <div>{category.description}</div>
            </>
          )}
        </div>
      </div>

      {category.spending > 0 ? (
        <div className="space-y-2 pt-2">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This category has <strong>{formatCurrency(category.spending)}</strong> in transactions associated with it.
              Please select a replacement category.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 pt-2">
            <Label htmlFor="replacementCategory">Replacement Category</Label>
            <Select value={replacementCategoryId} onValueChange={setReplacementCategoryId}>
              <SelectTrigger id="replacementCategory">
                <SelectValue placeholder="Select replacement category" />
              </SelectTrigger>
              <SelectContent>
                {compatibleCategories.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No compatible categories found</div>
                ) : (
                  compatibleCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: cat.color || "#ccc" }}
                        ></div>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All transactions from "{category.name}" will be moved to the selected category
            </p>
          </div>
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Confirmation</AlertTitle>
          <AlertDescription>
            Are you sure you want to delete this category? This action cannot be undone.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting || (category.spending > 0 && !replacementCategoryId)}
        >
          {isDeleting ? "Deleting..." : "Delete Category"}
        </Button>
      </div>
    </div>
  )
}
