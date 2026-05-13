import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { FiscalProviderResult } from '@/lib/fiscalProvider';
import { consultFiscalInvoice, issueFiscalInvoice } from '@/lib/fiscalProvider';

export const runtime = 'nodejs';

const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 10;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

const addressSchema = z.object({
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(2),
  cityCode: z.string().min(7),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().min(8),
});

const invoiceSchema = z.object({
  reference: z.string().min(6).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  invoice: z.object({
    transactionId: z.string().optional(),
    customer: z.object({
      name: z.string().min(2),
      document: z.string().min(11),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      address: addressSchema,
    }),
    service: z.object({
      description: z.string().min(5),
      serviceListItem: z.string().min(4),
      municipalServiceCode: z.string().optional(),
      taxRate: z.coerce.number().min(0).max(100),
      issWithheld: z.boolean(),
      amount: z.coerce.number().positive(),
      deductions: z.coerce.number().min(0).optional(),
    }),
  }),
});

interface FirebaseLookupResponse {
  users?: Array<{ localId?: string }>;
}

interface FirestoreValue {
  stringValue?: string;
}

interface FirestoreDocument {
  fields?: Record<string, FirestoreValue>;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return;
  }

  if (bucket.count >= rateLimitMaxRequests) {
    throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
  }

  bucket.count += 1;
}

async function getFirebaseUidFromToken(token: string) {
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!firebaseApiKey) {
    throw new Error('Firebase API key não configurada para validar sessão.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    }
  );

  if (!response.ok) {
    throw new Error('Sessão inválida ou expirada.');
  }

  const data = (await response.json()) as FirebaseLookupResponse;
  const uid = data.users?.[0]?.localId;
  if (!uid) {
    throw new Error('Sessão inválida ou expirada.');
  }

  return uid;
}

async function requireApprovedUser(uid: string, token: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase projectId não configurado para validar acesso.');
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}/profile/main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Não foi possível validar seu acesso ao sistema.');
  }

  const document = (await response.json()) as FirestoreDocument;
  const accessStatus = document.fields?.accessStatus?.stringValue;

  if (accessStatus !== 'approved') {
    throw new Error('Usuário sem permissão para emitir nota fiscal.');
  }
}

async function requireAuthorizedRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Sessão não informada.');
  }

  const uid = await getFirebaseUidFromToken(token);
  checkRateLimit(uid);
  await requireApprovedUser(uid, token);
}

function sanitizeFiscalResult(result: FiscalProviderResult) {
  const safeResult: Partial<FiscalProviderResult> = { ...result };
  delete safeResult.rawResponse;
  return safeResult;
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthorizedRequest(request);
    const payload = invoiceSchema.parse(await request.json());
    const result = await issueFiscalInvoice(payload);
    return Response.json(sanitizeFiscalResult(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao emitir NFS-e.';
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedRequest(request);
    const reference = request.nextUrl.searchParams.get('reference');
    if (!reference) {
      return Response.json({ error: 'Referência não informada.' }, { status: 400 });
    }
    const result = await consultFiscalInvoice(reference);
    return Response.json(sanitizeFiscalResult(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar NFS-e.';
    return Response.json({ error: message }, { status: 400 });
  }
}
