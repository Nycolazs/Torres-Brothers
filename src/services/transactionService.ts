import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  QueryConstraint,
  DocumentSnapshot,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Transaction,
  TransactionFormData,
  TransactionType,
  ReportFilters,
} from '@/types';

// ── Helpers ───────────────────────────────────────────────────────

function transactionsCol(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

function transactionDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'transactions', id);
}

function auditLogsCol(uid: string) {
  return collection(db, 'users', uid, 'auditLogs');
}

function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function formDataToFirestore(
  uid: string,
  data: Partial<TransactionFormData>,
  isNew: boolean
): Record<string, unknown> {
  const record: Record<string, unknown> = {};

  if (data.type !== undefined) record.type = data.type;
  if (data.description !== undefined) record.description = data.description;
  if (data.amount !== undefined) record.amount = data.amount;
  if (data.categoryId !== undefined) record.categoryId = data.categoryId;
  if (data.financialAccountId !== undefined) record.financialAccountId = data.financialAccountId ?? null;
  if (data.costCenterId !== undefined) record.costCenterId = data.costCenterId;
  if (data.bankAccountId !== undefined) record.bankAccountId = data.bankAccountId;
  if (data.contactId !== undefined) record.contactId = data.contactId ?? null;
  if (data.contactSnapshot !== undefined) record.contactSnapshot = data.contactSnapshot ?? null;
  if (data.documentNumber !== undefined) record.documentNumber = data.documentNumber ?? null;
  if (data.competenceDate !== undefined) record.competenceDate = toTimestamp(data.competenceDate);
  if (data.dueDate !== undefined) record.dueDate = toTimestamp(data.dueDate);
  if (data.paymentDate !== undefined) {
    record.paymentDate = data.paymentDate ? toTimestamp(data.paymentDate) : null;
  }
  if (data.status !== undefined) record.status = data.status;
  if (data.paymentStatus !== undefined) record.paymentStatus = data.paymentStatus;
  if (data.paidAmount !== undefined) record.paidAmount = data.paidAmount ?? 0;
  if (data.remainingAmount !== undefined) record.remainingAmount = data.remainingAmount ?? null;
  if (data.paymentMethod !== undefined) record.paymentMethod = data.paymentMethod ?? null;
  if (data.isInstallment !== undefined) record.isInstallment = data.isInstallment;
  if (data.installmentNumber !== undefined) record.installmentNumber = data.installmentNumber ?? null;
  if (data.totalInstallments !== undefined) record.totalInstallments = data.totalInstallments ?? null;
  if (data.installmentGroupId !== undefined) record.installmentGroupId = data.installmentGroupId ?? null;
  if (data.isRecurring !== undefined) record.isRecurring = data.isRecurring;
  if (data.recurrenceType !== undefined) record.recurrenceType = data.recurrenceType ?? null;
  if (data.recurrenceEndDate !== undefined) {
    record.recurrenceEndDate = data.recurrenceEndDate ? toTimestamp(data.recurrenceEndDate) : null;
  }
  if (data.notes !== undefined) record.notes = data.notes ?? null;
  if (data.attachmentUrl !== undefined) record.attachmentUrl = data.attachmentUrl ?? null;
  if (data.tags !== undefined) record.tags = data.tags ?? [];
  if (data.contactName !== undefined) record.contactName = data.contactName ?? null;
  if (data.sourceModule !== undefined) record.sourceModule = data.sourceModule ?? null;
  if (data.reconciliationId !== undefined) record.reconciliationId = data.reconciliationId ?? null;
  if (data.chargeId !== undefined) record.chargeId = data.chargeId ?? null;

  record.updatedAt = Timestamp.now();
  record.uid = uid;

  if (isNew) {
    record.createdAt = Timestamp.now();
    record.paymentStatus = data.paymentStatus ?? (data.status === 'paid' ? 'paid' : 'open');
    record.paidAmount = data.status === 'paid' ? data.amount ?? 0 : data.paidAmount ?? 0;
    record.remainingAmount =
      data.status === 'paid' ? 0 : data.remainingAmount ?? data.amount ?? 0;
  }

  return record;
}

function docToTransaction(docSnap: DocumentSnapshot): Transaction {
  const data = docSnap.data()!;
  return { id: docSnap.id, ...data } as Transaction;
}

async function logAudit(uid: string, action: string, entityId: string, metadata?: Record<string, unknown>) {
  await addDoc(auditLogsCol(uid), {
    action,
    entity: 'transaction',
    entityId,
    metadata: metadata || {},
    createdAt: Timestamp.now(),
    uid,
  });
}

// ── Create ────────────────────────────────────────────────────────

export async function createTransaction(
  uid: string,
  data: TransactionFormData
): Promise<string[]> {
  const ids: string[] = [];

  if (data.isInstallment && data.totalInstallments && data.totalInstallments > 1) {
    const groupId = crypto.randomUUID();
    const installmentAmount = Math.round((data.amount / data.totalInstallments) * 100) / 100;
    const batch = writeBatch(db);

    for (let i = 1; i <= data.totalInstallments; i++) {
      const dueDate = new Date(data.dueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      const installmentData: Partial<TransactionFormData> = {
        ...data,
        amount: installmentAmount,
        installmentNumber: i,
        totalInstallments: data.totalInstallments,
        installmentGroupId: groupId,
        dueDate,
        description: `${data.description} (${i}/${data.totalInstallments})`,
        status: i === 1 ? data.status : 'pending',
        paymentDate: i === 1 ? data.paymentDate : undefined,
      };

      const ref = doc(transactionsCol(uid));
      batch.set(ref, formDataToFirestore(uid, installmentData, true));
      ids.push(ref.id);
    }

    await batch.commit();
    await logAudit(uid, 'create_installments', groupId, { count: ids.length, amount: data.amount });
  } else {
    const record = formDataToFirestore(uid, data, true);
    const ref = await addDoc(transactionsCol(uid), record);
    ids.push(ref.id);
    await logAudit(uid, 'create', ref.id, { type: data.type, amount: data.amount });
  }

  return ids;
}

// ── Update ────────────────────────────────────────────────────────

export async function updateTransaction(
  uid: string,
  id: string,
  data: Partial<TransactionFormData>
): Promise<void> {
  const record = formDataToFirestore(uid, data, false);
  await updateDoc(transactionDoc(uid, id), record);
  await logAudit(uid, 'update', id, { fields: Object.keys(data) });
}

// ── Delete ────────────────────────────────────────────────────────

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  await deleteDoc(transactionDoc(uid, id));
  await logAudit(uid, 'delete', id);
}

export async function deleteTransactionGroup(
  uid: string,
  installmentGroupId: string
): Promise<void> {
  const q = query(
    transactionsCol(uid),
    where('installmentGroupId', '==', installmentGroupId)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
  await logAudit(uid, 'delete_group', installmentGroupId, { count: snapshot.size });
}

// ── Read ──────────────────────────────────────────────────────────

export async function getTransaction(
  uid: string,
  id: string
): Promise<Transaction | null> {
  const docSnap = await getDoc(transactionDoc(uid, id));
  if (!docSnap.exists()) return null;
  return docToTransaction(docSnap);
}

export async function getTransactions(
  uid: string,
  filters: ReportFilters,
  pagination: { itemsPerPage: number; lastDoc?: DocumentSnapshot | null }
): Promise<{
  data: Transaction[];
  lastDoc: DocumentSnapshot | null;
  totalEstimate: number;
}> {
  const constraints: QueryConstraint[] = [];

  constraints.push(
    where('dueDate', '>=', toTimestamp(filters.startDate)),
    where('dueDate', '<=', toTimestamp(filters.endDate))
  );

  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }

  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    constraints.push(where('categoryId', 'in', filters.categoryIds));
  }

  if (filters.costCenterIds && filters.costCenterIds.length > 0) {
    constraints.push(where('costCenterId', 'in', filters.costCenterIds));
  }

  if (filters.bankAccountIds && filters.bankAccountIds.length > 0) {
    constraints.push(where('bankAccountId', 'in', filters.bankAccountIds));
  }

  constraints.push(orderBy('dueDate', 'desc'));
  constraints.push(limit(pagination.itemsPerPage));

  if (pagination.lastDoc) {
    constraints.push(startAfter(pagination.lastDoc));
  }

  const q = query(transactionsCol(uid), ...constraints);
  const snapshot = await getDocs(q);

  const data = snapshot.docs.map(docToTransaction);
  const lastDocSnap = snapshot.docs[snapshot.docs.length - 1] ?? null;

  // Get total count estimate using same filters minus pagination
  const countConstraints: QueryConstraint[] = [];
  countConstraints.push(
    where('dueDate', '>=', toTimestamp(filters.startDate)),
    where('dueDate', '<=', toTimestamp(filters.endDate))
  );
  if (filters.type) countConstraints.push(where('type', '==', filters.type));
  if (filters.status) countConstraints.push(where('status', '==', filters.status));

  const countQuery = query(transactionsCol(uid), ...countConstraints);
  const countSnapshot = await getCountFromServer(countQuery);
  const totalEstimate = countSnapshot.data().count;

  return { data, lastDoc: lastDocSnap, totalEstimate };
}

// ── Mark as Paid ──────────────────────────────────────────────────

export async function markAsPaid(
  uid: string,
  id: string,
  paymentDate: Date,
  bankAccountId: string
): Promise<void> {
  const transactionSnap = await getDoc(transactionDoc(uid, id));
  const amount = transactionSnap.exists() ? (transactionSnap.data().amount as number) || 0 : 0;

  await updateDoc(transactionDoc(uid, id), {
    status: 'paid',
    paymentStatus: 'paid',
    paidAmount: amount,
    remainingAmount: 0,
    paymentDate: toTimestamp(paymentDate),
    bankAccountId,
    updatedAt: Timestamp.now(),
  });
  await logAudit(uid, 'mark_paid', id, { amount, bankAccountId });
}

// ── Date Range Query ──────────────────────────────────────────────

export async function getTransactionsByDateRange(
  uid: string,
  start: Date,
  end: Date,
  type?: TransactionType
): Promise<Transaction[]> {
  const constraints: QueryConstraint[] = [
    where('dueDate', '>=', toTimestamp(start)),
    where('dueDate', '<=', toTimestamp(end)),
  ];

  if (type) {
    constraints.push(where('type', '==', type));
  }

  constraints.push(orderBy('dueDate', 'asc'));

  const q = query(transactionsCol(uid), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTransaction);
}

// ── Summary ───────────────────────────────────────────────────────

export async function getTransactionsSummary(
  uid: string,
  start: Date,
  end: Date
): Promise<{ totalIncome: number; totalCosts: number; totalExpenses: number; netResult: number }> {
  const transactions = await getTransactionsByDateRange(uid, start, end);

  let totalIncome = 0;
  let totalCosts = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.status === 'cancelled') continue;

    switch (t.type) {
      case 'income':
        totalIncome += t.amount;
        break;
      case 'cost':
        totalCosts += t.amount;
        break;
      case 'expense':
        totalExpenses += t.amount;
        break;
    }
  }

  return {
    totalIncome,
    totalCosts,
    totalExpenses,
    netResult: totalIncome - totalCosts - totalExpenses,
  };
}

// ── Bulk Operations ───────────────────────────────────────────────

export async function bulkMarkAsPaid(
  uid: string,
  ids: string[],
  paymentDate: Date,
  bankAccountId: string
): Promise<void> {
  const batch = writeBatch(db);

  for (const id of ids) {
    const transactionSnap = await getDoc(transactionDoc(uid, id));
    const amount = transactionSnap.exists() ? (transactionSnap.data().amount as number) || 0 : 0;

    batch.update(transactionDoc(uid, id), {
      status: 'paid',
      paymentStatus: 'paid',
      paidAmount: amount,
      remainingAmount: 0,
      paymentDate: toTimestamp(paymentDate),
      bankAccountId,
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
  await logAudit(uid, 'bulk_mark_paid', ids.join(','), { count: ids.length, bankAccountId });
}

export async function bulkDelete(uid: string, ids: string[]): Promise<void> {
  const batch = writeBatch(db);

  for (const id of ids) {
    batch.delete(transactionDoc(uid, id));
  }

  await batch.commit();
  await logAudit(uid, 'bulk_delete', ids.join(','), { count: ids.length });
}
