"use client"

import type React from "react"

import { forwardRef, memo } from "react"
import NextLink from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  activeClassName?: string
  exact?: boolean
}

const Link = memo(
  forwardRef<HTMLAnchorElement, LinkProps>(({ href, className, activeClassName, exact = true, ...props }, ref) => {
    const pathname = usePathname()
    const isActive = exact ? pathname === href : pathname.startsWith(href.toString())

    return (
      <NextLink
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
        // Prevent scroll restoration to avoid layout shifts
        scroll={false}
      />
    )
  }),
)
Link.displayName = "Link"

export { Link }
