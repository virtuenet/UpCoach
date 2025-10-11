import React, { useState, useCallback, useRef } from 'react';
import {
  TextField,
  Popover,
  Box,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  Clear,
  DateRange,
  Today,
} from '@mui/icons-material';
import Calendar from './calendar';

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightedDates?: Date[];
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  required?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  showShortcuts?: boolean;
}

interface DateRangePickerProps extends Omit<DatePickerProps, 'value' | 'onChange'> {
  value?: [Date | null, Date | null];
  onChange?: (range: [Date | null, Date | null]) => void;
  rangeSeparator?: string;
}

const formatDate = (date: Date | null, format: string = 'MM/dd/yyyy'): string => {
  if (!date) return '';

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();

  return format
    .replace('MM', month)
    .replace('dd', day)
    .replace('yyyy', year.toString())
    .replace('yy', year.toString().slice(-2));
};

const parseDate = (dateString: string, format: string = 'MM/dd/yyyy'): Date | null => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  format = 'MM/dd/yyyy',
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  error = false,
  helperText,
  fullWidth = false,
  disabled = false,
  clearable = true,
  required = false,
  variant = 'outlined',
  size = 'medium',
  showShortcuts = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [inputValue, setInputValue] = useState(formatDate(value, format));
  const textFieldRef = useRef<HTMLInputElement>(null);

  const open = Boolean(anchorEl);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setInputValue(formatDate(date, format));
    if (onChange) {
      onChange(date);
    }
    handleClose();
  }, [onChange, format, handleClose]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    const parsedDate = parseDate(newValue, format);
    if (parsedDate && onChange) {
      onChange(parsedDate);
    }
  }, [format, onChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    if (onChange) {
      onChange(null);
    }
  }, [onChange]);

  const handleShortcut = useCallback((date: Date) => {
    handleDateSelect(date);
  }, [handleDateSelect]);

  const shortcuts = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { label: 'Next Month', date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()) },
  ];

  return (
    <>
      <TextField
        ref={textFieldRef}
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onClick={handleOpen}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        disabled={disabled}
        required={required}
        variant={variant}
        size={size}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <CalendarToday fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: clearable && inputValue && !disabled && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
                aria-label="Clear date"
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
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
          {showShortcuts && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quick Select
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                {shortcuts.map((shortcut) => (
                  <Chip
                    key={shortcut.label}
                    label={shortcut.label}
                    size="small"
                    onClick={() => handleShortcut(shortcut.date)}
                    variant="outlined"
                  />
                ))}
              </Stack>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          <Calendar
            selectedDate={value || undefined}
            onDateSelect={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            highlightedDates={highlightedDates}
            showToday={false}
          />
        </Box>
      </Popover>
    </>
  );
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = [null, null],
  onChange,
  label,
  placeholder = 'Select date range',
  format = 'MM/dd/yyyy',
  rangeSeparator = ' - ',
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  error = false,
  helperText,
  fullWidth = false,
  disabled = false,
  clearable = true,
  required = false,
  variant = 'outlined',
  size = 'medium',
  showShortcuts = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [startDate, endDate] = value;
  const [selectingStart, setSelectingStart] = useState(true);

  const displayValue = startDate && endDate
    ? `${formatDate(startDate, format)}${rangeSeparator}${formatDate(endDate, format)}`
    : startDate
    ? formatDate(startDate, format)
    : '';

  const open = Boolean(anchorEl);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
      setSelectingStart(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    if (selectingStart) {
      if (onChange) {
        onChange([date, null]);
      }
      setSelectingStart(false);
    } else {
      const newStartDate = startDate || date;
      const newEndDate = date;

      // Ensure start date is before end date
      const finalStartDate = newStartDate <= newEndDate ? newStartDate : newEndDate;
      const finalEndDate = newStartDate <= newEndDate ? newEndDate : newStartDate;

      if (onChange) {
        onChange([finalStartDate, finalEndDate]);
      }
      handleClose();
    }
  }, [selectingStart, startDate, onChange, handleClose]);

  const handleClear = useCallback(() => {
    if (onChange) {
      onChange([null, null]);
    }
    setSelectingStart(true);
  }, [onChange]);

  const rangeShortcuts = [
    { label: 'Last 7 days', range: [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), new Date()] },
    { label: 'Last 30 days', range: [new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), new Date()] },
    { label: 'This month', range: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
    { label: 'Last month', range: [
      new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    ]},
  ];

  const handleRangeShortcut = useCallback((range: Date[]) => {
    if (onChange) {
      onChange([range[0], range[1]]);
    }
    handleClose();
  }, [onChange, handleClose]);

  return (
    <>
      <TextField
        label={label}
        placeholder={placeholder}
        value={displayValue}
        onClick={handleOpen}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        disabled={disabled}
        required={required}
        variant={variant}
        size={size}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <DateRange fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: clearable && displayValue && !disabled && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
                aria-label="Clear date range"
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
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
          {showShortcuts && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quick Select
              </Typography>
              <Stack direction="column" spacing={1} sx={{ mb: 2, minWidth: 120 }}>
                {rangeShortcuts.map((shortcut) => (
                  <Button
                    key={shortcut.label}
                    size="small"
                    onClick={() => handleRangeShortcut(shortcut.range)}
                    variant="outlined"
                    fullWidth
                  >
                    {shortcut.label}
                  </Button>
                ))}
              </Stack>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {selectingStart ? 'Select start date' : 'Select end date'}
            </Typography>
          </Box>

          <Calendar
            selectedDate={selectingStart ? startDate || undefined : endDate || undefined}
            onDateSelect={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            highlightedDates={[
              ...highlightedDates,
              ...(startDate && !selectingStart ? [startDate] : [])
            ]}
            showToday={false}
          />
        </Box>
      </Popover>
    </>
  );
};

export { DatePicker as default, DateRangePicker };