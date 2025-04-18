import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ExpenseGraphSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-40 bg-muted rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>

        <div className="flex flex-wrap gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full h-[300px] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[250px] bg-muted/30 rounded-md animate-pulse"></div>
          </div>
          <div className="absolute left-0 bottom-0 h-[250px] flex flex-col justify-between py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 w-10 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 w-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
