import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Popover, PopoverContent } from './popover';

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
}

const DatePicker = ({ date, onDateChange, placeholder = 'Pick a date' }: DatePickerProps) => {
  const [open, setOpen] = React.useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        className={cn(
          'w-[280px] justify-start text-left font-normal',
          !date && 'text-gray-500'
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {date ? formatDate(date) : placeholder}
      </Button>
      <PopoverContent className="w-auto p-0">
        <input
          type="date"
          value={date?.toISOString().split('T')[0] || ''}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : undefined;
            onDateChange?.(newDate);
            setOpen(false);
          }}
          className="w-full p-3 border-0 focus:outline-none"
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker };