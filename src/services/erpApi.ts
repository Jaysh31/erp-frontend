// src/services/erpApi.ts

export const ERP_BASE_URL = 'https://erp.sculptortechpvtltd.com';

export interface ErpEndpoint {
  url: string;
  label: string;
  module: string;
  keywords: string[];
}

// ─────────────────────────────────────────────────────────────
// ⚠️ API rule: "Limit must be between 1 and 100"
// Every endpoint uses limit=100 (the max the API accepts).
// To get everything, use fetchAllPages() — it loops page=1,2,3...
// ─────────────────────────────────────────────────────────────
export const ERP_ENDPOINTS: Record<string, ErpEndpoint> = {
  // ── MANUFACTURING ─────────────────────────────────────────
  workOrder: {
    url: `${ERP_BASE_URL}/api/work-order?page=1&limit=100`,
    label: 'Work Orders',
    module: 'manufacturing',
    keywords: ['work order', 'work-order', 'workorder', 'work orders'],
  },
  jobCard: {
    url: `${ERP_BASE_URL}/api/job-card?page=1&limit=100`,
    label: 'Job Cards',
    module: 'manufacturing',
    keywords: ['job card', 'job-card', 'jobcard', 'job cards'],
  },
  inventory: {
    url: `${ERP_BASE_URL}/api/inventory?page=1&limit=100`,
    label: 'Inventory',
    module: 'manufacturing',
    keywords: ['inventory', 'stock', 'inventory list'],
  },
  bom: {
    url: `${ERP_BASE_URL}/api/bom?page=1&limit=100`,
    label: 'BOM',
    module: 'manufacturing',
    keywords: ['bom', 'bill of material', 'bill of materials'],
  },
  stockEntry: {
    url: `${ERP_BASE_URL}/api/stock-entry?page=1&limit=100`,
    label: 'Stock Entries',
    module: 'manufacturing',
    keywords: ['stock entry', 'stock-entry', 'stock entries', 'stock movement'],
  },

  // ── SETUP ─────────────────────────────────────────────────
  item: {
    url: `${ERP_BASE_URL}/api/item?page=1&limit=100`,
    label: 'Items',
    module: 'setup',
    keywords: ['item', 'items', 'item list'],
  },
  itemGroup: {
    url: `${ERP_BASE_URL}/api/item-group?page=1&limit=100`,
    label: 'Item Groups',
    module: 'setup',
    keywords: ['item group', 'item-group', 'item groups'],
  },
  warehouse: {
    url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100`,
    label: 'Warehouses',
    module: 'setup',
    keywords: ['warehouse', 'warehouses'],
  },
  workstation: {
    url: `${ERP_BASE_URL}/api/workstation?page=1&limit=100&sort_order=asc&sort_by=id`,
    label: 'Workstations',
    module: 'setup',
    keywords: ['workstation', 'workstations', 'work station'],
  },
  operation: {
    url: `${ERP_BASE_URL}/api/operation?page=1&limit=100`,
    label: 'Operations',
    module: 'setup',
    keywords: ['operation', 'operations'],
  },
  uom: {
    url: `${ERP_BASE_URL}/api/uom?page=1&limit=100`,
    label: 'Units of Measure',
    module: 'setup',
    keywords: ['uom', 'unit of measure', 'units'],
  },

  // ── QUALITY ───────────────────────────────────────────────
  qualityInspection: {
    url: `${ERP_BASE_URL}/api/quality-inspection?page=1&limit=100`,
    label: 'Quality Inspections',
    module: 'quality',
    keywords: ['quality inspection', 'quality-inspection', 'quality', 'inspections'],
  },

  // ── SALES ─────────────────────────────────────────────────
  lead: {
    url: `${ERP_BASE_URL}/api/lead?page=1&limit=100`,
    label: 'Leads',
    module: 'sales',
    keywords: ['lead', 'leads'],
  },
  quotation: {
    url: `${ERP_BASE_URL}/api/quotation?page=1&limit=100`,
    label: 'Quotations',
    module: 'sales',
    keywords: ['quotation', 'quotations', 'quote'],
  },
  salesOrder: {
    url: `${ERP_BASE_URL}/api/sales-order?page=1&limit=100`,
    label: 'Sales Orders',
    module: 'sales',
    keywords: ['sales order', 'sales-order', 'sales orders', 'salesorder'],
  },
  proformaInvoice: {
    url: `${ERP_BASE_URL}/api/proforma-invoice?page=1&limit=100`,
    label: 'Proforma Invoices',
    module: 'sales',
    keywords: [
      'proforma invoice',
      'proforma-invoice',
      'proforma invoices',
      'proforma',
      'pi ',
    ],
  },
  deliveryNote: {
    url: `${ERP_BASE_URL}/api/delivery-note?page=1&limit=100`,
    label: 'Delivery Notes',
    module: 'sales',
    keywords: [
      'delivery note',
      'delivery-note',
      'delivery notes',
      'delivery challan',
      'delivery-challan',
      'challan',
      'challans',
    ],
  },
  salesInvoice: {
    url: `${ERP_BASE_URL}/api/sales-invoice?page=1&limit=100`,
    label: 'Sales Invoices',
    module: 'sales',
    keywords: [
      'sales invoice',
      'sales-invoice',
      'sales invoices',
      'sales bill',
      'sales bills',
      'tax invoice',
      'tax invoices',
    ],
  },

  // ── ORGANIZATION ──────────────────────────────────────────
  company: {
    url: `${ERP_BASE_URL}/api/company?page=1&limit=100`,
    label: 'Companies',
    module: 'organization',
    keywords: ['company', 'companies'],
  },

  // ── PURCHASING ────────────────────────────────────────────
  purchaseOrder: {
    url: `${ERP_BASE_URL}/api/purchase-order?page=1&limit=100`,
    label: 'Purchase Orders',
    module: 'purchasing',
    keywords: [
      'purchase order',
      'purchase-order',
      'purchase orders',
      'po ',
      'pos ',
    ],
  },
  grn: {
    url: `${ERP_BASE_URL}/api/grn?page=1&limit=100`,
    label: 'GRN',
    module: 'purchasing',
    keywords: [
      'grn',
      'grns',
      'goods receipt note',
      'goods receipt',
      'goods receipt order',
      'goods receipt orders',
    ],
  },
  purchaseInvoice: {
    url: `${ERP_BASE_URL}/api/purchase-invoice?page=1&limit=100`,
    label: 'Purchase Invoices',
    module: 'purchasing',
    keywords: [
      'purchase invoice',
      'purchase-invoice',
      'purchase invoices',
      'purchase bill',
      'purchase bills',
    ],
  },
};

// ============================================================
// AUTH — find the JWT no matter where it's stored
// ============================================================
function getAuthToken(): string | null {
  const directKeys = [
    'token', 'access_token', 'auth_token', 'accessToken',
    'authToken', 'jwt', 'bearer', 'id_token',
  ];

  for (const k of directKeys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!v) continue;
    const cleaned = v.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '');
    if (cleaned.length > 20 && cleaned.split('.').length === 3) {
      console.log(`🔑 Token found in localStorage key "${k}"`);
      return cleaned;
    }
  }

  const objectKeys = [
    'user', 'auth', 'authData', 'auth_data',
    'session', 'loginResponse', 'loggedInUser', 'data',
  ];

  for (const k of objectKeys) {
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      const candidate =
        obj?.token ||
        obj?.access_token ||
        obj?.accessToken ||
        obj?.jwt ||
        obj?.authToken ||
        obj?.id_token ||
        obj?.data?.token ||
        obj?.data?.access_token;
      if (candidate && typeof candidate === 'string' && candidate.split('.').length === 3) {
        console.log(`🔑 Token found nested inside "${k}" key`);
        return candidate.replace(/^Bearer\s+/i, '');
      }
    } catch {
      // not JSON, skip
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key);
    if (!value) continue;

    if (value.split('.').length === 3 && value.length > 40 && value.startsWith('eyJ')) {
      console.log(`🔑 Token found by scanning key "${key}"`);
      return value.replace(/^Bearer\s+/i, '');
    }

    const match = value.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (match) {
      console.log(`🔑 Token found embedded in key "${key}"`);
      return match[0];
    }
  }

  console.warn('❌ No token found in localStorage or sessionStorage');
  return null;
}

// ============================================================
// FETCH — single page
// ============================================================
export interface FetchResult<T = any> {
  ok: boolean;
  data?: T;
  count?: number;
  error?: string;
  status?: number;
}

export async function fetchErpData<T = any>(url: string): Promise<FetchResult<T>> {
  const token = getAuthToken();

  if (!token) {
    return { ok: false, error: 'No auth token found. Please log in again.', status: 401 };
  }

  console.log('📡 Fetching:', url);

  const makeRequest = async (authHeaderValue: string) => {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeaderValue,
      },
    });
  };

  try {
    let res = await makeRequest(`Bearer ${token}`);
    console.log('📡 Status:', res.status);

    if (res.status === 401) {
      res = await makeRequest(token);
      console.log('📡 Status (raw token):', res.status);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('❌ API error body:', body.slice(0, 300));
      return {
        ok: false,
        status: res.status,
        error:
          res.status === 401
            ? 'Unauthorized — token rejected.'
            : res.status === 403
              ? 'Forbidden.'
              : `Request failed (${res.status})`,
      };
    }

    const json = await res.json();
    let count: number | undefined;
    if (Array.isArray(json)) count = json.length;
    else if (typeof json?.count === 'number') count = json.count;
    else if (typeof json?.total === 'number') count = json.total;
    else if (Array.isArray(json?.data)) count = json.data.length;

    return { ok: true, data: json, count };
  } catch (err: any) {
    console.error('❌ Fetch exception:', err);
    return { ok: false, error: err?.message || 'Network error' };
  }
}

// ============================================================
// FETCH ALL PAGES — loops page by page to gather everything
// ============================================================
export interface FetchAllResult<T = any> {
  ok: boolean;
  records: T[];
  total: number;
  pages: number;
  error?: string;
}

export async function fetchAllPages<T = any>(baseUrl: string): Promise<FetchAllResult<T>> {
  const token = getAuthToken();
  if (!token) {
    return {
      ok: false,
      records: [],
      total: 0,
      pages: 0,
      error: 'No auth token found. Please log in again.',
    };
  }

  // Force limit=100 in the URL (the API max), regardless of what came in
  const urlObj = new URL(baseUrl);
  urlObj.searchParams.set('limit', '100');
  const limit = 100;

  const all: T[] = [];
  let page = 1;
  let reportedTotal = 0;
  const MAX_PAGES = 500;

  while (page <= MAX_PAGES) {
    urlObj.searchParams.set('page', String(page));
    const url = urlObj.toString();

    console.log(`📡 Fetching page ${page}:`, url);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`❌ Page ${page} failed (${res.status}):`, errBody.slice(0, 200));
      return {
        ok: false,
        records: all,
        total: all.length,
        pages: page,
        error: `Page ${page} failed (${res.status})`,
      };
    }

    const json = await res.json();

    const raw = json?.data ?? json;
    const rows: T[] =
      (Array.isArray(raw?.records) && raw.records) ||
      (Array.isArray(raw?.data) && raw.data) ||
      (Array.isArray(raw) && raw) ||
      [];

    const declaredTotal =
      raw?.total ??
      raw?.count ??
      raw?.total_count ??
      raw?.totalCount ??
      json?.total ??
      json?.count ??
      undefined;
    if (typeof declaredTotal === 'number') reportedTotal = declaredTotal;

    all.push(...rows);
    console.log(`   page ${page}: got ${rows.length} rows, running total ${all.length}`);

    if (reportedTotal && all.length >= reportedTotal) break;
    if (rows.length < limit) break;

    page += 1;
  }

  console.log(
    `✅ fetchAllPages done: ${all.length} records across ${page} page(s)` +
      (reportedTotal ? ` (API says ${reportedTotal})` : '')
  );

  return {
    ok: true,
    records: all,
    total: reportedTotal || all.length,
    pages: page,
  };
}

// ============================================================
// MATCH ENDPOINT
// ============================================================
export function matchEndpoint(question: string): ErpEndpoint | null {
  const q = question.toLowerCase();
  const allMatches: { keyword: string; endpoint: ErpEndpoint }[] = [];

  for (const ep of Object.values(ERP_ENDPOINTS)) {
    for (const kw of ep.keywords) {
      if (q.includes(kw)) allMatches.push({ keyword: kw, endpoint: ep });
    }
  }

  if (allMatches.length === 0) return null;
  allMatches.sort((a, b) => b.keyword.length - a.keyword.length);
  return allMatches[0].endpoint;
}

// ─── Look up an endpoint's full URL by its key ──────────────────────
export function getEndpointUrl(key: keyof typeof ERP_ENDPOINTS): string {
  return ERP_ENDPOINTS[key].url;
}

/* ============================================================
   AI INTEGRATION
   ============================================================ */

export const AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ⚠️ PASTE YOUR REAL KEY HERE (starts with gsk_)
// ⚠️ DO NOT paste it into chat.
export const AI_API_KEY = 'PASTE_YOUR_GROQ_KEY_HERE';

export const AI_MODEL = 'llama-3.3-70b-versatile';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  ok: boolean;
  reply?: string;
  error?: string;
}

const SYSTEM_PROMPT =
  'You are a helpful assistant for Sculptor Tech ERP. ' +
  'You help users understand their Work Orders, Job Cards, Inventory, BOM, ' +
  'Quotations, Sales Orders, Purchase Orders, and other ERP modules. ' +
  'Answer clearly and concisely.';

export async function askAi(
  question: string,
  history: ChatMessage[] = []
): Promise<AiResponse> {
  if (!question?.trim()) return { ok: false, error: 'Empty question' };

  const key: string = AI_API_KEY;
  if (
    !key ||
    key === 'PASTE_YOUR_GROQ_KEY_HERE' ||
    !key.startsWith('gsk_')
  ) {
    return {
      ok: false,
      error:
        '⚠️ AI API key not set. Open src/services/erpApi.ts and paste your real Groq key into AI_API_KEY.',
    };
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: question },
  ];

  try {
    console.log('🤖 Asking AI:', question.slice(0, 80));

    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    console.log('🤖 AI status:', res.status);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('❌ AI error body:', body.slice(0, 400));
      if (res.status === 401) return { ok: false, error: 'Invalid AI API key.' };
      if (res.status === 429) return { ok: false, error: 'Rate limit reached.' };
      return { ok: false, error: `AI request failed (${res.status})` };
    }

    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim();
    if (!reply) return { ok: false, error: 'AI returned an empty response.' };

    console.log('✅ AI replied:', reply.slice(0, 80));
    return { ok: true, reply };
  } catch (err: any) {
    console.error('❌ AI exception:', err);
    return { ok: false, error: err?.message || 'Network error.' };
  }
}

export async function askAiWithErpContext(
  question: string,
  history: ChatMessage[] = []
): Promise<AiResponse> {
  const endpoint = matchEndpoint(question);

  if (!endpoint) {
    console.log('🤖 No ERP module matched — asking AI directly');
    return askAi(question, history);
  }

  console.log(`📦 Matched ERP module: ${endpoint.label}`);

  const result = await fetchAllPages(endpoint.url);

  if (!result.ok) {
    return {
      ok: false,
      error: `Could not fetch ${endpoint.label}: ${result.error}`,
    };
  }

  const records = result.records.slice(0, 50);

  const contextMessage: ChatMessage = {
    role: 'system',
    content:
      `Here is live ${endpoint.label} data from the ERP ` +
      `(showing ${records.length} of ${result.total} records):\n\n` +
      JSON.stringify(records, null, 2),
  };

  return askAi(question, [...history, contextMessage]);
}

// ─── Helper ───
export function extractRecordsFromErp(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.data?.records)) return payload.data.records;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}