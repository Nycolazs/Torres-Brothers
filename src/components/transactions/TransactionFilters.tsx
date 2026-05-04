'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { TransactionType, TransactionStatus } from '@/types';
import {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
} from '@/constants';

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: TransactionType | 'all';
  onTypeChange: (value: TransactionType | 'all') => void;
  statusFilter: TransactionStatus | 'all';
  onStatusChange: (value: TransactionStatus | 'all') => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function TransactionFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateChange,
  onClearFilters,
  hasActiveFilters,
}: TransactionFiltersProps) {
  const selectedTypeLabel =
    typeFilter === 'all' ? 'Todos os Tipos' : TRANSACTION_TYPE_LABELS[typeFilter];
  const selectedStatusLabel =
    statusFilter === 'all' ? 'Todos os Status' : TRANSACTION_STATUS_LABELS[statusFilter];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Buscar lançamentos"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => onTypeChange(v as TransactionType | 'all')}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Tipo">{selectedTypeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusChange(v as TransactionStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status">{selectedStatusLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(TRANSACTION_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker from={dateFrom} to={dateTo} onSelect={onDateChange} />

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={onClearFilters} aria-label="Limpar filtros">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
