import React from "react";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DatePickerWithRangeProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  value,
  onChange,
  className = "",
}: DatePickerWithRangeProps) {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    onChange?.({
      from: newDate,
      to: value?.to,
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    onChange?.({
      from: value?.from,
      to: newDate,
    });
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="date"
        value={formatDateForInput(value?.from)}
        onChange={handleFromChange}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-gray-500">to</span>
      <input
        type="date"
        value={formatDateForInput(value?.to)}
        onChange={handleToChange}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
