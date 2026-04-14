'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, CheckCircle, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Transaction, Category } from '@/types';
import { StatusBadge, TypeBadge } from './TransactionBadge';
import { PAYMENT_METHOD_LABELS } from '@/constants';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

export function TransactionTable({
  transactions,
  categories,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onMarkAsPaid,
}: TransactionTableProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const allSelected =
    transactions.length > 0 && selectedIds.length === transactions.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(transactions.map((t) => t.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  Nenhum lançamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const category = categoryMap.get(transaction.categoryId);
                return (
                  <TableRow
                    key={transaction.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      selectedIds.includes(transaction.id) && 'bg-muted/30'
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(transaction.id)}
                        onCheckedChange={() => toggleOne(transaction.id)}
                        aria-label={`Selecionar ${transaction.description}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {transaction.description}
                        </p>
                        {transaction.contactName && (
                          <p className="text-xs text-muted-foreground">
                            {transaction.contactName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={transaction.type} />
                    </TableCell>
                    <TableCell>
                      {category && (
                        <span className="flex items-center gap-1.5 text-sm">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="line-clamp-1">{category.name}</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-semibold tabular-nums text-sm',
                          transaction.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(transaction.dueDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.paymentMethod
                        ? PAYMENT_METHOD_LABELS[transaction.paymentMethod]
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(transaction)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {transaction.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => onMarkAsPaid(transaction.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onDelete(transaction.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
