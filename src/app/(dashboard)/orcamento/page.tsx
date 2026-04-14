'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, PieChart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { Budget, Category } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { getTransactionsByDateRange } from '@/services/transactionService';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OrcamentoPage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [actuals, setActuals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Form state
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');

  const budgetsCol = useCallback(
    (uid: string) => collection(db, 'users', uid, 'budgets'),
    []
  );

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        budgetsCol(user.uid),
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Budget[];
      setBudgets(data);

      // Get actual spending
      const start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const end = endOfMonth(start);
      const transactions = await getTransactionsByDateRange(user.uid, start, end);
      const totals: Record<string, number> = {};
      for (const t of transactions) {
        if (t.status === 'cancelled' || t.type === 'income') continue;
        totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
      }
      setActuals(totals);
    } catch {
      toast.error('Erro ao carregar orçamento.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth, selectedYear, budgetsCol]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'cost');
  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  const handleAdd = async () => {
    if (!user || !formCategoryId || !formAmount) return;
    try {
      await addDoc(budgetsCol(user.uid), {
        categoryId: formCategoryId,
        month: selectedMonth,
        year: selectedYear,
        plannedAmount: parseFloat(formAmount),
        actualAmount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        uid: user.uid,
      });
      toast.success('Orçamento adicionado!');
      setModalOpen(false);
      setFormCategoryId('');
      setFormAmount('');
      fetchBudgets();
    } catch {
      toast.error('Erro ao salvar orçamento.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
      toast.success('Orçamento removido!');
      fetchBudgets();
    } catch {
      toast.error('Erro ao remover.');
    }
  };

  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = -3; i <= 12; i++) {
      const d = subMonths(now, -i);
      options.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: format(d, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return options;
  }, []);

  const selectedMonthLabel =
    monthOptions.find((opt) => opt.month === selectedMonth && opt.year === selectedYear)?.label ??
    'Selecionar mês';
  const selectedCategoryLabel =
    availableCategories.find((c) => c.id === formCategoryId)?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orçamento</h1>
          <p className="text-sm text-muted-foreground">Defina metas de gastos por categoria</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={`${selectedMonth}-${selectedYear}`}
            onValueChange={(v) => {
              if (!v) return;
              const [m, y] = v.split('-').map(Number);
              setSelectedMonth(m);
              setSelectedYear(y);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue>
                <span className="capitalize">{selectedMonthLabel}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                  <span className="capitalize">{opt.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setModalOpen(true)} disabled={availableCategories.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Sem orçamento definido"
          description="Defina metas de gastos mensais por categoria para acompanhar seus limites."
          actionLabel="Definir Orçamento"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const category = categoryMap.get(budget.categoryId);
            const actual = actuals[budget.categoryId] || 0;
            const percentage = budget.plannedAmount > 0 ? (actual / budget.plannedAmount) * 100 : 0;
            const isOverBudget = percentage > 100;
            const isWarning = percentage > 80;

            return (
              <Card key={budget.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {category && (
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                      )}
                      <span className="font-medium text-sm">{category?.name || 'Categoria'}</span>
                    </div>
                    {isOverBudget && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Acima
                      </Badge>
                    )}
                    {isWarning && !isOverBudget && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                        Atenção
                      </Badge>
                    )}
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={cn(
                      'h-2',
                      isOverBudget && '[&>div]:bg-destructive',
                      isWarning && !isOverBudget && '[&>div]:bg-amber-500'
                    )}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn('font-semibold', isOverBudget ? 'text-destructive' : '')}>
                      {formatCurrency(actual)}
                    </span>
                    <span className="text-muted-foreground">
                      de {formatCurrency(budget.plannedAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(0)}% utilizado
                  </p>
                  <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => handleDelete(budget.id)}>
                    Remover
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Orçamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategoryId} onValueChange={(v) => v && setFormCategoryId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria">{selectedCategoryLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Planejado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={!formCategoryId || !formAmount}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
