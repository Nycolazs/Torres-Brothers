'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { categorySchema } from '@/lib/validations';
import { Category, TransactionType } from '@/types';
import { TRANSACTION_TYPE_LABELS } from '@/constants';

type FormData = z.infer<typeof categorySchema>;

const TYPE_COLORS: Record<TransactionType, string> = {
  income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export default function CategoriasPage() {
  const { companyUid } = useAuth();
  const { categories, loading, refresh } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: 'expense', color: '#3b82f6', icon: 'Tag' },
  });

  const openNew = () => {
    setEditingCategory(null);
    reset({ name: '', type: 'expense', color: '#3b82f6', icon: 'Tag' });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    reset({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!companyUid) return;
    try {
      if (editingCategory) {
        await updateCategory(companyUid, editingCategory.id, data);
        toast.success('Categoria atualizada!');
      } else {
        await createCategory(companyUid, data);
        toast.success('Categoria criada!');
      }
      setModalOpen(false);
      refresh();
    } catch {
      toast.error('Erro ao salvar categoria.');
    }
  };

  const handleDelete = async () => {
    if (!companyUid || !deleteId) return;
    try {
      await deleteCategory(companyUid, deleteId);
      toast.success('Categoria excluída!');
      setDeleteId(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir categoria.');
    }
  };

  const grouped = {
    income: categories.filter((c) => c.type === 'income'),
    cost: categories.filter((c) => c.type === 'cost'),
    expense: categories.filter((c) => c.type === 'expense'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize suas receitas e despesas</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : categories.length === 0 ? (
        <EmptyState icon={Tag} title="Sem categorias" description="Crie categorias para organizar seus lançamentos." actionLabel="Criar Categoria" onAction={openNew} />
      ) : (
        <div className="grid gap-6">
          {(Object.entries(grouped) as [TransactionType, Category[]][]).map(([type, cats]) => (
            cats.length > 0 && (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {TRANSACTION_TYPE_LABELS[type]}
                    <Badge variant="secondary">{cats.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cats.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{cat.name}</p>
                            <Badge variant="secondary" className={`text-[10px] ${TYPE_COLORS[cat.type]}`}>
                              {TRANSACTION_TYPE_LABELS[cat.type]}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!cat.isDefault && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cat.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...register('name')} placeholder="Nome da categoria" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue>{TRANSACTION_TYPE_LABELS[field.value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSACTION_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <Input type="color" {...register('color')} className="w-12 h-10 p-1 cursor-pointer" />
                <Input {...register('color')} placeholder="#3b82f6" className="flex-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingCategory ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Categoria" description="Tem certeza? Categorias com lançamentos vinculados não podem ser excluídas." confirmLabel="Excluir" variant="destructive" onConfirm={handleDelete} />
    </div>
  );
}
