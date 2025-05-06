"use client"

import { useState, useEffect } from "react"
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
import { AlertCircle, Edit, Plus, Star, Trash2 } from "lucide-react"
import { templateService } from "@/lib/template-service"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import type { TransactionTemplate, CreateTemplateInput } from "@/types/template"
import type { ExpenseType } from "@/types/expense"

export function TemplateManager() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // Load templates and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Try to load templates first
        let templatesData: TransactionTemplate[] = []
        try {
          templatesData = await templateService.getTemplates()
        } catch (error) {
          console.error("Error loading templates:", error)
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
        toast({
          title: "Error",
          description: "Failed to load data. Please try refreshing the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

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

  // Filter templates based on active tab
  const filteredTemplates = templates.filter((template) => {
    if (activeTab === "all") return true
    if (activeTab === "default") return template.isDefault
    return template.type === activeTab
  })

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

    // Reset category when type changes
    if (field === "type") {
      setFormState((prev) => ({
        ...prev,
        category: "",
      }))
    }
  }

  // Create template
  const handleCreateTemplate = async () => {
    try {
      if (!formState.name) {
        toast({
          title: "Validation Error",
          description: "Template name is required",
          variant: "destructive",
        })
        return
      }

      if (!formState.category) {
        toast({
          title: "Validation Error",
          description: "Category is required",
          variant: "destructive",
        })
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
      if (!activeTemplate) return

      if (!formState.name) {
        toast({
          title: "Validation Error",
          description: "Template name is required",
          variant: "destructive",
        })
        return
      }

      if (!formState.category) {
        toast({
          title: "Validation Error",
          description: "Category is required",
          variant: "destructive",
        })
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Transaction Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable transaction templates</p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="default">Default</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted rounded-t-lg" />
              <CardContent className="py-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === "all"
              ? "You haven't created any templates yet."
              : `You don't have any ${activeTab} templates.`}
          </p>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center">
                      {template.name}
                      {template.isDefault && <Star className="ml-2 h-4 w-4 text-yellow-500" />}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className={getTypeBadgeColor(template.type)}>
                        {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(template.amount)}</div>
                    <div className="text-sm text-muted-foreground">{template.category}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {template.notes && <p className="text-sm text-muted-foreground line-clamp-2">{template.notes}</p>}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(template)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleOpenDeleteDialog(template)}
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
                Name
              </Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="col-span-3"
                placeholder="Monthly Rent"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={formState.type} onValueChange={(value) => handleFormChange("type", value)}>
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={formState.category} onValueChange={(value) => handleFormChange("category", value)}>
                <SelectTrigger id="category" className="col-span-3">
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
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  value={formState.amount}
                  onChange={(e) => handleFormChange("amount", Number(e.target.value))}
                  className="pl-7"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formState.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                className="col-span-3"
                placeholder="Optional notes"
              />
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
                <Label htmlFor="isDefault">Show in quick access</Label>
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
                Name
              </Label>
              <Input
                id="edit-name"
                value={formState.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Type
              </Label>
              <Select value={formState.type} onValueChange={(value) => handleFormChange("type", value)}>
                <SelectTrigger id="edit-type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select value={formState.category} onValueChange={(value) => handleFormChange("category", value)}>
                <SelectTrigger id="edit-category" className="col-span-3">
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
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Amount
              </Label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formState.amount}
                  onChange={(e) => handleFormChange("amount", Number(e.target.value))}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                value={formState.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                className="col-span-3"
              />
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
                <Label htmlFor="edit-isDefault">Show in quick access</Label>
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
