"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}

export function FadeIn({ children, className, delay = 0, duration = 0.5 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface SlideInProps {
  children: React.ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  delay?: number
  duration?: number
}

export function SlideIn({
  children,
  className,
  direction = "up",
  distance = 20,
  delay = 0,
  duration = 0.5,
}: SlideInProps) {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directionMap[direction] }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggeredListProps {
  children: React.ReactNode[]
  className?: string
  itemClassName?: string
  staggerDelay?: number
  duration?: number
  initialDelay?: number
}

export function StaggeredList({
  children,
  className,
  itemClassName,
  staggerDelay = 0.1,
  duration = 0.5,
  initialDelay = 0,
}: StaggeredListProps) {
  return (
    <div className={className}>
      <AnimatePresence>
        {children.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration,
              delay: initialDelay + index * staggerDelay,
            }}
            className={itemClassName}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

interface HoverCardProps {
  children: React.ReactNode
  className?: string
  scale?: number
  shadow?: boolean
  lift?: boolean
  rotate?: number
}

export function HoverCard({
  children,
  className,
  scale = 1.02,
  shadow = true,
  lift = true,
  rotate = 0,
}: HoverCardProps) {
  return (
    <motion.div
      className={cn("transition-all duration-300", shadow && "hover:shadow-lg", className)}
      whileHover={{
        scale: scale,
        y: lift ? -5 : 0,
        rotate: rotate,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  )
}

interface PulseProps {
  children: React.ReactNode
  className?: string
  interval?: number
  scale?: number
}

export function Pulse({ children, className, interval = 2, scale = 1.05 }: PulseProps) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        duration: interval,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

interface FlipCardProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
  isFlipped?: boolean
  onFlip?: () => void
}

export function FlipCard({ front, back, className, isFlipped = false, onFlip }: FlipCardProps) {
  return (
    <div className={cn("relative perspective-1000 w-full h-full cursor-pointer", className)} onClick={onFlip}>
      <motion.div
        className="w-full h-full transition-all duration-500 preserve-3d relative"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute w-full h-full backface-hidden">{front}</div>
        <div className="absolute w-full h-full backface-hidden" style={{ transform: "rotateY(180deg)" }}>
          {back}
        </div>
      </motion.div>
    </div>
  )
}
