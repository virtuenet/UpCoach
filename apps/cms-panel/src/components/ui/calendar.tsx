import React, { useState, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Grid,
  Button,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightedDates?: Date[];
  className?: string;
  showToday?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  className,
  showToday = true,
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  const today = new Date();
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day));
  }

  const handlePreviousMonth = useCallback(() => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  }, [currentYear, currentMonth]);

  const handleNextMonth = useCallback(() => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  }, [currentYear, currentMonth]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    if (onDateSelect) {
      onDateSelect(today);
    }
  }, [onDateSelect]);

  const handleDateClick = useCallback((date: Date) => {
    if (isDateDisabled(date)) return;

    setCurrentDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  }, [onDateSelect]);

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some(disabled =>
      disabled.toDateString() === date.toDateString()
    );
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const isDateHighlighted = (date: Date): boolean => {
    return highlightedDates.some(highlighted =>
      highlighted.toDateString() === date.toDateString()
    );
  };

  const isToday = (date: Date): boolean => {
    return today.toDateString() === date.toDateString();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Paper
      className={className}
      sx={{
        p: 2,
        maxWidth: 350,
        width: '100%'
      }}
      elevation={2}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={handlePreviousMonth} size="small">
          <ChevronLeft />
        </IconButton>

        <Typography variant="h6" component="h2">
          {monthNames[currentMonth]} {currentYear}
        </Typography>

        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Today Button */}
      {showToday && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button
            size="small"
            startIcon={<Today />}
            onClick={handleToday}
            variant="outlined"
          >
            Today
          </Button>
        </Box>
      )}

      {/* Day Headers */}
      <Grid container spacing={0} sx={{ mb: 1 }}>
        {dayNames.map((day) => (
          <Grid item xs key={day} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.secondary,
                p: 1
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Grid container spacing={0}>
        {calendarDays.map((date, index) => (
          <Grid item xs key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
            {date ? (
              <Tooltip title={date.toLocaleDateString()}>
                <IconButton
                  size="small"
                  onClick={() => handleDateClick(date)}
                  disabled={isDateDisabled(date)}
                  sx={{
                    width: 36,
                    height: 36,
                    fontSize: '0.875rem',
                    backgroundColor: isDateSelected(date)
                      ? theme.palette.primary.main
                      : isDateHighlighted(date)
                      ? alpha(theme.palette.secondary.main, 0.2)
                      : 'transparent',
                    color: isDateSelected(date)
                      ? theme.palette.primary.contrastText
                      : isToday(date)
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    border: isToday(date) && !isDateSelected(date)
                      ? `2px solid ${theme.palette.primary.main}`
                      : 'none',
                    fontWeight: isToday(date) ? 600 : 400,
                    '&:hover': {
                      backgroundColor: isDateSelected(date)
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.1),
                    },
                    '&:disabled': {
                      color: theme.palette.text.disabled,
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  {date.getDate()}
                </IconButton>
              </Tooltip>
            ) : (
              <Box sx={{ width: 36, height: 36 }} />
            )}
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default Calendar;