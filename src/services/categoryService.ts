import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, TransactionType } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants';

// ── Helpers ───────────────────────────────────────────────────────

function categoriesCol(uid: string) {
  return collection(db, 'users', uid, 'categories');
}

function categoryDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'categories', id);
}

function transactionsCol(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

// ── Create ────────────────────────────────────────────────────────

export async function createCategory(
  uid: string,
  data: {
    name: string;
    type: TransactionType;
    color: string;
    icon: string;
  }
): Promise<string> {
  const record = {
    name: data.name,
    type: data.type,
    color: data.color,
    icon: data.icon,
    isDefault: false,
    isActive: true,
    createdAt: Timestamp.now(),
    uid,
  };

  const ref = await addDoc(categoriesCol(uid), record);
  return ref.id;
}

// ── Update ────────────────────────────────────────────────────────

export async function updateCategory(
  uid: string,
  id: string,
  data: Partial<{
    name: string;
    type: TransactionType;
    color: string;
    icon: string;
    isActive: boolean;
  }>
): Promise<void> {
  await updateDoc(categoryDoc(uid, id), { ...data });
}

// ── Delete ────────────────────────────────────────────────────────

export async function deleteCategory(uid: string, id: string): Promise<void> {
  // Check if any transactions reference this category
  const q = query(transactionsCol(uid), where('categoryId', '==', id));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error(
      `Não é possível excluir esta categoria. Existem ${snapshot.size} transação(ões) vinculada(s).`
    );
  }

  await deleteDoc(categoryDoc(uid, id));
}

// ── Read ──────────────────────────────────────────────────────────

export async function getCategories(uid: string): Promise<Category[]> {
  const q = query(categoriesCol(uid), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Category[];
}

export async function getCategoriesByType(
  uid: string,
  type: TransactionType
): Promise<Category[]> {
  const q = query(
    categoriesCol(uid),
    where('type', '==', type),
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Category[];
}

// ── Seed Defaults ─────────────────────────────────────────────────

export async function seedDefaultCategories(uid: string): Promise<void> {
  // Check if defaults already exist
  const existing = await getDocs(
    query(categoriesCol(uid), where('isDefault', '==', true))
  );
  if (!existing.empty) return;

  const batch = writeBatch(db);

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesCol(uid));
    batch.set(ref, {
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
      isActive: true,
      createdAt: Timestamp.now(),
      uid,
    });
  }

  await batch.commit();
}
