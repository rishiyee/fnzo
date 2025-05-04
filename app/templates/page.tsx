"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { TemplateManager } from "@/components/templates/template-manager"

export default function TemplatesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transaction Templates</h1>
        <TemplateManager />
      </div>
    </AppLayout>
  )
}
