// src/pages/components/chatbot/ChatBot.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaUser, FaSpinner,
} from "react-icons/fa";
import "./ChatBot.css";
import api from "../../../services/api";
import {
  askAiWithErpContext,
  matchEndpoint,
  extractSearchToken,
  searchAllModulesForRecord,
} from "../../../services/erpApi";
interface Msg {
  role: "user" | "bot";
  text: string;
}

// ─── Small helpers ─────────────────────────────────────────────────────
const fmt = (n: number) =>
  (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fmtLakh = (n: number) => {
  if (!n) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(2)} K`;
  return `₹${n.toFixed(0)}`;
};

// ─── Stoplist of common English words that should NOT be search terms ──
const STOP_WORDS = new Set([
  "work", "in", "progress", "the", "and", "for", "with", "from",
  "this", "that", "these", "those", "all", "any", "some", "list",
  "show", "find", "get", "give", "want", "need", "please", "about",
  "detail", "details", "info", "information", "data", "record",
  "records", "item", "items", "order", "orders", "name", "code",
  "one", "two", "three", "yes", "no", "not", "new", "old",
]);

// ─── Levenshtein distance for fuzzy typo tolerance ────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy contains check: does `text` contain `keyword` allowing
 * up to 2 character typos? Used to make "werehouse" match "warehouse".
 */
function fuzzyContains(text: string, keyword: string): boolean {
  const t = text.toLowerCase();
  const k = keyword.toLowerCase();

  // Fast path: exact substring
  if (t.includes(k)) return true;

  // Fuzzy: check each word in text against the keyword
  const words = t.split(/\s+/).filter(Boolean);
  const maxDist = k.length <= 5 ? 1 : 2;

  for (const w of words) {
    // Skip if length is too different
    if (Math.abs(w.length - k.length) > maxDist) continue;
    if (levenshtein(w, k) <= maxDist) return true;
  }
  return false;
}

// ─── Strip pagination wrappers ────────────────────────────────────────
const unwrap = (res: any): any[] => {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.records)) return d.records;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

// ─── Read TRUE total count from any paginated API response ────────────
function getTotalCount(res: any): number {
  const raw = res?.data ?? res;

  const candidates = [
    raw?.total,
    raw?.count,
    raw?.total_count,
    raw?.totalCount,
    raw?.row_count,
    raw?.rowCount,
    raw?.data?.total,
    raw?.data?.count,
    raw?.data?.total_count,
    raw?.pagination?.total,
    raw?.pagination?.total_count,
    raw?.meta?.total,
    raw?.meta?.total_count,
  ];

  for (const c of candidates) {
    if (typeof c === "number" && c >= 0) return c;
  }

  const arr =
    (Array.isArray(raw?.records) && raw.records) ||
    (Array.isArray(raw?.data) && raw.data) ||
    (Array.isArray(raw) && raw) ||
    [];
  return arr.length;
}

// ─── Debug helper ─────────────────────────────────────────────────────
const DEBUG_COUNT = true;

function debugCount(label: string, res: any) {
  if (!DEBUG_COUNT) return;
  const raw = res?.data ?? res;
  const shape = {
    "top-level keys": Object.keys(res || {}),
    "data keys": raw && typeof raw === "object" ? Object.keys(raw) : typeof raw,
    total: raw?.total,
    count: raw?.count,
    total_count: raw?.total_count,
    row_count: raw?.row_count,
    records_length: Array.isArray(raw?.records) ? raw.records.length : undefined,
    data_length: Array.isArray(raw?.data) ? raw.data.length : undefined,
    isArray: Array.isArray(raw),
  };
  console.log(`🔎 [${label}] response shape:`, shape);
}

// ====================================================================
// DATE HELPERS
// ====================================================================

const CREATED_FIELDS = [
  "creation",
  "created_at",
  "createdAt",
  "created_on",
  "creation_date",
  "date_created",
  "created",
  "inserted_at",
  "created_date",
];

const DATE_FIELDS = [
  "transaction_date",
  "posting_date",
  "order_date",
  "date",
  "delivery_date",
  "due_date",
  "valid_till",
  ...CREATED_FIELDS,
];

function getCreatedDate(record: any): Date | null {
  if (!record) return null;
  for (const f of CREATED_FIELDS) {
    const v = record[f];
    if (!v) continue;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getRecordDate(record: any): Date | null {
  if (!record) return null;
  for (const f of DATE_FIELDS) {
    const v = record[f];
    if (!v) continue;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatFullDate(d: Date | null): string {
  if (!d) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const mon = months[d.getMonth()];
  const yr = d.getFullYear();
  const hr = d.getHours();
  const mn = String(d.getMinutes()).padStart(2, "0");
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr % 12 || 12;
  return `${day} ${mon} ${yr}, ${hr12}:${mn} ${ampm}`;
}

function formatShortDate(d: Date | null): string {
  if (!d) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function timeAgo(d: Date | null): string {
  if (!d) return "";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.floor(mo / 12)} yr ago`;
}

// ====================================================================
// DATE-AWARE QUERY ENGINE
// ====================================================================

type DateRange = {
  label: string;
  from: Date;
  to: Date;
} | null;

function detectDateRange(question: string): DateRange {
  const q = question.toLowerCase();
  const now = new Date();
  const today = startOfDay(now);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (/\btoday\b/.test(q)) return { label: "today", from: today, to: today };
  if (/\byesterday\b/.test(q)) return { label: "yesterday", from: yesterday, to: yesterday };
  if (/\btomorrow\b/.test(q)) return { label: "tomorrow", from: tomorrow, to: tomorrow };

  if (/\bthis week\b/.test(q)) {
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { label: "this week", from: monday, to: sunday };
  }
  if (/\blast week\b/.test(q)) {
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff - 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { label: "last week", from: monday, to: sunday };
  }
  if (/\bthis month\b/.test(q)) {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { label: "this month", from, to };
  }
  if (/\blast month\b/.test(q)) {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0);
    return { label: "last month", from, to };
  }
  const lastNDays = q.match(/\blast\s+(\d+)\s+days?\b/);
  if (lastNDays) {
    const n = parseInt(lastNDays[1], 10);
    const from = new Date(today);
    from.setDate(from.getDate() - (n - 1));
    return { label: `last ${n} days`, from, to: today };
  }
  const nextNDays = q.match(/\bnext\s+(\d+)\s+days?\b/);
  if (nextNDays) {
    const n = parseInt(nextNDays[1], 10);
    const to = new Date(today);
    to.setDate(to.getDate() + n);
    return { label: `next ${n} days`, from: today, to };
  }
  return null;
}

function filterByDate(records: any[], range: DateRange): any[] {
  if (!range) return records;
  const from = range.from.getTime();
  const to = range.to.getTime() + 86399999;

  return records.filter((r) => {
    const d = getRecordDate(r);
    if (!d) return false;
    const t = d.getTime();
    return t >= from && t <= to;
  });
}

function rowLine(r: any, idx: number): string {
  const name =
    r.customer_name ||
    r.supplier_name ||
    r.party_name ||
    r.item_name ||
    r.item_code ||
    r.lead_name ||
    r.name ||
    r.title ||
    "Record";
  const id = r.name || r.id || "";
  const amount =
    r.grand_total != null
      ? `₹${fmt(r.grand_total)}`
      : r.total != null
        ? `₹${fmt(r.total)}`
        : "";
  const status = r.status ? ` · ${r.status}` : "";
  const idPart = id && id !== name ? ` (${id})` : "";

  const created = getCreatedDate(r);
  const fallback = created ? null : getRecordDate(r);
  const d = created || fallback;

  const dateStr = d
    ? ` · 📅 ${formatShortDate(d)} (${timeAgo(d)})`
    : "";

  return `${idx + 1}. ${name}${idPart}${amount ? " · " + amount : ""}${status}${dateStr}`;
}

// ─── Generic handler: fetch ANY module and format the reply ──────────
async function answerModuleGeneric(
  documentLabel: string,
  endpoint: string,
  range: DateRange,
  isCount: boolean
): Promise<string> {
  const res = await api.get(endpoint);
  debugCount(documentLabel, res);

  const all = unwrap(res);
  const total = getTotalCount(res);

  let rows = all;
  if (range) {
    rows = filterByDate(all, range);
  }

  if (total === 0 && all.length === 0) {
    return `You have no ${documentLabel.toLowerCase()} yet.`;
  }

  if (range && rows.length === 0) {
    return `No ${documentLabel.toLowerCase()} ${range.label}.`;
  }

  if (isCount && !range) {
    return `You have **${total}** ${documentLabel.toLowerCase()}.`;
  }

  if (isCount && range) {
    return `**${rows.length}** ${documentLabel.toLowerCase()} ${range.label}.`;
  }

  const sorted = [...rows].sort((a, b) => {
    const da = getRecordDate(a)?.getTime() ?? 0;
    const db = getRecordDate(b)?.getTime() ?? 0;
    return db - da;
  });

  const preview = sorted.slice(0, 10).map(rowLine);
  const more = sorted.length > 10 ? `\n…and ${sorted.length - 10} more.` : "";

  const header = range
    ? `📅 **${rows.length}** ${documentLabel.toLowerCase()} ${range.label}`
    : `📊 **${total}** ${documentLabel.toLowerCase()} total`;

  return `${header}\n\nLatest ${Math.min(10, sorted.length)}:\n${preview.join("\n")}${more}`;
}

// ====================================================================
// DETAIL VIEW
// ====================================================================

const HIDDEN_DETAIL_FIELDS = [
  "docstatus",
  "idx",
  "_user_tags",
  "_comments",
  "_assign",
  "_liked_by",
  "owner",
  "modified_by",
  "modified",
  "password",
  "api_key",
  "api_secret",
];

function prettyField(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyValue(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return fmt(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return formatFullDate(d);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    return v;
  }
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? "" : "s"}`;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 100);
  return String(v);
}

function renderRecordDetail(record: any, moduleLabel: string): string {
  const lines: string[] = [];

  const name =
    record.customer_name ||
    record.supplier_name ||
    record.party_name ||
    record.item_name ||
    record.lead_name ||
    record.name ||
    record.id ||
    "Record";

  lines.push(`📄 **${moduleLabel}: ${name}**`);
  lines.push("");

  const headerFields = [
    "name", "id", "status", "grand_total", "total", "currency",
    "transaction_date", "posting_date", "order_date", "creation",
  ];
  for (const f of headerFields) {
    if (record[f] !== undefined && record[f] !== null && record[f] !== "") {
      lines.push(`**${prettyField(f)}:** ${prettyValue(record[f])}`);
    }
  }

  const shown = new Set([...headerFields, ...HIDDEN_DETAIL_FIELDS]);
  const otherKeys = Object.keys(record).filter(
    (k) =>
      !shown.has(k) &&
      record[k] !== null &&
      record[k] !== undefined &&
      record[k] !== "" &&
      !Array.isArray(record[k]) &&
      typeof record[k] !== "object"
  );

  if (otherKeys.length > 0) {
    lines.push("");
    lines.push("**Details:**");
    for (const k of otherKeys.slice(0, 30)) {
      lines.push(`• **${prettyField(k)}:** ${prettyValue(record[k])}`);
    }
  }

  const childTables = Object.keys(record).filter(
    (k) => Array.isArray(record[k]) && record[k].length > 0
  );

  for (const t of childTables) {
    const rows = record[t];
    lines.push("");
    lines.push(`**${prettyField(t)}** (${rows.length}):`);
    rows.slice(0, 5).forEach((row: any, i: number) => {
      const label =
        row.item_name ||
        row.item_code ||
        row.description ||
        row.account_head ||
        row.payment_term ||
        `Row ${i + 1}`;
      const qty = row.qty != null ? ` · Qty ${row.qty}` : "";
      const rate = row.rate != null ? ` · ₹${fmt(row.rate)}` : "";
      const amount = row.amount != null ? ` · ₹${fmt(row.amount)}` : "";
      lines.push(`  ${i + 1}. ${label}${qty}${rate}${amount}`);
    });
    if (rows.length > 5) {
      lines.push(`  …and ${rows.length - 5} more.`);
    }
  }

  return lines.join("\n");
}

// ─── Detect if the question is asking for a specific record's details ─
function isDetailQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    q.includes("detail") ||
    q.includes("details") ||
    q.includes("full info") ||
    q.includes("full information") ||
    q.includes("show me info") ||
    q.includes("tell me about")
  );
}

function extractRecordId(question: string): string | null {
  // Priority 1: explicit ID-like pattern e.g. BOM-00123, SO-00045
  const match = question.match(/\b([A-Z]{2,6}-?\d{2,})\b/i);
  if (match) return match[1];

  // Priority 2: after "named"/"called"/"of"/"about"
  const named = question.match(/(?:named|called|of|about)\s+([A-Za-z0-9_-]{2,})/i);
  if (named) return named[1];

  return null;
}

/**
 * Extract a search term for detail lookup from a detail question.
 * Works for phrases like:
 *   "detail about abc warehouse"  → "abc"
 *   "show me detail of xyz item"  → "xyz"
 *   "detail of warehouse mumbai"  → "mumbai"
 *   "work in progress warehouse"  → "work in progress"  (multi-word)
 *   "show me detail of work in progress warehouse" → "work in progress"
 *
 * Skips stop words so generic English like "work", "in", "progress"
 * isn't accidentally used as a search term on its own.
 */
function extractDetailSearchTerm(
  question: string,
  moduleKeywords: string[]
): string | null {
  const q = question.toLowerCase();

  // 1. Try the standard extraction first
  const standard = extractRecordId(question);
  if (
    standard &&
    !moduleKeywords.some((k) => k.toLowerCase() === standard.toLowerCase())
  ) {
    // Make sure the standard pick isn't a stop word
    if (!STOP_WORDS.has(standard.toLowerCase())) {
      return standard;
    }
  }

  // 2. Fallback: strip filler words AND module keywords, then keep the
  //    meaningful tokens joined together (supports multi-word names like
  //    "work in progress").
  const fillerWords = [
    "show", "me", "detail", "details", "of", "about", "the", "for",
    "is", "are", "please", "give", "record", "info", "information",
    "full", "get", "find", "fetch", "want", "need", "view",
  ];

  const tokens = q
    .replace(/[?.!,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !fillerWords.includes(t))
    .filter((t) => !moduleKeywords.some((k) => k.toLowerCase() === t))
    .filter((t) => !STOP_WORDS.has(t));

  if (tokens.length === 0) return null;

  // If there's a token with letters+digits, prefer it alone (looks like an ID)
  const strongToken = tokens.find((t) => /[A-Za-z]/.test(t) && /\d/.test(t));
  if (strongToken) return strongToken;

  // Otherwise join remaining tokens with spaces so multi-word names work
  // but only if the joined string is at least 3 chars
  const joined = tokens.join(" ").trim();
  if (joined.length >= 3) return joined;

  return null;
}

async function fetchRecordDetail(
  endpoint: string,
  identifier: string
): Promise<any | null> {
  try {
    const res = await api.get(endpoint);
    const all = unwrap(res);
    const idLower = identifier.toLowerCase();

    // Priority 1: exact match on ID-like fields
    const exact = all.find((r: any) => {
      const candidates = [r.name, r.id, r.item_code].filter(Boolean);
      return candidates.some(
        (v: any) => String(v).toLowerCase() === idLower
      );
    });
    if (exact) return exact;

    // Priority 2: partial match on ID-like fields
    const partialId = all.find((r: any) => {
      const candidates = [r.name, r.id, r.item_code].filter(Boolean);
      return candidates.some((v: any) =>
        String(v).toLowerCase().includes(idLower)
      );
    });
    if (partialId) return partialId;

    // Priority 3: substring match on descriptive fields
    const fuzzySubstring = all.find((r: any) => {
      const fields = [
        r.customer_name,
        r.supplier_name,
        r.party_name,
        r.item_name,
        r.lead_name,
        r.title,
        r.description,
        r.warehouse_name,
        r.company_name,
      ].filter(Boolean);
      return fields.some((v: any) =>
        String(v).toLowerCase().includes(idLower)
      );
    });
    if (fuzzySubstring) return fuzzySubstring;

    // Priority 4: fuzzy (typo-tolerant) match on descriptive fields
    const fuzzyTypo = all.find((r: any) => {
      const fields = [
        r.customer_name,
        r.supplier_name,
        r.party_name,
        r.item_name,
        r.lead_name,
        r.title,
        r.description,
        r.warehouse_name,
        r.company_name,
        r.name,
      ].filter(Boolean);
      return fields.some((v: any) => {
        const s = String(v).toLowerCase();
        // fuzzy match: does this field contain the search term
        // with up to 2 typos per word?
        return s
          .split(/\s+/)
          .some((word: string) => {
            if (word.length < 3) return false;
            const maxDist = word.length <= 5 ? 1 : 2;
            return (
              Math.abs(word.length - idLower.length) <= maxDist &&
              levenshtein(word, idLower) <= maxDist
            );
          });
      });
    });
    if (fuzzyTypo) return fuzzyTypo;

    return null;
  } catch {
    return null;
  }
}

// ====================================================================
// NAVIGATION — "go to X page" / "open X" / "navigate to X"
// ====================================================================

/** Maps module labels to their list page URLs. */
const MODULE_ROUTES: Record<string, string> = {
  "work orders": "/work-order",
  "work order": "/work-order",
  "job cards": "/job-card",
  "job card": "/job-card",
  inventory: "/InventoryList",
  bom: "/bom",
  "stock entries": "/stock-entry",
  "stock entry": "/stock-entry",
  items: "/item-list",
  item: "/item-list",
  "item groups": "/item-group",
  "item group": "/item-group",
  warehouses: "/warehouse",
  warehouse: "/warehouse",
  workstations: "/Workstation",
  workstation: "/Workstation",
  operations: "/operations",
  operation: "/operations",
  uom: "/uom",
  "units of measure": "/uom",
  "quality inspections": "/quality-inspection",
  "quality inspection": "/quality-inspection",
  leads: "/lead",
  lead: "/lead",
  quotations: "/quotation",
  quotation: "/quotation",
  "sales orders": "/sales-order",
  "sales order": "/sales-order",
  "proforma invoices": "/proforma-invoice",
  "proforma invoice": "/proforma-invoice",
  proforma: "/proforma-invoice",
  "delivery notes": "/delivery-challan",
  "delivery challans": "/delivery-challan",
  "delivery challan": "/delivery-challan",
  "sales invoices": "/sales-bill",
  "sales bills": "/sales-bill",
  "sales bill": "/sales-bill",
  "tax invoices": "/sales-bill",
  "tax invoice": "/sales-bill",
  companies: "/company",
  company: "/company",
  "purchase orders": "/purchase-order",
  "purchase order": "/purchase-order",
  grn: "/grn",
  grns: "/grn",
  "goods receipt orders": "/grn",
  "goods receipt order": "/grn",
  "purchase invoices": "/purchase-invoice",
  "purchase invoice": "/purchase-invoice",
  settings: "/settings",
  setting: "/settings",
  dashboard: "/dashboard",
  "sales dashboard": "/dashboard/sales",
  "manufacturing dashboard": "/dashboard/manufacturing",
  "setup dashboard": "/dashboard/setup",
  "purchasing dashboard": "/dashboard/purchasing",
  "organization dashboard": "/dashboard/organization",
  "quality dashboard": "/dashboard/quality",
  "stock dashboard": "/dashboard/stock",
  "accounting dashboard": "/dashboard/accounting",
  "reports dashboard": "/dashboard/reports",
  "tools dashboard": "/dashboard/tools",
};

const NAV_KEYWORDS = [
  "go to",
  "open ",
  "navigate",
  "take me to",
  "show me the page",
  "go on",
  "redirect",
];

function isNavigationQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return NAV_KEYWORDS.some((kw) => q.includes(kw));
}

/** Extract the target module route from a navigation question. */
function detectNavigationTarget(question: string): {
  route: string;
  label: string;
} | null {
  const q = question.toLowerCase();

  // Sort keys by length (longest first) so "sales order" wins over "order"
  const keys = Object.keys(MODULE_ROUTES).sort(
    (a, b) => b.length - a.length
  );

  for (const key of keys) {
    if (q.includes(key) || fuzzyContains(q, key)) {
      return { route: MODULE_ROUTES[key], label: key };
    }
  }

  return null;
}

// ====================================================================
// DASHBOARD DETECTION
// ====================================================================

const DASHBOARD_LABELS: Record<string, string> = {
  "/dashboard/sales": "Sales Dashboard",
  "/dashboard/manufacturing": "Manufacturing Dashboard",
  "/dashboard/setup": "Setup Dashboard",
  "/dashboard/purchasing": "Purchasing Dashboard",
  "/dashboard/organization": "Organization Dashboard",
  "/dashboard/quality": "Quality Dashboard",
  "/dashboard/stock": "Stock Dashboard",
  "/dashboard/accounting": "Accounting Dashboard",
  "/dashboard/reports": "Reports Dashboard",
  "/dashboard/tools": "Tools Dashboard",
  "/dashboard": "Dashboard",
};

function isOnDashboard(pathname: string): {
  isDashboard: boolean;
  label: string;
} {
  const sorted = Object.keys(DASHBOARD_LABELS).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sorted) {
    if (pathname === key || pathname.startsWith(key + "/")) {
      return { isDashboard: true, label: DASHBOARD_LABELS[key] };
    }
  }
  return { isDashboard: false, label: "" };
}

// ====================================================================
// DASHBOARD → MODULE MAPPING
// ====================================================================
const DASHBOARD_MODULES: Record<string, string[]> = {
  "Sales Dashboard": ["sales"],
  "Manufacturing Dashboard": ["manufacturing", "inventory"],
  "Setup Dashboard": ["setup"],
  "Purchasing Dashboard": ["purchasing"],
  "Organization Dashboard": ["organization"],
  "Quality Dashboard": ["quality"],
  "Stock Dashboard": ["inventory"],
  "Accounting Dashboard": ["accounting"],
  "Reports Dashboard": ["all"],
  "Tools Dashboard": ["tools"],
  "Dashboard": ["all"],
};

// ====================================================================
// SETTINGS ANSWERS
// ====================================================================

const SETTINGS_PATHS = ["/settings", "/Setting", "/admin/settings"];

function isOnSettings(pathname: string): boolean {
  return SETTINGS_PATHS.some((p) => pathname.startsWith(p));
}

function answerSettingsQuestion(question: string): string | null {
  const q = question.toLowerCase();

  // Theme
  if (q.includes("theme") || q.includes("color") || q.includes("colour")) {
    const theme =
      localStorage.getItem("theme") ||
      localStorage.getItem("appTheme") ||
      localStorage.getItem("colorScheme") ||
      document.documentElement.getAttribute("data-theme") ||
      document.body.className.match(/blue-theme|green-theme|dark-theme/)?.[0] ||
      "unknown";

    return (
      `🎨 **Theme Settings**\n` +
      `Current theme: **${theme}**\n\n` +
      `Available themes in Settings:\n` +
      `• Blue Theme (default enterprise dashboard)\n` +
      `• Green Theme (premium reservation UI)\n\n` +
      `To change: go to Settings → Theme Cards → click a theme.`
    );
  }

  // Date format
  if (
    q.includes("date format") ||
    q.includes("date-format") ||
    q.includes("dateformat") ||
    (q.includes("date") && q.includes("format"))
  ) {
    const format =
      localStorage.getItem("dateFormat") ||
      localStorage.getItem("date_format") ||
      "DD/MM/YYYY";

    return (
      `📅 **Date Format Settings**\n` +
      `Current format: **${format}**\n\n` +
      `Available formats:\n` +
      `• DD/MM/YYYY (Digits only) — e.g. 15/03/2026\n` +
      `• DD/MMM/YYYY (Written month) — e.g. 15/Mar/2026\n` +
      `• MM/DD/YYYY (US format) — e.g. 03/15/2026\n` +
      `• YYYY-MM-DD (ISO standard) — e.g. 2026-03-15\n\n` +
      `To change: go to Settings → Date Format Settings → click a format.`
    );
  }

  return (
    `⚙️ **Settings**\n` +
    `You're on the Settings page. Available options:\n` +
    `• **Theme** — choose Blue, Green, or other themes\n` +
    `• **Date Format** — choose how dates appear across the app\n\n` +
    `Ask me:\n` +
    `• "what is the current theme?"\n` +
    `• "what date format is set?"`
  );
}

// ====================================================================
// PAGE-AWARE CHIPS
// ====================================================================

const PAGE_CHIPS: Array<{ prefix: string; chips: string[] }> = [
  {
    prefix: "/dashboard/sales",
    chips: [
      "Sales Dashboard Summary",
      "How many leads?",
      "How many quotations?",
      "How many sales orders?",
      "Total sales revenue",
      "How many delivery notes?",
      "How many invoices?",
      "Summary",
    ],
  },
  {
    prefix: "/dashboard/manufacturing",
    chips: [
      "Manufacturing Dashboard Summary",
      "How many work orders?",
      "How many job cards?",
      "Work orders in process",
      "Work orders completed",
      "How many BOMs?",
      "Inventory value",
      "Summary",
    ],
  },
  {
    prefix: "/dashboard/setup",
    chips: [
      "Setup Dashboard Summary",
      "How many items?",
      "How many item groups?",
      "How many warehouses?",
      "How many workstations?",
      "How many UOMs?",
      "How many operations?",
      "Summary",
    ],
  },
  {
    prefix: "/dashboard/purchasing",
    chips: [
      "Purchasing Dashboard Summary",
      "How many purchase orders?",
      "How many purchase invoices?",
      "How many GRNs?",
      "Total purchase spend",
      "Summary",
    ],
  },
  {
    prefix: "/dashboard/organization",
    chips: [
      "Organization Dashboard Summary",
      "How many companies?",
      "Summary",
    ],
  },
  {
    prefix: "/dashboard/quality",
    chips: [
      "Quality Dashboard Summary",
      "How many quality inspections?",
      "Quality inspections today",
      "Summary",
    ],
  },
  {
    prefix: "/settings",
    chips: [
      "What is the current theme?",
      "What date format is set?",
      "Settings help",
      "Summary",
    ],
  },
  {
    prefix: "/sales-order",
    chips: [
      "How many sales orders?",
      "Sales orders today",
      "Sales orders yesterday",
      "Show latest sales orders",
      "Total sales revenue",
      "Summary",
    ],
  },
  {
    prefix: "/quotation",
    chips: [
      "How many quotations?",
      "Show latest quotations",
      "Quotations today",
      "Summary",
    ],
  },
  {
    prefix: "/proforma-invoice",
    chips: [
      "How many proforma invoices?",
      "Show latest proforma invoices",
      "Summary",
    ],
  },
  {
    prefix: "/delivery-challan",
    chips: [
      "How many delivery challans?",
      "Show latest delivery challans",
      "Summary",
    ],
  },
  {
    prefix: "/sales-bill",
    chips: [
      "How many sales bills?",
      "Show latest sales bills",
      "Summary",
    ],
  },
  {
    prefix: "/lead",
    chips: [
      "How many leads?",
      "Show latest leads",
      "Summary",
    ],
  },
  {
    prefix: "/work-order",
    chips: [
      "How many work orders?",
      "Work orders in process",
      "Work orders completed",
      "Work orders today",
      "Summary",
    ],
  },
  {
    prefix: "/job-card",
    chips: [
      "How many job cards?",
      "Job cards today",
      "Show latest job cards",
      "Summary",
    ],
  },
  {
    prefix: "/bom",
    chips: [
      "How many BOMs?",
      "Show latest BOMs",
      "BOMs today",
      "Summary",
    ],
  },
  {
    prefix: "/stock-entry",
    chips: [
      "How many stock entries?",
      "Stock entries today",
      "Show latest stock entries",
      "Summary",
    ],
  },
  {
    prefix: "/item-group",
    chips: [
      "How many item groups?",
      "Show latest item groups",
      "Summary",
    ],
  },
  {
    prefix: "/item",
    chips: [
      "How many items?",
      "Show latest items",
      "Items today",
      "Summary",
    ],
  },
  {
    prefix: "/InventoryList",
    chips: [
      "How many inventory?",
      "Inventory value",
      "Summary",
    ],
  },
  {
    prefix: "/warehouse",
    chips: [
      "How many warehouses?",
      "Show latest warehouses",
      "Summary",
    ],
  },
  {
    prefix: "/Workstation",
    chips: [
      "How many workstations?",
      "Show latest workstations",
      "Summary",
    ],
  },
  {
    prefix: "/operations",
    chips: [
      "How many operations?",
      "Show latest operations",
      "Summary",
    ],
  },
  {
    prefix: "/uom",
    chips: [
      "How many UOMs?",
      "Show latest UOMs",
      "Summary",
    ],
  },
  {
    prefix: "/quality-inspection",
    chips: [
      "How many quality inspections?",
      "Quality inspections today",
      "Show latest quality inspections",
      "Summary",
    ],
  },
  {
    prefix: "/company",
    chips: [
      "How many companies?",
      "Show latest companies",
      "Summary",
    ],
  },
  {
    prefix: "/purchase-order",
    chips: [
      "How many purchase orders?",
      "Show latest purchase orders",
      "Summary",
    ],
  },
  {
    prefix: "/grn",
    chips: [
      "How many goods receipt orders?",
      "Show latest GRNs",
      "Summary",
    ],
  },
  {
    prefix: "/purchase-invoice",
    chips: [
      "How many purchase invoices?",
      "Show latest purchase invoices",
      "Summary",
    ],
  },
];

const DEFAULT_CHIPS = [
  "Summary",
  "How many sales orders?",
  "How many work orders?",
  "How many items?",
  "How many warehouses?",
  "How many stock entries?",
];

function getChipsForPath(pathname: string): string[] {
  const sorted = [...PAGE_CHIPS].sort(
    (a, b) => b.prefix.length - a.prefix.length
  );
  for (const { prefix, chips } of sorted) {
    if (pathname.startsWith(prefix)) return chips;
  }
  return DEFAULT_CHIPS;
}

// ====================================================================
// ANALYSIS KEYWORDS
// ====================================================================

const ANALYSIS_KEYWORDS = [
  "which",
  "why",
  "how does",
  "how do",
  "explain",
  "compare",
  "difference",
  "trend",
  "highest",
  "lowest",
  "biggest",
  "smallest",
  "top",
  "best",
  "worst",
  "analyze",
  "analysis",
  "recommend",
  "suggest",
  "summarize",
  "tell me about",
  "what is",
  "what are",
  "who is",
  "who has",
];

function needsAiAnalysis(question: string): boolean {
  const q = question.toLowerCase();
  return ANALYSIS_KEYWORDS.some((kw) => q.includes(kw));
}

// ====================================================================
// The "brain"
// ====================================================================

type AnswerResult = {
  text: string;
  navigateTo?: string;
};

async function answerQuestion(
  question: string,
  currentPath: string
): Promise<AnswerResult> {
  const q = question.toLowerCase().trim();

  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const isCount = has("how many", "count", "number of", "total number");

  // ════════════════════════════════════════════════════════════════════
  // 0. SETTINGS
  // ════════════════════════════════════════════════════════════════════
  if (isOnSettings(currentPath)) {
    const settingsReply = answerSettingsQuestion(question);
    if (settingsReply) {
      console.log("⚙️ Settings answer");
      return { text: settingsReply };
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 1. NAVIGATION
  // ════════════════════════════════════════════════════════════════════
  if (isNavigationQuestion(question)) {
    const target = detectNavigationTarget(question);
    if (target) {
      const current = currentPath.replace(/\/$/, "");
      const dest = target.route.replace(/\/$/, "");

      if (current === dest || current.startsWith(dest + "/")) {
        console.log(`📍 Already on ${target.label}`);
        return {
          text: `📍 You're already on the **${target.label}** page.`,
        };
      }

      console.log(`🧭 Navigation → ${target.route}`);
      return {
        text: `🧭 Navigating to **${target.label}**...`,
        navigateTo: target.route,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 2. DASHBOARD-AWARE SUMMARY
  // ════════════════════════════════════════════════════════════════════
  const dashInfo = isOnDashboard(currentPath);

  if (has("summary", "overview", "snapshot", "dashboard summary")) {
    const include = dashInfo.isDashboard
      ? (DASHBOARD_MODULES[dashInfo.label] || ["all"])
      : ["all"];
    const showAll = include.includes("all");
    const show = (m: string) => showAll || include.includes(m);

    const salesPromise = show("sales")
      ? Promise.all([
          api.get("/sales-order?page=1&limit=100").catch(() => null),
          api.get("/quotation?page=1&limit=100").catch(() => null),
          api.get("/lead?page=1&limit=100").catch(() => null),
        ])
      : Promise.resolve([null, null, null] as const);

    const purchasingPromise = show("purchasing")
      ? Promise.all([
          api.get("/purchase-invoice?page=1&limit=100").catch(() => null),
          api.get("/purchase-order?page=1&limit=100").catch(() => null),
          api.get("/grn?page=1&limit=100").catch(() => null),
        ])
      : Promise.resolve([null, null, null] as const);

    const manufacturingPromise = show("manufacturing")
      ? Promise.all([
          api.get("/work-order?page=1&limit=100").catch(() => null),
          api.get("/job-card?page=1&limit=100").catch(() => null),
          api.get("/bom?page=1&limit=100").catch(() => null),
        ])
      : Promise.resolve([null, null, null] as const);

    const inventoryPromise = show("inventory")
      ? api.get("/inventory?page=1&limit=100").catch(() => null)
      : Promise.resolve(null);

    const setupPromise = show("setup")
      ? Promise.all([
          api.get("/item?page=1&limit=100").catch(() => null),
          api.get("/item-group?page=1&limit=100").catch(() => null),
          api.get("/warehouse?page=1&limit=100").catch(() => null),
        ])
      : Promise.resolve([null, null, null] as const);

    const qualityPromise = show("quality")
      ? api.get("/quality-inspection?page=1&limit=100").catch(() => null)
      : Promise.resolve(null);

    const organizationPromise = show("organization")
      ? api.get("/company?page=1&limit=100").catch(() => null)
      : Promise.resolve(null);

    const [
      [soRes, qRes, leadRes],
      [piRes, poRes, grnRes],
      [woRes, jcRes, bomRes],
      invRes,
      [itemRes, igRes, whRes],
      qiRes,
      coRes,
    ] = await Promise.all([
      salesPromise,
      purchasingPromise,
      manufacturingPromise,
      inventoryPromise,
      setupPromise,
      qualityPromise,
      organizationPromise,
    ]);

    const lines: string[] = [];
    lines.push(dashInfo.isDashboard ? `📊 **${dashInfo.label}**` : `📊 Business Snapshot`);
    lines.push("");

    // ── SALES ──
    if (show("sales") && (soRes || qRes || leadRes)) {
      const soCount = soRes ? getTotalCount(soRes) : 0;
      const qCount = qRes ? getTotalCount(qRes) : 0;
      const leadCount = leadRes ? getTotalCount(leadRes) : 0;

      const so = soRes ? unwrap(soRes) : [];
      const qs = qRes ? unwrap(qRes) : [];

      const rev = so.reduce((s: number, o: any) => s + (o.grand_total || 0), 0);
      const quoteVal = qs.reduce((s: number, x: any) => s + (x.grand_total || 0), 0);

      lines.push(`**Sales**`);
      if (leadRes) lines.push(`• Leads: ${leadCount}`);
      if (qRes) lines.push(`• Quotations: ${qCount} · ₹${fmtLakh(quoteVal)}`);
      if (soRes) lines.push(`• Sales Orders: ${soCount} · ₹${fmtLakh(rev)}`);
      lines.push("");
    }

    // ── PURCHASING ──
    if (show("purchasing") && (piRes || poRes || grnRes)) {
      const piCount = piRes ? getTotalCount(piRes) : 0;
      const poCount = poRes ? getTotalCount(poRes) : 0;
      const grnCount = grnRes ? getTotalCount(grnRes) : 0;

      const pi = piRes ? unwrap(piRes) : [];
      const spend = pi.reduce((s: number, i: any) => s + (i.grand_total || i.total || 0), 0);

      lines.push(`**Purchasing**`);
      if (poRes) lines.push(`• Purchase Orders: ${poCount}`);
      if (grnRes) lines.push(`• GRNs: ${grnCount}`);
      if (piRes) lines.push(`• Purchase Invoices: ${piCount} · ₹${fmtLakh(spend)}`);
      lines.push("");
    }

    // ── MANUFACTURING ──
    if (show("manufacturing") && (woRes || jcRes || bomRes)) {
      const woCount = woRes ? getTotalCount(woRes) : 0;
      const jcCount = jcRes ? getTotalCount(jcRes) : 0;
      const bomCount = bomRes ? getTotalCount(bomRes) : 0;

      const wo = woRes ? unwrap(woRes) : [];
      const jcs = jcRes ? unwrap(jcRes) : [];

      const wip = wo.filter((w: any) => w.status === "In Process").length;
      const wc = wo.filter((w: any) => w.status === "Completed").length;
      const jcOpen = jcs.filter((j: any) => j.status === "Open").length;
      const jcDone = jcs.filter((j: any) => j.status === "Completed").length;

      lines.push(`**Manufacturing**`);
      if (bomRes) lines.push(`• BOMs: ${bomCount}`);
      if (woRes) lines.push(`• Work Orders: ${woCount} · ${wip} in process · ${wc} completed`);
      if (jcRes) lines.push(`• Job Cards: ${jcCount} · ${jcOpen} open · ${jcDone} completed`);
      lines.push("");
    }

    // ── INVENTORY ──
    if (show("inventory") && invRes) {
      const invCount = getTotalCount(invRes);
      const inv = unwrap(invRes);
      const stockVal = inv.reduce((s: number, i: any) => s + (i.stock_value || 0), 0);
      const lowStock = inv.filter((i: any) => (i.actual_qty || 0) < 10).length;

      lines.push(`**Inventory**`);
      lines.push(`• Items: ${invCount} · ₹${fmtLakh(stockVal)} · ${lowStock} low stock`);
      lines.push("");
    }

    // ── SETUP ──
    if (show("setup") && (itemRes || igRes || whRes)) {
      const itemCount = itemRes ? getTotalCount(itemRes) : 0;
      const igCount = igRes ? getTotalCount(igRes) : 0;
      const whCount = whRes ? getTotalCount(whRes) : 0;

      lines.push(`**Setup**`);
      if (itemRes) lines.push(`• Items: ${itemCount}`);
      if (igRes) lines.push(`• Item Groups: ${igCount}`);
      if (whRes) lines.push(`• Warehouses: ${whCount}`);
      lines.push("");
    }

    // ── QUALITY ──
    if (show("quality") && qiRes) {
      const qiCount = getTotalCount(qiRes);
      lines.push(`**Quality**`);
      lines.push(`• Quality Inspections: ${qiCount}`);
      lines.push("");
    }

    // ── ORGANIZATION ──
    if (show("organization") && coRes) {
      const coCount = getTotalCount(coRes);
      lines.push(`**Organization**`);
      lines.push(`• Companies: ${coCount}`);
      lines.push("");
    }

    return { text: lines.join("\n").trim() };
  }

  // ── REVENUE ────────────────────────────────────────────────────────
  if (has("revenue", "sales value", "total sales", "sales amount")) {
    const res = await api.get("/sales-order?page=1&limit=100");
    const orders = unwrap(res);
    const total = orders.reduce((s: number, o: any) => s + (o.grand_total || 0), 0);
    return {
      text: `Total sales revenue: ₹${fmt(total)} from ${getTotalCount(res)} orders.`,
    };
  }

  // ── INVENTORY VALUE ────────────────────────────────────────────────
  if (has("inventory value", "stock value", "item value")) {
    const res = await api.get("/inventory?page=1&limit=100");
    const totalCount = getTotalCount(res);
    const items = unwrap(res);
    const totalValue = items.reduce((s: number, i: any) => s + (i.stock_value || 0), 0);
    const lowStock = items.filter((i: any) => (i.actual_qty || 0) < 10).length;
    return {
      text: `Inventory: ${totalCount} items · Value ₹${fmtLakh(totalValue)} · ${lowStock} low-stock items.`,
    };
  }

  // ── WORK ORDER STATUS ──────────────────────────────────────────────
  if (has("work order", "work orders", "production order", "manufacturing order")) {
    if (
      has("in process", "inprogress", "ongoing", "running") ||
      has("completed", "done", "finished") ||
      has("open", "not started", "pending")
    ) {
      const res = await api.get("/work-order?page=1&limit=100");
      const wos = unwrap(res);

      if (has("in process", "inprogress", "ongoing", "running")) {
        const n = wos.filter((w: any) => w.status === "In Process").length;
        return { text: `${n} work orders are currently in process.` };
      }
      if (has("completed", "done", "finished")) {
        const n = wos.filter((w: any) => w.status === "Completed").length;
        return { text: `${n} work orders are completed.` };
      }
      const n = wos.filter((w: any) =>
        ["Open", "Not Started", "Draft"].includes(w.status)
      ).length;
      return { text: `${n} work orders are open / not started.` };
    }
  }

  // ── HELP ───────────────────────────────────────────────────────────
  if (has("help", "what can you", "how do you", "commands")) {
    return {
      text:
        "I can answer questions about every module. Try:\n" +
        "• How many sales orders?\n" +
        "• How many work orders?\n" +
        "• Show latest warehouses\n" +
        "• Detail about BOM-00123\n" +
        "• Detail of abc warehouse\n" +
        "• Detail of work in progress warehouse\n" +
        "• Go to BOM page\n" +
        "• Open sales order\n" +
        "• What is the current theme?\n" +
        "• Summary",
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // 4. DETAIL VIEW
  // ════════════════════════════════════════════════════════════════════
  const endpoint = matchEndpoint(question);

  if (endpoint && isDetailQuestion(question)) {
    const identifier = extractDetailSearchTerm(question, endpoint.keywords);

    if (identifier) {
      console.log(`🔍 Detail request → ${endpoint.label} · "${identifier}"`);
      const record = await fetchRecordDetail(endpoint.url, identifier);

      if (record) {
        console.log(`✅ Match found for "${identifier}"`);
        return { text: renderRecordDetail(record, endpoint.label) };
      }

      console.log(`↪️ No match for "${identifier}" — falling through to AI + ERP context`);
      const aiResult = await askAiWithErpContext(question);
      if (aiResult.ok && aiResult.reply) {
        return { text: aiResult.reply };
      }

      return {
        text:
          `🔍 I couldn't find a ${endpoint.label.toLowerCase()} matching "${identifier}".\n\n` +
          `Try asking "show latest ${endpoint.label.toLowerCase()}" to see what's available.`,
      };
    }

    return {
      text:
        `🔍 Tell me which ${endpoint.label.toLowerCase()} to look up — for example:\n` +
        `• "detail about BOM-00123"\n` +
        `• "detail of abc warehouse"\n` +
        `• "show details of Acme Corp"`,
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // 4b. SMART LOOKUP
  // ════════════════════════════════════════════════════════════════════
  if (!endpoint) {
    const token = extractSearchToken(question);
    if (token && token.length >= 3 && !STOP_WORDS.has(token.toLowerCase())) {
      console.log(`🔍 No module keyword — searching all modules for "${token}"...`);

      const found = await searchAllModulesForRecord(token);

      if (found) {
        console.log(`✅ Found "${token}" in ${found.endpoint.label}`);
        return { text: renderRecordDetail(found.record, found.endpoint.label) };
      }

      console.log(`❌ "${token}" not found in any module`);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 5. AI + ERP CONTEXT
  // ════════════════════════════════════════════════════════════════════
  if (endpoint && needsAiAnalysis(question)) {
    console.log(`🤖 Analytical question → routing to AI with ERP context (${endpoint.label})`);

    const aiResult = await askAiWithErpContext(question);
    if (aiResult.ok && aiResult.reply) {
      return { text: aiResult.reply };
    }
    console.warn(`⚠️ AI failed — falling back to list: ${aiResult.error}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // 6. GENERIC LOOKUP
  // ════════════════════════════════════════════════════════════════════
  if (endpoint) {
    console.log(`📦 Generic lookup → ${endpoint.label}`);
    const range = detectDateRange(question);
    const text = await answerModuleGeneric(endpoint.label, endpoint.url, range, isCount);
    return { text };
  }

  // ════════════════════════════════════════════════════════════════════
  // 7. AI FALLBACK
  // ════════════════════════════════════════════════════════════════════
  console.log("🤖 Falling back to AI for:", question);

  const aiResult = await askAiWithErpContext(question);

  if (aiResult.ok && aiResult.reply) {
    return { text: aiResult.reply };
  }

  return {
    text:
      `🤖 I couldn't reach the AI service. ${aiResult.error ?? ""}\n\n` +
      `Try asking:\n` +
      `• "How many sales orders?"\n` +
      `• "How many warehouses?"\n` +
      `• "Detail of abc warehouse"\n` +
      `• "Summary"`,
  };
}

// ─── Component ─────────────────────────────────────────────────────────
export default function ChatBot() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "Hi 👋 I'm your ERP assistant. Ask about any module:\n" +
        "• How many sales orders?\n" +
        "• How many work orders?\n" +
        "• Detail about BOM-00123\n" +
        "• Go to BOM page\n" +
        "• What is the current theme?\n" +
        "• Summary",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickChips = getChipsForPath(location.pathname);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const runQuestion = async (q: string, clearInput: boolean) => {
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    if (clearInput) setInput("");
    setLoading(true);

    try {
      const result = await answerQuestion(q, location.pathname);
      setMessages((m) => [...m, { role: "bot", text: result.text }]);

      if (result.navigateTo) {
        setTimeout(() => {
          navigate(result.navigateTo!);
          setOpen(false);
        }, 700);
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text:
            "⚠️ Couldn't fetch data. " +
            (err?.response?.data?.message || err?.message || "Try again."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => runQuestion(input.trim(), true);

  const sendQuestion = (text: string) => runQuestion(text.trim(), false);

  return (
    <>
      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
        title="Ask ERP Assistant"
      >
        {open ? <FaTimes /> : <FaCommentDots />}
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <FaRobot />
            <span>ERP Assistant</span>
            <button
              className="chat-header-close"
              onClick={() => setOpen(false)}
              title="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="chat-avatar">
                  {m.role === "bot" ? <FaRobot /> : <FaUser />}
                </div>
                <div className="chat-bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="chat-avatar">
                  <FaRobot />
                </div>
                <div className="chat-bubble typing">
                  <FaSpinner className="spin" /> thinking…
                </div>
              </div>
            )}

            {!loading && (
              <div className="chat-chips">
                {quickChips.map((c) => (
                  <button
                    key={c}
                    className="chat-chip"
                    onClick={() => sendQuestion(c)}
                    title={`Ask: ${c}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              value={input}
              placeholder="Ask about any module…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button
              className="chat-send"
              onClick={send}
              disabled={loading || !input.trim()}
              title="Send"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
}