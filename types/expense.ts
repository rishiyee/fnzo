export type ExpenseType = "expense" | "income" | "savings"

// Make ExpenseCategory a string type to support dynamic categories
export type ExpenseCategory = string

export interface Expense {
  id: string
  date: string
  type: ExpenseType
  category: ExpenseCategory
  amount: number
  notes: string
}
