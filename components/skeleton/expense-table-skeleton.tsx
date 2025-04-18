import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function ExpenseTableSkeleton() {
  // Generate 5 skeleton rows
  const skeletonRows = Array(5)
    .fill(0)
    .map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
        </TableCell>
        <TableCell>
          <div className="h-6 w-20 bg-muted rounded-full animate-pulse"></div>
        </TableCell>
        <TableCell>
          <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
        </TableCell>
        <TableCell className="text-right">
          <div className="h-5 w-20 bg-muted rounded animate-pulse ml-auto"></div>
        </TableCell>
        <TableCell>
          <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          </div>
        </TableCell>
      </TableRow>
    ))

  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">
                    <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="h-5 w-20 bg-muted rounded animate-pulse ml-auto"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[100px] text-right">
                    <div className="h-5 w-20 bg-muted rounded animate-pulse ml-auto"></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{skeletonRows}</TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
