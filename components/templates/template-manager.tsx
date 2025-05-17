"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpZA,
  Calendar,
  Copy,
  Edit,
  FileDown,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { templateService } from "@/lib/template-service"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import type { TransactionTemplate, CreateTemplateInput } from "@/types/template"
import type { ExpenseType } from "@/types/expense"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { format } from "date-fns"

type SortField = "name" | "amount" | "category" | "updatedAt"
type SortOrder = "asc" | "desc"

export function TemplateManager() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<TransactionTemplate | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [categories, setCategories] = useState<Record<string, string[]>>({
    expense: [],
    income: [],
    savings: [],
  })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const { toast } = useToast()

  // Form state for create/edit
  const [formState, setFormState] = useState<CreateTemplateInput>({
    name: "",
    type: "expense",
    category: "",
    amount: 0,
    notes: "",
    isDefault: false,
  })

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Load templates and categories
  const loadData = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)

      // Try to load templates first
      let templatesData: TransactionTemplate[] = []
      try {
        templatesData = await templateService.getTemplates()
      } catch (error) {
        console.error("Error loading templates:", error)
        setLoadError("Could not load templates. Please try again later.")
        toast({
          title: "Warning",
          description: "Could not load all templates. Some data may be missing.",
          variant: "destructive",
        })
        // Continue with empty templates rather than failing completely
        templatesData = []
      }

      // Try to load categories
      let categoriesData: Record<string, string[]> = { expense: [], income: [], savings: [] }
      try {
        categoriesData = await expenseService.getCategories()
      } catch (error) {
        console.error("Error loading categories:", error)
        toast({
          title: "Warning",
          description: "Could not load categories. Some functionality may be limited.",
          variant: "destructive",
        })
        // Continue with default empty categories
      }

      setTemplates(templatesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error in loadData:", error)
      setLoadError("Failed to load data. Please try refreshing the page.")
      toast({
        title: "Error",
        description: "Failed to load data. Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()

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
  }, [toast])

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  // Toggle sort order
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    // First filter by tab
    let result = [...templates] // Create a copy to avoid mutation issues

    if (activeTab !== "all") {
      if (activeTab === "default") {
        result = result.filter((template) => template.isDefault)
      } else {
        result = result.filter((template) => template.type === activeTab)
      }
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query) ||
          template.notes.toLowerCase().includes(query),
      )
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      result = result.filter((template) => selectedCategories.includes(template.category))
    }

    // Then sort
    return result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "amount":
          comparison = a.amount - b.amount
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [templates, activeTab, searchQuery, sortField, sortOrder, selectedCategories])

  // Get all available categories for the current tab
  const availableCategories = useMemo(() => {
    if (!templates || templates.length === 0) return []

    if (activeTab === "all" || activeTab === "default") {
      return [
        ...new Set(
          templates
            .filter((t) => activeTab !== "default" || t.isDefault)
            .map((template) => template.category)
            .filter(Boolean),
        ),
      ].sort()
    }
    return categories[activeTab as ExpenseType] || []
  }, [templates, categories, activeTab])

  // Open create dialog
  const handleOpenCreateDialog = () => {
    setFormState({
      name: "",
      type: "expense",
      category: "",
      amount: 0,
      notes: "",
      isDefault: false,
    })
    setFormErrors({})
    setIsCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleOpenEditDialog = (template: TransactionTemplate) => {
    setActiveTemplate(template)
    setFormState({
      name: template.name,
      type: template.type,
      category: template.category,
      amount: template.amount,
      notes: template.notes,
      isDefault: template.isDefault,
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const handleOpenDeleteDialog = (template: TransactionTemplate) => {
    setActiveTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  // Handle form input changes
  const handleFormChange = (field: keyof CreateTemplateInput, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Reset category when type changes
    if (field === "type") {
      setFormState((prev) => ({
        ...prev,
        category: "",
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formState.name.trim()) {
      errors.name = "Template name is required"
    }

    if (!formState.category) {
      errors.category = "Category is required"
    }

    if (formState.amount < 0) {
      errors.amount = "Amount cannot be negative"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Create template
  const handleCreateTemplate = async () => {
    try {
      if (!validateForm()) {
        return
      }

      await templateService.createTemplate(formState)
      toast({
        title: "Success",
        description: "Template created successfully",
      })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update template
  const handleUpdateTemplate = async () => {
    try {
      if (!activeTemplate || !validateForm()) {
        return
      }

      await templateService.updateTemplate(activeTemplate.id, formState)
      toast({
        title: "Success",
        description: "Template updated successfully",
      })
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete template
  const handleDeleteTemplate = async () => {
    try {
      if (!activeTemplate) return

      await templateService.deleteTemplate(activeTemplate.id)
      toast({
        title: "Success",
        description: "Template deleted successfully",
      })
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Duplicate template
  const handleDuplicateTemplate = async (template: TransactionTemplate) => {
    try {
      const duplicateData: CreateTemplateInput = {
        name: `${template.name} (Copy)`,
        type: template.type,
        category: template.category,
        amount: template.amount,
        notes: template.notes,
        isDefault: false, // Don't copy default status
      }

      await templateService.createTemplate(duplicateData)
      toast({
        title: "Success",
        description: "Template duplicated successfully",
      })
    } catch (error) {
      console.error("Error duplicating template:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate template. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Export templates
  const handleExportTemplates = () => {
    try {
      const dataToExport = filteredAndSortedTemplates.length > 0 ? filteredAndSortedTemplates : templates
      const jsonData = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `templates-export-${format(new Date(), "yyyy-MM-dd")}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Templates exported successfully",
      })
    } catch (error) {
      console.error("Error exporting templates:", error)
      toast({
        title: "Error",
        description: "Failed to export templates. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get type badge color
  const getTypeBadgeColor = (type: ExpenseType) => {
    switch (type) {
      case "expense":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "income":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "savings":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Toggle category selection
  const toggleCategorySelection = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setSortField("name")
    setSortOrder("asc")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Transaction Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable transaction templates</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportTemplates} disabled={templates.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="default">Default</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Categories
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandList>
                  <CommandEmpty>No categories found.</CommandEmpty>
                  <CommandGroup>
                    {availableCategories.map((category) => (
                      <CommandItem
                        key={category}
                        onSelect={() => toggleCategorySelection(category)}
                        className="flex items-center"
                      >
                        <div
                          className={`mr-2 h-4 w-4 rounded-sm border ${
                            selectedCategories.includes(category)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedCategories.includes(category) && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 text-white"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        <span>{category}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" className="h-9" onClick={() => toggleSort("name")} title="Sort by name">
            <span className="mr-2">Name</span>
            {sortField === "name" &&
              (sortOrder === "asc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpZA className="h-4 w-4" />)}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => toggleSort("amount")}
            title="Sort by amount"
          >
            <span className="mr-2">Amount</span>
            {sortField === "amount" &&
              (sortOrder === "asc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpZA className="h-4 w-4" />)}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => toggleSort("updatedAt")}
            title="Sort by last updated"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {sortField === "updatedAt" &&
              (sortOrder === "asc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpZA className="h-4 w-4" />)}
          </Button>

          {(searchQuery || selectedCategories.length > 0 || sortField !== "name" || sortOrder !== "asc") && (
            <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted rounded-t-lg" />
              <CardContent className="py-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : loadError ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-2">Error Loading Templates</h3>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Try Again
          </Button>
        </Card>
      ) : filteredAndSortedTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategories.length > 0
              ? "No templates match your search criteria."
              : activeTab === "all"
                ? "You haven't created any templates yet."
                : `You don't have any ${activeTab} templates.`}
          </p>
          {searchQuery || selectedCategories.length > 0 ? (
            <Button onClick={clearFilters}>Clear Filters</Button>
          ) : (
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center">
                      {template.name}
                      {template.isDefault && (
                        <span className="ml-2" title="Default template">
                          <Star className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className={getTypeBadgeColor(template.type)}>
                        {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                      </Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        Updated {format(new Date(template.updatedAt), "MMM d, yyyy")}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(template.amount)}</div>
                    <div className="text-sm text-muted-foreground">{template.category}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {template.notes ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicateTemplate(template)}
                  title="Duplicate template"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Duplicate</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(template)} title="Edit template">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleOpenDeleteDialog(template)}
                  title="Delete template"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>Create a new transaction template for quick reuse.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className={formErrors.name ? "border-destructive" : ""}
                  placeholder="Monthly Rent"
                />
                {formErrors.name && <p className="text-destructive text-sm mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Select
                  value={formState.type}
                  onValueChange={(value) => handleFormChange("type", value as ExpenseType)}
                >
                  <SelectTrigger id="type" className={formErrors.type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.type && <p className="text-destructive text-sm mt-1">{formErrors.type}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Select value={formState.category} onValueChange={(value) => handleFormChange("category", value)}>
                  <SelectTrigger id="category" className={formErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[formState.type]?.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-destructive text-sm mt-1">{formErrors.category}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  value={formState.amount}
                  onChange={(e) => handleFormChange("amount", Number(e.target.value))}
                  className={`pl-7 ${formErrors.amount ? "border-destructive" : ""}`}
                  placeholder="0"
                />
                {formErrors.amount && <p className="text-destructive text-sm mt-1">{formErrors.amount}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="notes"
                  value={formState.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  className={formErrors.notes ? "border-destructive" : ""}
                  placeholder="Optional notes"
                />
                {formErrors.notes && <p className="text-destructive text-sm mt-1">{formErrors.notes}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">
                Default
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="isDefault"
                  checked={formState.isDefault}
                  onCheckedChange={(checked) => handleFormChange("isDefault", checked)}
                />
                <Label htmlFor="isDefault" className="font-normal">
                  Show in quick access
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update your transaction template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  value={formState.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && <p className="text-destructive text-sm mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Type <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Select
                  value={formState.type}
                  onValueChange={(value) => handleFormChange("type", value as ExpenseType)}
                >
                  <SelectTrigger id="edit-type" className={formErrors.type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.type && <p className="text-destructive text-sm mt-1">{formErrors.type}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Select value={formState.category} onValueChange={(value) => handleFormChange("category", value)}>
                  <SelectTrigger id="edit-category" className={formErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[formState.type]?.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-destructive text-sm mt-1">{formErrors.category}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formState.amount}
                  onChange={(e) => handleFormChange("amount", Number(e.target.value))}
                  className={`pl-7 ${formErrors.amount ? "border-destructive" : ""}`}
                />
                {formErrors.amount && <p className="text-destructive text-sm mt-1">{formErrors.amount}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-notes" className="text-right">
                Notes
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="edit-notes"
                  value={formState.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  className={formErrors.notes ? "border-destructive" : ""}
                />
                {formErrors.notes && <p className="text-destructive text-sm mt-1">{formErrors.notes}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isDefault" className="text-right">
                Default
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="edit-isDefault"
                  checked={formState.isDefault}
                  onCheckedChange={(checked) => handleFormChange("isDefault", checked)}
                />
                <Label htmlFor="edit-isDefault" className="font-normal">
                  Show in quick access
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>Update Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {activeTemplate && (
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{activeTemplate.name}</h4>
                    <Badge variant="outline" className={getTypeBadgeColor(activeTemplate.type)}>
                      {activeTemplate.type.charAt(0).toUpperCase() + activeTemplate.type.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(activeTemplate.amount)}</div>
                    <div className="text-sm text-muted-foreground">{activeTemplate.category}</div>
                  </div>
                </div>
                {activeTemplate.notes && <p className="text-sm text-muted-foreground">{activeTemplate.notes}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
