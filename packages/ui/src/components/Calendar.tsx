import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  description?: string;
}

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  disabledDates?: Date[];
  highlightedDates?: Date[];
  showWeekNumbers?: boolean;
  showAdjacentMonths?: boolean;
  firstDayOfWeek?: 0 | 1; // 0 = Sunday, 1 = Monday
  locale?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'full';
  showEventIndicators?: boolean;
  allowMultipleSelection?: boolean;
  selectedDates?: Date[];
  onMultipleSelect?: (dates: Date[]) => void;
}

// Helper function to get days in a month
const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Helper function to get the first day of the month
const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Helper function to format month and year
const formatMonthYear = (date: Date, locale: string = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric'
  }).format(date);
};

// Helper function to get weekday names
const getWeekdayNames = (firstDayOfWeek: 0 | 1 = 0, locale: string = 'en-US', short: boolean = true): string[] => {
  const baseDate = new Date(2024, 0, firstDayOfWeek === 0 ? 7 : 1); // Start from Sunday or Monday
  const weekdays = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() + i);
    weekdays.push(
      new Intl.DateTimeFormat(locale, {
        weekday: short ? 'short' : 'long'
      }).format(day)
    );
  }

  return weekdays;
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Helper function to check if date is in range
const isDateInRange = (date: Date, minDate?: Date, maxDate?: Date): boolean => {
  if (minDate && date < minDate) return false;
  if (maxDate && date > maxDate) return false;
  return true;
};

// Helper function to check if date is disabled
const isDateDisabled = (date: Date, disabledDates?: Date[]): boolean => {
  if (!disabledDates) return false;
  return disabledDates.some(disabled => isSameDay(date, disabled));
};

export const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  events = [],
  onEventClick,
  minDate,
  maxDate,
  disabled = false,
  disabledDates = [],
  highlightedDates = [],
  showWeekNumbers = false,
  showAdjacentMonths = true,
  firstDayOfWeek = 0,
  locale = 'en-US',
  className,
  variant = 'default',
  showEventIndicators = true,
  allowMultipleSelection = false,
  selectedDates = [],
  onMultipleSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);
  const [multipleSelectedDates, setMultipleSelectedDates] = useState<Date[]>(selectedDates);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  // Refs for keyboard navigation
  const calendarRef = useRef<HTMLDivElement>(null);
  const monthYearButtonRef = useRef<HTMLButtonElement>(null);

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setCurrentMonth(value);
    }
  }, [value]);

  // Update multiple selected dates when prop changes
  useEffect(() => {
    setMultipleSelectedDates(selectedDates);
  }, [selectedDates]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    return events.filter(event => isSameDay(event.date, date));
  }, [events]);

  // Check if date has events
  const hasEvents = useCallback((date: Date): boolean => {
    return getEventsForDate(date).length > 0;
  }, [getEventsForDate]);

  // Handle date selection
  const handleDateClick = useCallback((date: Date) => {
    if (disabled) return;
    if (!isDateInRange(date, minDate, maxDate)) return;
    if (isDateDisabled(date, disabledDates)) return;

    if (allowMultipleSelection) {
      const isSelected = multipleSelectedDates.some(d => isSameDay(d, date));
      const newDates = isSelected
        ? multipleSelectedDates.filter(d => !isSameDay(d, date))
        : [...multipleSelectedDates, date];

      setMultipleSelectedDates(newDates);
      onMultipleSelect?.(newDates);
    } else {
      setSelectedDate(date);
      onChange?.(date);
    }
  }, [disabled, minDate, maxDate, disabledDates, allowMultipleSelection, multipleSelectedDates, onChange, onMultipleSelect]);

  // Navigate months
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + (direction === 'prev' ? -1 : 1));
      return newMonth;
    });
  }, []);

  // Navigate to today
  const navigateToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    if (!allowMultipleSelection) {
      setSelectedDate(today);
      onChange?.(today);
    }
    setFocusedDate(today);
  }, [allowMultipleSelection, onChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!focusedDate) {
      setFocusedDate(selectedDate || new Date());
      return;
    }

    const newDate = new Date(focusedDate);
    let shouldPreventDefault = true;

    switch (e.key) {
      case 'ArrowLeft':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'ArrowRight':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'ArrowUp':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'ArrowDown':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'Enter':
      case ' ':
        handleDateClick(focusedDate);
        break;
      case 'Home':
        newDate.setDate(1);
        break;
      case 'End':
        newDate.setDate(getDaysInMonth(newDate));
        break;
      case 'PageUp':
        if (e.shiftKey) {
          newDate.setFullYear(newDate.getFullYear() - 1);
        } else {
          newDate.setMonth(newDate.getMonth() - 1);
        }
        break;
      case 'PageDown':
        if (e.shiftKey) {
          newDate.setFullYear(newDate.getFullYear() + 1);
        } else {
          newDate.setMonth(newDate.getMonth() + 1);
        }
        break;
      case 'Escape':
        setFocusedDate(null);
        monthYearButtonRef.current?.focus();
        break;
      default:
        shouldPreventDefault = false;
    }

    if (shouldPreventDefault) {
      e.preventDefault();
      setFocusedDate(newDate);

      // Update current month if focused date is outside current month
      if (newDate.getMonth() !== currentMonth.getMonth() ||
          newDate.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(newDate);
      }
    }
  }, [focusedDate, selectedDate, currentMonth, handleDateClick]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = getFirstDayOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const daysInPrevMonth = getDaysInMonth(new Date(year, month - 1));

    // Adjust for first day of week preference
    const startPadding = (firstDay - firstDayOfWeek + 7) % 7;

    // Add days from previous month
    if (showAdjacentMonths) {
      for (let i = startPadding - 1; i >= 0; i--) {
        days.push(new Date(year, month - 1, daysInPrevMonth - i));
      }
    } else {
      for (let i = 0; i < startPadding; i++) {
        days.push(null);
      }
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    if (showAdjacentMonths) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }
    } else {
      for (let i = 0; i < remainingDays; i++) {
        days.push(null);
      }
    }

    return days;
  }, [currentMonth, firstDayOfWeek, showAdjacentMonths]);

  // Get calendar weeks for week number display
  const calendarWeeks = useMemo(() => {
    const weeks: number[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekDays = calendarDays.slice(i, i + 7);
      const firstValidDay = weekDays.find(day => day !== null);
      if (firstValidDay) {
        weeks.push(getWeekNumber(firstValidDay));
      }
    }
    return weeks;
  }, [calendarDays]);

  const weekdayNames = useMemo(() => getWeekdayNames(firstDayOfWeek, locale, variant === 'compact'),
    [firstDayOfWeek, locale, variant]);

  const isToday = (date: Date): boolean => isSameDay(date, new Date());

  const isSelected = (date: Date): boolean => {
    if (allowMultipleSelection) {
      return multipleSelectedDates.some(d => isSameDay(d, date));
    }
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  const isHighlighted = (date: Date): boolean => {
    return highlightedDates.some(highlighted => isSameDay(date, highlighted));
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth() &&
           date.getFullYear() === currentMonth.getFullYear();
  };

  const isFocused = (date: Date): boolean => {
    return focusedDate ? isSameDay(date, focusedDate) : false;
  };

  return (
    <div
      ref={calendarRef}
      className={clsx(
        'w-full bg-white rounded-lg shadow-sm border border-gray-200',
        variant === 'compact' && 'text-sm',
        variant === 'full' && 'text-base',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      role="application"
      aria-label="Calendar"
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous month"
          disabled={disabled}
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <button
          ref={monthYearButtonRef}
          type="button"
          className="text-lg font-semibold text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={navigateToToday}
          aria-label={`Current month: ${formatMonthYear(currentMonth, locale)}. Click to go to today`}
          aria-live="polite"
        >
          {formatMonthYear(currentMonth, locale)}
        </button>

        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next month"
          disabled={disabled}
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div
          className={clsx(
            'grid gap-1',
            showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'
          )}
          role="grid"
          aria-label="Calendar dates"
        >
          {/* Week day headers */}
          {showWeekNumbers && (
            <div className="text-xs font-medium text-gray-500 text-center p-2" aria-label="Week number column">
              Wk
            </div>
          )}
          {weekdayNames.map((day, index) => (
            <div
              key={index}
              className="text-xs font-medium text-gray-500 text-center p-2"
              role="columnheader"
              aria-label={day}
            >
              {variant === 'compact' ? day.slice(0, 2) : day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            // Add week number at the start of each week
            if (showWeekNumbers && index % 7 === 0) {
              const weekIndex = Math.floor(index / 7);
              return (
                <React.Fragment key={`week-${weekIndex}`}>
                  <div
                    className="text-xs text-gray-400 text-center p-2"
                    role="rowheader"
                    aria-label={`Week ${calendarWeeks[weekIndex]}`}
                  >
                    {calendarWeeks[weekIndex]}
                  </div>
                  {renderDateCell(date, index)}
                </React.Fragment>
              );
            }
            return renderDateCell(date, index);
          })}
        </div>

        {/* Today button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={navigateToToday}
            className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go to today"
            disabled={disabled}
          >
            <CalendarIcon className="inline-block w-4 h-4 mr-2" />
            Today
          </button>
        </div>
      </div>
    </div>
  );

  function renderDateCell(date: Date | null, index: number) {
    if (!date) {
      return <div key={index} className="p-2" aria-hidden="true" />;
    }

    const dateIsDisabled = !isDateInRange(date, minDate, maxDate) || isDateDisabled(date, disabledDates);
    const dateIsToday = isToday(date);
    const dateIsSelected = isSelected(date);
    const dateIsHighlighted = isHighlighted(date);
    const dateIsCurrentMonth = isCurrentMonth(date);
    const dateIsFocused = isFocused(date);
    const dateHasEvents = showEventIndicators && hasEvents(date);
    const dateEvents = getEventsForDate(date);

    return (
      <div
        key={index}
        className="relative"
        role="gridcell"
        aria-selected={dateIsSelected}
        aria-disabled={dateIsDisabled}
        aria-current={dateIsToday ? 'date' : undefined}
      >
        <button
          type="button"
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
          onFocus={() => setFocusedDate(date)}
          disabled={dateIsDisabled || disabled}
          className={clsx(
            'relative w-full p-2 text-sm rounded-md transition-all duration-150',
            'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
            dateIsCurrentMonth ? 'text-gray-900' : 'text-gray-400',
            dateIsToday && 'font-bold text-blue-600',
            dateIsSelected && 'bg-blue-600 text-white hover:bg-blue-700',
            dateIsHighlighted && !dateIsSelected && 'bg-yellow-50 text-yellow-900',
            dateIsFocused && 'ring-2 ring-blue-500 ring-inset',
            variant === 'compact' && 'p-1 text-xs',
            variant === 'full' && 'p-3 text-base'
          )}
          aria-label={`${date.toLocaleDateString(locale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}${dateHasEvents ? `, ${dateEvents.length} event${dateEvents.length > 1 ? 's' : ''}` : ''}`}
          tabIndex={-1}
        >
          <span className="relative z-10">{date.getDate()}</span>

          {/* Event indicators */}
          {dateHasEvents && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {dateEvents.slice(0, 3).map((event, i) => (
                <div
                  key={event.id || i}
                  className={clsx(
                    'w-1 h-1 rounded-full',
                    event.type === 'primary' && 'bg-blue-500',
                    event.type === 'success' && 'bg-green-500',
                    event.type === 'warning' && 'bg-yellow-500',
                    event.type === 'danger' && 'bg-red-500',
                    event.type === 'info' && 'bg-gray-500',
                    !event.type && 'bg-blue-500'
                  )}
                  aria-hidden="true"
                />
              ))}
              {dateEvents.length > 3 && (
                <span className="text-xs text-gray-500" aria-hidden="true">+</span>
              )}
            </div>
          )}
        </button>

        {/* Event tooltip on hover */}
        {hoveredDate && isSameDay(hoveredDate, date) && dateHasEvents && (
          <div
            className="absolute z-50 top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-md py-1 px-2 whitespace-nowrap pointer-events-none"
            role="tooltip"
          >
            {dateEvents.map((event, i) => (
              <div key={event.id || i} className="py-0.5">
                {event.startTime && <span className="text-gray-300">{event.startTime} - </span>}
                {event.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};

Calendar.displayName = 'Calendar';