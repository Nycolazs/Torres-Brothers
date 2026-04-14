'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
}

export function DateRangePicker({ from, to, onSelect, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal hover:bg-accent hover:text-accent-foreground cursor-pointer',
          !from && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        {from ? (
          to ? (
            <>
              {format(from, 'dd/MM/yyyy', { locale: ptBR })} –{' '}
              {format(to, 'dd/MM/yyyy', { locale: ptBR })}
            </>
          ) : (
            format(from, 'dd/MM/yyyy', { locale: ptBR })
          )
        ) : (
          'Selecionar período'
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from, to }}
          onSelect={(range) => {
            onSelect({ from: range?.from, to: range?.to });
            if (range?.from && range?.to) {
              setOpen(false);
            }
          }}
          locale={ptBR}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
