import { FiscalInvoiceFormData } from '@/types';

export interface FiscalProviderResult {
  provider: 'focus' | 'nfeio' | 'mock';
  environment: 'homologation' | 'production';
  status: 'processing' | 'authorized' | 'rejected' | 'simulation';
  providerInvoiceId?: string;
  providerStatus?: string;
  providerMessage?: string;
  invoiceNumber?: string;
  verificationCode?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  rawResponse?: Record<string, unknown>;
}

interface IssueInput {
  reference: string;
  invoice: FiscalInvoiceFormData;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function getEnvironment(): 'homologation' | 'production' {
  return process.env.FISCAL_ENVIRONMENT === 'production' ? 'production' : 'homologation';
}

function getFocusBaseUrl() {
  return process.env.FOCUS_NFE_BASE_URL || 'https://api.focusnfe.com.br/v2';
}

function getFocusAuthHeader() {
  const token = process.env.FOCUS_NFE_TOKEN;
  if (!token) return null;
  return `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
}

function getNfeioBaseUrl() {
  return process.env.NFEIO_BASE_URL || 'https://api.nfe.io/v2';
}

function getNfeioApiKey() {
  return (process.env.NFEIO_INVOICE_KEY || process.env.NFEIO_API_KEY || '').trim() || null;
}

function getNfeioCompanyId() {
  return process.env.NFEIO_COMPANY_ID?.trim() || null;
}

function mapStatus(raw: Record<string, unknown>): FiscalProviderResult['status'] {
  const status = String(raw.status || raw.codigo || '').toLowerCase();
  if (
    status.includes('autoriz') ||
    status.includes('issued') ||
    status.includes('done') ||
    status.includes('success')
  ) {
    return 'authorized';
  }
  if (
    status.includes('erro') ||
    status.includes('error') ||
    status.includes('fail') ||
    status.includes('cancel') ||
    status.includes('rejeit')
  ) {
    return 'rejected';
  }
  return 'processing';
}

function buildFocusPayload(invoice: FiscalInvoiceFormData) {
  const issuerCnpj = onlyDigits(process.env.COMPANY_CNPJ || '66121072000103');
  const municipalRegistration = process.env.COMPANY_MUNICIPAL_REGISTRATION;
  const issuerCityCode = process.env.COMPANY_CITY_CODE;

  return {
    data_emissao: new Date().toISOString(),
    natureza_operacao: '1',
    optante_simples_nacional: process.env.FISCAL_SIMPLES_NACIONAL !== 'false',
    incentivador_cultural: false,
    prestador: {
      cnpj: issuerCnpj,
      inscricao_municipal: municipalRegistration || undefined,
      codigo_municipio: issuerCityCode || undefined,
    },
    tomador: {
      cpf: onlyDigits(invoice.customer.document).length === 11 ? onlyDigits(invoice.customer.document) : undefined,
      cnpj: onlyDigits(invoice.customer.document).length === 14 ? onlyDigits(invoice.customer.document) : undefined,
      razao_social: invoice.customer.name,
      email: invoice.customer.email || undefined,
      telefone: invoice.customer.phone ? onlyDigits(invoice.customer.phone) : undefined,
      endereco: {
        logradouro: invoice.customer.address.street,
        numero: invoice.customer.address.number,
        complemento: invoice.customer.address.complement || undefined,
        bairro: invoice.customer.address.district,
        codigo_municipio: invoice.customer.address.cityCode,
        uf: invoice.customer.address.state,
        cep: onlyDigits(invoice.customer.address.zipCode),
      },
    },
    servico: {
      discriminacao: invoice.service.description,
      item_lista_servico: invoice.service.serviceListItem,
      codigo_tributario_municipio: invoice.service.municipalServiceCode || undefined,
      valor_servicos: invoice.service.amount,
      valor_deducoes: invoice.service.deductions || 0,
      aliquota: invoice.service.taxRate,
      iss_retido: invoice.service.issWithheld,
    },
  };
}

function buildNfeioPayload(reference: string, invoice: FiscalInvoiceFormData) {
  return {
    externalId: reference,
    description: invoice.service.description,
    cityServiceCode: invoice.service.municipalServiceCode || invoice.service.serviceListItem,
    issRate: invoice.service.taxRate,
    servicesAmount: invoice.service.amount,
    deductionsAmount: invoice.service.deductions || 0,
    issHeldByBorrower: invoice.service.issWithheld,
    borrower: {
      federalTaxNumber: onlyDigits(invoice.customer.document),
      name: invoice.customer.name,
      email: invoice.customer.email || undefined,
      phone: invoice.customer.phone ? onlyDigits(invoice.customer.phone) : undefined,
      address: {
        street: invoice.customer.address.street,
        number: invoice.customer.address.number,
        additionalInformation: invoice.customer.address.complement || undefined,
        district: invoice.customer.address.district,
        postalCode: onlyDigits(invoice.customer.address.zipCode),
        state: invoice.customer.address.state,
        city: {
          code: invoice.customer.address.cityCode,
          name: invoice.customer.address.city,
          country: 'BRA',
        },
      },
    },
  };
}

function extractInvoiceId(raw: Record<string, unknown>) {
  return String(raw.id || raw.invoiceId || raw.serviceInvoiceId || raw.externalId || '');
}

function extractInvoiceNumber(raw: Record<string, unknown>) {
  return raw.number || raw.invoiceNumber || raw.nfseNumber || raw.rpsNumber;
}

function extractVerificationCode(raw: Record<string, unknown>) {
  return raw.verificationCode || raw.checkCode || raw.codigo_verificacao;
}

export async function issueFiscalInvoice(input: IssueInput): Promise<FiscalProviderResult> {
  const provider = process.env.FISCAL_PROVIDER || (getNfeioApiKey() && getNfeioCompanyId() ? 'nfeio' : 'mock');
  const environment = getEnvironment();

  if (provider === 'nfeio') {
    const apiKey = getNfeioApiKey();
    const companyId = getNfeioCompanyId();

    if (!apiKey || !companyId) {
      throw new Error('NFEIO_API_KEY e NFEIO_COMPANY_ID precisam estar configurados no servidor.');
    }

    const response = await fetch(
      `${getNfeioBaseUrl()}/companies/${encodeURIComponent(companyId)}/serviceinvoices?apikey=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'X-NFE-APIKEY': apiKey,
          'X-NFEIO-APIKEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildNfeioPayload(input.reference, input.invoice)),
      }
    );

    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(String(raw.message || raw.error || raw.errors || 'Erro ao enviar NFS-e para a NFE.io.'));
    }

    const providerInvoiceId = extractInvoiceId(raw);

    return {
      provider: 'nfeio',
      environment,
      status: mapStatus(raw),
      providerInvoiceId: providerInvoiceId || undefined,
      providerStatus: String(raw.status || response.status),
      providerMessage: String(raw.message || 'NFS-e enviada para fila de emissão da NFE.io.'),
      invoiceNumber: extractInvoiceNumber(raw) ? String(extractInvoiceNumber(raw)) : undefined,
      verificationCode: extractVerificationCode(raw) ? String(extractVerificationCode(raw)) : undefined,
      rawResponse: raw,
    };
  }

  if (provider !== 'focus') {
    return {
      provider: 'mock',
      environment,
      status: 'simulation',
      providerStatus: 'simulation',
      providerMessage: 'Nota simulada. Configure FISCAL_PROVIDER=focus e FOCUS_NFE_TOKEN para emitir NFS-e real.',
      invoiceNumber: `SIM-${input.reference.slice(-6).toUpperCase()}`,
      verificationCode: `TB-${Date.now().toString(36).toUpperCase()}`,
      rawResponse: { reference: input.reference, provider: 'mock' },
    };
  }

  const authorization = getFocusAuthHeader();
  if (!authorization) {
    throw new Error('FOCUS_NFE_TOKEN não configurado no servidor.');
  }

  const response = await fetch(`${getFocusBaseUrl()}/nfse?ref=${encodeURIComponent(input.reference)}`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildFocusPayload(input.invoice)),
  });

  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message = String(raw.mensagem || raw.erros || raw.error || 'Erro ao enviar NFS-e para processamento.');
    throw new Error(message);
  }

  return {
    provider: 'focus',
    environment,
    status: mapStatus(raw),
    providerStatus: String(raw.status || raw.codigo || 'processing'),
    providerMessage: String(raw.mensagem || raw.message || 'NFS-e recebida para processamento.'),
    invoiceNumber: raw.numero ? String(raw.numero) : undefined,
    verificationCode: raw.codigo_verificacao ? String(raw.codigo_verificacao) : undefined,
    pdfUrl: raw.url_danfse ? String(raw.url_danfse) : undefined,
    xmlUrl: raw.caminho_xml_nota_fiscal ? String(raw.caminho_xml_nota_fiscal) : undefined,
    rawResponse: raw,
  };
}

export async function consultFiscalInvoice(reference: string): Promise<FiscalProviderResult> {
  const environment = getEnvironment();

  if ((process.env.FISCAL_PROVIDER || (getNfeioApiKey() && getNfeioCompanyId() ? 'nfeio' : 'mock')) === 'nfeio') {
    const apiKey = getNfeioApiKey();
    const companyId = getNfeioCompanyId();

    if (!apiKey || !companyId) {
      throw new Error('NFEIO_API_KEY e NFEIO_COMPANY_ID precisam estar configurados no servidor.');
    }

    const response = await fetch(
      `${getNfeioBaseUrl()}/companies/${encodeURIComponent(companyId)}/serviceinvoices/external/${encodeURIComponent(reference)}?apikey=${encodeURIComponent(apiKey)}`,
      {
        headers: {
          Authorization: apiKey,
          'X-NFE-APIKEY': apiKey,
          'X-NFEIO-APIKEY': apiKey,
        },
      }
    );
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(String(raw.message || raw.error || raw.errors || 'Erro ao consultar NFS-e na NFE.io.'));
    }

    const providerInvoiceId = extractInvoiceId(raw);
    const pdfUrl = providerInvoiceId
      ? `${getNfeioBaseUrl()}/companies/${encodeURIComponent(companyId)}/serviceinvoices/${encodeURIComponent(providerInvoiceId)}/pdf`
      : undefined;
    const xmlUrl = providerInvoiceId
      ? `${getNfeioBaseUrl()}/companies/${encodeURIComponent(companyId)}/serviceinvoices/${encodeURIComponent(providerInvoiceId)}/xml`
      : undefined;

    return {
      provider: 'nfeio',
      environment,
      status: mapStatus(raw),
      providerInvoiceId: providerInvoiceId || undefined,
      providerStatus: String(raw.status || response.status),
      providerMessage: String(raw.message || 'Consulta realizada na NFE.io.'),
      invoiceNumber: extractInvoiceNumber(raw) ? String(extractInvoiceNumber(raw)) : undefined,
      verificationCode: extractVerificationCode(raw) ? String(extractVerificationCode(raw)) : undefined,
      pdfUrl,
      xmlUrl,
      rawResponse: raw,
    };
  }

  if ((process.env.FISCAL_PROVIDER || 'mock') !== 'focus') {
    return {
      provider: 'mock',
      environment,
      status: 'simulation',
      providerStatus: 'simulation',
      providerMessage: 'Consulta simulada. Configure o provedor fiscal para consultar a NFS-e real.',
      invoiceNumber: `SIM-${reference.slice(-6).toUpperCase()}`,
      verificationCode: `TB-${Date.now().toString(36).toUpperCase()}`,
      rawResponse: { reference, provider: 'mock' },
    };
  }

  const authorization = getFocusAuthHeader();
  if (!authorization) {
    throw new Error('FOCUS_NFE_TOKEN não configurado no servidor.');
  }

  const response = await fetch(`${getFocusBaseUrl()}/nfse/${encodeURIComponent(reference)}`, {
    headers: { Authorization: authorization },
  });
  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(String(raw.mensagem || raw.error || 'Erro ao consultar NFS-e.'));
  }

  return {
    provider: 'focus',
    environment,
    status: mapStatus(raw),
    providerStatus: String(raw.status || raw.codigo || 'processing'),
    providerMessage: String(raw.mensagem || raw.message || 'Consulta realizada.'),
    invoiceNumber: raw.numero ? String(raw.numero) : undefined,
    verificationCode: raw.codigo_verificacao ? String(raw.codigo_verificacao) : undefined,
    pdfUrl: raw.url_danfse ? String(raw.url_danfse) : undefined,
    xmlUrl: raw.caminho_xml_nota_fiscal ? String(raw.caminho_xml_nota_fiscal) : undefined,
    rawResponse: raw,
  };
}
