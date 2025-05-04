"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CategoryTable } from "@/components/category/category-table"

export default function CategoriesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <CategoryTable />
      </div>
    </AppLayout>
  )
}
