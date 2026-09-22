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
  detectSmartNavigation,
  fetchDetailPageData,
  DETAIL_PAGE_APIS,
} from "../../../services/erpApi";

interface Msg {
  role: "user" | "bot";
  text: string;
  navigateTo?: string;
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

const STOP_WORDS = new Set([
  "work", "in", "progress", "the", "and", "for", "with", "from",
  "this", "that", "these", "those", "all", "any", "some", "list",
  "show", "find", "get", "give", "want", "need", "please", "about",
  "detail", "details", "info", "information", "data", "record",
  "records", "item", "items", "order", "orders", "name", "code",
  "one", "two", "three", "yes", "no", "not", "new", "old",
  "page", "navigate", "go", "open", "edit", "view",
]);

// ═══════════════════════════════════════════════════════════════════════
// 🆕 FIX #2 (part a): short keywords that must NEVER win the module
//    match in a "candidates" list. These are ambiguous (they appear as
//    substrings of other words) and were the reason an invoice question
//    could route to the BOM page.
// ═══════════════════════════════════════════════════════════════════════
const AMBIGUOUS_MODULE_KEYS = new Set([
  "bom", "grn", "po", "so", "pi", "jc", "wo",
]);

// ═══════════════════════════════════════════════════════════════════════
// 🆕 FIX #5: document-series prefixes that appear in the UI/naming
//    series (PINV-, SINV-, GRN-, PO-, …) but are never themselves valid
//    record ids. If the chatbot treats them as a search term, it fires
//    GET /api/<module>/<PREFIX> and the ERP returns 500
//    ("Purchase Invoice not found"). We must filter these out of any
//    "search id" extraction.
// ═══════════════════════════════════════════════════════════════════════
const DOCUMENT_PREFIXES = new Set([
  "pinv", "sinv", "grn", "po", "so", "bom", "wo", "jc", "qtn",
  "dn", "pi", "si", "lead", "emp", "sup", "cust",
]);

// ─── Levenshtein distance ─────────────────────────────────────────────
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

function fuzzyContains(text: string, keyword: string): boolean {
  const t = text.toLowerCase();
  const k = keyword.toLowerCase();
  if (t.includes(k)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  const maxDist = k.length <= 5 ? 1 : 2;
  for (const w of words) {
    if (Math.abs(w.length - k.length) > maxDist) continue;
    if (levenshtein(w, k) <= maxDist) return true;
  }
  return false;
}

const unwrap = (res: any): any[] => {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.records)) return d.records;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

function unwrapOne(res: any): any | null {
  const raw = res?.data ?? res;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw?.data)) return raw.data[0] ?? null;
  if (Array.isArray(raw?.records)) return raw.records[0] ?? null;
  if (raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    return raw.data;
  }
  if (typeof raw === "object") return raw;
  return null;
}

function getTotalCount(res: any): number {
  const raw = res?.data ?? res;
  const candidates = [
    raw?.total, raw?.count, raw?.total_count, raw?.totalCount,
    raw?.row_count, raw?.rowCount, raw?.data?.total, raw?.data?.count,
    raw?.data?.total_count, raw?.pagination?.total,
    raw?.pagination?.total_count, raw?.meta?.total, raw?.meta?.total_count,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && c >= 0) return c;
  }
  const arr =
    (Array.isArray(raw?.records) && raw.records) ||
    (Array.isArray(raw?.data) && raw.data) ||
    (Array.isArray(raw) && raw) || [];
  return arr.length;
}

const DEBUG_COUNT = true;
function debugCount(label: string, res: any) {
  if (!DEBUG_COUNT) return;
  const raw = res?.data ?? res;
  const shape = {
    "top-level keys": Object.keys(res || {}),
    "data keys": raw && typeof raw === "object" ? Object.keys(raw) : typeof raw,
    total: raw?.total, count: raw?.count, total_count: raw?.total_count,
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
  "creation", "created_at", "createdAt", "created_on", "creation_date",
  "date_created", "created", "inserted_at", "created_date",
];

const DATE_FIELDS = [
  "transaction_date", "posting_date", "order_date", "date",
  "delivery_date", "due_date", "valid_till", ...CREATED_FIELDS,
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
// DATE RANGE
// ====================================================================
type DateRange = { label: string; from: Date; to: Date } | null;

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
    r.customer_name || r.supplier_name || r.party_name || r.item_name ||
    r.item_code || r.lead_name || r.name || r.title || "Record";
  const id = r.name || r.id || "";
  const amount =
    r.grand_total != null ? `₹${fmt(r.grand_total)}` :
    r.total != null ? `₹${fmt(r.total)}` : "";
  const status = r.status ? ` · ${r.status}` : "";
  const idPart = id && id !== name ? ` (${id})` : "";
  const created = getCreatedDate(r);
  const fallback = created ? null : getRecordDate(r);
  const d = created || fallback;
  const dateStr = d ? ` · 📅 ${formatShortDate(d)} (${timeAgo(d)})` : "";
  return `${idx + 1}. ${name}${idPart}${amount ? " · " + amount : ""}${status}${dateStr}`;
}

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
  if (range) rows = filterByDate(all, range);

  if (total === 0 && all.length === 0) {
    return `📭 You have no ${documentLabel.toLowerCase()} yet.`;
  }
  if (range && rows.length === 0) {
    return `📭 No ${documentLabel.toLowerCase()} ${range.label}.`;
  }
  if (isCount && !range) {
    return `📊 You have **${total}** ${documentLabel.toLowerCase()}.`;
  }
  if (isCount && range) {
    return `📊 **${rows.length}** ${documentLabel.toLowerCase()} ${range.label}.`;
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
// RECORD ID RESOLVER
// ====================================================================
function getRecordNavId(record: any, fallbackIdentifier?: string): string {
  if (record) {
    const idCandidates = [
      record.name,
      record.id,
      record.item_code,
      record.customer_id,
      record.supplier_id,
      record.lead_id,
      record.warehouse_id,
      record.workstation_id,
      record.operation_id,
      record.employee_id,
      record.bom_id,
      record.quotation_no,
      record.invoice_number,
      record.order_number,
      record.bill_number,
      record.delivery_note_no,
      record.proforma_no,
      record.grn_no,
      record.po_number,
    ];
    for (const c of idCandidates) {
      if (c !== null && c !== undefined && String(c).trim() !== "") {
        return String(c);
      }
    }
    if (record.item_name) return String(record.item_name);
  }
  return fallbackIdentifier || "";
}

// ====================================================================
// DETAIL VIEW
// ====================================================================
const HIDDEN_DETAIL_FIELDS = [
  "docstatus", "idx", "_user_tags", "_comments", "_assign", "_liked_by",
  "owner", "modified_by", "modified", "password", "api_key", "api_secret",
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
    record.customer_name || record.supplier_name || record.party_name ||
    record.item_name || record.lead_name || record.name || record.id || "Record";

  lines.push(`📄 **${moduleLabel}: ${name}**`);
  lines.push("");

  const headerFields = [
    "name", "id", "item_code", "item_name", "status", "grand_total", "total",
    "currency", "transaction_date", "posting_date", "order_date", "creation",
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
        row.item_name || row.item_code || row.description ||
        row.account_head || row.payment_term || `Row ${i + 1}`;
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

function isDetailQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return (
    q.includes("detail") || q.includes("details") ||
    q.includes("full info") || q.includes("full information") ||
    q.includes("show me info") || q.includes("tell me about")
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ALPHANUMERIC ID EXTRACTION
// ═══════════════════════════════════════════════════════════════════════
// 🆕 FIX #1: strip leading zeros so "PO-00098" → "98", and
//            "00098" → "98". The API needs the numeric id without
//            leading zeros (e.g. /purchase-order/98, not /00098).
function extractAlphanumericId(question: string): string | null {
  const hyphenated = question.match(/\b([A-Za-z]{2,6})-(\d{2,})\b/);
  if (hyphenated) {
    const digits = hyphenated[2];
    // Strip leading zeros, but keep a single "0" if the number is zero
    const stripped = String(parseInt(digits, 10));
    return stripped === "NaN" ? digits : stripped;
  }

  const mixed = question.match(/\b([A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*\d[A-Za-z0-9]*|[A-Za-z0-9]*\d[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*)\b/);
  if (mixed) {
    const candidate = mixed[1];
    if (/\d/.test(candidate) && /[A-Za-z]/.test(candidate)) {
      if (
        candidate.length >= 2 &&
        candidate.length <= 30 &&
        !STOP_WORDS.has(candidate.toLowerCase())
      ) {
        return candidate;
      }
    }
  }

  const numeric = question.match(/\b(\d{2,})\b/);
  if (numeric) {
    const stripped = String(parseInt(numeric[1], 10));
    return stripped === "NaN" ? numeric[1] : stripped;
  }

  return null;
}

// 🆕 Extract a plain word token like "bolt", "hinge", "tyu".
//    🆕 FIX #5: reject document-series prefixes (PINV, SINV, GRN, PO, …)
//    and any all-uppercase short token — these are never real ids.
function extractWordToken(question: string, moduleKey: string): string | null {
  const filler = new Set([
    "navigate", "on", "to", "go", "open", "show", "me", "the", "page",
    "detail", "details", "edit", "view", "of", "for", "about", "a", "an",
    "is", "are", "please", "record", "info", "information", "full", "get",
    "find", "fetch", "want", "need", "and", "take", "redirect",
    ...moduleKey.split(" "),
  ]);

  const tokens = question
    .toLowerCase()
    .replace(/[?.!,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !filler.has(t))
    .filter((t) => t.length >= 3)
    .filter((t) => !STOP_WORDS.has(t))
    .filter((t) => !DOCUMENT_PREFIXES.has(t));   // 🆕 FIX #5

  return tokens[0] || null;
}

function extractDetailSearchTerm(
  question: string,
  moduleKeywords: string[]
): string | null {
  const q = question.toLowerCase();

  const idCandidate = extractAlphanumericId(question);
  if (
    idCandidate &&
    !moduleKeywords.some((k) => k.toLowerCase() === idCandidate.toLowerCase()) &&
    !STOP_WORDS.has(idCandidate.toLowerCase())
  ) {
    return idCandidate;
  }

  const fillerWords = [
    "show", "me", "detail", "details", "of", "about", "the", "for",
    "is", "are", "please", "give", "record", "info", "information",
    "full", "get", "find", "fetch", "want", "need", "view", "and",
    "navigate", "on", "page", "go", "to", "edit",
  ];

  const tokens = q
    .replace(/[?.!,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !fillerWords.includes(t))
    .filter((t) => !moduleKeywords.some((k) => k.toLowerCase() === t))
    .filter((t) => !STOP_WORDS.has(t))
    .filter((t) => !DOCUMENT_PREFIXES.has(t));   // 🆕 FIX #5

  if (tokens.length === 0) return null;

  const strongToken = tokens.find((t) => /[A-Za-z]/.test(t) && /\d/.test(t));
  if (strongToken) return strongToken;

  const joined = tokens.join(" ").trim();
  if (joined.length >= 3) return joined;
  return null;
}

// ====================================================================
// SINGLE RECORD FETCH
// ====================================================================
async function fetchRecordById(
  endpointBase: string,
  id: string
): Promise<any | null> {
  if (!endpointBase || !id) return null;

  const base = endpointBase.replace(/\/+$/, "").split("?")[0];
  const url = `${base}/${encodeURIComponent(id)}`;

  try {
    console.log(`📡 Direct fetch (authenticated): ${url}`);
    const res = await api.get(url);
    const record = unwrapOne(res);
    if (record && typeof record === "object") {
      console.log(`✅ Direct fetch succeeded: ${url}`);
      return record;
    }
    return null;
  } catch (err: any) {
    console.log(
      `↪️ Direct fetch failed for ${url} (status ${err?.response?.status ?? "?"}) — will fall back to list search`
    );
    return null;
  }
}

async function resolveRecord(
  endpointBase: string,
  searchTerm: string
): Promise<any | null> {
  const direct = await fetchRecordById(endpointBase, searchTerm);
  if (direct) return direct;
  return await fetchRecordDetail(endpointBase, searchTerm);
}

async function fetchRecordDetail(
  endpoint: string,
  identifier: string
): Promise<any | null> {
  try {
    const res = await api.get(endpoint);
    const all = unwrap(res);
    const idLower = identifier.toLowerCase();

    const exact = all.find((r: any) => {
      const candidates = [r.name, r.id, r.item_code, r.item_name].filter(Boolean);
      return candidates.some((v: any) => String(v).toLowerCase() === idLower);
    });
    if (exact) return exact;

    const partialId = all.find((r: any) => {
      const candidates = [r.name, r.id, r.item_code].filter(Boolean);
      return candidates.some((v: any) =>
        String(v).toLowerCase().includes(idLower)
      );
    });
    if (partialId) return partialId;

    const fuzzySubstring = all.find((r: any) => {
      const fields = [
        r.customer_name, r.supplier_name, r.party_name, r.item_name,
        r.lead_name, r.title, r.description, r.warehouse_name, r.company_name,
      ].filter(Boolean);
      return fields.some((v: any) =>
        String(v).toLowerCase().includes(idLower)
      );
    });
    if (fuzzySubstring) return fuzzySubstring;

    const fuzzyTypo = all.find((r: any) => {
      const fields = [
        r.customer_name, r.supplier_name, r.party_name, r.item_name,
        r.lead_name, r.title, r.description, r.warehouse_name,
        r.company_name, r.name,
      ].filter(Boolean);
      return fields.some((v: any) => {
        const s = String(v).toLowerCase();
        return s.split(/\s+/).some((word: string) => {
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
// MULTI-RECORD FETCH
// ====================================================================
async function resolveAllRecords(
  endpoint: string,
  identifier: string
): Promise<any[]> {
  try {
    const res = await api.get(endpoint);
    const all = unwrap(res);
    const idLower = identifier.toLowerCase();

    const exact = all.filter((r: any) => {
      const candidates = [r.name, r.id, r.item_code, r.item_name].filter(Boolean);
      return candidates.some((v: any) => String(v).toLowerCase() === idLower);
    });
    if (exact.length > 0) return exact;

    const partialId = all.filter((r: any) => {
      const candidates = [r.name, r.id, r.item_code].filter(Boolean);
      return candidates.some((v: any) =>
        String(v).toLowerCase().includes(idLower)
      );
    });
    if (partialId.length > 0) return partialId;

    const fuzzySubstring = all.filter((r: any) => {
      const fields = [
        r.customer_name, r.supplier_name, r.party_name, r.item_name,
        r.lead_name, r.title, r.description, r.warehouse_name, r.company_name,
      ].filter(Boolean);
      return fields.some((v: any) =>
        String(v).toLowerCase().includes(idLower)
      );
    });
    if (fuzzySubstring.length > 0) return fuzzySubstring;

    const fuzzyTypo = all.filter((r: any) => {
      const fields = [
        r.customer_name, r.supplier_name, r.party_name, r.item_name,
        r.lead_name, r.title, r.description, r.warehouse_name,
        r.company_name, r.name,
      ].filter(Boolean);
      return fields.some((v: any) => {
        const s = String(v).toLowerCase();
        return s.split(/\s+/).some((word: string) => {
          if (word.length < 3) return false;
          const maxDist = word.length <= 5 ? 1 : 2;
          return (
            Math.abs(word.length - idLower.length) <= maxDist &&
            levenshtein(word, idLower) <= maxDist
          );
        });
      });
    });
    return fuzzyTypo;
  } catch {
    return [];
  }
}

async function resolveAllRecordsWithDirect(
  endpointBase: string,
  searchTerm: string
): Promise<any[]> {
  const direct = await fetchRecordById(endpointBase, searchTerm);
  if (direct) return [direct];
  return await resolveAllRecords(endpointBase, searchTerm);
}

// ====================================================================
// HANDOFF
// ====================================================================
export interface DetailHandoffPayload {
  endpointKey: string;
  id: string;
  route: string;
  master: any | null;
  related: Record<string, any[]>;
  errors: string[];
  storedAt: number;
}

const HANDOFF_KEY = "erp-detail-handoff";

function stashDetailHandoff(payload: DetailHandoffPayload) {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
    console.log(`📦 Stashed detail handoff for ${payload.endpointKey} #${payload.id}`);
  } catch (e) {
    console.warn("⚠️ Could not stash handoff:", e);
  }
}

// ====================================================================
// NAVIGATION
// ====================================================================
const MODULE_ROUTES: Record<string, string> = {
  "work orders": "/work-order", "work order": "/work-order",
  "job cards": "/job-card", "job card": "/job-card",
  inventory: "/InventoryList", bom: "/bom",
  "stock entries": "/stock-entry", "stock entry": "/stock-entry",
  items: "/item-list", item: "/item-list",
  "item groups": "/item-group", "item group": "/item-group",
  warehouses: "/warehouse", warehouse: "/warehouse",
  workstations: "/Workstation", workstation: "/Workstation",
  operations: "/operations", operation: "/operations",
  uom: "/uom", "units of measure": "/uom",
  "quality inspections": "/quality-inspection", "quality inspection": "/quality-inspection",
  leads: "/lead", lead: "/lead",
  quotations: "/quotation", quotation: "/quotation",
  "sales orders": "/sales-order", "sales order": "/sales-order",
  "proforma invoices": "/proforma-invoice", "proforma invoice": "/proforma-invoice",
  proforma: "/proforma-invoice",
  "delivery notes": "/delivery-challan", "delivery challans": "/delivery-challan",
  "delivery challan": "/delivery-challan",
  "sales invoices": "/sales-bill", "sales bills": "/sales-bill",
  "sales bill": "/sales-bill", "tax invoices": "/sales-bill",
  "tax invoice": "/sales-bill",
  companies: "/company", company: "/company",
  "purchase orders": "/purchase-order", "purchase order": "/purchase-order",
  grn: "/grn", grns: "/grn",
  "goods receipt orders": "/grn", "goods receipt order": "/grn",
  "purchase invoices": "/purchase-invoice", "purchase invoice": "/purchase-invoice",
  "purchase bills": "/purchase-invoice", "purchase bill": "/purchase-invoice",
  settings: "/settings", setting: "/settings",
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

const MODULE_DETAIL_ROUTES: Record<string, string> = {
  // ── Sales (put these FIRST because they are most specific) ──────────
  "proforma invoice": "/proforma-invoice/view/",
  "delivery challan": "/delivery-challan/view/",
  "sales invoice": "/sales-bill/edit/",
  "tax invoice": "/sales-bill/edit/",
  "sales bill": "/sales-bill/edit/",
  "delivery note": "/delivery-challan/view/",
  "sales order": "/sales-order/",
  quotation: "/quotation/",

  // ── Purchasing ─────────────────────────────────────────────────────
  "goods receipt order": "/grn/",
  "purchase invoice": "/purchase-invoice/",
  "purchase bills": "/purchase-invoice/",
  "purchase bill": "/purchase-invoice/",
  "purchase order": "/purchase-order/",
  grn: "/grn/",

  // ── Quality ────────────────────────────────────────────────────────
  "quality inspection": "/quality-inspection/",

  // ── Manufacturing ──────────────────────────────────────────────────
  "work order": "/work-order/",
  "job card": "/job-cards/",
  bom: "/bom/",
  "stock entry": "/stock-entry/",

  // ── Setup ──────────────────────────────────────────────────────────
  "item group": "/item-group/",
  workstation: "/Workstation/",
  warehouse: "/warehouse/",
  operation: "/operation/",
  company: "/company/",
  supplier: "/supplier/",
  customer: "/customer/",
  employee: "/employee/",
  item: "/item/",
  uom: "/uom/",

  // ── Sales (short keys last) ────────────────────────────────────────
  lead: "/leads/",
};

// Map from MODULE_DETAIL_ROUTES keys → DETAIL_PAGE_APIS keys
const MODULE_TO_ENDPOINT_KEY: Record<string, string> = {
  "work order": "workOrder",
  "job card": "jobCard",
  bom: "bom",
  "stock entry": "stockEntry",
  item: "item",
  "item group": "itemGroup",
  warehouse: "warehouse",
  workstation: "workstation",
  operation: "operation",
  uom: "uom",
  "quality inspection": "qualityInspection",
  lead: "lead",
  quotation: "quotation",
  "sales order": "salesOrder",
  "proforma invoice": "proformaInvoice",
  "delivery challan": "deliveryNote",
  "delivery note": "deliveryNote",
  "sales bill": "salesInvoice",
  "sales invoice": "salesInvoice",
  "tax invoice": "salesInvoice",
  company: "company",
  "purchase order": "purchaseOrder",
  grn: "grn",
  "goods receipt order": "grn",
  "purchase invoice": "purchaseInvoice",
  "purchase bills": "purchaseInvoice",
  "purchase bill": "purchaseInvoice",
};

const MODULE_API_BASES: Record<string, string> = {
  "work order": "/work-order",
  "job card": "/job-card",
  bom: "/bom",
  "stock entry": "/stock-entry",
  item: "/item",
  "item group": "/item-group",
  warehouse: "/warehouse",
  workstation: "/workstation",
  operation: "/operation",
  uom: "/uom",
  "quality inspection": "/quality-inspection",
  lead: "/lead",
  quotation: "/quotation",
  "sales order": "/sales-order",
  "proforma invoice": "/sales-order",
  "delivery challan": "/delivery-note",
  "delivery note": "/delivery-note",
  "sales bill": "/sales-invoice",
  "sales invoice": "/sales-invoice",
  "tax invoice": "/sales-invoice",
  company: "/company",
  "purchase order": "/purchase-order",
  grn: "/grn",
  "goods receipt order": "/grn",
  "purchase invoice": "/purchase-invoice",
  "purchase bills": "/purchase-invoice",
  "purchase bill": "/purchase-invoice",
};

const NAV_KEYWORDS = [
  "go to", "open ", "navigate", "take me to",
  "show me the page", "go on", "redirect",
];

function isNavigationQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return NAV_KEYWORDS.some((kw) => q.includes(kw));
}

function detectNavigationTarget(question: string): {
  route: string;
  label: string;
} | null {
  const q = question.toLowerCase();
  const keys = Object.keys(MODULE_ROUTES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (q.includes(key) || fuzzyContains(q, key)) {
      return { route: MODULE_ROUTES[key], label: key };
    }
  }
  return null;
}

function detectGenericDetailNavigation(question: string): string | null {
  const q = question.toLowerCase();
  if (!isNavigationQuestion(question)) return null;

  const hasPage =
    q.includes("detail page") || q.includes("edit page") ||
    q.includes("details page") || q.includes("detail") || q.includes("edit");

  if (!hasPage) return null;

  const id = extractAlphanumericId(question);
  if (id && !STOP_WORDS.has(id.toLowerCase())) {
    return id;
  }
  return null;
}

function detectDetailNavigationTarget(question: string): {
  moduleKey: string;
  label: string;
  searchId: string;
} | null {
  const q = question.toLowerCase();

  if (!isNavigationQuestion(question)) return null;

  const keys = Object.keys(MODULE_DETAIL_ROUTES).sort(
    (a, b) => b.length - a.length
  );

  for (const key of keys) {
    if (AMBIGUOUS_MODULE_KEYS.has(key)) {
      const wordBoundary = new RegExp(`(^|\\s)${key}(\\s|$)`);
      if (!wordBoundary.test(q)) continue;
    }

    if (q.includes(key) || fuzzyContains(q, key)) {
      // 1) Try explicit ID (12abc, BOM-00123, WO-00286…)
      const id = extractAlphanumericId(question);
      if (id && id.toLowerCase() !== key.toLowerCase()) {
        console.log(`🧭 Detail nav detected: ${key} · ID "${id}"`);
        return { moduleKey: key, label: key, searchId: id };
      }
      // 2) Fall back to a word token like "bolt" (but never a doc prefix)
      const word = extractWordToken(question, key);
      if (word) {
        console.log(`🧭 Detail nav detected: ${key} · word "${word}"`);
        return { moduleKey: key, label: key, searchId: word };
      }
    }
  }

  return null;
}

function isShowDetailAndNavigate(question: string): boolean {
  const q = question.toLowerCase();
  const hasDetail = isDetailQuestion(question);
  const hasNav =
    q.includes("navigate") ||
    q.includes("go to") ||
    q.includes("open") ||
    q.includes("show");
  const hasDetailPage = q.includes("detail page") || q.includes("edit page") ||
                        q.includes("detail") || q.includes("page");
  return hasDetail && hasNav && hasDetailPage;
}

function buildModuleCandidates(
  endpointKey: string,
  endpoint: { keywords?: string[]; label?: string; module?: string }
): string[] {
  const raw = [
    endpointKey,
    endpoint.module,
    endpoint.label,
    ...(endpoint.keywords || []),
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const filtered = raw.filter((c) => {
    if (AMBIGUOUS_MODULE_KEYS.has(c) && c !== endpointKey.toLowerCase()) {
      return false;
    }
    return true;
  });

  return [...new Set(filtered)];
}

function resolveDetailRouteForRecord(
  endpointKey: string,
  endpoint: { keywords?: string[]; label?: string; module?: string }
): { route: string; moduleKey: string } {
  const candidates = buildModuleCandidates(endpointKey, endpoint);

  for (const c of candidates) {
    if (MODULE_DETAIL_ROUTES[c]) {
      return { route: MODULE_DETAIL_ROUTES[c], moduleKey: c };
    }
  }

  const detailKeys = Object.keys(MODULE_DETAIL_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const key of detailKeys) {
    if (AMBIGUOUS_MODULE_KEYS.has(key)) continue;
    if (candidates.some((c) => c.includes(key) || key.includes(c))) {
      return { route: MODULE_DETAIL_ROUTES[key], moduleKey: key };
    }
  }

  return { route: "", moduleKey: "" };
}

// ====================================================================
// PAGE FLOW
// ====================================================================
const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
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
  "/work-order": "Work Order List",
  "/job-card": "Job Card List",
  "/bom": "BOM List",
  "/stock-entry": "Stock Entry List",
  "/item-list": "Item List",
  "/item-group": "Item Group List",
  "/warehouse": "Warehouse List",
  "/Workstation": "Workstation List",
  "/operations": "Operations List",
  "/uom": "UOM List",
  "/quality-inspection": "Quality Inspection List",
  "/lead": "Lead List",
  "/quotation": "Quotation List",
  "/sales-order": "Sales Order List",
  "/proforma-invoice": "Proforma Invoice List",
  "/delivery-challan": "Delivery Challan List",
  "/sales-bill": "Sales Bill List",
  "/company": "Company List",
  "/purchase-order": "Purchase Order List",
  "/grn": "GRN List",
  "/purchase-invoice": "Purchase Invoice List",
  "/InventoryList": "Inventory List",
  "/settings": "Settings",
};

const PAGE_FLOWS: Record<string, { label: string; route: string }[]> = {
  sales: [
    { label: "Sales Dashboard", route: "/dashboard/sales" },
    { label: "Leads", route: "/lead" },
    { label: "Quotations", route: "/quotation" },
    { label: "Sales Orders", route: "/sales-order" },
    { label: "Proforma Invoices", route: "/proforma-invoice" },
    { label: "Delivery Challans", route: "/delivery-challan" },
    { label: "Sales Bills", route: "/sales-bill" },
  ],
  manufacturing: [
    { label: "Manufacturing Dashboard", route: "/dashboard/manufacturing" },
    { label: "BOM", route: "/bom" },
    { label: "Work Orders", route: "/work-order" },
    { label: "Job Cards", route: "/job-card" },
    { label: "Quality Inspections", route: "/quality-inspection" },
    { label: "Stock Entries", route: "/stock-entry" },
  ],
  purchasing: [
    { label: "Purchasing Dashboard", route: "/dashboard/purchasing" },
    { label: "Purchase Orders", route: "/purchase-order" },
    { label: "GRNs", route: "/grn" },
    { label: "Purchase Invoices", route: "/purchase-invoice" },
  ],
  setup: [
    { label: "Setup Dashboard", route: "/dashboard/setup" },
    { label: "Items", route: "/item-list" },
    { label: "Item Groups", route: "/item-group" },
    { label: "Warehouses", route: "/warehouse" },
    { label: "Workstations", route: "/Workstation" },
    { label: "Operations", route: "/operations" },
    { label: "UOM", route: "/uom" },
  ],
  inventory: [
    { label: "Stock Dashboard", route: "/dashboard/stock" },
    { label: "Inventory", route: "/InventoryList" },
    { label: "Stock Entries", route: "/stock-entry" },
  ],
  quality: [
    { label: "Quality Dashboard", route: "/dashboard/quality" },
    { label: "Quality Inspections", route: "/quality-inspection" },
  ],
  organization: [
    { label: "Organization Dashboard", route: "/dashboard/organization" },
    { label: "Companies", route: "/company" },
  ],
  accounting: [{ label: "Accounting Dashboard", route: "/dashboard/accounting" }],
  reports: [{ label: "Reports Dashboard", route: "/dashboard/reports" }],
  tools: [{ label: "Tools Dashboard", route: "/dashboard/tools" }],
};

const FLOW_LABELS: Record<string, string> = {
  sales: "Sales Flow",
  manufacturing: "Manufacturing Flow",
  purchasing: "Purchasing Flow",
  setup: "Setup Flow",
  inventory: "Inventory Flow",
  quality: "Quality Flow",
  organization: "Organization Flow",
  accounting: "Accounting Flow",
  reports: "Reports Flow",
  tools: "Tools Flow",
};

function findFlowForRoute(route: string): {
  flowKey: string;
  flowLabel: string;
  stepIndex: number;
} | null {
  for (const [flowKey, steps] of Object.entries(PAGE_FLOWS)) {
    const idx = steps.findIndex(
      (s) => s.route === route || route.startsWith(s.route + "/")
    );
    if (idx !== -1) {
      return {
        flowKey,
        flowLabel: FLOW_LABELS[flowKey] || `${flowKey} Flow`,
        stepIndex: idx,
      };
    }
  }
  return null;
}

function findFlowKeyForModule(moduleKeyword: string): string | null {
  const route = MODULE_ROUTES[moduleKeyword.toLowerCase()] ||
                MODULE_DETAIL_ROUTES[moduleKeyword.toLowerCase()];
  if (!route) return null;
  const flow = findFlowForRoute(route);
  return flow ? flow.flowKey : null;
}

function detectPageFlow(pathname: string): {
  flowKey: string;
  flowLabel: string;
  steps: { label: string; route: string }[];
  currentIndex: number;
} | null {
  const sortedRoutes = Object.keys(PAGE_LABELS).sort(
    (a, b) => b.length - a.length
  );
  let matchedRoute = "";
  for (const r of sortedRoutes) {
    if (pathname === r || pathname.startsWith(r + "/")) {
      matchedRoute = r;
      break;
    }
  }
  if (!matchedRoute) return null;

  for (const [flowKey, steps] of Object.entries(PAGE_FLOWS)) {
    const idx = steps.findIndex(
      (s) => s.route === matchedRoute || matchedRoute.startsWith(s.route + "/")
    );
    if (idx !== -1) {
      return {
        flowKey,
        flowLabel: FLOW_LABELS[flowKey] || `${flowKey} Flow`,
        steps,
        currentIndex: idx,
      };
    }
  }
  return null;
}

function answerFlowQuestion(pathname: string): string {
  const flow = detectPageFlow(pathname);
  if (!flow) {
    return (
      `🗺️ **Page Flow**\n\n` +
      `I couldn't determine a specific flow for the current page.\n` +
      `Current path: **${pathname}**\n\n` +
      `Available flows:\n` +
      `• Sales Flow — Lead → Quotation → Sales Order → Delivery → Invoice\n` +
      `• Manufacturing Flow — BOM → Work Order → Job Card → Quality → Stock\n` +
      `• Purchasing Flow — Purchase Order → GRN → Purchase Invoice\n` +
      `• Setup Flow — Item → Item Group → Warehouse → Workstation\n` +
      `• Inventory Flow — Stock Dashboard → Inventory → Stock Entry\n` +
      `• Quality Flow — Quality Dashboard → Quality Inspection\n` +
      `• Organization Flow — Company Management\n`
    );
  }

  const lines: string[] = [];
  lines.push(`🗺️ **${flow.flowLabel}**`);
  lines.push("");
  lines.push(`You are currently on **${PAGE_LABELS[pathname] || pathname}**`);
  lines.push(`This is **step ${flow.currentIndex + 1} of ${flow.steps.length}** in the flow.`);
  lines.push("");

  flow.steps.forEach((step, i) => {
    const isCurrent = i === flow.currentIndex;
    const isPast = i < flow.currentIndex;
    const isFuture = i > flow.currentIndex;

    let marker = "";
    if (isCurrent) marker = "▶️";
    else if (isPast) marker = "✅";
    else if (isFuture) marker = "⬜";

    const arrow = i < flow.steps.length - 1 ? "  ↓" : "";
    const label = isCurrent
      ? `**${step.label}** ← *you are here*`
      : step.label;

    lines.push(`${marker} ${i + 1}. ${label}`);
    if (arrow) lines.push(arrow);
  });

  lines.push("");
  lines.push(`💡 **Tip:** ${getFlowTip(flow.flowKey, flow.currentIndex)}`);
  return lines.join("\n");
}

function moduleBreadcrumb(moduleKeyword: string): string {
  const flowKey = findFlowKeyForModule(moduleKeyword);
  if (!flowKey) return prettyField(moduleKeyword);

  const route = MODULE_ROUTES[moduleKeyword.toLowerCase()] ||
                MODULE_DETAIL_ROUTES[moduleKeyword.toLowerCase()];
  if (!route) return prettyField(moduleKeyword);

  const steps = PAGE_FLOWS[flowKey];
  const idx = steps.findIndex(
    (s) => s.route === route || route.startsWith(s.route + "/")
  );
  if (idx === -1) return prettyField(moduleKeyword);

  return steps
    .slice(0, idx + 1)
    .map((s) => s.label)
    .join(" → ");
}

function getFlowTip(flowKey: string, index: number): string {
  const tips: Record<string, string[]> = {
    sales: [
      "Track your leads here and convert them to quotations.",
      "Send quotations to customers. Accepted ones become Sales Orders.",
      "Manage confirmed Sales Orders. Create Delivery Challans from here.",
      "Track deliveries. Once delivered, generate Sales Bills.",
      "Create final invoices for delivered goods.",
    ],
    manufacturing: [
      "Define your Bill of Materials for products.",
      "Plan production with Work Orders. Release them for execution.",
      "Track individual operations on the shop floor.",
      "Record quality checks for manufactured items.",
      "Transfer finished goods to stock.",
    ],
    purchasing: [
      "Create Purchase Orders for required materials.",
      "Receive goods against POs via GRN.",
      "Record supplier invoices against GRNs.",
    ],
    setup: [
      "Define items and their attributes first.",
      "Group items logically for easier management.",
      "Set up physical locations for inventory.",
      "Configure workstations for manufacturing.",
      "Define standard operations and their times.",
    ],
    inventory: [
      "Monitor real-time stock levels.",
      "Make manual stock adjustments.",
      "Track all stock movements.",
    ],
    quality: [
      "Set quality parameters first.",
      "Perform inspections on incoming and outgoing goods.",
    ],
    organization: ["Manage multiple companies in one system."],
  };
  const flowTips = tips[flowKey];
  if (!flowTips || flowTips.length === 0) return "Explore the next step in the flow!";
  const tipIdx = Math.min(index, flowTips.length - 1);
  return flowTips[tipIdx];
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
// SETTINGS
// ====================================================================
const SETTINGS_PATHS = ["/settings", "/Setting", "/admin/settings"];

function isOnSettings(pathname: string): boolean {
  return SETTINGS_PATHS.some((p) => pathname.startsWith(p));
}

function answerSettingsQuestion(question: string): string | null {
  const q = question.toLowerCase();

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

  if (
    q.includes("date format") || q.includes("date-format") ||
    q.includes("dateformat") || (q.includes("date") && q.includes("format"))
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
  { prefix: "/dashboard/sales", chips: ["Sales Dashboard Summary", "How many leads?", "How many quotations?", "How many sales orders?", "Total sales revenue", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/manufacturing", chips: ["Manufacturing Dashboard Summary", "How many work orders?", "How many job cards?", "Work orders in process", "How many BOMs?", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/setup", chips: ["Setup Dashboard Summary", "How many items?", "How many warehouses?", "How many workstations?", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/purchasing", chips: ["Purchasing Dashboard Summary", "How many purchase orders?", "How many GRNs?", "Total purchase spend", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/organization", chips: ["Organization Dashboard Summary", "How many companies?", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/quality", chips: ["Quality Dashboard Summary", "How many quality inspections?", "Show me flow of this page", "Summary"] },
  { prefix: "/settings", chips: ["What is the current theme?", "What date format is set?", "Settings help", "Summary"] },
  { prefix: "/sales-order", chips: ["How many sales orders?", "Sales orders today", "Show latest sales orders", "Total sales revenue", "Show me flow of this page", "Summary"] },
  { prefix: "/quotation", chips: ["How many quotations?", "Show latest quotations", "Show me flow of this page", "Summary"] },
  { prefix: "/proforma-invoice", chips: ["How many proforma invoices?", "Show latest proforma invoices", "Show me flow of this page", "Summary"] },
  { prefix: "/delivery-challan", chips: ["How many delivery challans?", "Show latest delivery challans", "Show me flow of this page", "Summary"] },
  { prefix: "/sales-bill", chips: ["How many sales bills?", "Show latest sales bills", "Show me flow of this page", "Summary"] },
  { prefix: "/lead", chips: ["How many leads?", "Show latest leads", "Show me flow of this page", "Summary"] },
  { prefix: "/work-order", chips: ["How many work orders?", "Work orders in process", "Work orders completed", "Show me flow of this page", "Summary"] },
  { prefix: "/job-card", chips: ["How many job cards?", "Show latest job cards", "Show me flow of this page", "Summary"] },
  { prefix: "/bom", chips: ["How many BOMs?", "Show latest BOMs", "Show me flow of this page", "Summary"] },
  { prefix: "/stock-entry", chips: ["How many stock entries?", "Show latest stock entries", "Show me flow of this page", "Summary"] },
  { prefix: "/item-group", chips: ["How many item groups?", "Show latest item groups", "Show me flow of this page", "Summary"] },
  { prefix: "/item", chips: ["How many items?", "Show latest items", "Show me flow of this page", "Summary"] },
  { prefix: "/InventoryList", chips: ["How many inventory?", "Inventory value", "Show me flow of this page", "Summary"] },
  { prefix: "/warehouse", chips: ["How many warehouses?", "Show latest warehouses", "Show me flow of this page", "Summary"] },
  { prefix: "/Workstation", chips: ["How many workstations?", "Show latest workstations", "Show me flow of this page", "Summary"] },
  { prefix: "/operations", chips: ["How many operations?", "Show latest operations", "Show me flow of this page", "Summary"] },
  { prefix: "/uom", chips: ["How many UOMs?", "Show latest UOMs", "Show me flow of this page", "Summary"] },
  { prefix: "/quality-inspection", chips: ["How many quality inspections?", "Show latest quality inspections", "Show me flow of this page", "Summary"] },
  { prefix: "/company", chips: ["How many companies?", "Show latest companies", "Show me flow of this page", "Summary"] },
  { prefix: "/purchase-order", chips: ["How many purchase orders?", "Show latest purchase orders", "Show me flow of this page", "Summary"] },
  { prefix: "/grn", chips: ["How many goods receipt orders?", "Show latest GRNs", "Show me flow of this page", "Summary"] },
  { prefix: "/purchase-invoice", chips: ["How many purchase invoices?", "Show latest purchase invoices", "Show me flow of this page", "Summary"] },
];

const DEFAULT_CHIPS = [
  "Summary", "Show me flow of this page", "How many sales orders?",
  "How many work orders?", "How many items?", "How many warehouses?",
];

function getChipsForPath(pathname: string): string[] {
  const sorted = [...PAGE_CHIPS].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { prefix, chips } of sorted) {
    if (pathname.startsWith(prefix)) return chips;
  }
  return DEFAULT_CHIPS;
}

// ====================================================================
// ANALYSIS KEYWORDS
// ====================================================================
const ANALYSIS_KEYWORDS = [
  "which", "why", "how does", "how do", "explain", "compare",
  "difference", "trend", "highest", "lowest", "biggest", "smallest",
  "top", "best", "worst", "analyze", "analysis", "recommend",
  "suggest", "summarize", "tell me about", "what is", "what are",
  "who is", "who has",
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
  // 0. FLOW DETECTION
  // ════════════════════════════════════════════════════════════════════
  if (
    has(
      "flow", "where am i", "where is this page", "which module",
      "what module", "where does this page", "where does this belong",
      "page flow", "show me flow", "show flow", "flow of this page",
      "flow of the page", "module is this", "module does this"
    )
  ) {
    console.log("🗺️ Flow question detected");
    return { text: answerFlowQuestion(currentPath) };
  }

  // ════════════════════════════════════════════════════════════════════
  // 0b. SETTINGS
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
    // 1a. Named-module detail navigation
    const detailTarget = detectDetailNavigationTarget(question);
    if (detailTarget) {
      console.log(
        `🧭 Detail nav (named module) → "${detailTarget.moduleKey}", search "${detailTarget.searchId}"`
      );

      const moduleKey = detailTarget.moduleKey.toLowerCase();
      const apiBase = MODULE_API_BASES[moduleKey] ||
                      matchEndpoint(detailTarget.label)?.url ||
                      matchEndpoint(detailTarget.moduleKey)?.url;

      let navTo: string | undefined;
      let resolvedId: string = detailTarget.searchId;
      let recordFound = false;

      // 1) Resolve search term → actual record (so we get the numeric ID)
      if (apiBase) {
        const record = await resolveRecord(apiBase, detailTarget.searchId);
        if (record) {
          resolvedId = getRecordNavId(record, detailTarget.searchId);
          recordFound = true;
        }
      }

      if (!recordFound) {
        return {
          text:
            `🔍 I couldn't find a **${prettyField(detailTarget.label)}** matching ` +
            `**"${detailTarget.searchId}"**.\n\n` +
            `Try:\n` +
            `• "show latest ${detailTarget.label}s" to see available ones\n` +
            `• Double-check the number/name`,
        };
      }

      const detailRoute = MODULE_DETAIL_ROUTES[moduleKey] || "";
      navTo = detailRoute
        ? detailRoute + encodeURIComponent(resolvedId)
        : undefined;

      // 2) Fetch the FULL detail payload (master + related lists)
      const endpointKey = MODULE_TO_ENDPOINT_KEY[moduleKey];
      let fullDetail: any = null;

      if (endpointKey && DETAIL_PAGE_APIS[endpointKey] && resolvedId) {
        console.log(`📄 Fetching full detail payload for ${endpointKey} #${resolvedId}`);
        try {
          fullDetail = await fetchDetailPageData(endpointKey, resolvedId);
        } catch (e: any) {
          console.warn(`⚠️ fetchDetailPageData failed: ${e?.message || e}`);
        }
      }

      // 3) Stash the payload so the destination page can read it immediately
      if (fullDetail && endpointKey && navTo) {
        stashDetailHandoff({
          endpointKey,
          id: String(resolvedId),
          route: navTo,
          master: fullDetail.master,
          related: fullDetail.related,
          errors: fullDetail.errors || [],
          storedAt: Date.now(),
        });
      }

      // 4) Compose reply
      const summaryBits: string[] = [];
      if (fullDetail?.master) summaryBits.push(`✅ master record loaded`);
      if (fullDetail?.related) {
        const keys = Object.keys(fullDetail.related);
        if (keys.length > 0) {
          summaryBits.push(
            `✅ related lists loaded: ${keys.join(", ")}`
          );
        }
      }
      if (fullDetail?.errors?.length) {
        summaryBits.push(`⚠️ ${fullDetail.errors.length} fetch error(s)`);
      }

      return {
        text:
          `🧭 Navigating to **${prettyField(detailTarget.label)} ${resolvedId}** detail page...` +
          (summaryBits.length ? `\n\n${summaryBits.join("\n")}` : ""),
        navigateTo: navTo,
      };
    }

    // 1b. Generic detail navigation (module not named)
    const genericId = detectGenericDetailNavigation(question);
    if (genericId) {
      console.log(`🧭 Generic detail navigation → search all modules for "${genericId}"`);

      const found = await searchAllModulesForRecord(genericId);
      if (found) {
        const resolvedId = getRecordNavId(found.record, genericId);

        const { route: detailRoute, moduleKey: matchedModuleKey } =
          resolveDetailRouteForRecord(found.endpointKey, found.endpoint);

        const navTo = detailRoute
          ? detailRoute + encodeURIComponent(resolvedId)
          : undefined;

        const endpointKey = MODULE_TO_ENDPOINT_KEY[matchedModuleKey] || found.endpointKey;
        if (endpointKey && DETAIL_PAGE_APIS[endpointKey] && navTo) {
          try {
            const fullDetail = await fetchDetailPageData(endpointKey, resolvedId);
            stashDetailHandoff({
              endpointKey,
              id: String(resolvedId),
              route: navTo,
              master: fullDetail.master,
              related: fullDetail.related,
              errors: fullDetail.errors || [],
              storedAt: Date.now(),
            });
          } catch (e: any) {
            console.warn(`⚠️ fetchDetailPageData failed: ${e?.message || e}`);
          }
        }

        console.log(
          `✅ Found "${genericId}" in ${found.endpoint.label} → ${navTo}`
        );

        return {
          text:
            `🧭 Navigating to **${found.endpoint.label} ${resolvedId}** detail page...`,
          navigateTo: navTo,
        };
      }

      return {
        text:
          `🔍 I couldn't find any record matching **"${genericId}"** in any module.\n\n` +
          `Please specify the module, e.g.:\n` +
          `• "Navigate on ${genericId} item detail page"\n` +
          `• "Navigate on ${genericId} work order detail page"\n` +
          `• "Navigate on ${genericId} warehouse detail page"`,
      };
    }

    // 1c. List-page navigation
    const target = detectNavigationTarget(question);
    if (target) {
      const current = currentPath.replace(/\/$/, "");
      const dest = target.route.replace(/\/$/, "");
      if (current === dest || current.startsWith(dest + "/")) {
        return { text: `📍 You're already on the **${target.label}** page.` };
      }
      console.log(`🧭 List navigation → ${target.route}`);
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
      salesPromise, purchasingPromise, manufacturingPromise,
      inventoryPromise, setupPromise, qualityPromise, organizationPromise,
    ]);

    const lines: string[] = [];
    lines.push(
      dashInfo.isDashboard
        ? `📊 **${dashInfo.label}**`
        : `📊 **Business Snapshot**`
    );
    lines.push("");

    if (show("sales") && (soRes || qRes || leadRes)) {
      const soCount = soRes ? getTotalCount(soRes) : 0;
      const qCount = qRes ? getTotalCount(qRes) : 0;
      const leadCount = leadRes ? getTotalCount(leadRes) : 0;
      const so = soRes ? unwrap(soRes) : [];
      const qs = qRes ? unwrap(qRes) : [];
      const rev = so.reduce((s: number, o: any) => s + (o.grand_total || 0), 0);
      const quoteVal = qs.reduce((s: number, x: any) => s + (x.grand_total || 0), 0);
      lines.push(`**🛒 Sales**`);
      if (leadRes) lines.push(`• Leads: **${leadCount}**`);
      if (qRes) lines.push(`• Quotations: **${qCount}** · ${fmtLakh(quoteVal)}`);
      if (soRes) lines.push(`• Sales Orders: **${soCount}** · ${fmtLakh(rev)}`);
      lines.push("");
    }

    if (show("purchasing") && (piRes || poRes || grnRes)) {
      const piCount = piRes ? getTotalCount(piRes) : 0;
      const poCount = poRes ? getTotalCount(poRes) : 0;
      const grnCount = grnRes ? getTotalCount(grnRes) : 0;
      const pi = piRes ? unwrap(piRes) : [];
      const spend = pi.reduce((s: number, i: any) => s + (i.grand_total || i.total || 0), 0);
      lines.push(`**🛍️ Purchasing**`);
      if (poRes) lines.push(`• Purchase Orders: **${poCount}**`);
      if (grnRes) lines.push(`• GRNs: **${grnCount}**`);
      if (piRes) lines.push(`• Purchase Invoices: **${piCount}** · ${fmtLakh(spend)}`);
      lines.push("");
    }

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
      lines.push(`**🏭 Manufacturing**`);
      if (bomRes) lines.push(`• BOMs: **${bomCount}**`);
      if (woRes) lines.push(`• Work Orders: **${woCount}** · ${wip} in process · ${wc} completed`);
      if (jcRes) lines.push(`• Job Cards: **${jcCount}** · ${jcOpen} open · ${jcDone} completed`);
      lines.push("");
    }

    if (show("inventory") && invRes) {
      const invCount = getTotalCount(invRes);
      const inv = unwrap(invRes);
      const stockVal = inv.reduce((s: number, i: any) => s + (i.stock_value || 0), 0);
      const lowStock = inv.filter((i: any) => (i.actual_qty || 0) < 10).length;
      lines.push(`**📦 Inventory**`);
      lines.push(`• Items: **${invCount}** · ${fmtLakh(stockVal)} · ${lowStock} low stock`);
      lines.push("");
    }

    if (show("setup") && (itemRes || igRes || whRes)) {
      const itemCount = itemRes ? getTotalCount(itemRes) : 0;
      const igCount = igRes ? getTotalCount(igRes) : 0;
      const whCount = whRes ? getTotalCount(whRes) : 0;
      lines.push(`**⚙️ Setup**`);
      if (itemRes) lines.push(`• Items: **${itemCount}**`);
      if (igRes) lines.push(`• Item Groups: **${igCount}**`);
      if (whRes) lines.push(`• Warehouses: **${whCount}**`);
      lines.push("");
    }

    if (show("quality") && qiRes) {
      const qiCount = getTotalCount(qiRes);
      lines.push(`**✅ Quality**`);
      lines.push(`• Quality Inspections: **${qiCount}**`);
      lines.push("");
    }

    if (show("organization") && coRes) {
      const coCount = getTotalCount(coRes);
      lines.push(`**🏢 Organization**`);
      lines.push(`• Companies: **${coCount}**`);
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
      text: `💰 **Total Sales Revenue:** ₹${fmt(total)}\n\nFrom **${getTotalCount(res)}** orders.`,
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
      text:
        `📦 **Inventory Summary**\n\n` +
        `• Items: **${totalCount}**\n` +
        `• Total Value: **${fmtLakh(totalValue)}**\n` +
        `• Low Stock Alerts: **${lowStock}** items`,
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
        return { text: `🔄 **${n}** work orders are currently in process.` };
      }
      if (has("completed", "done", "finished")) {
        const n = wos.filter((w: any) => w.status === "Completed").length;
        return { text: `✅ **${n}** work orders are completed.` };
      }
      const n = wos.filter((w: any) =>
        ["Open", "Not Started", "Draft"].includes(w.status)
      ).length;
      return { text: `📋 **${n}** work orders are open / not started.` };
    }
  }

  // ── HELP ───────────────────────────────────────────────────────────
  if (has("help", "what can you", "how do you", "commands")) {
    return {
      text:
        "🤖 **ERP Assistant — Help**\n\n" +
        "I can answer questions about every module. Try:\n\n" +
        "**📊 Counting & Lists**\n" +
        "• How many sales orders?\n" +
        "• Show latest warehouses\n\n" +
        "**🔍 Detail Lookup**\n" +
        "• Detail about BOM-00123\n" +
        "• Detail of 12ABC item\n" +
        "• Detail of 381\n\n" +
        "**🧭 Navigate to Detail Page**\n" +
        "• Navigate on 12abc detail page\n" +
        "• Navigate on bolt bom detail page\n" +
        "• Go to work order 294 detail page\n" +
        "• Navigate on purchase bill 92 detail page\n\n" +
        "**🗺️ Page Flow**\n" +
        "• Show me flow of this page\n" +
        "• Where am I?\n\n" +
        "**⚙️ Settings**\n" +
        "• What is the current theme?\n" +
        "• What date format is set?\n\n" +
        "**📈 Analysis**\n" +
        "• Summary\n" +
        "• Total sales revenue",
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // 4. DETAIL VIEW (with optional auto-navigate)
  // ════════════════════════════════════════════════════════════════════
  const endpoint = matchEndpoint(question);

  if (endpoint && isDetailQuestion(question)) {
    const identifier = extractDetailSearchTerm(question, endpoint.keywords);
    const shouldNavigate = isShowDetailAndNavigate(question);

    if (identifier) {
      console.log(`🔍 Detail request → ${endpoint.label} · "${identifier}"${shouldNavigate ? " (+navigate)" : ""}`);

      const moduleKey = endpoint.keywords[0]?.toLowerCase() || "";
      const apiBase = MODULE_API_BASES[moduleKey] || endpoint.url;
      const records = await resolveAllRecordsWithDirect(apiBase, identifier);

      if (records.length > 0) {
        console.log(`✅ Found ${records.length} match(es) for "${identifier}"`);

        const breadcrumb = moduleBreadcrumb(endpoint.keywords[0] || endpoint.label);
        const header = `🗺️ **Module Path:** ${breadcrumb}`;

        let body = "";
        if (records.length === 1) {
          const detailBody = renderRecordDetail(records[0], endpoint.label);
          const bodyLines = detailBody.split("\n");
          body = bodyLines.slice(2).join("\n");
        } else {
          const details = records.map((r, i) =>
            renderRecordDetail(r, `${endpoint.label} (${i + 1}/${records.length})`)
          );
          body = details.join("\n\n---\n\n");
          body = `Found **${records.length}** matching records:\n\n` + body;
        }

        const navNote = shouldNavigate && records.length === 1
          ? `\n\n---\n🧭 **Auto-navigating to detail page...**`
          : records.length === 1
            ? `\n\n---\n🔗 Open the record in its detail page.`
            : `\n\n---\n🔗 Multiple records found. Open the list to view them.`;

        const navTo = shouldNavigate && records.length === 1
          ? (MODULE_DETAIL_ROUTES[moduleKey] || "")
            + encodeURIComponent(getRecordNavId(records[0], identifier))
          : undefined;

        if (navTo) {
          const endpointKey = MODULE_TO_ENDPOINT_KEY[moduleKey];
          if (endpointKey && DETAIL_PAGE_APIS[endpointKey]) {
            try {
              const fullDetail = await fetchDetailPageData(
                endpointKey,
                getRecordNavId(records[0], identifier)
              );
              stashDetailHandoff({
                endpointKey,
                id: String(getRecordNavId(records[0], identifier)),
                route: navTo,
                master: fullDetail.master,
                related: fullDetail.related,
                errors: fullDetail.errors || [],
                storedAt: Date.now(),
              });
            } catch (e: any) {
              console.warn(`⚠️ handoff failed: ${e?.message || e}`);
            }
          }
        }

        return {
          text: header + "\n\n" + body + navNote,
          navigateTo: navTo,
        };
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
        `• "detail of 12ABC item"\n` +
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
        const recordId = getRecordNavId(found.record, token);

        const { route: detailRoute, moduleKey: matchedModuleKey } =
          resolveDetailRouteForRecord(found.endpointKey, found.endpoint);

        const navTo = detailRoute
          ? detailRoute + encodeURIComponent(recordId)
          : undefined;
        const shouldNavigate = isShowDetailAndNavigate(question);

        const breadcrumb = moduleBreadcrumb(
          found.endpoint.keywords[0] || found.endpoint.label
        );
        const header = `🗺️ **Module Path:** ${breadcrumb}`;
        const detailBody = renderRecordDetail(found.record, found.endpoint.label);
        const bodyLines = detailBody.split("\n");
        const cleanBody = bodyLines.slice(2).join("\n");

        const navNote = shouldNavigate && navTo
          ? `\n\n---\n🧭 **Auto-navigating to detail page...**`
          : "";

        if (shouldNavigate && navTo) {
          const endpointKey = MODULE_TO_ENDPOINT_KEY[matchedModuleKey] || found.endpointKey;
          if (endpointKey && DETAIL_PAGE_APIS[endpointKey]) {
            try {
              const fullDetail = await fetchDetailPageData(endpointKey, recordId);
              stashDetailHandoff({
                endpointKey,
                id: String(recordId),
                route: navTo,
                master: fullDetail.master,
                related: fullDetail.related,
                errors: fullDetail.errors || [],
                storedAt: Date.now(),
              });
            } catch (e: any) {
              console.warn(`⚠️ handoff failed: ${e?.message || e}`);
            }
          }
        }

        return {
          text: header + "\n\n" + cleanBody + navNote,
          navigateTo: shouldNavigate ? navTo : undefined,
        };
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
      `• "Navigate on 12abc detail page"\n` +
      `• "Show me flow of this page"\n` +
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
        "Hi 👋 I'm your ERP assistant.\n\n" +
        "I can help you with:\n" +
        "• 📊 Counting — *How many sales orders?*\n" +
        "• 🔍 Details — *Detail about 12ABC*\n" +
        "• 🧭 Navigate — *Navigate on 12abc detail page*\n" +
        "• 🗺️ Page Flow — *Show me flow of this page*\n" +
        "• ⚙️ Settings — *What is the current theme?*\n\n" +
        "What would you like to know?",
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
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: result.text,
          navigateTo: result.navigateTo,
        },
      ]);

      if (result.navigateTo) {
        setTimeout(() => {
          navigate(result.navigateTo!);
          setOpen(false);
        }, 1400);
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

  const formatText = (text: string): React.ReactNode => {
    const lines = text.split("\n");

    return lines.map((line, lineIdx) => {
      if (line.trim() === "") {
        return <br key={`br-${lineIdx}`} />;
      }

      const parts: React.ReactNode[] = [];
      const regex = /\*\*(.+?)\*\*/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        parts.push(
          <strong key={`bold-${lineIdx}-${match.index}`} className="chat-bold">
            {match[1]}
          </strong>
        );
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      return (
        <div key={`line-${lineIdx}`} className="chat-line">
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

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
                <div className="chat-bubble">
                  {formatText(m.text)}
                </div>
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