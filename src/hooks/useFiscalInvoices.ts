'use client';

import { useCallback, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { FiscalInvoice, FiscalInvoiceFormData } from '@/types';
import {
  cancelFiscalInvoice,
  createFiscalInvoiceDraft,
  listFiscalInvoices,
  updateFiscalInvoiceStatus,
} from '@/services/fiscalInvoiceService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

async function getAuthorizationHeader(): Promise<Record<string, string>> {
  if (!auth) return {};
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useFiscalInvoices() {
  const { companyUid } = useAuth();
  const [invoices, setInvoices] = useState<FiscalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const refresh = useCallback(async () => {
    if (!companyUid) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setInvoices(await listFiscalInvoices(companyUid));
    } catch (error) {
      console.error('Error loading fiscal invoices:', error);
      toast.error('Erro ao carregar notas fiscais.');
    } finally {
      setLoading(false);
    }
  }, [companyUid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const issueInvoice = useCallback(
    async (data: FiscalInvoiceFormData) => {
      if (!companyUid) return;
      setIssuing(true);
      try {
        const draft = await createFiscalInvoiceDraft(companyUid, data);
        const headers = await getAuthorizationHeader();

        const response = await fetch('/api/fiscal/nfse', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reference: draft.reference, invoice: data }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao emitir NFS-e.');
        }

        await updateFiscalInvoiceStatus(companyUid, draft.id, result);
        toast.success(result.status === 'simulation' ? 'Nota simulada registrada.' : 'NFS-e enviada para emissão.');
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao emitir NFS-e.';
        toast.error(message);
      } finally {
        setIssuing(false);
      }
    },
    [companyUid, refresh]
  );

  const consultInvoice = useCallback(
    async (invoice: FiscalInvoice) => {
      if (!companyUid) return;
      try {
        const headers = await getAuthorizationHeader();
        const lookupId = invoice.providerInvoiceId || invoice.reference;
        const response = await fetch(`/api/fiscal/nfse?reference=${encodeURIComponent(lookupId)}`, {
          headers,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao consultar NFS-e.');
        }
        await updateFiscalInvoiceStatus(companyUid, invoice.id, result);
        toast.success('Status da NFS-e atualizado.');
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao consultar NFS-e.';
        toast.error(message);
      }
    },
    [companyUid, refresh]
  );

  const cancelInvoice = useCallback(
    async (invoice: FiscalInvoice) => {
      if (!companyUid) return;
      try {
        await cancelFiscalInvoice(companyUid, invoice.id, 'Cancelamento solicitado no sistema.');
        toast.success('Nota cancelada no histórico interno.');
        await refresh();
      } catch {
        toast.error('Erro ao cancelar nota fiscal.');
      }
    },
    [companyUid, refresh]
  );

  return { invoices, loading, issuing, issueInvoice, consultInvoice, cancelInvoice, refresh };
}
