import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiscalInvoice, FiscalInvoiceFormData, FiscalInvoiceStatus } from '@/types';

function fiscalInvoicesCol(uid: string) {
  return collection(db, 'users', uid, 'fiscalInvoices');
}

function fiscalInvoiceDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'fiscalInvoices', id);
}

function docToFiscalInvoice(docSnap: DocumentSnapshot): FiscalInvoice {
  return { id: docSnap.id, ...docSnap.data() } as FiscalInvoice;
}

export function createFiscalReference() {
  return `tb${Date.now()}${crypto.randomUUID().slice(0, 8).replace(/-/g, '')}`;
}

export async function createFiscalInvoiceDraft(
  uid: string,
  data: FiscalInvoiceFormData
): Promise<{ id: string; reference: string }> {
  const reference = createFiscalReference();
  const now = Timestamp.now();
  const ref = await addDoc(fiscalInvoicesCol(uid), {
    reference,
    status: 'draft',
    provider: 'mock',
    environment: 'homologation',
    ...data,
    createdAt: now,
    updatedAt: now,
    uid,
  });

  return { id: ref.id, reference };
}

export async function updateFiscalInvoiceStatus(
  uid: string,
  id: string,
  data: {
    status: FiscalInvoiceStatus;
    provider: 'focus' | 'nfeio' | 'mock';
    environment: 'homologation' | 'production';
    providerInvoiceId?: string;
    providerStatus?: string;
    providerMessage?: string;
    invoiceNumber?: string;
    verificationCode?: string;
    pdfUrl?: string;
    xmlUrl?: string;
    rawResponse?: Record<string, unknown>;
  }
) {
  const record: Record<string, unknown> = {
    ...data,
    statusEvents: arrayUnion({
      status: data.status,
      message: data.providerMessage || data.providerStatus || '',
      at: Timestamp.now(),
    }),
    updatedAt: Timestamp.now(),
  };

  if (data.status === 'processing' || data.status === 'authorized' || data.status === 'simulation') {
    record.issuedAt = Timestamp.now();
  }

  await updateDoc(fiscalInvoiceDoc(uid, id), record);
}

export async function cancelFiscalInvoice(uid: string, id: string, reason: string): Promise<void> {
  await updateDoc(fiscalInvoiceDoc(uid, id), {
    status: 'cancelled',
    providerMessage: reason,
    statusEvents: arrayUnion({
      status: 'cancelled',
      message: reason,
      at: Timestamp.now(),
    }),
    updatedAt: Timestamp.now(),
  });
}

export async function listFiscalInvoices(uid: string): Promise<FiscalInvoice[]> {
  const q = query(fiscalInvoicesCol(uid), orderBy('createdAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFiscalInvoice);
}
