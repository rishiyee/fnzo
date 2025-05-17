import React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva("transition-all duration-300 overflow-hidden relative group", {
  variants: {
    variant: {
      default: "border bg-card text-card-foreground shadow-sm hover:shadow-md",
      accent: "border-l-4 bg-card text-card-foreground shadow-sm hover:shadow-md",
      elevated: "border bg-card text-card-foreground shadow-md hover:shadow-lg",
      glass:
        "bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 shadow-lg hover:shadow-xl",
      outline: "border-2 bg-transparent hover:bg-card/5",
      ghost: "bg-transparent hover:bg-muted/50 shadow-none border-none",
    },
    size: {
      sm: "p-2",
      default: "",
      lg: "p-6",
    },
    animation: {
      none: "",
      subtle: "hover:translate-y-[-2px]",
      raise: "hover:translate-y-[-5px]",
      glow: "hover:shadow-[0_0_15px_rgba(var(--card-glow-rgb),0.5)]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    animation: "subtle",
  },
})

export interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  accentColor?: string
  glowColor?: string
  hoverEffect?: boolean
  isActive?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  cornerBadge?: React.ReactNode
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      accentColor,
      glowColor,
      hoverEffect = true,
      isActive = false,
      isDisabled = false,
      isLoading = false,
      cornerBadge,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    // Generate custom styles based on props
    const customStyles: React.CSSProperties = {
      ...style,
    }

    // Handle accent color for accent variant
    if (variant === "accent" && accentColor) {
      customStyles.borderLeftColor = accentColor
    }

    // Handle glow color for glow animation
    if (animation === "glow" && glowColor) {
      customStyles["--card-glow-rgb"] = glowColor
        .replace("rgb(", "")
        .replace(")", "")
        .replace("#", "")
        .match(/.{1,2}/g)
        ?.map((x) => Number.parseInt(x, 16))
        .join(",")
    }

    return (
      <Card
        ref={ref}
        className={cn(
          cardVariants({ variant, size, animation }),
          isActive && "ring-2 ring-primary",
          isDisabled && "opacity-60 pointer-events-none",
          hoverEffect && "hover:border-primary/50",
          className,
        )}
        style={customStyles}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-card/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
        {cornerBadge && <div className="absolute top-0 right-0 z-10 m-2">{cornerBadge}</div>}
        {children}
      </Card>
    )
  },
)
EnhancedCard.displayName = "EnhancedCard"

// Enhanced versions of Card subcomponents
const EnhancedCardHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof CardHeader>>(
  ({ className, ...props }, ref) => <CardHeader ref={ref} className={cn("pb-3", className)} {...props} />,
)
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof CardTitle>>(
  ({ className, ...props }, ref) => (
    <CardTitle ref={ref} className={cn("text-lg font-semibold tracking-tight", className)} {...props} />
  ),
)
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof CardDescription>
>(({ className, ...props }, ref) => (
  <CardDescription ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof CardContent>>(
  ({ className, ...props }, ref) => <CardContent ref={ref} className={cn("pt-0", className)} {...props} />,
)
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof CardFooter>>(
  ({ className, ...props }, ref) => (
    <CardFooter
      ref={ref}
      className={cn("flex items-center pt-3 opacity-0 group-hover:opacity-100 transition-opacity", className)}
      {...props}
    />
  ),
)
EnhancedCardFooter.displayName = "EnhancedCardFooter"

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
}
