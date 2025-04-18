"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, GitMerge, ArrowRight } from "lucide-react"
import type { Category } from "@/lib/category-service"

interface MergeCategoriesFormProps {
  categories: Category[]
  sourceCategory: Category
  onSubmit: (sourceId: string, targetId: string) => void
  isSubmitting?: boolean
}

export function MergeCategoriesForm({
  categories,
  sourceCategory,
  onSubmit,
  isSubmitting = false,
}: MergeCategoriesFormProps) {
  const [targetCategoryId, setTargetCategoryId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Filter categories to only show those of the same type as the source
  const compatibleCategories = categories.filter(
    (cat) => cat.type === sourceCategory.type && cat.id !== sourceCategory.id,
  )

  // Reset form when sourceCategory changes
  useEffect(() => {
    setTargetCategoryId("")
    setError(null)
  }, [sourceCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!targetCategoryId) {
      setError("Please select a target category")
      return
    }

    onSubmit(sourceCategory.id, targetCategoryId)
  }

  // Find target category details
  const targetCategory = targetCategoryId ? categories.find((cat) => cat.id === targetCategoryId) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label className="text-muted-foreground">Source Category</Label>
          <div className="p-3 border rounded-md mt-1 bg-muted/30">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: sourceCategory.color || "#ccc" }}
              ></div>
              <p className="font-medium">{sourceCategory.name}</p>
            </div>
            <p className="text-sm text-muted-foreground capitalize mt-1">{sourceCategory.type}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetCategory">Target Category</Label>
          <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
            <SelectTrigger id="targetCategory">
              <SelectValue placeholder="Select target category" />
            </SelectTrigger>
            <SelectContent>
              {compatibleCategories.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No compatible categories found</div>
              ) : (
                compatibleCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color || "#ccc" }}
                      ></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            All transactions from "{sourceCategory.name}" will be moved to the selected category
          </p>
        </div>
      </div>

      {targetCategoryId && (
        <div className="bg-muted/20 p-4 rounded-md mt-4">
          <h4 className="font-medium text-sm mb-2">Merge Preview</h4>
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 border rounded-md bg-background flex-1">
              <p className="font-medium text-sm">{sourceCategory.name}</p>
              <div className="flex items-center mt-1">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: sourceCategory.color || "#ccc" }}
                ></div>
                <p className="text-xs text-muted-foreground capitalize">{sourceCategory.type}</p>
              </div>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            {targetCategory && (
              <div className="p-2 border rounded-md bg-background flex-1">
                <p className="font-medium text-sm">{targetCategory.name}</p>
                <div className="flex items-center mt-1">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: targetCategory.color || "#ccc" }}
                  ></div>
                  <p className="text-xs text-muted-foreground capitalize">{targetCategory.type}</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            This action will move all transactions from "{sourceCategory.name}" to "{targetCategory?.name}" and then
            delete the "{sourceCategory.name}" category.
          </p>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || compatibleCategories.length === 0 || !targetCategoryId}
        >
          {isSubmitting ? (
            "Merging..."
          ) : (
            <>
              <GitMerge className="h-4 w-4 mr-2" />
              Merge Categories
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
