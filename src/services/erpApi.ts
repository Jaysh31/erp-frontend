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
// ROUTE MAP — which page URL belongs to which endpoint
// ============================================================
// Used by the chatbot to navigate the user when they ask
// "go to BOM page", "open sales order", etc.
// ============================================================
export const ENDPOINT_ROUTES: Record<string, string> = {
  workOrder: '/work-order',
  jobCard: '/job-card',
  inventory: '/InventoryList',
  bom: '/bom',
  stockEntry: '/stock-entry',
  item: '/item-list',
  itemGroup: '/item-group',
  warehouse: '/warehouse',
  workstation: '/Workstation',
  operation: '/operations',
  uom: '/uom',
  qualityInspection: '/quality-inspection',
  lead: '/lead',
  quotation: '/quotation',
  salesOrder: '/sales-order',
  proformaInvoice: '/proforma-invoice',
  deliveryNote: '/delivery-challan',
  salesInvoice: '/sales-bill',
  company: '/company',
  purchaseOrder: '/purchase-order',
  grn: '/grn',
  purchaseInvoice: '/purchase-invoice',
};

// ============================================================
// DASHBOARD ROUTES — special pages that aggregate multiple modules
// ============================================================
// These do NOT have their own API. They compose data from
// several page APIs. Used by the chatbot to detect "you are on
// a dashboard" and give module-aware summaries.
// ============================================================
export const DASHBOARD_ROUTES: Record<string, string> = {
  '/dashboard/sales': 'Sales Dashboard',
  '/dashboard/manufacturing': 'Manufacturing Dashboard',
  '/dashboard/setup': 'Setup Dashboard',
  '/dashboard/purchasing': 'Purchasing Dashboard',
  '/dashboard/organization': 'Organization Dashboard',
  '/dashboard/quality': 'Quality Dashboard',
  '/dashboard/stock': 'Stock Dashboard',
  '/dashboard/accounting': 'Accounting Dashboard',
  '/dashboard/reports': 'Reports Dashboard',
  '/dashboard/tools': 'Tools Dashboard',
  '/dashboard': 'Dashboard',
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

export function getEndpointUrl(key: keyof typeof ERP_ENDPOINTS): string {
  return ERP_ENDPOINTS[key].url;
}

// ============================================================
// ROUTE HELPERS — for chatbot navigation
// ============================================================

/**
 * Get the app page path for an endpoint key.
 * Example: getEndpointRoute('bom') → '/bom'
 */
export function getEndpointRoute(
  key: keyof typeof ERP_ENDPOINTS
): string | null {
  return ENDPOINT_ROUTES[key] || null;
}

/**
 * Find an endpoint key by its route.
 * Example: findEndpointKeyByRoute('/bom') → 'bom'
 */
export function findEndpointKeyByRoute(route: string): string | null {
  const sorted = Object.entries(ENDPOINT_ROUTES).sort(
    (a, b) => b[1].length - a[1].length
  );
  for (const [key, r] of sorted) {
    if (route.startsWith(r)) return key;
  }
  return null;
}

/**
 * Find an endpoint by matching a route or a label.
 * Useful when a question mentions a module.
 */
export function findEndpointByLabelOrRoute(text: string): ErpEndpoint | null {
  const q = text.toLowerCase();

  // 1. Try label match
  for (const ep of Object.values(ERP_ENDPOINTS)) {
    if (q.includes(ep.label.toLowerCase())) return ep;
  }

  // 2. Try route match
  for (const [key, route] of Object.entries(ENDPOINT_ROUTES)) {
    if (q.includes(route.toLowerCase())) {
      const ep = ERP_ENDPOINTS[key];
      if (ep) return ep;
    }
  }

  return null;
}

/**
 * Detect if a question is a navigation request like
 * "go to BOM page", "open sales order", "navigate to warehouse"
 * and return the target route + label.
 */
export function detectNavigationTarget(question: string): {
  route: string;
  label: string;
} | null {
  const q = question.toLowerCase();

  const navKeywords = [
    'go to',
    'open ',
    'navigate',
    'take me to',
    'show me the page',
    'go on',
    'redirect',
  ];
  const isNav = navKeywords.some((kw) => q.includes(kw));
  if (!isNav) return null;

  // Try to find a matching endpoint
  const endpoint = findEndpointByLabelOrRoute(question);
  if (!endpoint) return null;

  // Find its key so we can get the route
  for (const [key, ep] of Object.entries(ERP_ENDPOINTS)) {
    if (ep === endpoint) {
      const route = ENDPOINT_ROUTES[key];
      if (route) return { route, label: ep.label };
    }
  }

  return null;
}

// ============================================================
// DASHBOARD HELPERS
// ============================================================

/**
 * Check if a pathname is a dashboard page.
 * Example: isDashboardPath('/dashboard/sales') → { isDashboard: true, label: 'Sales Dashboard' }
 */
export function isDashboardPath(pathname: string): {
  isDashboard: boolean;
  label: string;
} {
  const sorted = Object.keys(DASHBOARD_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sorted) {
    if (pathname === key || pathname.startsWith(key + '/')) {
      return { isDashboard: true, label: DASHBOARD_ROUTES[key] };
    }
  }
  return { isDashboard: false, label: '' };
}

// ============================================================
// SETTINGS HELPERS
// ============================================================

/** Common URLs where Settings pages live. */
export const SETTINGS_PATHS = ['/settings', '/Setting', '/admin/settings'];

/** Check if a pathname is a Settings page. */
export function isSettingsPath(pathname: string): boolean {
  return SETTINGS_PATHS.some((p) => pathname.startsWith(p));
}

// ============================================================
// SMART RECORD LOOKUP — search across all modules
// ============================================================

export interface RecordSearchResult {
  endpoint: ErpEndpoint;
  record: any;
}

export function extractSearchToken(question: string): string | null {
  const cleaned = question
    .replace(
      /\b(i want|its|it's|the|of|about|for|show|me|give|detail|details|please|record|info|information|full|is|are)\b/gi,
      ' '
    )
    .replace(/[?.!,]/g, ' ')
    .trim();

  const tokens = cleaned.split(/\s+/).filter(Boolean);

  const strongMatch = tokens.find(
    (t) => /[A-Za-z]/.test(t) && /\d/.test(t) && t.length >= 3
  );
  if (strongMatch) return strongMatch;

  const fallback = tokens.find((t) => /^[A-Za-z0-9_-]{4,}$/.test(t));
  return fallback || null;
}

export async function searchAllModulesForRecord(
  token: string
): Promise<RecordSearchResult | null> {
  const tokenLower = token.toLowerCase();

  const checks = Object.values(ERP_ENDPOINTS).map(async (ep) => {
    try {
      const result = await fetchAllPages(ep.url);
      if (!result.ok) return null;

      const found = result.records.find((r: any) => {
        const candidates = [
          r.name,
          r.id,
          r.item_code,
          r.item_name,
          r.customer_name,
          r.supplier_name,
          r.party_name,
          r.lead_name,
          r.company_name,
          r.warehouse_name,
        ].filter(Boolean);

        return candidates.some((v: any) => {
          const s = String(v).toLowerCase();
          return s === tokenLower || s.includes(tokenLower);
        });
      });

      if (found) {
        console.log(`✅ Found "${token}" in ${ep.label}`);
        return { endpoint: ep, record: found };
      }

      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(checks);
  return (results.find((r) => r !== null) as RecordSearchResult) || null;
}

/* ============================================================
   AI INTEGRATION
   ============================================================ */

export const AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ⚠️ PASTE YOUR REAL KEY HERE (starts with gsk_)
// Get one at: https://console.groq.com/keys
// DO NOT paste the key into chat.
export const AI_API_KEY = '';

export const AI_MODEL = 'openai/gpt-oss-120b';

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
  'When live ERP data is provided to you in a system message, use it to ' +
  'answer questions accurately with real numbers and record names. ' +
  'Never invent data. If the data is not provided, say so.';

// ============================================================
// askAi — send messages to Groq
// ============================================================
export async function askAi(
  question: string,
  history: ChatMessage[] = []
): Promise<AiResponse> {
  if (!question?.trim()) {
    return { ok: false, error: 'Empty question' };
  }

  const key: string = AI_API_KEY;
  if (!key || !key.startsWith('gsk_')) {
    console.warn('⚠️ AI key not set — the AI fallback will be skipped.');
    return {
      ok: false,
      error:
        '⚠️ AI API key not set. Open src/services/erpApi.ts ',
    };
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: question },
  ];

  console.log('🤖 Sending to Groq:', {
    totalMessages: messages.length,
    historyMessages: history.length,
    hasErpContext: history.some((h) => h.content.includes('live')),
  });

  try {
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

    console.log('🤖 Groq response status:', res.status);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('❌ Groq error body:', body.slice(0, 400));
      if (res.status === 401) return { ok: false, error: 'Invalid AI API key.' };
      if (res.status === 429) return { ok: false, error: 'Rate limit reached.' };
      if (res.status === 413) return { ok: false, error: 'Request too large for the AI model.' };
      return { ok: false, error: `AI request failed (${res.status})` };
    }

    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim();
    if (!reply) return { ok: false, error: 'AI returned an empty response.' };

    console.log('✅ Groq replied:', reply.slice(0, 100));
    return { ok: true, reply };
  } catch (err: any) {
    console.error('❌ Groq exception:', err);
    return { ok: false, error: err?.message || 'Network error.' };
  }
}

// ============================================================
// askAiWithErpContext — full flow
// ============================================================
export async function askAiWithErpContext(
  question: string,
  history: ChatMessage[] = []
): Promise<AiResponse> {
  console.log('──────────────────────────────────────');
  console.log('🚀 askAiWithErpContext starting');
  console.log('📝 Question:', question);

  const endpoint = matchEndpoint(question);

  if (!endpoint) {
    console.log('🤖 STEP 1: No ERP module matched → asking AI directly');
    return askAi(question, history);
  }

  console.log(`✅ STEP 1: Matched ERP module = ${endpoint.label}`);

  console.log(`📡 STEP 2: Fetching ${endpoint.label} from ERP...`);
  const result = await fetchAllPages(endpoint.url);

  if (!result.ok) {
    console.warn(`⚠️ STEP 2 failed: ${result.error}`);
    return {
      ok: false,
      error: `Could not fetch ${endpoint.label}: ${result.error}`,
    };
  }

  console.log(`✅ STEP 2: Got ${result.records.length} records from ERP`);

  const records = result.records.slice(0, 10);
  console.log(`✅ STEP 3: Built ERP context (${records.length} records)`);

  const contextMessage: ChatMessage = {
    role: 'system',
    content:
      `Here is live ${endpoint.label} data from the ERP ` +
      `(showing ${records.length} of ${result.total} total records):\n\n` +
      JSON.stringify(records),
  };

  const enrichedHistory: ChatMessage[] = [...history, contextMessage];

  console.log('📤 STEP 4: Sending to Groq with ERP context...');
  const aiResult = await askAi(question, enrichedHistory);

  if (aiResult.ok) {
    console.log('✅ STEP 5: AI answer received');
  } else {
    console.warn(`⚠️ STEP 5: AI failed — ${aiResult.error}`);
  }

  return aiResult;
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