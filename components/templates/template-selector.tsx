"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ChevronsUpDown, Star } from "lucide-react"
import { templateService } from "@/lib/template-service"
import type { TransactionTemplate } from "@/types/template"
import type { ExpenseType } from "@/types/expense"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TemplateSelectorProps {
  onSelectTemplate: (template: TransactionTemplate) => void
  type?: ExpenseType
}

export function TemplateSelector({ onSelectTemplate, type }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<TransactionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const templatesData = await templateService.getTemplates()
        setTemplates(templatesData)
      } catch (err) {
        console.error("Error loading templates:", err)
        setError("Failed to load templates. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()

    // Set up event listeners for template changes
    const handleTemplateCreated = (e: CustomEvent<TransactionTemplate>) => {
      setTemplates((prev) => [...prev, e.detail])
    }

    const handleTemplateUpdated = (e: CustomEvent<TransactionTemplate>) => {
      setTemplates((prev) => prev.map((template) => (template.id === e.detail.id ? e.detail : template)))
    }

    const handleTemplateDeleted = (e: CustomEvent<TransactionTemplate>) => {
      setTemplates((prev) => prev.filter((template) => template.id !== e.detail.id))
    }

    window.addEventListener("template-created", handleTemplateCreated as EventListener)
    window.addEventListener("template-updated", handleTemplateUpdated as EventListener)
    window.addEventListener("template-deleted", handleTemplateDeleted as EventListener)

    return () => {
      window.removeEventListener("template-created", handleTemplateCreated as EventListener)
      window.removeEventListener("template-updated", handleTemplateUpdated as EventListener)
      window.removeEventListener("template-deleted", handleTemplateDeleted as EventListener)
    }
  }, [])

  // Filter templates based on type
  const filteredTemplates = type ? templates.filter((template) => template.type === type) : templates

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handle template selection
  const handleSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      onSelectTemplate(template)
      setOpen(false)
    }
  }

  // Handle retry
  const handleRetry = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const templatesData = await templateService.getTemplates()
      setTemplates(templatesData)
    } catch (err) {
      console.error("Error retrying template load:", err)
      setError("Failed to load templates. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading ? "Loading templates..." : "Select a template"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search templates..." />
            <CommandList>
              <CommandEmpty>No templates found.</CommandEmpty>
              <CommandGroup>
                {filteredTemplates.map((template) => (
                  <CommandItem
                    key={template.id}
                    value={template.id}
                    onSelect={handleSelect}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span>{template.name}</span>
                      {template.isDefault && <Star className="ml-2 h-3 w-3 text-yellow-500" />}
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {template.category}
                      </Badge>
                      <span className="text-sm font-medium">{formatCurrency(template.amount)}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
