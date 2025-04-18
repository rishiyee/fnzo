import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ExpenseFilterSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-5 w-24 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
          </div>

          <div>
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
