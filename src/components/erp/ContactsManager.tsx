'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Search, UserRoundPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { listCharges, listContacts, saveContact } from '@/services/erpService';
import { listFiscalInvoices } from '@/services/fiscalInvoiceService';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { buildClientErrorPayload, logClientError } from '@/services/errorLogService';
import { Charge, Contact, ContactFormData, ContactType, FiscalInvoice, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const emptyForm = (type: ContactType): ContactFormData => ({
  type,
  name: '',
  tradeName: '',
  document: '',
  email: '',
  phone: '',
  mobile: '',
  address: {
    street: '',
    number: '',
    complement: '',
    district: '',
    cityCode: '',
    city: '',
    state: '',
    zipCode: '',
  },
  blocked: false,
  creditLimit: 0,
  notes: '',
});

interface ContactsManagerProps {
  mode: 'customer' | 'supplier';
}

export function ContactsManager({ mode }: ContactsManagerProps) {
  const { companyUid, user, can } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [invoices, setInvoices] = useState<FiscalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<ContactFormData>(emptyForm(mode));
  const title = mode === 'customer' ? 'Clientes' : 'Fornecedores';
  const singular = mode === 'customer' ? 'cliente' : 'fornecedor';

  async function load() {
    if (!companyUid) return;
    if (!can('contacts:write')) {
      toast.error('Seu perfil não tem permissão para salvar cadastros.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const contactData = await listContacts(companyUid, mode);
      setContacts(contactData);

      const [transactionResult, chargeResult, invoiceResult] = await Promise.allSettled([
        getTransactionsByDateRange(companyUid, new Date(2020, 0, 1), new Date(2035, 11, 31)),
        listCharges(companyUid),
        listFiscalInvoices(companyUid),
      ]);

      if (transactionResult.status === 'fulfilled') {
        setTransactions(transactionResult.value);
      } else {
        console.error(`[ContactsManager] Erro ao carregar lançamentos de ${title.toLowerCase()}:`, transactionResult.reason);
        setTransactions([]);
      }

      if (chargeResult.status === 'fulfilled') {
        setCharges(chargeResult.value);
      } else {
        console.error(`[ContactsManager] Erro ao carregar cobranças de ${title.toLowerCase()}:`, chargeResult.reason);
        setCharges([]);
      }

      if (invoiceResult.status === 'fulfilled') {
        setInvoices(invoiceResult.value);
      } else {
        console.error(`[ContactsManager] Erro ao carregar notas fiscais de ${title.toLowerCase()}:`, invoiceResult.reason);
        setInvoices([]);
      }
    } catch (error) {
      console.error(`[ContactsManager] Erro ao carregar ${title.toLowerCase()}:`, error);
      const payload = buildClientErrorPayload(error, 'ContactsManager.load', { mode }, user?.uid);
      setLoadError(payload.message);
      void logClientError(payload);
      toast.error(`Erro ao carregar ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUid, mode]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return contacts;
    return contacts.filter((contact) =>
      [contact.name, contact.tradeName, contact.document, contact.email, contact.phone, contact.mobile]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [contacts, query]);

  const selectedContact = useMemo(() => {
    if (!form.id) return null;
    return contacts.find((contact) => contact.id === form.id) || null;
  }, [contacts, form.id]);

  const selectedSummary = useMemo(() => {
    if (!selectedContact) return null;
    const linkedTransactions = transactions.filter((transaction) => transaction.contactId === selectedContact.id);
    const linkedCharges = charges.filter((charge) => charge.contactId === selectedContact.id);
    const linkedInvoices = invoices.filter((invoice) => invoice.customerId === selectedContact.id);
    return {
      transactions: linkedTransactions.slice(0, 6),
      openAmount: linkedTransactions
        .filter((transaction) => transaction.status !== 'paid' && transaction.status !== 'cancelled')
        .reduce((sum, transaction) => sum + (transaction.remainingAmount ?? transaction.amount), 0),
      paidAmount: linkedTransactions
        .filter((transaction) => transaction.status === 'paid')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      chargesCount: linkedCharges.length,
      invoicesCount: linkedInvoices.length,
    };
  }, [charges, invoices, selectedContact, transactions]);

  const updateAddress = (key: keyof NonNullable<ContactFormData['address']>, value: string) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [key]: value,
      },
    }));
  };

  const edit = (contact: Contact) => {
    setForm({
      id: contact.id,
      type: contact.type,
      name: contact.name,
      tradeName: contact.tradeName || '',
      document: contact.document || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      address: contact.address || emptyForm(mode).address,
      blocked: contact.blocked,
      creditLimit: contact.creditLimit || 0,
      notes: contact.notes || '',
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyUid) return;
    if (!form.name.trim()) {
      toast.error(`Informe o nome do ${singular}.`);
      return;
    }

    try {
      await saveContact(companyUid, form);
      toast.success(`${title.slice(0, -1)} salvo com sucesso.`);
      setForm(emptyForm(mode));
      await load();
    } catch (error) {
      const payload = buildClientErrorPayload(error, 'ContactsManager.save', { mode, id: form.id }, user?.uid);
      void logClientError(payload);
      toast.error(`Erro ao salvar ${singular}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro reutilizável para financeiro, cobranças e notas fiscais.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, documento ou contato"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        {loadError && (
          <div className="xl:col-span-2">
            <ErrorState
              title={`Erro ao carregar ${title.toLowerCase()}.`}
              technicalDetails={loadError}
              onRetry={load}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRoundPlus className="h-4 w-4" />
              {form.id ? `Editar ${singular}` : `Novo ${singular}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome/Razão social</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fantasia</Label>
                  <Input value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(value) => value && setForm({ ...form, type: value as ContactType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="supplier">Fornecedor</SelectItem>
                      <SelectItem value="both">Cliente e fornecedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Limite de crédito</Label>
                  <Input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={form.address?.zipCode} onChange={(e) => updateAddress('zipCode', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Código IBGE</Label>
                  <Input value={form.address?.cityCode} onChange={(e) => updateAddress('cityCode', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={form.address?.street} onChange={(e) => updateAddress('street', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={form.address?.number} onChange={(e) => updateAddress('number', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={form.address?.district} onChange={(e) => updateAddress('district', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={form.address?.city} onChange={(e) => updateAddress('city', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input maxLength={2} value={form.address?.state} onChange={(e) => updateAddress('state', e.target.value.toUpperCase())} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!can('contacts:write')}>
                  {form.id ? 'Salvar alterações' : 'Cadastrar'}
                </Button>
                {form.id && (
                  <Button type="button" variant="outline" onClick={() => setForm(emptyForm(mode))}>
                    Novo
                  </Button>
                )}
              </div>
            </form>
            {selectedContact && selectedSummary && (
              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border p-2">
                    <div className="text-xs text-muted-foreground">Aberto</div>
                    <div className="text-sm font-semibold">{formatCurrency(selectedSummary.openAmount)}</div>
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="text-xs text-muted-foreground">Liquidado</div>
                    <div className="text-sm font-semibold">{formatCurrency(selectedSummary.paidAmount)}</div>
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="text-xs text-muted-foreground">Fiscal/Cobrança</div>
                    <div className="text-sm font-semibold">{selectedSummary.invoicesCount}/{selectedSummary.chargesCount}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Últimos lançamentos</div>
                  {selectedSummary.transactions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum lançamento vinculado.</div>
                  ) : (
                    selectedSummary.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(transaction.dueDate)}</div>
                        </div>
                        <div className="text-right font-mono">{formatCurrency(transaction.amount)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4"><TableSkeleton /></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={Building2} title={`Nenhum ${singular}`} description="Cadastre o primeiro registro para reutilizar no financeiro." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Limite</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-xs text-muted-foreground">{contact.tradeName}</div>
                      </TableCell>
                      <TableCell>{contact.document || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">{contact.email || '-'}</div>
                        <div className="text-xs text-muted-foreground">{contact.phone || contact.mobile}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(contact.creditLimit || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={contact.blocked ? 'destructive' : 'secondary'}>
                          {contact.blocked ? 'Bloqueado' : 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => edit(contact)}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
