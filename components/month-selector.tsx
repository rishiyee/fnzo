"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, addMonths, subMonths, startOfMonth, isSameMonth } from "date-fns"

interface MonthSelectorProps {
  selectedMonth: Date
  onChange: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}

export function MonthSelector({ selectedMonth, onChange, minDate, maxDate }: MonthSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handlePreviousMonth = () => {
    onChange(subMonths(selectedMonth, 1))
  }

  const handleNextMonth = () => {
    onChange(addMonths(selectedMonth, 1))
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(startOfMonth(date))
      setCalendarOpen(false)
    }
  }

  // Check if previous/next buttons should be disabled
  const isPreviousDisabled = minDate ? startOfMonth(selectedMonth) <= startOfMonth(minDate) : false
  const isNextDisabled = maxDate ? startOfMonth(selectedMonth) >= startOfMonth(maxDate) : false

  // Custom calendar render function to show only month view
  const renderCalendarCaption = ({ date, locale }: { date: Date; locale?: string }) => {
    return <div className="flex justify-center py-2 font-medium">{format(date, "MMMM yyyy", { locale })}</div>
  }

  return (
    <div className="flex items-center justify-between bg-card border rounded-lg p-3 mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        disabled={isPreviousDisabled}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[150px] font-medium">
            {format(selectedMonth, "MMMM yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedMonth}
            onSelect={handleCalendarSelect}
            initialFocus
            captionLayout="dropdown-buttons"
            fromMonth={minDate}
            toMonth={maxDate}
            showOutsideDays={false}
            ISOWeek
            disabled={(date) => {
              // Only allow selecting the first day of each month
              return !isSameMonth(date, startOfMonth(date))
            }}
          />
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isNextDisabled} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
