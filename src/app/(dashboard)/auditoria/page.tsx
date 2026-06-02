'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bug, History, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { listAuditLogs } from '@/services/erpService';
import { listClientErrors } from '@/services/errorLogService';
import { AuditLog, ClientErrorLog } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AuditoriaPage() {
  const { companyUid, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [clientErrors, setClientErrors] = useState<ClientErrorLog[] | null>(null);
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    if (!companyUid || !isAdmin) {
      return;
    }
    Promise.all([
      listAuditLogs(companyUid),
      listClientErrors(),
    ])
      .then(([auditData, errorData]) => {
        setLogs(auditData);
        setClientErrors(errorData);
      })
      .catch(() => toast.error('Erro ao carregar auditoria.'))
  }, [companyUid, isAdmin]);

  const safeLogs = useMemo(() => logs || [], [logs]);
  const entities = useMemo(() => Array.from(new Set(safeLogs.map((log) => log.entity))).sort(), [safeLogs]);
  const selectedEntityLabel = entityFilter === 'all' ? 'Todas as entidades' : entityFilter;
  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return safeLogs.filter((log) => {
      const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;
      const matchesText =
        !needle ||
        log.action.toLowerCase().includes(needle) ||
        log.entity.toLowerCase().includes(needle) ||
        log.entityId.toLowerCase().includes(needle);
      return matchesEntity && matchesText;
    });
  }, [entityFilter, safeLogs, query]);

  if (!isAdmin) {
    return (
      <EmptyState
        icon={History}
        title="Acesso restrito"
        description="Somente administradores podem visualizar trilhas de auditoria."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Últimas ações críticas executadas no ERP financeiro.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar ação, entidade ou ID" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={entityFilter} onValueChange={(value) => value && setEntityFilter(value)}>
            <SelectTrigger className="md:w-56"><SelectValue>{selectedEntityLabel}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as entidades</SelectItem>
              {entities.map((entity) => <SelectItem key={entity} value={entity}>{entity}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {logs === null ? (
            <div className="p-4"><TableSkeleton /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={History} title="Sem auditoria" description="Nenhuma ação encontrada nos filtros atuais." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Metadados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                    <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                      {JSON.stringify(log.metadata || {})}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {clientErrors === null ? (
            <div className="p-4"><TableSkeleton /></div>
          ) : clientErrors.length === 0 ? (
            <EmptyState icon={Bug} title="Sem erros de produção" description="Nenhum erro client-side foi registrado recentemente." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientErrors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell>{formatDate(error.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{error.route || '-'}</TableCell>
                    <TableCell>{error.source}</TableCell>
                    <TableCell className="max-w-[520px] truncate text-xs text-muted-foreground">
                      {error.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
