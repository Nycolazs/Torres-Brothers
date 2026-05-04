'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TransactionStatus, TransactionType } from '@/types';
import { TRANSACTION_STATUS_LABELS, STATUS_COLORS, TRANSACTION_TYPE_LABELS } from '@/constants';

interface StatusBadgeProps {
  status: TransactionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('text-xs font-medium', STATUS_COLORS[status])}>
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  );
}

interface TypeBadgeProps {
  type: TransactionType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const colors: Record<TransactionType, string> = {
    income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    cost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  return (
    <Badge variant="secondary" className={cn('text-xs font-medium', colors[type])}>
      {TRANSACTION_TYPE_LABELS[type]}
    </Badge>
  );
}
