'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { CostCenter } from '@/types';
import { costCenterSchema } from '@/lib/validations';
import {
  getCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
} from '@/services/costCenterService';

type FormData = z.infer<typeof costCenterSchema>;

export default function CentrosCustoPage() {
  const { user } = useAuth();
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCostCenters(user.uid);
      setCenters(data);
    } catch {
      toast.error('Erro ao carregar centros de custo.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => {
    setEditingCenter(null);
    reset({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (center: CostCenter) => {
    setEditingCenter(center);
    reset({ name: center.name, description: center.description || '', isActive: center.isActive });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      if (editingCenter) {
        await updateCostCenter(user.uid, editingCenter.id, data);
        toast.success('Centro de custo atualizado!');
      } else {
        await createCostCenter(user.uid, data);
        toast.success('Centro de custo criado!');
      }
      setModalOpen(false);
      fetch();
    } catch {
      toast.error('Erro ao salvar centro de custo.');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteCostCenter(user.uid, deleteId);
      toast.success('Centro de custo excluído!');
      setDeleteId(null);
      fetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir.');
    }
  };

  const toggleActive = async (center: CostCenter) => {
    if (!user) return;
    try {
      await updateCostCenter(user.uid, center.id, { isActive: !center.isActive });
      fetch();
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centros de Custo</h1>
          <p className="text-sm text-muted-foreground">Organize seus custos por área ou projeto</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Centro
        </Button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : centers.length === 0 ? (
        <EmptyState icon={Building} title="Sem centros de custo" description="Crie centros para organizar seus custos por área." actionLabel="Criar Centro" onAction={openNew} />
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((center) => (
            <Card key={center.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{center.name}</p>
                    {center.description && (
                      <p className="text-sm text-muted-foreground">{center.description}</p>
                    )}
                    <Badge variant={center.isActive ? 'default' : 'secondary'} className="mt-1 text-xs">
                      {center.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={center.isActive} onCheckedChange={() => toggleActive(center)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(center)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(center.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input {...register('name')} placeholder="Ex: Loja Centro" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea {...register('description')} placeholder="Descrição opcional" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingCenter ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Centro de Custo" description="Tem certeza que deseja excluir este centro de custo?" confirmLabel="Excluir" variant="destructive" onConfirm={handleDelete} />
    </div>
  );
}
