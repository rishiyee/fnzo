"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

// Enhanced Card with hover effects and animations
export const EnhancedCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Card> & {
    variant?: "default" | "interactive" | "gradient" | "bordered" | "subtle"
    isActive?: boolean
    isDisabled?: boolean
    isNew?: boolean
    isHighlighted?: boolean
  }
>(({ className, variant = "default", isActive, isDisabled, isNew, isHighlighted, ...props }, ref) => {
  const baseStyles = "transition-all duration-200 overflow-hidden"

  const variantStyles = {
    default: "bg-card",
    interactive: "hover:shadow-md hover:translate-y-[-2px] cursor-pointer",
    gradient: "bg-gradient-to-br from-card to-background border-0",
    bordered: "border-2 border-primary/10",
    subtle: "bg-muted/50",
  }

  const stateStyles = cn(
    isActive && "ring-2 ring-primary/50",
    isDisabled && "opacity-60 pointer-events-none",
    isHighlighted && "bg-primary/5",
  )

  return (
    <Card ref={ref} className={cn(baseStyles, variantStyles[variant], stateStyles, className)} {...props}>
      {isNew && (
        <div className="absolute top-0 right-0">
          <Badge variant="default" className="m-2 bg-primary text-primary-foreground">
            New
          </Badge>
        </div>
      )}
      {props.children}
    </Card>
  )
})
EnhancedCard.displayName = "EnhancedCard"

// Enhanced Card Header with improved typography
export const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CardHeader> & {
    compact?: boolean
    withBorder?: boolean
  }
>(({ className, compact, withBorder, ...props }, ref) => {
  return (
    <CardHeader ref={ref} className={cn(compact ? "p-4" : "p-6", withBorder && "border-b", className)} {...props} />
  )
})
EnhancedCardHeader.displayName = "EnhancedCardHeader"

// Enhanced Card Title with improved typography
export const EnhancedCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof CardTitle> & {
    size?: "sm" | "md" | "lg"
    withGradient?: boolean
  }
>(({ className, size = "md", withGradient, ...props }, ref) => {
  const sizeStyles = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <CardTitle
      ref={ref}
      className={cn(
        sizeStyles[size],
        "font-semibold tracking-tight",
        withGradient && "bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60",
        className,
      )}
      {...props}
    />
  )
})
EnhancedCardTitle.displayName = "EnhancedCardTitle"

// Enhanced Card Description with improved typography
export const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof CardDescription> & {
    truncate?: boolean
  }
>(({ className, truncate, ...props }, ref) => {
  return (
    <CardDescription
      ref={ref}
      className={cn("text-muted-foreground mt-1.5", truncate && "line-clamp-2", className)}
      {...props}
    />
  )
})
EnhancedCardDescription.displayName = "EnhancedCardDescription"

// Enhanced Card Content with improved spacing
export const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CardContent> & {
    compact?: boolean
    withPadding?: boolean
  }
>(({ className, compact, withPadding = true, ...props }, ref) => {
  return (
    <CardContent
      ref={ref}
      className={cn(withPadding ? (compact ? "p-4" : "p-6") : "p-0", "pt-0", className)}
      {...props}
    />
  )
})
EnhancedCardContent.displayName = "EnhancedCardContent"

// Enhanced Card Footer with improved spacing
export const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CardFooter> & {
    compact?: boolean
    withBorder?: boolean
    alignEnd?: boolean
  }
>(({ className, compact, withBorder, alignEnd, ...props }, ref) => {
  return (
    <CardFooter
      ref={ref}
      className={cn(compact ? "p-4" : "p-6", withBorder && "border-t", alignEnd && "flex justify-end", className)}
      {...props}
    />
  )
})
EnhancedCardFooter.displayName = "EnhancedCardFooter"

// Animated Card for interactive elements
export const AnimatedCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Card> & {
    animateOnHover?: boolean
    animateOnView?: boolean
  }
>(({ className, animateOnHover, animateOnView, ...props }, ref) => {
  const hoverAnimation = {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  }

  const viewAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <motion.div
      ref={ref}
      className={cn("overflow-hidden", className)}
      initial={animateOnView ? "hidden" : undefined}
      whileInView={animateOnView ? "visible" : undefined}
      viewport={animateOnView ? { once: true, margin: "-100px" } : undefined}
      animate={animateOnView ? "visible" : undefined}
      variants={animateOnView ? viewAnimation : undefined}
      whileHover={animateOnHover ? "hover" : undefined}
      variants={animateOnHover ? hoverAnimation : undefined}
    >
      <Card className="h-full" {...props} />
    </motion.div>
  )
})
AnimatedCard.displayName = "AnimatedCard"

// Card with image header
export const ImageCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Card> & {
    imageSrc?: string
    imageAlt?: string
    imageHeight?: string
    overlay?: boolean
  }
>(({ className, imageSrc, imageAlt = "", imageHeight = "h-48", overlay, children, ...props }, ref) => {
  return (
    <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <div className="relative">
        <div className={cn("w-full overflow-hidden", imageHeight)}>
          {imageSrc ? (
            <img
              src={imageSrc || "/placeholder.svg"}
              alt={imageAlt}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className={cn("w-full bg-muted/50 flex items-center justify-center", imageHeight)}>
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        {overlay && <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />}
      </div>
      {children}
    </Card>
  )
})
ImageCard.displayName = "ImageCard"

// Stat Card for displaying metrics
export const StatCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Card> & {
    title: string
    value: string | number
    icon?: React.ReactNode
    trend?: {
      value: number
      isPositive: boolean
    }
    footer?: React.ReactNode
  }
>(({ className, title, value, icon, trend, footer, ...props }, ref) => {
  return (
    <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn("text-xs mt-1", trend.isPositive ? "text-green-500" : "text-red-500")}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </p>
        )}
      </CardContent>
      {footer && <CardFooter className="pt-0">{footer}</CardFooter>}
    </Card>
  )
})
StatCard.displayName = "StatCard"

// Grid Card Layout
export const CardGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    columns?: {
      sm?: number
      md?: number
      lg?: number
      xl?: number
    }
    gap?: "sm" | "md" | "lg"
  }
>(({ className, columns = { sm: 1, md: 2, lg: 3, xl: 4 }, gap = "md", ...props }, ref) => {
  const gapStyles = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid",
        `grid-cols-${columns.sm || 1}`,
        `sm:grid-cols-${columns.sm || 1}`,
        `md:grid-cols-${columns.md || 2}`,
        `lg:grid-cols-${columns.lg || 3}`,
        `xl:grid-cols-${columns.xl || 4}`,
        gapStyles[gap],
        className,
      )}
      {...props}
    />
  )
})
CardGrid.displayName = "CardGrid"
