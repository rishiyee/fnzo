"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { BackupSyncPanel } from "@/components/settings/backup-sync-panel"

export default function BackupPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Backup & Sync</h1>
        <BackupSyncPanel />
      </div>
    </AppLayout>
  )
}
