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
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BankAccount, BankAccountType } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────

function bankAccountsCol(uid: string) {
  return collection(db, 'users', uid, 'bankAccounts');
}

function bankAccountDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'bankAccounts', id);
}

function transactionsCol(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

// ── Create ────────────────────────────────────────────────────────

export async function createBankAccount(
  uid: string,
  data: {
    name: string;
    type: BankAccountType;
    bankName?: string;
    agency?: string;
    accountNumber?: string;
    initialBalance: number;
    color: string;
  }
): Promise<string> {
  const record = {
    name: data.name,
    type: data.type,
    bankName: data.bankName ?? null,
    agency: data.agency ?? null,
    accountNumber: data.accountNumber ?? null,
    initialBalance: data.initialBalance,
    currentBalance: data.initialBalance,
    isActive: true,
    color: data.color,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    uid,
  };

  const ref = await addDoc(bankAccountsCol(uid), record);
  return ref.id;
}

// ── Update ────────────────────────────────────────────────────────

export async function updateBankAccount(
  uid: string,
  id: string,
  data: Partial<{
    name: string;
    type: BankAccountType;
    bankName: string;
    agency: string;
    accountNumber: string;
    initialBalance: number;
    isActive: boolean;
    color: string;
  }>
): Promise<void> {
  await updateDoc(bankAccountDoc(uid, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ── Delete ────────────────────────────────────────────────────────

export async function deleteBankAccount(uid: string, id: string): Promise<void> {
  const q = query(transactionsCol(uid), where('bankAccountId', '==', id));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error(
      `Não é possível excluir esta conta bancária. Existem ${snapshot.size} transação(ões) vinculada(s).`
    );
  }

  await deleteDoc(bankAccountDoc(uid, id));
}

// ── Read ──────────────────────────────────────────────────────────

export async function getBankAccount(
  uid: string,
  id: string
): Promise<BankAccount | null> {
  const docSnap = await getDoc(bankAccountDoc(uid, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as BankAccount;
}

export async function getBankAccounts(uid: string): Promise<BankAccount[]> {
  const q = query(bankAccountsCol(uid), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as BankAccount[];
}

export async function getActiveBankAccounts(uid: string): Promise<BankAccount[]> {
  const q = query(
    bankAccountsCol(uid),
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as BankAccount[];
}

// ── Recalculate Balance ───────────────────────────────────────────

export async function updateBalance(uid: string, id: string): Promise<void> {
  const accountSnap = await getDoc(bankAccountDoc(uid, id));
  if (!accountSnap.exists()) {
    throw new Error('Conta bancária não encontrada.');
  }

  const account = accountSnap.data() as BankAccount;

  // Get all paid transactions for this bank account
  const q = query(
    transactionsCol(uid),
    where('bankAccountId', '==', id),
    where('status', '==', 'paid')
  );
  const snapshot = await getDocs(q);

  let balance = account.initialBalance;

  snapshot.docs.forEach((docSnap) => {
    const t = docSnap.data();
    if (t.type === 'income') {
      balance += t.amount;
    } else {
      balance -= t.amount;
    }
  });

  await updateDoc(bankAccountDoc(uid, id), {
    currentBalance: Math.round(balance * 100) / 100,
    updatedAt: Timestamp.now(),
  });
}

// ── Transfer Between Accounts ─────────────────────────────────────

export async function transferBetweenAccounts(
  uid: string,
  fromId: string,
  toId: string,
  amount: number,
  description: string,
  date: Date
): Promise<void> {
  const batch = writeBatch(db);
  const ts = Timestamp.fromDate(date);
  const now = Timestamp.now();
  const transferGroupId = crypto.randomUUID();

  // Debit from source account (expense-like)
  const debitRef = doc(transactionsCol(uid));
  batch.set(debitRef, {
    type: 'expense',
    description: `Transferência: ${description}`,
    amount,
    categoryId: '',
    bankAccountId: fromId,
    competenceDate: ts,
    dueDate: ts,
    paymentDate: ts,
    status: 'paid',
    paymentMethod: 'bank_transfer',
    isInstallment: false,
    isRecurring: false,
    notes: `Transferência para outra conta. Grupo: ${transferGroupId}`,
    tags: ['transferencia'],
    installmentGroupId: transferGroupId,
    createdAt: now,
    updatedAt: now,
    uid,
  });

  // Credit to destination account (income-like)
  const creditRef = doc(transactionsCol(uid));
  batch.set(creditRef, {
    type: 'income',
    description: `Transferência: ${description}`,
    amount,
    categoryId: '',
    bankAccountId: toId,
    competenceDate: ts,
    dueDate: ts,
    paymentDate: ts,
    status: 'paid',
    paymentMethod: 'bank_transfer',
    isInstallment: false,
    isRecurring: false,
    notes: `Transferência de outra conta. Grupo: ${transferGroupId}`,
    tags: ['transferencia'],
    installmentGroupId: transferGroupId,
    createdAt: now,
    updatedAt: now,
    uid,
  });

  await batch.commit();

  // Recalculate both account balances
  await Promise.all([updateBalance(uid, fromId), updateBalance(uid, toId)]);
}

// ── Seed Default ──────────────────────────────────────────────────

export async function seedDefaultBankAccount(uid: string): Promise<void> {
  const existing = await getDocs(bankAccountsCol(uid));
  if (!existing.empty) return;

  await addDoc(bankAccountsCol(uid), {
    name: 'Caixa Principal',
    type: 'cash' as BankAccountType,
    bankName: null,
    agency: null,
    accountNumber: null,
    initialBalance: 0,
    currentBalance: 0,
    isActive: true,
    color: '#22c55e',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    uid,
  });
}
