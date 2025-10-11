/**
 * Calendar Component for CMS Panel
 * Features:
 * - Month/week/day views
 * - Event management
 * - Date selection and navigation
 * - Responsive design
 * - Accessibility compliant
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
} from '@mui/icons-material';

// Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  color?: string;
  category?: string;
  isAllDay?: boolean;
}

export interface CalendarProps {
  events?: CalendarEvent[];
  selectedDate?: Date;
  view?: 'month' | 'week' | 'day';
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  readOnly?: boolean;
  className?: string;
}

// Calendar utilities
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

const getWeekDays = (date: Date): Date[] => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
  }
  return days;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const Calendar: React.FC<CalendarProps> = ({
  events = [],
  selectedDate = new Date(),
  view = 'month',
  onDateSelect,
  onEventClick,
  onEventCreate,
  onViewChange,
  readOnly = false,
  className,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentView, setCurrentView] = useState(view);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      return newDate;
    });
  }, [currentView]);

  const handleNext = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    });
  }, [currentView]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleViewChange = useCallback((newView: 'month' | 'week' | 'day') => {
    setCurrentView(newView);
    onViewChange?.(newView);
  }, [onViewChange]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDay(date);
    onDateSelect?.(date);
  }, [onDateSelect]);

  const handleEventClick = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  }, [onEventClick]);

  const handleCreateEvent = useCallback((date: Date) => {
    if (!readOnly) {
      onEventCreate?.(date);
    }
  }, [readOnly, onEventCreate]);

  // Get events for a specific day
  const getEventsForDay = useCallback((date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      // Check if date falls within event range
      return date >= eventStart && date <= eventEnd;
    });
  }, [events]);

  // Get display title
  const displayTitle = useMemo(() => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else if (currentView === 'week') {
      const weekDays = getWeekDays(currentDate);
      const startDate = weekDays[0];
      const endDate = weekDays[6];
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
      } else {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.getFullYear()}`;
      }
    } else {
      return formatDate(currentDate);
    }
  }, [currentDate, currentView]);

  // Get days to render based on view
  const daysToRender = useMemo(() => {
    if (currentView === 'month') {
      return getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    } else if (currentView === 'week') {
      return getWeekDays(currentDate);
    } else {
      return [currentDate];
    }
  }, [currentDate, currentView]);

  // Render day cell
  const renderDayCell = (date: Date, index: number) => {
    const dayEvents = getEventsForDay(date);
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isDayToday = isToday(date);
    const isSelected = selectedDay && isSameDay(date, selectedDay);

    return (
      <Grid item xs key={`${date.toISOString()}-${index}`} sx={{ minHeight: currentView === 'month' ? 120 : 200 }}>
        <Box
          onClick={() => handleDateClick(date)}
          onDoubleClick={() => handleCreateEvent(date)}
          sx={{
            height: '100%',
            p: 1,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: isSelected
              ? 'primary.light'
              : isDayToday
              ? 'action.selected'
              : isCurrentMonth
              ? 'background.paper'
              : 'action.disabled',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            transition: 'background-color 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
          role="button"
          tabIndex={0}
          aria-label={`${formatDate(date)}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDateClick(date);
            }
          }}
        >
          {/* Date number */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: isDayToday ? 'bold' : 'normal',
                color: isDayToday ? 'primary.contrastText' : (isCurrentMonth ? 'text.primary' : 'text.secondary'),
                backgroundColor: isDayToday ? 'primary.main' : 'transparent',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {date.getDate()}
            </Typography>
            {dayEvents.length > 0 && (
              <Badge
                badgeContent={dayEvents.length}
                color="primary"
                max={9}
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
              />
            )}
          </Box>

          {/* Events */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {dayEvents.slice(0, currentView === 'month' ? 3 : 10).map((event, _) => (
              <Tooltip key={event.id} title={`${event.title}${event.description ? `: ${event.description}` : ''}`}>
                <Chip
                  label={event.title}
                  size="small"
                  onClick={(e: React.MouseEvent) => handleEventClick(event, e)}
                  sx={{
                    mb: 0.25,
                    width: '100%',
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: event.color || 'primary.main',
                    color: 'white',
                    '& .MuiChip-label': {
                      px: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              </Tooltip>
            ))}
            {dayEvents.length > (currentView === 'month' ? 3 : 10) && (
              <Typography variant="caption" color="text.secondary">
                +{dayEvents.length - (currentView === 'month' ? 3 : 10)} more
              </Typography>
            )}
          </Box>
        </Box>
      </Grid>
    );
  };

  return (
    <Card className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          {/* Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrevious} aria-label="Previous period">
              <ChevronLeft />
            </IconButton>
            <Button
              onClick={handleToday}
              startIcon={<Today />}
              variant="outlined"
              size="small"
            >
              Today
            </Button>
            <IconButton onClick={handleNext} aria-label="Next period">
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Title */}
          <Typography variant="h6" component="h2" sx={{ flex: 1, textAlign: 'center', mx: 2 }}>
            {displayTitle}
          </Typography>

          {/* View Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ButtonGroup size="small" variant="outlined">
              <Button
                onClick={() => handleViewChange('month')}
                variant={currentView === 'month' ? 'contained' : 'outlined'}
              >
                Month
              </Button>
              <Button
                onClick={() => handleViewChange('week')}
                variant={currentView === 'week' ? 'contained' : 'outlined'}
              >
                Week
              </Button>
              <Button
                onClick={() => handleViewChange('day')}
                variant={currentView === 'day' ? 'contained' : 'outlined'}
              >
                Day
              </Button>
            </ButtonGroup>

            {!readOnly && (
              <Button
                startIcon={<Add />}
                variant="contained"
                size="small"
                onClick={() => handleCreateEvent(selectedDay || currentDate)}
              >
                Add Event
              </Button>
            )}
          </Box>
        </Box>

        {/* Week days header */}
        {(currentView === 'month' || currentView === 'week') && (
          <Grid container sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid item xs key={day}>
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
        )}

        {/* Calendar grid */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Grid
            container
            sx={{
              height: '100%',
              '& .MuiGrid-item': {
                ...(currentView === 'month' && {
                  flex: '1 1 14.28%',
                  maxWidth: '14.28%',
                }),
                ...(currentView === 'week' && {
                  flex: '1 1 14.28%',
                  maxWidth: '14.28%',
                }),
                ...(currentView === 'day' && {
                  flex: '1 1 100%',
                  maxWidth: '100%',
                }),
              },
            }}
          >
            {daysToRender.map((date, index) => renderDayCell(date, index))}
          </Grid>
        </Box>

        {/* Footer with event summary */}
        {selectedDay && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Events for {formatDate(selectedDay)}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {getEventsForDay(selectedDay).map((event) => (
                <Chip
                  key={event.id}
                  label={`${event.title}${event.isAllDay ? '' : ` (${formatTime(new Date(event.startDate))})`}`}
                  size="small"
                  onClick={(e: React.MouseEvent) => handleEventClick(event, e)}
                  sx={{
                    backgroundColor: event.color || 'primary.main',
                    color: 'white',
                  }}
                />
              ))}
              {getEventsForDay(selectedDay).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No events scheduled
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default Calendar;