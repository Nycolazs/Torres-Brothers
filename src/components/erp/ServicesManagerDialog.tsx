'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BriefcaseBusiness, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { listServices, saveService } from '@/services/erpService';
import { ServiceCatalogFormData, ServiceCatalogItem } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const initialForm: ServiceCatalogFormData = {
  description: '',
  serviceListItem: '07.10',
  municipalServiceCode: '',
  taxRate: 0,
  issWithheld: false,
  defaultAmount: 0,
  isActive: true,
  notes: '',
};

interface ServicesManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyUid: string | null;
  onServicesChange?: (updatedServices: ServiceCatalogItem[], lastCreatedId?: string) => void;
}

export function ServicesManagerDialog({
  open,
  onOpenChange,
  companyUid,
  onServicesChange,
}: ServicesManagerDialogProps) {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [form, setForm] = useState<ServiceCatalogFormData>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tab state for mobile-first layout
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

  async function load() {
    if (!companyUid) return;
    setLoading(true);
    try {
      const data = await listServices(companyUid);
      setServices(data);
    } catch {
      toast.error('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && companyUid) {
      load();
      setActiveTab('form'); // Reset to form view when opening
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyUid]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !companyUid) return;
    if (!form.description.trim()) {
      toast.error('Informe a descrição do serviço.');
      return;
    }
    setSaving(true);
    try {
      const savedId = await saveService(companyUid, form);
      toast.success(form.id ? 'Serviço atualizado com sucesso.' : 'Serviço cadastrado com sucesso.');
      
      // Reload list
      const updatedData = await listServices(companyUid);
      setServices(updatedData);

      // Invoke callback
      if (onServicesChange) {
        onServicesChange(updatedData, form.id ? undefined : savedId);
      }

      setForm(initialForm);

      // Auto switch to list tab on mobile to let them see their new service
      if (window.innerWidth < 1024) {
        setActiveTab('list');
      }
    } catch {
      toast.error('Erro ao salvar serviço.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!companyUid) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'users', companyUid, 'services', id));
      toast.success('Serviço removido com sucesso.');

      // Reload list
      const updatedData = await listServices(companyUid);
      setServices(updatedData);

      if (onServicesChange) {
        onServicesChange(updatedData);
      }
    } catch {
      toast.error('Erro ao excluir serviço.');
    } finally {
      setDeletingId(null);
    }
  };

  const edit = (service: ServiceCatalogItem) => {
    setForm({
      id: service.id,
      description: service.description,
      serviceListItem: service.serviceListItem,
      municipalServiceCode: service.municipalServiceCode || '',
      taxRate: service.taxRate,
      issWithheld: service.issWithheld,
      defaultAmount: service.defaultAmount,
      isActive: service.isActive,
      notes: service.notes || '',
    });
    // On mobile, switch view to form for editing
    setActiveTab('form');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <BriefcaseBusiness className="h-5 w-5 text-primary shrink-0" />
            Gerenciador de Catálogo de Serviços
          </DialogTitle>
        </DialogHeader>

        {/* Tab Selector for Mobile/Tablets */}
        <div className="flex border-b border-border/60 mb-4 lg:hidden">
          <button
            type="button"
            className={cn(
              "flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === 'form'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('form')}
          >
            {form.id ? 'Editar Serviço' : 'Novo Serviço'}
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === 'list'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('list')}
          >
            Serviços Cadastrados ({services.length})
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
          {/* Form Card (Responsive display) */}
          <div
            className={cn(
              "border rounded-lg p-4 sm:p-5 bg-muted/15 space-y-4 h-fit shadow-xs",
              activeTab === 'form' ? 'block' : 'hidden lg:block'
            )}
          >
            <h3 className="hidden lg:block font-bold text-sm border-b pb-2 text-foreground/90">
              {form.id ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Polimento de Mármore"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Valor Padrão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.defaultAmount || ''}
                  onChange={(e) => setForm({ ...form, defaultAmount: Number(e.target.value) })}
                  placeholder="0,00"
                  className="bg-background"
                />
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Alíquota ISS (%)</Label>
                  <Input
                    type="number"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Lista Serviço</Label>
                  <Input
                    value={form.serviceListItem}
                    onChange={(e) => setForm({ ...form, serviceListItem: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm select-none cursor-pointer pt-1">
                <Checkbox
                  checked={form.issWithheld}
                  onCheckedChange={(checked) => setForm({ ...form, issWithheld: checked === true })}
                />
                <span className="text-xs font-medium text-foreground/80">ISS retido</span>
              </label>

              <div className="flex gap-2 pt-3">
                <Button type="submit" disabled={saving} className="flex-1 cursor-pointer">
                  {saving ? 'Salvando...' : form.id ? 'Atualizar' : 'Cadastrar'}
                </Button>
                {form.id && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setForm(initialForm)}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* List Card (Responsive display) */}
          <div
            className={cn(
              "border rounded-lg overflow-hidden flex flex-col min-h-[320px] bg-background shadow-xs",
              activeTab === 'list' ? 'block' : 'hidden lg:flex'
            )}
          >
            {loading ? (
              <div className="p-6">
                <TableSkeleton />
              </div>
            ) : services.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="Nenhum serviço cadastrado"
                  description="Cadastre serviços no painel lateral para compor seu catálogo."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold">Serviço</TableHead>
                      <TableHead className="text-right text-xs font-semibold">Valor Padrão</TableHead>
                      <TableHead className="w-24 text-center text-xs font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="font-medium max-w-[200px] truncate py-3" title={service.description}>
                          {service.description}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold py-3">
                          {formatCurrency(service.defaultAmount)}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer rounded-md"
                              onClick={() => edit(service)}
                              title="Editar serviço"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-md"
                              disabled={deletingId === service.id}
                              onClick={() => handleDelete(service.id)}
                              title="Excluir serviço"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
