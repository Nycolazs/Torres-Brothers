'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { transactionSchema } from '@/lib/validations';
import { Transaction, TransactionFormData, TransactionType, Category, BankAccount } from '@/types';
import {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  RECURRENCE_TYPE_LABELS,
} from '@/constants';

type FormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  categories: Category[];
  bankAccounts: BankAccount[];
  onSubmit: (data: TransactionFormData) => Promise<void>;
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  categories,
  bankAccounts,
  onSubmit,
}: TransactionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: 0,
      categoryId: '',
      bankAccountId: '',
      competenceDate: new Date(),
      dueDate: new Date(),
      status: 'pending',
      isInstallment: false,
      isRecurring: false,
      notes: '',
      tags: '',
      contactName: '',
    },
  });

  const selectedType = watch('type');
  const isInstallment = watch('isInstallment');
  const isRecurring = watch('isRecurring');
  const status = watch('status');

  const filteredCategories = categories.filter((c) => c.type === selectedType);
  const selectedCategory = categories.find((c) => c.id === watch('categoryId'));
  const selectedBankAccount = bankAccounts.find((acc) => acc.id === watch('bankAccountId'));
  const selectedPaymentMethod = watch('paymentMethod');
  const selectedRecurrenceType = watch('recurrenceType');

  const getBankAccountLabel = (acc: BankAccount) => {
    const name = acc.name?.trim();
    const looksLikeToken = !!name && /^[A-Za-z0-9_-]{12,}$/.test(name);
    if (!name || name === acc.id || looksLikeToken) {
      return 'Conta bancária';
    }
    return name;
  };

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        costCenterId: transaction.costCenterId || '',
        bankAccountId: transaction.bankAccountId,
        competenceDate: transaction.competenceDate.toDate(),
        dueDate: transaction.dueDate.toDate(),
        paymentDate: transaction.paymentDate?.toDate(),
        status: transaction.status,
        paymentMethod: transaction.paymentMethod || undefined,
        isInstallment: transaction.isInstallment,
        totalInstallments: transaction.totalInstallments,
        isRecurring: transaction.isRecurring,
        recurrenceType: transaction.recurrenceType || undefined,
        notes: transaction.notes || '',
        tags: transaction.tags?.join(', ') || '',
        contactName: transaction.contactName || '',
      });
    } else {
      reset({
        type: 'expense',
        description: '',
        amount: 0,
        categoryId: '',
        bankAccountId: bankAccounts[0]?.id || '',
        competenceDate: new Date(),
        dueDate: new Date(),
        status: 'pending',
        isInstallment: false,
        isRecurring: false,
        notes: '',
        tags: '',
        contactName: '',
      });
    }
  }, [transaction, reset, bankAccounts]);

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const formData: TransactionFormData = {
        ...data,
        id: transaction?.id,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        paymentDate: data.status === 'paid' ? (data.paymentDate || new Date()) : undefined,
      };
      await onSubmit(formData);
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[98vw] sm:!w-[97vw] lg:!w-[96vw] xl:!w-[94vw] !max-w-none sm:!max-w-none lg:!max-w-[1200px] xl:!max-w-[1320px] h-[94vh] p-0 overflow-hidden overflow-x-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b bg-background">
          <DialogTitle className="text-xl sm:text-2xl">
            {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Preencha somente os campos principais para salvar rapidamente.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex h-full min-h-0 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border p-1 bg-muted/40">
            {(Object.entries(TRANSACTION_TYPE_LABELS) as [TransactionType, string][]).map(
              ([value, label]) => (
                <Controller
                  key={value}
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Button
                      type="button"
                      variant={field.value === value ? 'default' : 'outline'}
                      className={cn(
                        'w-full rounded-lg border-0',
                        field.value === value && value === 'income' && 'bg-emerald-600 hover:bg-emerald-700',
                        field.value === value && value === 'cost' && 'bg-red-600 hover:bg-red-700',
                        field.value === value && value === 'expense' && 'bg-orange-600 hover:bg-orange-700',
                        field.value !== value && 'bg-transparent hover:bg-background'
                      )}
                      onClick={() => {
                        field.onChange(value);
                        setValue('categoryId', '');
                      }}
                    >
                      {label}
                    </Button>
                  )}
                />
              )
            )}
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input id="description" {...register('description')} placeholder="Ex: Venda de produto" />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0,00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Category & Bank Account */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar categoria">{selectedCategory?.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Conta Bancária *</Label>
              <Controller
                name="bankAccountId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar conta" className="truncate">
                        {selectedBankAccount ? getBankAccountLabel(selectedBankAccount) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <span className="truncate">{getBankAccountLabel(acc)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bankAccountId && (
                <p className="text-sm text-destructive">{errors.bankAccountId.message}</p>
              )}
            </div>
          </div>

          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="contactName">
              {selectedType === 'income' ? 'Cliente / Pagador' : 'Fornecedor / Beneficiário'}
            </Label>
            <Input
              id="contactName"
              {...register('contactName')}
              placeholder={selectedType === 'income' ? 'Nome do cliente' : 'Nome do fornecedor'}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data de Competência *</Label>
              <Controller
                name="competenceDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger className="inline-flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-left hover:bg-accent cursor-pointer">
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => date && field.onChange(date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger className="inline-flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-left hover:bg-accent cursor-pointer">
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => date && field.onChange(date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            {status === 'paid' && (
              <div className="space-y-2">
                <Label>Data de Pagamento</Label>
                <Controller
                  name="paymentDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger className="inline-flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-left hover:bg-accent cursor-pointer">
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        {field.value
                          ? format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecionar'}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => date && field.onChange(date)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            )}
          </div>

          {/* Status & Payment Method */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status *</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{field.value === 'paid' ? 'Pago' : 'Pendente'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar">
                        {selectedPaymentMethod ? PAYMENT_METHOD_LABELS[selectedPaymentMethod] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Installments */}
          <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
            <div>
              <Label className="text-sm font-medium">Parcelamento</Label>
              <p className="text-xs text-muted-foreground">Dividir em parcelas mensais</p>
            </div>
            <Controller
              name="isInstallment"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          {isInstallment && (
            <div className="space-y-2">
              <Label htmlFor="totalInstallments">Número de Parcelas</Label>
              <Input
                id="totalInstallments"
                type="number"
                min="2"
                max="48"
                {...register('totalInstallments', { valueAsNumber: true })}
                placeholder="Ex: 12"
              />
            </div>
          )}

          {/* Recurrence */}
          <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
            <div>
              <Label className="text-sm font-medium">Recorrência</Label>
              <p className="text-xs text-muted-foreground">Repetir automaticamente</p>
            </div>
            <Controller
              name="isRecurring"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          {isRecurring && (
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Controller
                name="recurrenceType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar frequência">
                        {selectedRecurrenceType
                          ? RECURRENCE_TYPE_LABELS[selectedRecurrenceType]
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Notes & Tags */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="Separar por vírgula: urgente, projeto-x"
            />
          </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 z-10 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-4 sm:px-6 py-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando...
                </span>
              ) : isEditing ? (
                'Salvar Alterações'
              ) : (
                'Criar Lançamento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
