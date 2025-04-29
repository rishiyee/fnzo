import type { ExpenseType } from "./expense"

export interface TransactionTemplate {
  id: string
  name: string
  type: ExpenseType
  category: string
  amount: number
  notes: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateTemplateInput = Omit<TransactionTemplate, "id" | "createdAt" | "updatedAt">
export type UpdateTemplateInput = Partial<Omit<TransactionTemplate, "id" | "createdAt" | "updatedAt">>
