import { AppLayout } from "@/components/layout/app-layout"

export default function Loading() {
  return (
    <AppLayout>
      <div className="p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>

        <div className="h-12 w-full bg-muted rounded animate-pulse mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="p-4">
                <div className="h-4 w-full bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="p-4 border-t flex justify-end">
                <div className="h-8 w-16 bg-muted rounded animate-pulse mr-2"></div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
