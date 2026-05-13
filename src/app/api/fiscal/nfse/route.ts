import { NextRequest } from 'next/server';
import { z } from 'zod';
import { consultFiscalInvoice, issueFiscalInvoice } from '@/lib/fiscalProvider';
import { getFirebaseAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

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

async function requireAuthorizedRequest(request: NextRequest) {
  const provider = process.env.FISCAL_PROVIDER || 'mock';
  const adminAuth = getFirebaseAdminAuth();
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Sessão não informada.');
  }

  if (adminAuth) {
    await adminAuth.verifyIdToken(token);
    return;
  }

  if (provider === 'mock') return;

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
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthorizedRequest(request);
    const payload = invoiceSchema.parse(await request.json());
    const result = await issueFiscalInvoice(payload);
    return Response.json(result);
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
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar NFS-e.';
    return Response.json({ error: message }, { status: 400 });
  }
}
