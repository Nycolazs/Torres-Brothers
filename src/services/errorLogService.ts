import { addDoc, collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClientErrorLog } from '@/types';

interface ClientErrorPayload {
  uid?: string | null;
  route?: string;
  source: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      stack: undefined,
    };
  }

  return {
    message: 'Erro desconhecido',
    stack: undefined,
  };
}

export async function logClientError(payload: ClientErrorPayload): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, 'clientErrors'), {
      ...payload,
      uid: payload.uid || null,
      route: payload.route || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn('[ErrorLog] Falha ao registrar erro no Firestore:', error);
  }
}

export function buildClientErrorPayload(
  error: unknown,
  source: string,
  metadata?: Record<string, unknown>,
  uid?: string | null
): ClientErrorPayload {
  const serialized = serializeError(error);

  return {
    uid,
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    source,
    message: serialized.message,
    stack: serialized.stack,
    metadata,
  };
}

export async function listClientErrors(max = 50): Promise<ClientErrorLog[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, 'clientErrors'), orderBy('createdAt', 'desc'), limit(max))
  );

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  } as ClientErrorLog));
}
