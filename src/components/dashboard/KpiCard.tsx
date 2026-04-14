'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency, formatCurrencyShort } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  abbreviated?: boolean;
  suffix?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  abbreviated = false,
  suffix,
}: KpiCardProps) {
  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;

  const variantStyles = {
    default: 'text-primary',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', variantStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {suffix
            ? `${value}${suffix}`
            : abbreviated
              ? formatCurrencyShort(value)
              : formatCurrency(value)}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isPositiveChange ? (
              <TrendingUp className="h-3 w-3 text-emerald-600" />
            ) : isNegativeChange ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-xs',
                isPositiveChange && 'text-emerald-600',
                isNegativeChange && 'text-red-600',
                !isPositiveChange && !isNegativeChange && 'text-muted-foreground'
              )}
            >
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
