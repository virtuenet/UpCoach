import * as React from "react"
import { Button } from "./button"

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  value,
  onChange,
  className = "",
}: DatePickerWithRangeProps) {
  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return date.toLocaleDateString()
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined
    onChange?.({
      from: newDate,
      to: value?.to,
    })
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined
    onChange?.({
      from: value?.from,
      to: newDate,
    })
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="date"
        value={value?.from ? value.from.toISOString().split('T')[0] : ''}
        onChange={handleFromChange}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <input
        type="date"
        value={value?.to ? value.to.toISOString().split('T')[0] : ''}
        onChange={handleToChange}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}