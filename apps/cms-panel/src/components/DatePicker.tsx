/**
 * DatePicker Component for CMS Panel
 * Features:
 * - Single date and date range selection
 * - Multiple date formats
 * - Time selection (optional)
 * - Keyboard navigation
 * - Accessibility compliant
 * - Integration with forms
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
  Popover,
  FormControl,
  FormHelperText,
} from '@mui/material';
import { FormLabel, ButtonGroup, Divider } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  CalendarMonth,
  AccessTime,
  Clear,
  Check,
} from '@mui/icons-material';

// Types
export interface DatePickerProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  format?: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MMM dd, yyyy';
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  showTime?: boolean;
  readOnly?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
  className?: string;
}

export interface DateRangePickerProps {
  value?: { start: Date | null; end: Date | null };
  defaultValue?: { start: Date | null; end: Date | null };
  onChange?: (range: { start: Date | null; end: Date | null }) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  format?: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MMM dd, yyyy';
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  maxRange?: number; // Days
  readOnly?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
  className?: string;
}

// Date utilities
const formatDate = (date: Date, format: string): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const padZero = (num: number) => num.toString().padStart(2, '0');

  switch (format) {
    case 'MM/dd/yyyy':
      return `${padZero(month)}/${padZero(day)}/${year}`;
    case 'dd/MM/yyyy':
      return `${padZero(day)}/${padZero(month)}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${padZero(month)}-${padZero(day)}`;
    case 'MMM dd, yyyy':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    default:
      return date.toLocaleDateString();
  }
};

const parseDate = (dateString: string, format: string): Date | null => {
  if (!dateString.trim()) return null;

  try {
    let day: number, month: number, year: number;

    switch (format) {
      case 'MM/dd/yyyy':
        const mmddyyyy = dateString.split('/');
        if (mmddyyyy.length !== 3) return null;
        [month, day, year] = mmddyyyy.map(Number);
        break;
      case 'dd/MM/yyyy':
        const ddmmyyyy = dateString.split('/');
        if (ddmmyyyy.length !== 3) return null;
        [day, month, year] = ddmmyyyy.map(Number);
        break;
      case 'yyyy-MM-dd':
        const yyyymmdd = dateString.split('-');
        if (yyyymmdd.length !== 3) return null;
        [year, month, day] = yyyymmdd.map(Number);
        break;
      default:
        return new Date(dateString);
    }

    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const getMonthDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: Date[] = [];

  // Add previous month's trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Add next month's leading days
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
};

const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const isDateDisabled = (
  date: Date,
  minDate?: Date,
  maxDate?: Date,
  disablePast?: boolean,
  disableFuture?: boolean
): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);

  if (minDate && dateToCheck < minDate) return true;
  if (maxDate && dateToCheck > maxDate) return true;
  if (disablePast && dateToCheck < today) return true;
  if (disableFuture && dateToCheck > today) return true;

  return false;
};

// Calendar component for date selection
interface CalendarProps {
  selectedDate?: Date | null;
  selectedRange?: { start: Date | null; end: Date | null };
  onDateClick: (date: Date) => void;
  isRangeMode?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
}

const CalendarGrid: React.FC<CalendarProps> = ({
  selectedDate,
  selectedRange,
  onDateClick,
  isRangeMode = false,
  minDate,
  maxDate,
  disablePast,
  disableFuture,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const theme = useTheme();

  const monthDays = useMemo(() => {
    return getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    onDateClick(today);
  }, [onDateClick]);

  const isDateInRange = (date: Date): boolean => {
    if (!isRangeMode || !selectedRange?.start || !selectedRange?.end) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isRangeStart = (date: Date): boolean => {
    return isRangeMode && selectedRange?.start ? isSameDay(date, selectedRange.start) : false;
  };

  const isRangeEnd = (date: Date): boolean => {
    return isRangeMode && selectedRange?.end ? isSameDay(date, selectedRange.end) : false;
  };

  return (
    <Box sx={{ p: 2, minWidth: 320 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6">
          {currentMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </Typography>
        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Today button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Button onClick={handleToday} size="small" startIcon={<Today />}>
          Today
        </Button>
      </Box>

      {/* Week days */}
      <Grid container sx={{ mb: 1 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Grid item xs key={index}>
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 1,
                fontWeight: 'medium',
                color: 'text.secondary',
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar days */}
      <Grid container>
        {monthDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isSelected = !isRangeMode ? isSameDay(date, selectedDate) : false;
          const isInRange = isDateInRange(date);
          const isStartDate = isRangeStart(date);
          const isEndDate = isRangeEnd(date);
          const isDisabled = isDateDisabled(date, minDate, maxDate, disablePast, disableFuture);
          const isToday = isSameDay(date, new Date());

          return (
            <Grid item xs key={index}>
              <Box
                onClick={() => !isDisabled && onDateClick(date)}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 36,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  borderRadius: 1,
                  color: isCurrentMonth ? 'text.primary' : 'text.secondary',
                  backgroundColor: isSelected || isStartDate || isEndDate
                    ? 'primary.main'
                    : isInRange
                    ? alpha(theme.palette.primary.main, 0.2)
                    : isToday
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  color: isSelected || isStartDate || isEndDate ? 'primary.contrastText' : undefined,
                  opacity: isDisabled ? 0.4 : 1,
                  '&:hover': !isDisabled ? {
                    backgroundColor: isSelected || isStartDate || isEndDate
                      ? 'primary.dark'
                      : alpha(theme.palette.primary.main, 0.1),
                  } : {},
                  transition: 'all 0.2s',
                }}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-label={`Select ${date.toLocaleDateString()}`}
                aria-selected={isSelected || isStartDate || isEndDate}
                aria-disabled={isDisabled}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                    e.preventDefault();
                    onDateClick(date);
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                  {date.getDate()}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// Single DatePicker Component
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Select date',
  helperText,
  error = false,
  disabled = false,
  required = false,
  format = 'MM/dd/yyyy',
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  showTime = false,
  readOnly = false,
  size = 'medium',
  variant = 'outlined',
  fullWidth = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue || null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : internalValue;

  useEffect(() => {
    setInputValue(currentValue ? formatDate(currentValue, format) : '');
  }, [currentValue, format]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    const parsedDate = parseDate(newValue, format);
    if (parsedDate && !isDateDisabled(parsedDate, minDate, maxDate, disablePast, disableFuture)) {
      const finalValue = parsedDate;
      setInternalValue(finalValue);
      onChange?.(finalValue);
    } else if (newValue === '') {
      setInternalValue(null);
      onChange?.(null);
    }
  }, [format, minDate, maxDate, disablePast, disableFuture, onChange]);

  const handleDateClick = useCallback((date: Date) => {
    const finalValue = showTime && currentValue
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                  currentValue.getHours(), currentValue.getMinutes())
      : date;

    setInternalValue(finalValue);
    onChange?.(finalValue);
    setOpen(false);
  }, [showTime, currentValue, onChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setInternalValue(null);
    onChange?.(null);
  }, [onChange]);

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      disabled={disabled}
      required={required}
      className={className}
    >
      {label && <FormLabel>{label}</FormLabel>}
      <TextField
        ref={anchorRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        size={size}
        variant={variant}
        disabled={disabled}
        error={error}
        fullWidth={fullWidth}
        InputProps={{
          readOnly: readOnly,
          endAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {currentValue && !readOnly && !disabled && (
                <IconButton size="small" onClick={handleClear} aria-label="Clear date">
                  <Clear fontSize="small" />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={() => !disabled && !readOnly && setOpen(true)}
                aria-label="Open calendar"
                disabled={disabled || readOnly}
              >
                <CalendarMonth fontSize="small" />
              </IconButton>
            </Box>
          ),
        }}
        onFocus={() => !readOnly && setOpen(true)}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <CalendarGrid
          selectedDate={currentValue}
          onDateClick={handleDateClick}
          minDate={minDate}
          maxDate={maxDate}
          disablePast={disablePast}
          disableFuture={disableFuture}
        />
      </Popover>
    </FormControl>
  );
};

// DateRangePicker Component
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Select date range',
  helperText,
  error = false,
  disabled = false,
  required = false,
  format = 'MM/dd/yyyy',
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  maxRange,
  readOnly = false,
  size = 'medium',
  variant = 'outlined',
  fullWidth = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || { start: null, end: null });
  const [selectingEnd, setSelectingEnd] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : internalValue;

  const displayValue = useMemo(() => {
    if (currentValue.start && currentValue.end) {
      return `${formatDate(currentValue.start, format)} - ${formatDate(currentValue.end, format)}`;
    } else if (currentValue.start) {
      return formatDate(currentValue.start, format);
    }
    return '';
  }, [currentValue, format]);

  const handleDateClick = useCallback((date: Date) => {
    if (!selectingEnd && !currentValue.start) {
      // First selection
      const newValue = { start: date, end: null };
      setInternalValue(newValue);
      onChange?.(newValue);
      setSelectingEnd(true);
    } else if (selectingEnd && currentValue.start && !currentValue.end) {
      // Second selection
      const start = currentValue.start;
      const end = date;

      // Ensure start is before end
      const orderedRange = start <= end
        ? { start, end }
        : { start: end, end: start };

      // Check max range constraint
      if (maxRange) {
        const daysDiff = Math.abs((orderedRange.end.getTime() - orderedRange.start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > maxRange) {
          return; // Don't select if exceeds max range
        }
      }

      setInternalValue(orderedRange);
      onChange?.(orderedRange);
      setSelectingEnd(false);
      setOpen(false);
    } else {
      // Reset and start new selection
      const newValue = { start: date, end: null };
      setInternalValue(newValue);
      onChange?.(newValue);
      setSelectingEnd(true);
    }
  }, [selectingEnd, currentValue.start, currentValue.end, maxRange, onChange]);

  const handleClear = useCallback(() => {
    const clearedValue = { start: null, end: null };
    setInternalValue(clearedValue);
    onChange?.(clearedValue);
    setSelectingEnd(false);
  }, [onChange]);

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      disabled={disabled}
      required={required}
      className={className}
    >
      {label && <FormLabel>{label}</FormLabel>}
      <TextField
        ref={anchorRef}
        value={displayValue}
        placeholder={placeholder}
        size={size}
        variant={variant}
        disabled={disabled}
        error={error}
        fullWidth={fullWidth}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {(currentValue.start || currentValue.end) && !readOnly && !disabled && (
                <IconButton size="small" onClick={handleClear} aria-label="Clear date range">
                  <Clear fontSize="small" />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={() => !disabled && !readOnly && setOpen(true)}
                aria-label="Open calendar"
                disabled={disabled || readOnly}
              >
                <CalendarMonth fontSize="small" />
              </IconButton>
            </Box>
          ),
        }}
        onClick={() => !disabled && !readOnly && setOpen(true)}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => {
          setOpen(false);
          setSelectingEnd(false);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectingEnd ? 'Select end date' : 'Select start date'}
          </Typography>
          <CalendarGrid
            selectedRange={currentValue}
            onDateClick={handleDateClick}
            isRangeMode
            minDate={minDate}
            maxDate={maxDate}
            disablePast={disablePast}
            disableFuture={disableFuture}
          />
        </Box>
      </Popover>
    </FormControl>
  );
};

export default DatePicker;