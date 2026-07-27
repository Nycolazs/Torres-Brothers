import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPaymentProvider } from '@/lib/paymentProvider';
import { onlyDigits } from '@/lib/utils';
import {
  BankStatementImport,
  BankStatementItem,
  Charge,
  ChargeFormData,
  Contact,
  ContactFormData,
  ContactSnapshot,
  ContactType,
  FinancialAccount,
  FinancialAccountFormData,
  PaymentStatus,
  AuditLog,
  ProviderSetting,
  ProviderSettingFormData,
  ReconciliationStatus,
  ServiceCatalogFormData,
  ServiceCatalogItem,
  Transaction,
  TransactionPayment,
  TransactionPaymentFormData,
} from '@/types';

function userCol(uid: string, path: string) {
  return collection(db, 'users', uid, path);
}

function userDoc(uid: string, path: string, id: string) {
  return doc(db, 'users', uid, path, id);
}

function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function docTo<T>(docSnap: DocumentSnapshot): T {
  return { id: docSnap.id, ...docSnap.data() } as T;
}

function cleanRecord(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

async function logAudit(
  uid: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  try {
    await addDoc(userCol(uid, 'auditLogs'), {
      action,
      entity,
      entityId,
      metadata: metadata || {},
      createdAt: Timestamp.now(),
      uid,
    });
  } catch (error) {
    console.warn('[ERPService] Auditoria ignorada para não bloquear a operação:', error);
  }
}

export function buildContactSnapshot(contact: Contact): ContactSnapshot {
  return {
    id: contact.id,
    type: contact.type,
    name: contact.name,
    document: contact.document,
    email: contact.email,
    phone: contact.phone || contact.mobile,
    address: contact.address,
  };
}

// ── Contacts ──────────────────────────────────────────────────────

export async function listContacts(uid: string, type?: ContactType): Promise<Contact[]> {
  const snapshot = await getDocs(query(userCol(uid, 'contacts'), orderBy('name', 'asc')));
  const contacts = snapshot.docs.map((docSnap) => docTo<Contact>(docSnap));

  if (!type) return contacts;

  const acceptedTypes = type === 'customer' ? ['customer', 'both'] : ['supplier', 'both'];
  return contacts.filter((contact) => acceptedTypes.includes(contact.type));
}

export async function saveContact(uid: string, data: ContactFormData): Promise<string> {
  const now = Timestamp.now();
  const normalizedDocument = onlyDigits(data.document || '');
  if (normalizedDocument) {
    const existingContacts = await listContacts(uid);
    const duplicatedContact = existingContacts.find((contact) => {
      if (contact.id === data.id) return false;
      const contactDocument = contact.normalizedDocument || onlyDigits(contact.document || '');
      return contactDocument === normalizedDocument;
    });

    if (duplicatedContact) {
      throw new Error(`Já existe um cadastro com este CPF/CNPJ: ${duplicatedContact.name}.`);
    }
  }

  const record = cleanRecord({
    type: data.type,
    name: data.name.trim(),
    tradeName: data.tradeName?.trim() || null,
    document: data.document?.trim() || null,
    normalizedDocument: normalizedDocument || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    mobile: data.mobile?.trim() || null,
    address: data.address || {},
    blocked: data.blocked,
    notes: data.notes?.trim() || null,
    updatedAt: now,
    uid,
  });

  if (data.id) {
    await updateDoc(userDoc(uid, 'contacts', data.id), record);
    await logAudit(uid, 'update', 'contact', data.id);
    return data.id;
  }

  const ref = await addDoc(userCol(uid, 'contacts'), {
    ...record,
    createdAt: now,
  });
  await logAudit(uid, 'create', 'contact', ref.id);
  return ref.id;
}

export async function deleteContact(uid: string, id: string): Promise<void> {
  const linkedTransactions = await getDocs(
    query(userCol(uid, 'transactions'), where('contactId', '==', id))
  );
  if (!linkedTransactions.empty) {
    throw new Error('Este cadastro possui lançamentos vinculados e não pode ser excluído.');
  }
  await deleteDoc(userDoc(uid, 'contacts', id));
  await logAudit(uid, 'delete', 'contact', id);
}

// ── Services ──────────────────────────────────────────────────────

export async function listServices(uid: string): Promise<ServiceCatalogItem[]> {
  const snapshot = await getDocs(query(userCol(uid, 'services'), orderBy('description', 'asc')));
  return snapshot.docs.map((docSnap) => docTo<ServiceCatalogItem>(docSnap));
}

export async function saveService(uid: string, data: ServiceCatalogFormData): Promise<string> {
  const now = Timestamp.now();
  const record = cleanRecord({
    description: data.description.trim(),
    serviceListItem: data.serviceListItem.trim(),
    municipalServiceCode: data.municipalServiceCode?.trim() || null,
    taxRate: data.taxRate || 0,
    issWithheld: data.issWithheld,
    defaultAmount: data.defaultAmount || 0,
    isActive: data.isActive,
    notes: data.notes?.trim() || null,
    updatedAt: now,
    uid,
  });

  if (data.id) {
    await updateDoc(userDoc(uid, 'services', data.id), record);
    await logAudit(uid, 'update', 'service', data.id);
    return data.id;
  }

  const ref = await addDoc(userCol(uid, 'services'), {
    ...record,
    createdAt: now,
  });
  await logAudit(uid, 'create', 'service', ref.id);
  return ref.id;
}

// ── Financial Accounts ────────────────────────────────────────────

export async function listFinancialAccounts(uid: string): Promise<FinancialAccount[]> {
  const snapshot = await getDocs(query(userCol(uid, 'financialAccounts'), orderBy('name', 'asc')));
  return snapshot.docs.map((docSnap) => docTo<FinancialAccount>(docSnap));
}

export async function saveFinancialAccount(
  uid: string,
  data: FinancialAccountFormData
): Promise<string> {
  const now = Timestamp.now();
  const record = cleanRecord({
    name: data.name.trim(),
    type: data.type,
    dreClassification: data.dreClassification,
    parentId: data.parentId || null,
    isDefault: false,
    isActive: data.isActive,
    updatedAt: now,
    uid,
  });

  if (data.id) {
    await updateDoc(userDoc(uid, 'financialAccounts', data.id), record);
    await logAudit(uid, 'update', 'financialAccount', data.id);
    return data.id;
  }

  const ref = await addDoc(userCol(uid, 'financialAccounts'), {
    ...record,
    createdAt: now,
  });
  await logAudit(uid, 'create', 'financialAccount', ref.id);
  return ref.id;
}

// ── Transaction Payments ──────────────────────────────────────────

export async function listTransactionPayments(
  uid: string,
  transactionId: string
): Promise<TransactionPayment[]> {
  const snapshot = await getDocs(
    query(
      userCol(uid, 'transactionPayments'),
      where('transactionId', '==', transactionId),
      orderBy('paymentDate', 'asc')
    )
  );
  return snapshot.docs.map((docSnap) => docTo<TransactionPayment>(docSnap));
}

export async function settleTransaction(
  uid: string,
  transaction: Transaction,
  data: TransactionPaymentFormData
): Promise<string> {
  const now = Timestamp.now();
  const interest = data.interest || 0;
  const discount = data.discount || 0;
  const paidTotal = Math.max(0, data.amount + interest - discount);
  const previousPaid = transaction.paidAmount || (transaction.status === 'paid' ? transaction.amount : 0);
  const nextPaid = Math.min(transaction.amount, Math.round((previousPaid + paidTotal) * 100) / 100);
  const remaining = Math.max(0, Math.round((transaction.amount - nextPaid) * 100) / 100);
  const paymentStatus: PaymentStatus = remaining <= 0 ? 'paid' : 'partial';
  const status = paymentStatus === 'paid' ? 'paid' : transaction.status;
  const batch = writeBatch(db);
  const paymentRef = doc(userCol(uid, 'transactionPayments'));

  batch.set(paymentRef, {
    transactionId: transaction.id,
    type: transaction.type,
    amount: data.amount,
    interest,
    discount,
    paidTotal,
    paymentDate: toTimestamp(data.paymentDate),
    bankAccountId: data.bankAccountId,
    paymentMethod: data.paymentMethod,
    notes: data.notes?.trim() || null,
    receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
    createdAt: now,
    uid,
  });

  batch.update(userDoc(uid, 'transactions', transaction.id), {
    status,
    paymentStatus,
    paidAmount: nextPaid,
    remainingAmount: remaining,
    paymentDate: paymentStatus === 'paid' ? toTimestamp(data.paymentDate) : transaction.paymentDate || null,
    bankAccountId: data.bankAccountId,
    paymentMethod: data.paymentMethod,
    updatedAt: now,
  });

  await batch.commit();
  await logAudit(uid, 'settle', 'transaction', transaction.id, {
    paymentId: paymentRef.id,
    amount: data.amount,
    interest,
    discount,
  });
  return paymentRef.id;
}

// ── Charges ───────────────────────────────────────────────────────

export async function listCharges(uid: string): Promise<Charge[]> {
  const snapshot = await getDocs(query(userCol(uid, 'charges'), orderBy('dueDate', 'desc')));
  const charges = snapshot.docs.map((docSnap) => docTo<Charge>(docSnap));
  const now = new Date();
  const updates = charges
    .filter((charge) => charge.status !== 'paid' && charge.status !== 'cancelled' && charge.dueDate.toDate() < now)
    .map((charge) => updateDoc(userDoc(uid, 'charges', charge.id), {
      status: 'overdue',
      updatedAt: Timestamp.now(),
    }));

  if (updates.length > 0) {
    await Promise.all(updates);
    await logAudit(uid, 'auto_overdue', 'charges', 'batch', { count: updates.length });
  }

  return charges.map((charge) => ({
    ...charge,
    status:
      charge.status !== 'paid' && charge.status !== 'cancelled' && charge.dueDate.toDate() < now
        ? 'overdue'
        : charge.status,
  }));
}

export async function saveCharge(uid: string, data: ChargeFormData): Promise<string> {
  const now = Timestamp.now();
  const providerResult = await getPaymentProvider(data.provider).createCharge(data);
  const record = cleanRecord({
    transactionId: data.transactionId || null,
    contactId: data.contactId || null,
    contactSnapshot: data.contactSnapshot || null,
    description: data.description.trim(),
    amount: data.amount,
    dueDate: toTimestamp(data.dueDate),
    method: data.method,
    status: data.status,
    provider: providerResult.provider,
    providerChargeId: providerResult.providerChargeId || null,
    notes: data.notes?.trim() || null,
    paymentLink: providerResult.paymentLink || null,
    barcode: providerResult.barcode || null,
    pixCode: providerResult.pixCode || null,
    updatedAt: now,
    uid,
  });

  const normalizedStatus =
    data.status !== 'paid' && data.status !== 'cancelled' && data.dueDate < new Date()
      ? 'overdue'
      : data.status;

  record.status = normalizedStatus;

  if (data.id) {
    await updateDoc(userDoc(uid, 'charges', data.id), record);
    await logAudit(uid, 'update', 'charge', data.id, { status: normalizedStatus });
    return data.id;
  }

  const ref = await addDoc(userCol(uid, 'charges'), {
    ...record,
    createdAt: now,
  });

  if (data.transactionId) {
    await updateDoc(userDoc(uid, 'transactions', data.transactionId), {
      chargeId: ref.id,
      updatedAt: now,
    });
  }

  await logAudit(uid, 'create', 'charge', ref.id, {
    transactionId: data.transactionId || null,
    status: normalizedStatus,
  });
  return ref.id;
}

export async function updateChargeStatus(
  uid: string,
  id: string,
  status: Charge['status']
): Promise<void> {
  await updateDoc(userDoc(uid, 'charges', id), {
    status,
    updatedAt: Timestamp.now(),
  });
  await logAudit(uid, 'status', 'charge', id, { status });
}

export async function deleteCharge(uid: string, charge: Charge): Promise<void> {
  const batch = writeBatch(db);

  batch.delete(userDoc(uid, 'charges', charge.id));
  if (charge.transactionId) {
    batch.update(userDoc(uid, 'transactions', charge.transactionId), {
      chargeId: null,
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
  await logAudit(uid, 'delete', 'charge', charge.id, {
    transactionId: charge.transactionId || null,
  });
}

// ── Bank Reconciliation ───────────────────────────────────────────

function readOfxTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'));
  return match?.[1]?.trim() || '';
}

function parseOfxDate(value: string) {
  const compact = value.slice(0, 8);
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6)) - 1;
  const day = Number(compact.slice(6, 8));
  return new Date(year, month, day);
}

export function parseOfx(text: string) {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>)/gi) || [];
  return blocks.map((block, index) => {
    const amount = Number(readOfxTag(block, 'TRNAMT').replace(',', '.')) || 0;
    const date = parseOfxDate(readOfxTag(block, 'DTPOSTED'));
    return {
      date,
      amount,
      description: readOfxTag(block, 'MEMO') || readOfxTag(block, 'NAME') || 'Movimento bancário',
      externalId: readOfxTag(block, 'FITID') || `ofx-${Date.now()}-${index}`,
    };
  });
}

export async function importOfxStatement(
  uid: string,
  bankAccountId: string,
  fileName: string,
  text: string
): Promise<string> {
  const items = parseOfx(text);
  const now = Timestamp.now();
  const batch = writeBatch(db);
  const importRef = doc(userCol(uid, 'bankStatementImports'));

  batch.set(importRef, {
    bankAccountId,
    fileName,
    format: 'ofx',
    itemCount: items.length,
    importedAt: now,
    uid,
  } satisfies Omit<BankStatementImport, 'id'>);

  for (const item of items) {
    const itemRef = doc(userCol(uid, 'bankStatementItems'));
    batch.set(itemRef, {
      importId: importRef.id,
      bankAccountId,
      date: toTimestamp(item.date),
      description: item.description,
      amount: item.amount,
      externalId: item.externalId,
      status: 'pending' as ReconciliationStatus,
      createdAt: now,
      updatedAt: now,
      uid,
    });
  }

  await batch.commit();
  await logAudit(uid, 'import', 'bankStatementImport', importRef.id, {
    fileName,
    itemCount: items.length,
  });
  return importRef.id;
}

export async function importCnabStatement(): Promise<never> {
  throw new Error('Importação CNAB exige layout bancário real (banco, carteira, versão e tipo de arquivo).');
}

export async function listBankStatementItems(uid: string): Promise<BankStatementItem[]> {
  const snapshot = await getDocs(query(userCol(uid, 'bankStatementItems'), orderBy('date', 'desc')));
  return snapshot.docs.map((docSnap) => docTo<BankStatementItem>(docSnap));
}

export async function listBankStatementImports(uid: string): Promise<BankStatementImport[]> {
  const snapshot = await getDocs(query(userCol(uid, 'bankStatementImports'), orderBy('importedAt', 'desc')));
  return snapshot.docs.map((docSnap) => docTo<BankStatementImport>(docSnap));
}

export async function updateBankStatementItemStatus(
  uid: string,
  id: string,
  status: ReconciliationStatus,
  transactionId?: string
): Promise<void> {
  await updateDoc(userDoc(uid, 'bankStatementItems', id), {
    status,
    matchedTransactionId: transactionId || null,
    updatedAt: Timestamp.now(),
  });
  await logAudit(uid, 'status', 'bankStatementItem', id, { status, transactionId: transactionId || null });
}

export async function createTransactionFromStatementItem(
  uid: string,
  item: BankStatementItem
): Promise<string> {
  const now = Timestamp.now();
  const amount = Math.abs(item.amount);
  const transactionRef = doc(userCol(uid, 'transactions'));
  const batch = writeBatch(db);
  const type = item.amount >= 0 ? 'income' : 'expense';

  batch.set(transactionRef, {
    type,
    description: item.description,
    amount,
    categoryId: '',
    bankAccountId: item.bankAccountId,
    competenceDate: item.date,
    dueDate: item.date,
    paymentDate: item.date,
    status: 'paid',
    paymentStatus: 'paid',
    paidAmount: amount,
    remainingAmount: 0,
    paymentMethod: 'bank_transfer',
    isInstallment: false,
    isRecurring: false,
    notes: `Criado pela conciliação bancária. Item OFX: ${item.externalId || item.id}`,
    tags: ['conciliacao-bancaria'],
    reconciliationId: item.id,
    sourceModule: 'bank_reconciliation',
    createdAt: now,
    updatedAt: now,
    uid,
  });

  batch.update(userDoc(uid, 'bankStatementItems', item.id), {
    status: 'reconciled',
    createdTransactionId: transactionRef.id,
    updatedAt: now,
  });

  await batch.commit();
  await logAudit(uid, 'create_from_statement', 'transaction', transactionRef.id, {
    statementItemId: item.id,
  });
  return transactionRef.id;
}

export async function undoBankReconciliation(uid: string, item: BankStatementItem): Promise<void> {
  const batch = writeBatch(db);
  if (item.createdTransactionId) {
    batch.delete(userDoc(uid, 'transactions', item.createdTransactionId));
  }
  batch.update(userDoc(uid, 'bankStatementItems', item.id), {
    status: 'pending',
    matchedTransactionId: null,
    createdTransactionId: null,
    updatedAt: Timestamp.now(),
  });
  await batch.commit();
  await logAudit(uid, 'undo', 'bankStatementItem', item.id, {
    deletedTransactionId: item.createdTransactionId || null,
  });
}

// ── Audit / Provider Settings ─────────────────────────────────────

export async function listAuditLogs(uid: string): Promise<AuditLog[]> {
  const snapshot = await getDocs(query(userCol(uid, 'auditLogs'), orderBy('createdAt', 'desc')));
  return snapshot.docs.slice(0, 200).map((docSnap) => docTo<AuditLog>(docSnap));
}

export async function listProviderSettings(uid: string): Promise<ProviderSetting[]> {
  const snapshot = await getDocs(query(userCol(uid, 'providerSettings'), orderBy('kind', 'asc')));
  return snapshot.docs.map((docSnap) => docTo<ProviderSetting>(docSnap));
}

export async function saveProviderSetting(
  uid: string,
  data: ProviderSettingFormData,
  updatedBy?: string
): Promise<string> {
  const now = Timestamp.now();
  const record = cleanRecord({
    kind: data.kind,
    status: data.status,
    displayName: data.displayName.trim(),
    notes: data.notes?.trim() || null,
    updatedAt: now,
    updatedBy: updatedBy || null,
    uid,
  });

  if (data.id) {
    await updateDoc(userDoc(uid, 'providerSettings', data.id), record);
    await logAudit(uid, 'update', 'providerSetting', data.id, { kind: data.kind, status: data.status });
    return data.id;
  }

  const ref = await addDoc(userCol(uid, 'providerSettings'), record);
  await logAudit(uid, 'create', 'providerSetting', ref.id, { kind: data.kind, status: data.status });
  return ref.id;
}

// ── Proposals ─────────────────────────────────────────────────────

export interface ProposalItem {
  serviceId: string;
  title: string;
  description: string;
  statusFinanceiro: string;
  qty: number;
  unitPrice: number;
}

export interface Proposal {
  id?: string;
  title: string;
  selectedContactId: string;
  customContactName: string;
  networkName: string;
  contractingName: string;
  clientCnpj: string;
  additionalAmount: number;
  proposalDate: string;
  validityDays: string;
  introduction: string;
  paymentTerms: string;
  executionTime: string;
  observations: string;
  items: ProposalItem[];
  createdAt: string | Timestamp;
}

export async function listProposals(uid: string): Promise<Proposal[]> {
  const snapshot = await getDocs(query(userCol(uid, 'proposals'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
    } as Proposal;
  });
}

export async function saveProposal(uid: string, proposal: Omit<Proposal, 'id'> & { id?: string }): Promise<string> {
  const now = Timestamp.now();
  const record = {
    title: proposal.title,
    selectedContactId: proposal.selectedContactId,
    customContactName: proposal.customContactName,
    networkName: proposal.networkName,
    contractingName: proposal.contractingName,
    clientCnpj: proposal.clientCnpj,
    additionalAmount: proposal.additionalAmount,
    proposalDate: proposal.proposalDate,
    validityDays: proposal.validityDays,
    introduction: proposal.introduction,
    paymentTerms: proposal.paymentTerms,
    executionTime: proposal.executionTime,
    observations: proposal.observations,
    items: proposal.items,
    createdAt: proposal.createdAt ? (typeof proposal.createdAt === 'string' ? Timestamp.fromDate(new Date(proposal.createdAt)) : proposal.createdAt) : now,
    updatedAt: now,
  };

  if (proposal.id) {
    await updateDoc(userDoc(uid, 'proposals', proposal.id), record);
    await logAudit(uid, 'update', 'proposal', proposal.id, { title: proposal.title });
    return proposal.id;
  }

  const ref = await addDoc(userCol(uid, 'proposals'), record);
  await logAudit(uid, 'create', 'proposal', ref.id, { title: proposal.title });
  return ref.id;
}

export async function deleteProposal(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, 'proposals', id));
  await logAudit(uid, 'delete', 'proposal', id);
}
