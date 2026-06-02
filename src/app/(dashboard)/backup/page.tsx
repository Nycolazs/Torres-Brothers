'use client';

import { useEffect, useMemo, useState } from 'react';
import { DatabaseBackup, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/reports/ExportButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { listContacts, listFinancialAccounts, listCharges } from '@/services/erpService';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { formatCurrency, formatDate } from '@/lib/utils';

type BackupDataset = 'transactions' | 'contacts' | 'charges' | 'financialAccounts';

interface BackupTable {
  rows: Record<string, unknown>[];
  columns: { header: string; key: string }[];
}

export default function BackupPage() {
  const { companyUid, can } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<BackupDataset>('transactions');
  const [tables, setTables] = useState<Record<BackupDataset, BackupTable>>({
    transactions: { rows: [], columns: [] },
    contacts: { rows: [], columns: [] },
    charges: { rows: [], columns: [] },
    financialAccounts: { rows: [], columns: [] },
  });

  useEffect(() => {
    if (!companyUid) return;

    Promise.all([
      getTransactionsByDateRange(companyUid, new Date(2020, 0, 1), new Date(2035, 11, 31)),
      listContacts(companyUid),
      listCharges(companyUid),
      listFinancialAccounts(companyUid),
    ]).then(([transactions, contacts, charges, financialAccounts]) => {
      setTables({
        transactions: {
          columns: [
            { header: 'Descrição', key: 'description' },
            { header: 'Tipo', key: 'type' },
            { header: 'Valor', key: 'amount' },
            { header: 'Vencimento', key: 'dueDate' },
            { header: 'Status', key: 'status' },
          ],
          rows: transactions.map((item) => ({
            description: item.description,
            type: item.type,
            amount: formatCurrency(item.amount),
            dueDate: formatDate(item.dueDate),
            status: item.status,
          })),
        },
        contacts: {
          columns: [
            { header: 'Nome', key: 'name' },
            { header: 'Tipo', key: 'type' },
            { header: 'Documento', key: 'document' },
            { header: 'E-mail', key: 'email' },
            { header: 'Telefone', key: 'phone' },
          ],
          rows: contacts.map((item) => ({
            name: item.name,
            type: item.type,
            document: item.document || '',
            email: item.email || '',
            phone: item.phone || item.mobile || '',
          })),
        },
        charges: {
          columns: [
            { header: 'Descrição', key: 'description' },
            { header: 'Valor', key: 'amount' },
            { header: 'Vencimento', key: 'dueDate' },
            { header: 'Status', key: 'status' },
            { header: 'Método', key: 'method' },
          ],
          rows: charges.map((item) => ({
            description: item.description,
            amount: formatCurrency(item.amount),
            dueDate: formatDate(item.dueDate),
            status: item.status,
            method: item.method,
          })),
        },
        financialAccounts: {
          columns: [
            { header: 'Nome', key: 'name' },
            { header: 'Tipo', key: 'type' },
            { header: 'DRE', key: 'dreClassification' },
            { header: 'Ativo', key: 'isActive' },
          ],
          rows: financialAccounts.map((item) => ({
            name: item.name,
            type: item.type,
            dreClassification: item.dreClassification,
            isActive: item.isActive ? 'Sim' : 'Não',
          })),
        },
      });
    }).finally(() => setLoading(false));
  }, [companyUid]);

  const selectedTable = tables[dataset];
  const totalRows = useMemo(
    () => Object.values(tables).reduce((sum, table) => sum + table.rows.length, 0),
    [tables]
  );

  if (!can('finance:read')) {
    return (
      <EmptyState
        icon={DatabaseBackup}
        title="Acesso indisponível"
        description="Seu perfil não tem permissão para exportar dados financeiros."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backup e Exportação</h1>
          <p className="text-sm text-muted-foreground">
            Exporte bases financeiras para conferência, auditoria e backup operacional.
          </p>
        </div>
        <ExportButton
          data={selectedTable.rows}
          columns={selectedTable.columns}
          filename={`backup-${dataset}`}
          title={`Backup ${dataset}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {([
          ['transactions', 'Lançamentos'],
          ['contacts', 'Contatos'],
          ['charges', 'Cobranças'],
          ['financialAccounts', 'Contas gerenciais'],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            variant={dataset === key ? 'default' : 'outline'}
            onClick={() => setDataset(key)}
            className="justify-start"
          >
            <Download className="mr-2 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do backup</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : totalRows === 0 ? (
            <EmptyState icon={DatabaseBackup} title="Sem dados para exportar" description="Os dados aparecerão aqui conforme o sistema for usado." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              {Object.entries(tables).map(([key, table]) => (
                <div key={key} className="rounded-md border p-4">
                  <div className="text-sm text-muted-foreground">{key}</div>
                  <div className="text-2xl font-bold">{table.rows.length}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
