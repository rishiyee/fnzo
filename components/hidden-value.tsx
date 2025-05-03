"use client"

import { useVisibility } from "@/contexts/visibility-context"
import { cn } from "@/lib/utils"

interface HiddenValueProps {
  value: string | number
  className?: string
  placeholder?: string
}

export function HiddenValue({ value, className, placeholder = "••••••" }: HiddenValueProps) {
  const { showValues } = useVisibility()

  return (
    <span className={cn("transition-opacity duration-300", className)}>
      {showValues ? <span>{value}</span> : <span className="opacity-70">{placeholder}</span>}
    </span>
  )
}
