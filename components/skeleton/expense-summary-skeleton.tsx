export function ExpenseSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Income Card Skeleton */}
      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-6 pb-2">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-muted rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 pt-2">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* Expenses Card Skeleton */}
      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-6 pb-2">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-muted rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 pt-2">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* Savings Card Skeleton */}
      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-6 pb-2">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 pt-2 space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
            </div>
          </div>

          {/* Progress bar skeleton */}
          <div className="w-full bg-muted rounded-full h-2.5"></div>

          <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
          </div>

          <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* Balance Card Skeleton */}
      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-6 pb-2">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-muted rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 pt-2">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
