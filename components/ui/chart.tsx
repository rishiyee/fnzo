"use client"

import * as React from "react"
import { Tooltip, type TooltipProps } from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

export type ChartConfig = Record<
  string,
  {
    label: string
    color: string
  }
>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({ config, children, className, ...props }: ChartContainerProps) {
  const cssProperties = React.useMemo(() => {
    return Object.entries(config).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[`--color-${key}`] = value.color
      return acc
    }, {})
  }, [config])

  return (
    <div className={className} style={cssProperties} {...props}>
      {children}
    </div>
  )
}

interface ChartTooltipContentProps extends Omit<TooltipProps<ValueType, NameType>, "active" | "payload" | "label"> {
  active?: boolean
  payload?: any[]
  label?: string
  indicator?: "dot" | "line"
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  ...props
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm" {...props}>
      <div className="grid gap-2">
        <div className="text-xs font-medium">{label}</div>
        <div className="grid gap-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              {indicator === "dot" ? (
                <div
                  className="h-1 w-1 rounded-full"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              ) : (
                <div
                  className="h-0.5 w-2"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              <span className="font-medium">{item.name}:</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChartTooltip({ children, ...props }: React.ComponentProps<typeof Tooltip>) {
  return (
    <Tooltip content={<ChartTooltipContent indicator="dot" />} {...props}>
      {children}
    </Tooltip>
  )
}
