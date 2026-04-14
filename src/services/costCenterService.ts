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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CostCenter } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────

function costCentersCol(uid: string) {
  return collection(db, 'users', uid, 'costCenters');
}

function costCenterDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'costCenters', id);
}

function transactionsCol(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

// ── Create ────────────────────────────────────────────────────────

export async function createCostCenter(
  uid: string,
  data: { name: string; description?: string }
): Promise<string> {
  const record = {
    name: data.name,
    description: data.description ?? null,
    isActive: true,
    createdAt: Timestamp.now(),
    uid,
  };

  const ref = await addDoc(costCentersCol(uid), record);
  return ref.id;
}

// ── Update ────────────────────────────────────────────────────────

export async function updateCostCenter(
  uid: string,
  id: string,
  data: Partial<{ name: string; description: string; isActive: boolean }>
): Promise<void> {
  await updateDoc(costCenterDoc(uid, id), { ...data });
}

// ── Delete ────────────────────────────────────────────────────────

export async function deleteCostCenter(uid: string, id: string): Promise<void> {
  // Check if any transactions reference this cost center
  const q = query(transactionsCol(uid), where('costCenterId', '==', id));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error(
      `Não é possível excluir este centro de custo. Existem ${snapshot.size} transação(ões) vinculada(s).`
    );
  }

  await deleteDoc(costCenterDoc(uid, id));
}

// ── Read ──────────────────────────────────────────────────────────

export async function getCostCenter(
  uid: string,
  id: string
): Promise<CostCenter | null> {
  const docSnap = await getDoc(costCenterDoc(uid, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as CostCenter;
}

export async function getCostCenters(uid: string): Promise<CostCenter[]> {
  const q = query(costCentersCol(uid), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as CostCenter[];
}

export async function getActiveCostCenters(uid: string): Promise<CostCenter[]> {
  const q = query(
    costCentersCol(uid),
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as CostCenter[];
}

// ── Seed Default ──────────────────────────────────────────────────

export async function seedDefaultCostCenter(uid: string): Promise<void> {
  const existing = await getDocs(costCentersCol(uid));
  if (!existing.empty) return;

  await addDoc(costCentersCol(uid), {
    name: 'Operações',
    description: 'Centro de custo principal',
    isActive: true,
    createdAt: Timestamp.now(),
    uid,
  });
}
