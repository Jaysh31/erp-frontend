// src/pages/components/chatbot/ChatBot.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaUser, FaSpinner,
  FaExpandArrowsAlt, FaCompressArrowsAlt,
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
  ERP_ENDPOINTS,
  ENDPOINT_ROUTES,
  isLatestListQuery,
  fetchAndBuildLatestListNavigation,
} from "../../../services/erpApi";

interface Msg {
  role: "user" | "bot";
  text: string;
  navigateTo?: string;
  navigateLabel?: string;
  rowActions?: Array<{ label: string; route: string }>;
  tableRoutes?: string[];
}

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

const AMBIGUOUS_MODULE_KEYS = new Set([
  "bom", "grn", "po", "so", "pi", "jc", "wo",
]);

const DOCUMENT_PREFIXES = new Set([
  "pinv", "sinv", "grn", "po", "so", "bom", "wo", "jc", "qtn",
  "dn", "pi", "si", "lead", "emp", "sup", "cust",
]);

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

function escapeCell(v: any): string {
  const s = String(v ?? "").trim();
  if (!s || s === "—" || s === "-") return "";
  return s.replace(/\|/g, "\\|").replace(/\s+/g, " ");
}

function renderTable(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  if (rows.length === 0) return "";

  const normalized: string[][] = rows.map((r) =>
    r.map((c) => escapeCell(c))
  );

  const keepColumn: boolean[] = headers.map((_, colIdx) =>
    normalized.some((row) => row[colIdx] && row[colIdx].length > 0)
  );

  const finalHeaders = headers.filter((_, i) => keepColumn[i]);

  const finalRows = normalized
    .map((row) => row.filter((_, i) => keepColumn[i]))
    .filter((row) => row.some((c) => c && c.length > 0));

  if (finalHeaders.length === 0 || finalRows.length === 0) return "";

  const headerLine = `| ${finalHeaders.join(" | ")} |`;
  const sepLine = `|${finalHeaders.map(() => "------").join("|")}|`;
  const bodyLines = finalRows.map((r) => `| ${r.join(" | ")} |`);

  return [headerLine, sepLine, ...bodyLines].join("\n");
}

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

function getRowName(r: any): string {
  return (
    r.customer_name ||
    r.supplier_name ||
    r.party_name ||
    r.item_name ||
    r.item_code ||
    r.lead_name ||
    r.name ||
    r.title ||
    r.id ||
    "Record"
  );
}

function getRowId(r: any): string {
  return String(
    r.name || r.id || r.item_code || r.order_no || r.invoice_no || ""
  );
}

function getRowAmount(r: any): string {
  if (r.grand_total != null) return `₹${fmt(r.grand_total)}`;
  if (r.total != null) return `₹${fmt(r.total)}`;
  if (r.amount != null) return `₹${fmt(r.amount)}`;
  return "";
}

function getRowStatus(r: any): string {
  return r.status || getRecordStatus(r) || "";
}

function getRowDate(r: any): string {
  const created = getCreatedDate(r);
  const fallback = created ? null : getRecordDate(r);
  const d = created || fallback;
  return d ? formatShortDate(d) : "";
}

function getModuleTableSpec(endpointKey: string): {
  headers: string[];
  rowBuilder: (r: any, idx: number) => (string | number | null | undefined)[];
} {
  switch (endpointKey) {
    case "workOrder":
    case "jobCard":
      return {
        headers: ["#", "WO / JC", "Item", "Qty", "Cards", "Progress", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.work_order_no || `WO-${r.id}`,
          r.item_name || r.item_code || r.production_item || "",
          r.qty ?? r.quantity ?? "",
          r.total_job_cards ?? r.job_cards ?? "",
          r.progress != null ? `${r.progress}%` : "",
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "bom":
      return {
        headers: ["#", "BOM", "Item", "Qty", "Type", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.bom_no || `BOM-${r.id}`,
          r.item_name || r.item_code || "",
          r.quantity ?? r.qty ?? "",
          r.type || r.bom_type || "",
          getRowDate(r),
        ],
      };
    case "stockEntry":
      return {
        headers: ["#", "Stock Entry", "Type", "Warehouse", "Items", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.stock_entry_no || `SE-${r.id}`,
          r.stock_entry_type || r.purpose || r.type || "",
          r.to_warehouse || r.from_warehouse || r.warehouse || "",
          r.total_items ?? "",
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "item":
    case "itemProduct":
    case "itemRaw":
      return {
        headers: ["#", "Item Code", "Item Name", "Group", "UOM", "Type", "Status"],
        rowBuilder: (r, i) => [
          i + 1,
          r.item_code || r.name || `ITEM-${r.id}`,
          r.item_name || r.name || "",
          r.item_group || r.group || "",
          r.stock_uom || r.uom || "",
          r.type || r.item_type || (r.is_stock_item === 1 ? "Stock" : "Non-Stock"),
          r.disabled === 1 ? "Disabled" : "Enabled",
        ],
      };
    case "warehouse":
      return {
        headers: ["#", "Warehouse", "Company", "Status"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.warehouse_name || `WH-${r.id}`,
          r.company || "",
          r.disabled === 1 ? "Disabled" : "Enabled",
        ],
      };
    case "workstation":
      return {
        headers: ["#", "Workstation", "Type", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.workstation_name || `WS-${r.id}`,
          r.type || "",
          r.disabled === 1 ? "Disabled" : "Enabled",
          getRowDate(r),
        ],
      };
    case "operation":
      return {
        headers: ["#", "Operation", "Workstation", "Time (min)", "Status"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.operation_name || `OP-${r.id}`,
          r.workstation || "",
          r.total_operation_time ?? r.time_in_mins ?? "",
          getRowStatus(r),
        ],
      };
    case "uom":
      return {
        headers: ["#", "UOM", "Enabled"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.uom_name || "",
          r.enabled === 0 ? "No" : "Yes",
        ],
      };
    case "itemGroup":
      return {
        headers: ["#", "Item Group", "Parent"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.item_group_name || "",
          r.parent_item_group || "",
        ],
      };
    case "quotation":
      return {
        headers: ["#", "Quotation", "Customer", "Amount", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.quotation_no || `QTN-${r.id}`,
          r.customer_name || r.party_name || "",
          getRowAmount(r),
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "salesOrder":
      return {
        headers: ["#", "Sales Order", "Customer", "Amount", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.sales_order_no || r.order_no || `SO-${r.id}`,
          r.customer_name || r.party_name || "",
          getRowAmount(r),
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "proformaInvoice":
      return {
        headers: ["#", "Proforma", "Customer", "Amount", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.proforma_invoice_no || `PI-${r.id}`,
          r.customer_name || r.party_name || "",
          getRowAmount(r),
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "deliveryNote":
      return {
        headers: ["#", "Delivery Note", "Customer", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.delivery_note_no || `DN-${r.id}`,
          r.customer_name || r.party_name || "",
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "salesInvoice":
      return {
        headers: ["#", "Invoice", "Customer", "Amount", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.invoice_no || r.sales_invoice_no || `INV-${r.id}`,
          r.customer_name || r.party_name || "",
          getRowAmount(r),
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "lead":
      return {
        headers: ["#", "Lead", "Company", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.lead_name || `LEAD-${r.id}`,
          r.company_name || "",
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "purchaseOrder":
      return {
        headers: ["#", "PO", "Supplier", "Amount", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.purchase_order_no || r.order_no || `PO-${r.id}`,
          r.supplier_name || r.party_name || "",
          getRowAmount(r),
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "grn":
      return {
        headers: ["#", "GRN", "Party", "PO Ref", "Items", "Received", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.grn_no || `GRN-${r.id}`,
          r.supplier_name || r.party_name || r.name || "",
          r.purchase_order_id ? `PO-${String(r.purchase_order_id).padStart(5, "0")}` : "",
          r.total_items ?? "",
          r.total_received_qty ?? "",
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "purchaseInvoice":
      return {
        headers: ["#", "Invoice", "Supplier", "Amount", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.invoice_no || r.purchase_invoice_no || `PI-${r.id}`,
          r.supplier_name || r.party_name || "",
          getRowAmount(r),
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "qualityInspection":
      return {
        headers: ["#", "Inspection", "Item", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.inspection_no || `QI-${r.id}`,
          r.item_name || r.item_code || "",
          getRowStatus(r),
          getRowDate(r),
        ],
      };
    case "inventory":
      return {
        headers: ["#", "Item Code", "Item Name", "Warehouse", "Qty", "Value"],
        rowBuilder: (r, i) => [
          i + 1,
          r.item_code || r.name || "",
          r.item_name || "",
          r.warehouse || r.warehouse_name || "",
          r.actual_qty ?? r.qty ?? "",
          r.stock_value != null ? `₹${fmt(r.stock_value)}` : "",
        ],
      };
    case "company":
      return {
        headers: ["#", "Company", "Country", "Currency"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.company_name || `CO-${r.id}`,
          r.country || "",
          r.default_currency || r.currency || "",
        ],
      };
    case "customer":
    case "supplier":
    case "employee":
      return {
        headers: ["#", "Name", "Group / Type", "Status"],
        rowBuilder: (r, i) => [
          i + 1,
          r.name || r.customer_name || r.supplier_name || r.employee_name || "",
          r.customer_group || r.supplier_group || r.designation || "",
          r.disabled === 1 ? "Disabled" : "Enabled",
        ],
      };
    default:
      return {
        headers: ["#", "Name", "ID", "Status", "Date"],
        rowBuilder: (r, i) => [
          i + 1,
          getRowName(r),
          getRowId(r) || "",
          getRowStatus(r),
          getRowDate(r),
        ],
      };
  }
}

async function answerModuleGeneric(
  documentLabel: string,
  endpoint: string,
  range: DateRange,
  isCount: boolean
): Promise<AnswerResult> {
  const res = await api.get(endpoint);
  debugCount(documentLabel, res);
  const all = unwrap(res);
  const total = getTotalCount(res);
  let rows = all;
  if (range) rows = filterByDate(all, range);

  if (total === 0 && all.length === 0) {
    return { text: `📭 You have no ${documentLabel.toLowerCase()} yet.` };
  }
  if (range && rows.length === 0) {
    return { text: `📭 No ${documentLabel.toLowerCase()} ${range.label}.` };
  }
  if (isCount && !range) {
    return { text: `📊 You have **${total}** ${documentLabel.toLowerCase()}.` };
  }
  if (isCount && range) {
    return { text: `📊 **${rows.length}** ${documentLabel.toLowerCase()} ${range.label}.` };
  }

  const sorted = [...rows].sort((a, b) => {
    const da = getRecordDate(a)?.getTime() ?? 0;
    const db = getRecordDate(b)?.getTime() ?? 0;
    return db - da;
  });

  const shown = sorted.slice(0, 20);

  const url = endpoint.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const endpointKey =
    Object.keys(ENDPOINT_ROUTES).find((k) => url.endsWith(ENDPOINT_ROUTES[k])) ||
    "";

  const { headers, rowBuilder } = getModuleTableSpec(endpointKey);
  const table = renderTable(
    headers,
    shown.map((r, i) => rowBuilder(r, i))
  );

  const tableRoutes = shown.map((r) => {
    return buildDetailRouteForRecord(endpointKey, r, getRecordNavId(r));
  });

  const header = range
    ? `📅 **${rows.length}** ${documentLabel.toLowerCase()} ${range.label}`
    : `📊 **${total}** ${documentLabel.toLowerCase()} total`;

  const moreNote =
    sorted.length > 20
      ? `\n\n_…and ${sorted.length - 20} more._`
      : "";

  return {
    text: `${header}\n\n${table}${moreNote}`,
    tableRoutes,
    suggestionKey: endpointKey,
  };
}

function getRecordNavId(record: any, fallbackIdentifier?: string): string {
  if (record) {
    const idCandidates = [
      record.id,
      record.item_id,
      record.customer_id,
      record.supplier_id,
      record.lead_id,
      record.warehouse_id,
      record.workstation_id,
      record.operation_id,
      record.employee_id,
      record.bom_id,
    ];
    for (const c of idCandidates) {
      if (c !== null && c !== undefined && /^\d+$/.test(String(c))) {
        return String(c);
      }
    }

    const nameCandidates = [
      record.name,
      record.item_code,
      record.quotation_no,
      record.invoice_number,
      record.order_number,
      record.bill_number,
      record.delivery_note_no,
      record.proforma_no,
      record.grn_no,
      record.po_number,
    ];
    for (const c of nameCandidates) {
      if (c !== null && c !== undefined && String(c).trim() !== "") {
        return String(c);
      }
    }
    if (record.item_name) return String(record.item_name);
  }
  return fallbackIdentifier || "";
}

function getInventoryNavKey(record: any, fallbackIdentifier?: string): string {
  if (record) {
    const candidates = [
      record.item_code,
      record.item,
      record.name,
      record.item_name,
    ];
    for (const c of candidates) {
      if (c !== null && c !== undefined && String(c).trim() !== "") {
        return String(c);
      }
    }
    if (record.id !== undefined && record.id !== null) return String(record.id);
  }
  return fallbackIdentifier || "";
}

function buildInventoryDetailRoute(itemCode: string, record?: any): string {
  const item = itemCode ?? record?.item_code ?? record?.item ?? "";
  const type =
    record?.type ??
    record?.stock_type ??
    record?.warehouse_type ??
    "Internal";
  const warehouseId =
    record?.warehouse_id ??
    record?.warehouse ??
    record?.warehouseId ??
    "";

  const params = new URLSearchParams();
  params.set("type", String(type));
  if (warehouseId !== "" && warehouseId !== undefined && warehouseId !== null) {
    params.set("warehouse_id", String(warehouseId));
  }

  return `/inventory/detail/${encodeURIComponent(String(item))}?${params.toString()}`;
}

function buildDetailRouteForRecord(
  endpointKey: string,
  record: any,
  fallbackId?: string
): string {
  if (endpointKey === "inventory") {
    const itemCode = getInventoryNavKey(record, fallbackId);
    return buildInventoryDetailRoute(itemCode, record);
  }

  const matchedModuleKey = Object.keys(MODULE_DETAIL_ROUTES).find(
    (mKey) => MODULE_TO_ENDPOINT_KEY[mKey] === endpointKey
  );

  const route = matchedModuleKey
    ? MODULE_DETAIL_ROUTES[matchedModuleKey]
    : ENDPOINT_ROUTES[endpointKey] + "/";

  const id = getRecordNavId(record, fallbackId);
  return route + encodeURIComponent(id);
}

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

const STATUS_KEYWORDS: Record<string, string[]> = {
  completed:    ["completed", "complete", "done", "finished", "closed"],
  cancelled:    ["cancelled", "canceled", "cancel"],
  draft:        ["draft"],
  sent:         ["sent", "send", "dispatched"],
  accepted:     ["accepted", "accept"],
  rejected:     ["rejected", "reject"],
  expired:      ["expired", "expire", "expiring"],
  converted:    ["converted", "convert"],
  paid:         ["paid", "fully paid"],
  "partially paid": ["partially paid", "partially-paid", "partial paid", "part payment"],
  unpaid:       ["unpaid", "not paid", "un-paid"],
  "in process": ["in process", "in-process", "in progress", "in-progress", "processing", "ongoing", "running"],
  pending:      ["pending", "awaiting", "waiting"],
  open:         ["open"],
  submitted:    ["submitted", "submit"],
  approved:     ["approved", "approve"],
  overdue:      ["overdue", "over due"],
  "on hold":    ["on hold", "on-hold"],
  active:       ["active", "enabled"],
  inactive:     ["inactive", "disabled"],
};

const STATUS_FIELD_NAMES = [
  "status", "work_order_status", "order_status", "job_card_status",
  "stock_entry_status", "status_name", "state", "document_status",
  "bom_status", "sales_order_status", "purchase_order_status",
  "inspection_status", "quotation_status", "invoice_status",
  "production_status", "current_status",
  "item_status", "item_type", "type",
];

function getRecordStatus(record: any): string {
  for (const field of STATUS_FIELD_NAMES) {
    const v = record?.[field];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim().toLowerCase();
    }
  }
  return "";
}

function matchesStatus(recordStatus: string, targetStatus: string): boolean {
  if (!recordStatus || !targetStatus) return false;
  const normRecord = recordStatus.toLowerCase().trim();
  const normTarget = targetStatus.toLowerCase().trim();

  if (normRecord === normTarget) return true;

  const targetWords = normTarget.split(/\s+/);
  if (targetWords.length > 1) {
    return targetWords.every((w) => normRecord.includes(w));
  }
  return normRecord.includes(normTarget) || normTarget.includes(normRecord);
}

function detectStatusFilter(question: string): string | null {
  const q = question.toLowerCase();

  const allKeywords: Array<{ status: string; keyword: string }> = [];
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    for (const kw of keywords) {
      allKeywords.push({ status, keyword: kw });
    }
  }
  allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const { status, keyword } of allKeywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i");
    if (re.test(q)) return status;
  }
  return null;
}

function isStatusCountQuery(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /how many/i.test(q) ||
    /\bcount\b/i.test(q) ||
    /number of/i.test(q) ||
    /total/i.test(q)
  );
}

function isStatusListQuery(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /show me which/i.test(q) ||
    /show me the/i.test(q) ||
    /list.*(which|the|all)/i.test(q) ||
    /which.*(are|is)/i.test(q) ||
    /display.*(which|the|all)/i.test(q) ||
    /tell me which/i.test(q) ||
    /what are the/i.test(q) ||
    /show.*(completed|draft|pending|open|approved|rejected|cancelled|sent|accepted|expired|converted|submitted|paid|partially paid|overdue|in process|in progress)/i.test(q) ||
    /filter.*item/i.test(q) ||
    /item.*filter/i.test(q) ||
    /item.*status/i.test(q) ||
    /item.*type/i.test(q) ||
    /raw item/i.test(q) ||
    /product item/i.test(q)
  );
}

function detectStatusQuery(question: string): {
  endpointKey: string;
  status: string;
  wantsList: boolean;
} | null {
  const status = detectStatusFilter(question);
  if (!status) return null;

  const endpoint = matchEndpoint(question);
  if (!endpoint) return null;

  const endpointKey = Object.keys(ERP_ENDPOINTS).find(
    (k) => ERP_ENDPOINTS[k] === endpoint
  );
  if (!endpointKey) return null;

  const isCount = isStatusCountQuery(question);
  const isList = isStatusListQuery(question);
  const wantsList = isList || !isCount;

  return { endpointKey, status, wantsList };
}

async function answerStatusQuery(
  endpointKey: string,
  status: string,
  wantsList: boolean
): Promise<AnswerResult> {
  const endpoint = ERP_ENDPOINTS[endpointKey];
  if (!endpoint) {
    return { text: `⚠️ Unknown module: ${endpointKey}` };
  }

  const fetchUrl = endpoint.filterBase
    ? `${endpoint.filterBase}?page=1&limit=100`
    : endpoint.url;

  let res: any = null;
  try {
    res = await api.get(fetchUrl);
  } catch (e: any) {
    return {
      text: `⚠️ Couldn't fetch ${endpoint.label}: ${e?.message || e}`,
    };
  }

  const all = unwrap(res);
  const totalFetched = getTotalCount(res);

  const matching: any[] = [];
  const statusCounts: Record<string, number> = {};

  for (const record of all) {
    const rs = getRecordStatus(record);
    const display = rs || "unknown";
    statusCounts[display] = (statusCounts[display] || 0) + 1;
    if (matchesStatus(rs, status)) matching.push(record);
  }

  const route = ENDPOINT_ROUTES[endpointKey] || "";
  const navigateTo = route
    ? `${route}?status=${encodeURIComponent(status)}&autoFilter=1`
    : undefined;

  const lines: string[] = [];
  let tableRoutes: string[] | undefined;

  if (wantsList) {
    lines.push(
      `📋 **${endpoint.label} with status "${status}"** — **${matching.length}** record(s)`
    );
    lines.push("");

    if (matching.length === 0) {
      lines.push("_No records match this status._");
    } else {
      const shown = matching.slice(0, 20);
      const { headers, rowBuilder } = getModuleTableSpec(endpointKey);
      const table = renderTable(
        headers,
        shown.map((r, i) => rowBuilder(r, i))
      );
      lines.push(table);
      if (matching.length > 20) {
        lines.push("");
        lines.push(`_…and ${matching.length - 20} more._`);
      }

      tableRoutes = shown.map((r) => {
        return buildDetailRouteForRecord(endpointKey, r, getRecordNavId(r));
      });
    }
  } else {
    lines.push(
      `📊 **${endpoint.label}** — **${matching.length}** with status "${status}" (out of ${totalFetched} total).`
    );
    lines.push("");
    lines.push("**Status breakdown:**");
    lines.push("");

    const sortedCounts = Object.entries(statusCounts).sort(
      (a, b) => b[1] - a[1]
    );
    const table = renderTable(
      ["Status", "Count", "Match"],
      sortedCounts.map(([st, count]) => [
        st,
        count,
        matchesStatus(st, status) ? "✅" : "",
      ])
    );
    lines.push(table);
  }

  if (navigateTo && matching.length > 0) {
    lines.push("");
    lines.push(
      `Click below to open the **${endpoint.label}** list filtered to **${status}**.`
    );
  }

  return {
    text: lines.join("\n"),
    navigateTo,
    navigateLabel: `🔍 Open ${endpoint.label} · ${status} (${matching.length})`,
    suggestionKey: endpointKey,
    tableRoutes,
  };
}

const ITEM_TYPE_KEYWORDS: Record<string, string[]> = {
  raw:     ["raw", "raw item", "raw items", "raw material", "raw materials"],
  product: ["product", "product item", "product items", "finished good", "finished goods"],
  service: ["service", "service item", "service items"],
  consumable: ["consumable", "consumables"],
};

function detectItemTypeFilter(question: string): string | null {
  const q = question.toLowerCase();
  const allKeywords: Array<{ type: string; keyword: string }> = [];
  for (const [type, keywords] of Object.entries(ITEM_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      allKeywords.push({ type, keyword: kw });
    }
  }
  allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const { type, keyword } of allKeywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i");
    if (re.test(q)) return type;
  }
  return null;
}

async function answerItemTypeQuery(
  itemType: string,
  wantsList: boolean
): Promise<AnswerResult> {
  const endpointKey = "item";
  const endpoint = ERP_ENDPOINTS[endpointKey];

  const fetchUrl = `${endpoint.filterBase || `${endpoint.url.split("?")[0]}`}?page=1&limit=200&type=${encodeURIComponent(itemType)}`;

  console.log(`📡 Fetching items filtered by type: ${itemType}`);

  let res: any = null;
  try {
    res = await api.get(fetchUrl);
  } catch (e: any) {
    return {
      text: `⚠️ Couldn't fetch Items: ${e?.message || e}`,
    };
  }

  const all = unwrap(res);

  const targetType = itemType.toLowerCase().trim();
  const filtered = all.filter((r: any) => {
    const rt = String(
      r?.type ?? r?.item_type ?? r?.item_group ?? r?.group ?? ""
    ).toLowerCase().trim();
    return rt.includes(targetType) || targetType.includes(rt);
  });

  const matching = filtered.length > 0 && filtered.length < all.length
    ? filtered
    : all;

  const route = ENDPOINT_ROUTES[endpointKey] || "";
  const navigateTo = route
    ? `${route}?type=${encodeURIComponent(itemType)}&autoFilter=1`
    : undefined;

  const lines: string[] = [];
  let tableRoutes: string[] | undefined;
  lines.push(`🏷️ **Items · ${itemType}** — ${matching.length} record(s)`);
  lines.push("");

  if (matching.length === 0) {
    lines.push(`_No ${itemType} items found._`);
  } else if (wantsList) {
    const shown = matching.slice(0, 20);
    const { headers, rowBuilder } = getModuleTableSpec(endpointKey);
    const table = renderTable(
      headers,
      shown.map((r, i) => rowBuilder(r, i))
    );
    lines.push(table);
    if (matching.length > 20) {
      lines.push("");
      lines.push(`_…and ${matching.length - 20} more._`);
    }

    tableRoutes = shown.map((r) => {
      return buildDetailRouteForRecord(endpointKey, r, getRecordNavId(r));
    });
  } else {
    lines.push(`Total: **${matching.length}** items of type "${itemType}".`);
  }

  if (navigateTo && matching.length > 0) {
    lines.push("");
    lines.push(
      `Click below to open the **Items** list filtered to **${itemType}**.`
    );
  }

  return {
    text: lines.join("\n"),
    navigateTo,
    navigateLabel: `🔍 Open Items · ${itemType} (${matching.length})`,
    suggestionKey: endpointKey,
    tableRoutes,
  };
}

function getDetailRouteForEndpoint(endpointKey: string): string | null {
  if (MODULE_DETAIL_ROUTES[endpointKey]) {
    return MODULE_DETAIL_ROUTES[endpointKey];
  }

  const moduleKeys = Object.keys(MODULE_TO_ENDPOINT_KEY);
  for (const mKey of moduleKeys) {
    if (MODULE_TO_ENDPOINT_KEY[mKey] === endpointKey) {
      if (MODULE_DETAIL_ROUTES[mKey]) {
        return MODULE_DETAIL_ROUTES[mKey];
      }
    }
  }

  if (ENDPOINT_ROUTES[endpointKey]) {
    return ENDPOINT_ROUTES[endpointKey] + "/";
  }

  return null;
}

async function answerLatestListQuery(
  question: string
): Promise<AnswerResult | null> {
  const latestKeyword = isLatestListQuery(question);
  if (!latestKeyword) return null;

  const endpoint = matchEndpoint(question);
  if (!endpoint) return null;

  const endpointKey = Object.keys(ERP_ENDPOINTS).find(
    (k) => ERP_ENDPOINTS[k] === endpoint
  );
  if (!endpointKey) return null;

  console.log(
    `🆕 Latest-list query detected: ${endpointKey} (keyword="${latestKeyword}")`
  );

  let res: any;
  try {
    res = await api.get(endpoint.url);
  } catch (e: any) {
    return {
      text: `⚠️ Couldn't fetch ${endpoint.label}: ${e?.message || e}`,
      suggestionKey: endpointKey,
    };
  }

  const all = unwrap(res);
  const total = getTotalCount(res);

  if (all.length === 0) {
    return {
      text: `📭 You have no ${endpoint.label.toLowerCase()} yet.`,
      suggestionKey: endpointKey,
    };
  }

  const sorted = [...all].sort((a, b) => {
    const da = getRecordDate(a)?.getTime() ?? 0;
    const db = getRecordDate(b)?.getTime() ?? 0;
    return db - da;
  });

  const MAX_ROWS = 20;
  const shown = sorted.slice(0, MAX_ROWS);

  const { headers, rowBuilder } = getModuleTableSpec(endpointKey);
  const table = renderTable(
    headers,
    shown.map((r, i) => rowBuilder(r, i))
  );

  const lines: string[] = [];
  lines.push(`📋 **Latest ${endpoint.label}** — ${total} total`);
  lines.push("");
  lines.push(table);
  if (sorted.length > MAX_ROWS) {
    lines.push("");
    lines.push(`_…and ${sorted.length - MAX_ROWS} more._`);
  }

  const tableRoutes = shown.map((r) => {
    return buildDetailRouteForRecord(endpointKey, r, getRecordNavId(r));
  });

  const baseRoute = ENDPOINT_ROUTES[endpointKey];

  return {
    text: lines.join("\n"),
    navigateTo: baseRoute ? baseRoute : undefined,
    navigateLabel: baseRoute
      ? `🔍 Open ${endpoint.label} (${total})`
      : undefined,
    suggestionKey: endpointKey,
    tableRoutes,
  };
}

async function answerListingWithRowActions(
  endpointKey: string
): Promise<AnswerResult | null> {
  const endpoint = ERP_ENDPOINTS[endpointKey];
  if (!endpoint) return null;

  let res: any;
  try {
    res = await api.get(endpoint.url);
  } catch (e: any) {
    return {
      text: `⚠️ Couldn't fetch ${endpoint.label}: ${e?.message || e}`,
      suggestionKey: endpointKey,
    };
  }

  const all = unwrap(res);
  const total = getTotalCount(res);

  if (all.length === 0) {
    return {
      text: `📭 You have no ${endpoint.label.toLowerCase()} yet.`,
      suggestionKey: endpointKey,
    };
  }

  const sorted = [...all].sort((a, b) => {
    const da = getRecordDate(a)?.getTime() ?? 0;
    const db = getRecordDate(b)?.getTime() ?? 0;
    return db - da;
  });

  const detailRoute = getDetailRouteForEndpoint(endpointKey);

  const rowActions: Array<{ label: string; route: string }> = [];

  sorted.forEach((rec: any, idx: number) => {
    const displayName =
      rec.item_name ||
      rec.item_code ||
      rec.customer_name ||
      rec.supplier_name ||
      rec.party_name ||
      rec.lead_name ||
      rec.name ||
      rec.title ||
      rec.id ||
      "Record";

    const id = getRecordNavId(rec);

    const qtyBits: string[] = [];
    if (rec.qty != null) qtyBits.push(`Qty ${rec.qty}`);
    if (rec.quantity != null && rec.quantity !== rec.qty) qtyBits.push(`Qty ${rec.quantity}`);
    if (rec.uom) qtyBits.push(String(rec.uom));
    if (rec.type) qtyBits.push(String(rec.type));

    const qtyStr = qtyBits.length > 0 ? ` — ${qtyBits.join(" ")}` : "";
    const idStr = id ? ` (${id})` : "";

    if (id) {
      const rowRoute =
        endpointKey === "inventory"
          ? buildInventoryDetailRoute(getInventoryNavKey(rec, id), rec)
          : (detailRoute ? detailRoute + encodeURIComponent(id) : "");

      if (rowRoute) {
        rowActions.push({
          label: `${idx + 1}. ${displayName}${idStr}${qtyStr}`,
          route: rowRoute,
        });
        return;
      }
    }

    rowActions.push({
      label: `${idx + 1}. ${displayName}${idStr}${qtyStr}`,
      route: "",
    });
  });

  const headerText =
    `📄 **${endpoint.label}** — **${total}** total.\n` +
    `Tap any row below to open its detail page.`;

  const baseRoute = ENDPOINT_ROUTES[endpointKey];

  return {
    text: headerText,
    navigateTo: baseRoute ? baseRoute : undefined,
    navigateLabel: baseRoute
      ? `🔍 Open ${endpoint.label} (${total})`
      : undefined,
    rowActions: rowActions.length > 0 ? rowActions : undefined,
    suggestionKey: endpointKey,
  };
}

function extractAlphanumericId(question: string): string | null {
  const multiSegment = question.match(
    /\b([A-Za-z]{2,10}(?:[-_][A-Za-z0-9]{1,10}){1,5})\b/
  );
  if (multiSegment) {
    const full = multiSegment[1].toUpperCase();
    if (/\d/.test(full) && full.length <= 40) {
      if (!STOP_WORDS.has(full.toLowerCase())) {
        return full;
      }
    }
  }

  const hyphenated = question.match(/\b([A-Za-z]{2,6})-(\d{2,})\b/);
  if (hyphenated) {
    const digits = hyphenated[2];
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
    .filter((t) => !DOCUMENT_PREFIXES.has(t));

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
    .filter((t) => !DOCUMENT_PREFIXES.has(t));

  if (tokens.length === 0) return null;

  const strongToken = tokens.find((t) => /[A-Za-z]/.test(t) && /\d/.test(t));
  if (strongToken) return strongToken;

  const joined = tokens.join(" ").trim();
  if (joined.length >= 3) return joined;
  return null;
}

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
  "proforma invoice": "/proforma-invoice/",
  "delivery challan": "/delivery-challan/view/",
  "sales invoice": "/sales-bill/edit/",
  "tax invoice": "/sales-bill/edit/",
  "sales bill": "/sales-bill/edit/",
  "delivery note": "/delivery-challan/view/",
  "sales order": "/sales-order/",
  quotation: "/quotation/",

  "goods receipt order": "/grn/",
  "purchase invoice": "/purchase-invoice/",
  "purchase bills": "/purchase-invoice/",
  "purchase bill": "/purchase-invoice/",
  "purchase order": "/purchase-order/",
  grn: "/grn/",

  "quality inspection": "/quality-inspection/",

  "work order": "/work-order/",
  "job card": "/job-cards/",
  bom: "/bom/",
  "stock entry": "/stock-entry/",

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

  lead: "/leads/",

  inventory: "/inventory/detail/",

  "product item": "/item/",
  "raw item": "/item/",
};

const MODULE_TO_ENDPOINT_KEY: Record<string, string> = {
  "work order": "workOrder",
  "job card": "jobCard",
  bom: "bom",
  "stock entry": "stockEntry",
  item: "item",
  "product item": "itemProduct",
  "raw item": "itemRaw",
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
  customer: "customer",
  employee: "employee",
  supplier: "supplier",
  "purchase order": "purchaseOrder",
  grn: "grn",
  "goods receipt order": "grn",
  "purchase invoice": "purchaseInvoice",
  "purchase bills": "purchaseInvoice",
  "purchase bill": "purchaseInvoice",
  inventory: "inventory",
};

const MODULE_API_BASES: Record<string, string> = {
  "work order": "/work-order",
  "job card": "/job-card",
  bom: "/bom",
  "stock entry": "/stock-entry",
  item: "/item",
  "product item": "/item",
  "raw item": "/item",
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
  customer: "/customer",
  employee: "/employee",
  supplier: "/supplier",
  "purchase order": "/purchase-order",
  grn: "/grn",
  "goods receipt order": "/grn",
  "purchase invoice": "/purchase-invoice",
  "purchase bills": "/purchase-invoice",
  "purchase bill": "/purchase-invoice",
  inventory: "/inventory",
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

interface GenericDetailNav {
  id: string;
  moduleHint: string | null;
  endpointHint: string | null;
}

function detectGenericDetailNavigation(
  question: string
): GenericDetailNav | null {
  const q = question.toLowerCase();
  if (!isNavigationQuestion(question)) return null;

  const hasPage =
    q.includes("detail page") || q.includes("edit page") ||
    q.includes("details page") || q.includes("detail") || q.includes("edit");

  if (!hasPage) return null;

  const id = extractAlphanumericId(question);
  if (!id || STOP_WORDS.has(id.toLowerCase())) return null;

  const detailKeys = Object.keys(MODULE_DETAIL_ROUTES).sort(
    (a, b) => b.length - a.length
  );

  let moduleHint: string | null = null;
  for (const key of detailKeys) {
    if (AMBIGUOUS_MODULE_KEYS.has(key)) {
      const wordBoundary = new RegExp(`(^|\\s)${key}(\\s|$)`);
      if (!wordBoundary.test(q)) continue;
    }
    if (q.includes(key) || fuzzyContains(q, key)) {
      moduleHint = key;
      break;
    }
  }

  if (!moduleHint) {
    const aliasKeys = Object.keys(MODULE_ROUTES).sort(
      (a, b) => b.length - a.length
    );
    for (const key of aliasKeys) {
      if (AMBIGUOUS_MODULE_KEYS.has(key)) {
        const wordBoundary = new RegExp(`(^|\\s)${key}(\\s|$)`);
        if (!wordBoundary.test(q)) continue;
      }
      if (q.includes(key) || fuzzyContains(q, key)) {
        const endpointKey = MODULE_TO_ENDPOINT_KEY[key];
        if (endpointKey) {
          const detailKey = Object.keys(MODULE_DETAIL_ROUTES).find(
            (k) => MODULE_TO_ENDPOINT_KEY[k] === endpointKey
          );
          if (detailKey) {
            moduleHint = detailKey;
            break;
          }
        }
      }
    }
  }

  let endpointHint: string | null = null;
  if (moduleHint) {
    endpointHint = MODULE_TO_ENDPOINT_KEY[moduleHint] || null;
  } else {
    const ep = matchEndpoint(question);
    if (ep) {
      endpointHint =
        Object.keys(ERP_ENDPOINTS).find((k) => ERP_ENDPOINTS[k] === ep) ||
        null;
    }
  }

  console.log(
    `🧭 Generic detail nav → id="${id}", moduleHint="${moduleHint}", endpointHint="${endpointHint}"`
  );

  return { id, moduleHint, endpointHint };
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
      const id = extractAlphanumericId(question);
      if (id && id.toLowerCase() !== key.toLowerCase()) {
        console.log(`🧭 Detail nav detected: ${key} · ID "${id}"`);
        return { moduleKey: key, label: key, searchId: id };
      }
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

const PAGE_CHIPS: Array<{ prefix: string; chips: string[] }> = [
  { prefix: "/dashboard/sales", chips: ["Sales Dashboard Summary", "How many leads?", "How many quotations?", "How many sales orders?", "Total sales revenue", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/manufacturing", chips: ["Manufacturing Dashboard Summary", "How many work orders?", "How many job cards?", "Work orders in process", "How many BOMs?", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/setup", chips: ["Setup Dashboard Summary", "How many items?", "How many warehouses?", "How many workstations?", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/purchasing", chips: ["Purchasing Dashboard Summary", "How many purchase orders?", "How many GRNs?", "Total purchase spend", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/organization", chips: ["Organization Dashboard Summary", "How many companies?", "Show me flow of this page", "Summary"] },
  { prefix: "/dashboard/quality", chips: ["Quality Dashboard Summary", "How many quality inspections?", "Show me flow of this page", "Summary"] },
  { prefix: "/settings", chips: ["What is the current theme?", "What date format is set?", "Settings help", "Summary"] },
  { prefix: "/sales-order", chips: ["How many sales orders?", "Sales orders today", "Show latest sales orders", "Show me completed sales orders", "Show me draft sales orders", "Total sales revenue", "Show me flow of this page", "Summary"] },
  { prefix: "/quotation", chips: ["How many quotations?", "Show latest quotations", "Show me sent quotations", "Show me accepted quotations", "Show me draft quotations", "Show me flow of this page", "Summary"] },
  { prefix: "/proforma-invoice", chips: ["How many proforma invoices?", "Show latest proforma invoices", "Show me flow of this page", "Summary"] },
  { prefix: "/delivery-challan", chips: ["How many delivery challans?", "Show latest delivery challans", "Show me submitted delivery challans", "Show me draft delivery challans", "Show me cancelled delivery challans", "Show me flow of this page", "Summary"] },
  { prefix: "/sales-bill", chips: ["How many sales bills?", "Show latest sales bills", "Show me paid sales bills", "Show me partially paid sales bills", "Show me draft sales bills", "Show me cancelled sales bills", "Show me overdue sales bills", "Show me flow of this page", "Summary"] },
  { prefix: "/lead", chips: ["How many leads?", "Show latest leads", "Show me flow of this page", "Summary"] },
  { prefix: "/work-order", chips: ["How many work orders?", "Work orders in process", "Work orders completed", "Show latest work orders", "Show me flow of this page", "Summary"] },
  { prefix: "/job-card", chips: ["How many job cards?", "Show latest job cards", "Show me flow of this page", "Summary"] },
  { prefix: "/bom", chips: ["How many BOMs?", "Show latest BOMs", "Show me flow of this page", "Summary"] },
  { prefix: "/stock-entry", chips: ["How many stock entries?", "Show latest stock entries", "Show me flow of this page", "Summary"] },
  { prefix: "/item-group", chips: ["How many item groups?", "Show latest item groups", "Show me flow of this page", "Summary"] },
  { prefix: "/item", chips: ["How many items?", "Show latest items", "Show me raw items", "Show me product items", "Show me active items", "Show me inactive items", "Show me flow of this page", "Summary"] },
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

const ENDPOINT_CHIPS: Record<string, string[]> = {
  workOrder: ["How many work orders?", "Work orders in process", "Work orders completed", "Show latest work orders", "Summary"],
  jobCard: ["How many job cards?", "Show latest job cards", "Summary"],
  inventory: ["How many inventory?", "Inventory value", "Show latest inventory", "Summary"],
  bom: ["How many BOMs?", "Show latest BOMs", "Show me flow of this page", "Summary"],
  stockEntry: ["How many stock entries?", "Show latest stock entries", "Summary"],
  item: ["How many items?", "Show latest items", "Show me raw items", "Show me product items", "Show me active items", "Show me inactive items", "Summary"],
  itemProduct: ["How many product items?", "Show latest product items", "Show me active product items", "Summary"],
  itemRaw: ["How many raw items?", "Show latest raw items", "Show me active raw items", "Summary"],
  itemGroup: ["How many item groups?", "Show latest item groups", "Summary"],
  warehouse: ["How many warehouses?", "Show latest warehouses", "Summary"],
  workstation: ["How many workstations?", "Show latest workstations", "Summary"],
  operation: ["How many operations?", "Show latest operations", "Summary"],
  uom: ["How many UOMs?", "Show latest UOMs", "Summary"],
  qualityInspection: ["How many quality inspections?", "Show latest quality inspections", "Summary"],
  lead: ["How many leads?", "Show latest leads", "Summary"],
  quotation: ["How many quotations?", "Show latest quotations", "Show me sent quotations", "Show me accepted quotations", "Show me draft quotations", "Summary"],
  salesOrder: ["How many sales orders?", "Show latest sales orders", "Show me completed sales orders", "Show me draft sales orders", "Summary"],
  proformaInvoice: ["How many proforma invoices?", "Show latest proforma invoices", "Summary"],
  deliveryNote: ["How many delivery challans?", "Show latest delivery challans", "Show me submitted delivery challans", "Show me draft delivery challans", "Show me cancelled delivery challans", "Summary"],
  salesInvoice: ["How many sales bills?", "Show latest sales bills", "Show me paid sales bills", "Show me partially paid sales bills", "Show me draft sales bills", "Show me cancelled sales bills", "Show me overdue sales bills", "Summary"],
  company: ["How many companies?", "Show latest companies", "Summary"],
  customer: ["How many customers?", "Show latest customers", "Summary"],
  employee: ["How many employees?", "Show latest employees", "Summary"],
  supplier: ["How many suppliers?", "Show latest suppliers", "Summary"],
  purchaseOrder: ["How many purchase orders?", "Show latest purchase orders", "Show me submitted purchase orders", "Show me draft purchase orders", "Summary"],
  grn: ["How many GRNs?", "Show latest GRNs", "Show me submitted GRNs", "Show me completed GRNs", "Summary"],
  purchaseInvoice: ["How many purchase invoices?", "Show latest purchase invoices", "Show me paid purchase invoices", "Show me partially paid purchase invoices", "Summary"],
};

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

type AnswerResult = {
  text: string;
  navigateTo?: string;
  navigateLabel?: string;
  rowActions?: Array<{ label: string; route: string }>;
  suggestionKey?: string;
  tableRoutes?: string[];
};

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTION CAPACITY CHECK
// ═══════════════════════════════════════════════════════════════════════
const CAPACITY_KEYWORDS = [
  "production capacity",
  "capacity check",
  "capacity for",
  "capacity of",
  "how many can i make",
  "how many can i produce",
  "how many can be made",
  "how many can be produced",
  "how many units can",
  "how many units of",
];

function detectCapacityQuery(question: string): boolean {
  const q = question.toLowerCase();
  if (CAPACITY_KEYWORDS.some((kw) => q.includes(kw))) return true;

  if (
    /\bhow\s+many\b.+\b(can\s+(?:i\s+)?(?:make|produce|be\s+made|be\s+produced))\b/i.test(
      q
    )
  ) {
    return true;
  }
  if (
    /\bcan\s+(?:i\s+)?(?:make|produce)\b.+\bfrom\s+(?:current\s+)?stock\b/i.test(
      q
    )
  ) {
    return true;
  }
  return false;
}

function extractCapacityItemName(question: string): string | null {
  const q = question.trim();
  const lower = q.toLowerCase();

  const bomIdMatch = lower.match(/\bbom\s*[-#]?\s*(\d+)\b/);
  if (bomIdMatch) return `__BOM_ID__${bomIdMatch[1]}`;

  const patterns: RegExp[] = [
    /how\s+many\s+units?\s+of\s+(?:production\s+)?capacity\s+(?:for\s+|of\s+)?(.+?)[?.!]*$/i,
    /how\s+many\s+(?:units?\s+of\s+)?(.+?)\s+capacity[?.!]*$/i,
    /how\s+many\s+(?:units?\s+of\s+)?(.+?)\s+can\s+(?:i\s+)?(?:make|produce|be\s+made|be\s+produced)/i,
    /can\s+(?:i\s+)?(?:make|produce)\s+(.+?)(?:\s+from\s+(?:current\s+)?stock)?[?.!]*$/i,
    /production\s+capacity\s+(?:check\s+)?(?:for|of)\s+(.+?)[?.!]*$/i,
    /capacity\s+(?:check\s+)?(?:for|of)\s+(.+?)[?.!]*$/i,
    /capacity\s+for\s+(.+?)[?.!]*$/i,
  ];

  for (const p of patterns) {
    const m = q.match(p);
    if (m && m[1]) {
      let name = m[1].trim().replace(/[?.!]+$/, "").trim();
      name = name.replace(/\s*\(\s*q(?:ty|uantity)?\s*\d+\s*\)\s*$/i, "").trim();
      if (name && name.length >= 2) return name;
    }
  }

  const noiseWords = new Set([
    "how", "many", "much", "what", "which", "is", "are", "the", "a", "an",
    "of", "for", "with", "using", "from", "by", "in", "on",
    "production", "capacity", "check", "units", "unit", "stock",
    "can", "could", "i", "we", "you", "make", "makes", "made",
    "produce", "produces", "produced", "be", "built", "build",
    "manufacture", "manufactured", "get",
    "tell", "me", "show", "give", "please", "want", "need", "query",
    "current", "available",
  ]);

  const tokens = q
    .replace(/[?.!,;]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const remaining = tokens.filter((t) => {
    const lw = t.toLowerCase();
    return !noiseWords.has(lw);
  });

  if (remaining.length > 0) {
    const candidate = remaining.join(" ").trim();
    if (candidate.length >= 2) return candidate;
  }

  return null;
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕 HELPER: Robustly fetch a BOM + its items (handles all response shapes)
// ═══════════════════════════════════════════════════════════════════════
async function fetchBOMWithItems(
  bomIdOrName: string | number
): Promise<{ bom: any; items: any[]; id: string } | null> {
  try {
    console.log(`📡 [BOM] Fetching /bom/${bomIdOrName}`);
    const res = await api.get(`/bom/${encodeURIComponent(String(bomIdOrName))}`);
    const raw = res?.data ?? res;
    const d = raw?.data ?? raw;

    let bom: any = null;
    let items: any[] = [];

    // Case A: { bom: {...}, items: [...] }  ← most common shape
    if (d && typeof d === "object" && d.bom && typeof d.bom === "object") {
      bom = d.bom;
      if (Array.isArray(d.items)) items = d.items;
      else if (Array.isArray(bom.items)) items = bom.items;
      else if (Array.isArray(bom.bom_items)) items = bom.bom_items;
    }
    // Case B: flat object with items
    else if (d && typeof d === "object" && !Array.isArray(d)) {
      bom = d;
      if (Array.isArray(d.items)) items = d.items;
      else if (Array.isArray(d.bom_items)) items = d.bom_items;
      else if (Array.isArray(d.components)) items = d.components;
    }
    // Case C: array of one BOM
    else if (Array.isArray(d) && d.length > 0) {
      bom = d[0];
      if (Array.isArray(bom.items)) items = bom.items;
      else if (Array.isArray(bom.bom_items)) items = bom.bom_items;
    }

    if (!bom) {
      console.warn(`⚠️ [BOM] No BOM found in response for ${bomIdOrName}`);
      return null;
    }

    const id = String(bom.id ?? bom.name ?? bomIdOrName);
    console.log(
      `✅ [BOM] Loaded ${bom.name || id} · item=${bom.item_name || bom.item || "?"} · qty=${
        bom.quantity ?? bom.qty ?? 1
      } · items=${items.length}`
    );
    return { bom, items, id };
  } catch (e: any) {
    console.warn(`⚠️ [BOM] fetchBOMWithItems(${bomIdOrName}) failed:`, e?.message || e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTION CAPACITY CHECK — robust version
// ═══════════════════════════════════════════════════════════════════════
async function answerProductionCapacityQuery(
  question: string
): Promise<AnswerResult | null> {
  if (!detectCapacityQuery(question)) return null;

  const itemOrBom = extractCapacityItemName(question);
  if (!itemOrBom) {
    return {
      text:
        `🏭 **Production Capacity Check**\n\n` +
        `Tell me which item you want to check — for example:\n` +
        `• "production capacity for wooden study table"\n` +
        `• "how many wooden study table can I make"\n` +
        `• "capacity for BOM 91"`,
      suggestionKey: "bom",
    };
  }

  let bomRecord: any = null;
  let bomItems: any[] = [];
  let bomIdUsed: string = "";

  // ─── Case 1: direct BOM ID ─────────────────────────────────────
  if (itemOrBom.startsWith("__BOM_ID__")) {
    const id = itemOrBom.replace("__BOM_ID__", "");
    const result = await fetchBOMWithItems(id);
    if (!result) {
      return {
        text: `🔍 I couldn't find a BOM with ID **${id}**.`,
        suggestionKey: "bom",
      };
    }
    bomRecord = result.bom;
    bomItems = result.items;
    bomIdUsed = result.id;
  } else {
    // ─── Case 2: match by item name ─────────────────────────────
    const target = normalizeForMatch(itemOrBom);
    let allBoms: any[] = [];
    try {
      const res = await api.get("/bom?page=1&limit=1000");
      allBoms = unwrap(res);
    } catch (e: any) {
      return {
        text: `⚠️ Couldn't fetch BOMs: ${e?.message || e}`,
        suggestionKey: "bom",
      };
    }

    if (!allBoms.length) {
      return {
        text: `📭 No BOMs found in the system yet.`,
        suggestionKey: "bom",
      };
    }

    const candidatesOf = (b: any): string[] =>
      [b.item_name, b.item, b.production_item, b.name, b.bom_no]
        .filter(Boolean)
        .map((s: string) => normalizeForMatch(String(s)));

    let match = allBoms.find((b: any) =>
      candidatesOf(b).some((c) => c === target)
    );

    if (!match) {
      match = allBoms.find((b: any) =>
        candidatesOf(b).some((c) => c.includes(target) || target.includes(c))
      );
    }

    if (!match) {
      const targetWords = target.split(/\s+/).filter((w) => w.length >= 3);
      if (targetWords.length > 0) {
        match = allBoms.find((b: any) =>
          candidatesOf(b).some((c) => targetWords.some((w) => c.includes(w)))
        );
      }
    }

    if (!match) {
      return {
        text:
          `🔍 I couldn't find a BOM for **"${itemOrBom}"**.\n\n` +
          `Try:\n` +
          `• "production capacity for BOM 91"\n` +
          `• "show latest BOMs" to see available ones`,
        suggestionKey: "bom",
      };
    }

    const mId = String(match.id ?? match.name ?? "");

    // Always re-fetch the full BOM by ID to get the components
    if (mId) {
      const result = await fetchBOMWithItems(mId);
      if (result) {
        bomRecord = result.bom;
        bomItems = result.items;
        bomIdUsed = result.id;
      } else {
        bomRecord = match;
        bomItems = Array.isArray(match.items) ? match.items : [];
        bomIdUsed = mId;
      }
    } else {
      bomRecord = match;
      bomItems = Array.isArray(match.items) ? match.items : [];
      bomIdUsed = String(match.name ?? "");
    }
  }

  if (bomItems.length === 0) {
    bomItems =
      (Array.isArray(bomRecord?.items) && bomRecord.items) ||
      (Array.isArray(bomRecord?.bom_items) && bomRecord.bom_items) ||
      (Array.isArray(bomRecord?.components) && bomRecord.components) ||
      [];
  }

  if (bomItems.length === 0) {
    return {
      text:
        `⚠️ BOM **${bomRecord?.name || bomIdUsed}** has no components ` +
        `(or the components weren't returned by the API).`,
      suggestionKey: "bom",
    };
  }

  const bomQty =
    Number(bomRecord?.quantity ?? bomRecord?.qty ?? 1) || 1;

  const productionItem =
    bomRecord?.item_name ||
    bomRecord?.item ||
    bomRecord?.production_item ||
    "Item";

  let inventoryRecords: any[] = [];
  try {
    const invRes = await api.get("/inventory?limit=10000");
    inventoryRecords = unwrap(invRes);
  } catch (e: any) {
    return {
      text: `⚠️ Couldn't fetch inventory: ${e?.message || e}`,
      suggestionKey: "inventory",
    };
  }

  const stockByCode = new Map<string, number>();
  const stockByName = new Map<string, number>();
  for (const inv of inventoryRecords) {
    const code = String(inv.item_code ?? inv.item ?? "").toUpperCase().trim();
    const name = String(inv.item_name ?? "").toUpperCase().trim();
    const qty = Number(inv.actual_qty ?? inv.qty ?? 0) || 0;
    if (code) stockByCode.set(code, (stockByCode.get(code) || 0) + qty);
    if (name) stockByName.set(name, (stockByName.get(name) || 0) + qty);
  }

  type CompRow = {
    itemCode: string;
    itemName: string;
    requiredPerUnit: number;
    availableStock: number;
    uom: string;
    maxUnits: number;
  };

  const compRows: CompRow[] = bomItems.map((c: any) => {
    const code = String(
      c.item_code ?? c.item ?? c.code ?? ""
    ).toUpperCase().trim();
    const name = c.item_name || c.item || c.item_code || "—";
    const reqPerBom = Number(c.qty ?? c.quantity ?? c.required_qty ?? 0) || 0;
    const requiredPerUnit = bomQty > 0 ? reqPerBom / bomQty : reqPerBom;

    let avail = stockByCode.get(code) ?? 0;
    if (avail === 0) {
      avail = stockByName.get(String(name).toUpperCase().trim()) ?? 0;
    }

    const maxUnits =
      requiredPerUnit > 0 ? Math.floor(avail / requiredPerUnit) : Infinity;

    return {
      itemCode: code || name,
      itemName: name,
      requiredPerUnit,
      availableStock: avail,
      uom: c.uom || c.stock_uom || "",
      maxUnits,
    };
  });

  const validRows = compRows.filter((r) => r.itemCode);

  if (validRows.length === 0) {
    return {
      text: `⚠️ BOM **${bomRecord?.name || bomIdUsed}** has no usable components.`,
      suggestionKey: "bom",
    };
  }

  const finiteRows = validRows.filter((r) => Number.isFinite(r.maxUnits));
  const capacity =
    finiteRows.length > 0
      ? Math.min(...finiteRows.map((r) => r.maxUnits))
      : Infinity;
  const limiting =
    finiteRows.find((r) => r.maxUnits === capacity) ?? validRows[0];

  const lines: string[] = [];
  lines.push(`🏭 **Production Capacity Check**`);
  lines.push(`**Item:** ${productionItem}`);
  if (bomRecord?.name) lines.push(`**BOM:** ${bomRecord.name}`);
  lines.push("");

  if (!Number.isFinite(capacity)) {
    lines.push(`⚠️ Could not compute capacity (missing required quantities).`);
  } else {
    lines.push(
      `✅ **${capacity}** unit${capacity === 1 ? "" : "s"} can be made from current stock.`
    );
    if (limiting) {
      lines.push(
        `🔻 Limited by **${limiting.itemName}** (${limiting.itemCode})`
      );
    }
    lines.push("");
    lines.push(
      renderTable(
        ["Component", "Req. / Unit", "Available", "Max Units"],
        validRows
          .slice()
          .sort((a, b) => a.maxUnits - b.maxUnits)
          .map((r) => [
            `${r.itemName}${r.uom ? ` (${r.uom})` : ""}`,
            fmt(r.requiredPerUnit),
            fmt(r.availableStock),
            Number.isFinite(r.maxUnits) ? fmt(r.maxUnits) : "∞",
          ])
      )
    );
  }

  const bomDetailRoute = bomIdUsed
    ? `/bom/${encodeURIComponent(bomIdUsed)}`
    : null;

  return {
    text: lines.join("\n"),
    navigateTo: bomDetailRoute || undefined,
    navigateLabel: bomDetailRoute
      ? `🔍 Open BOM ${bomRecord?.name || bomIdUsed}`
      : undefined,
    suggestionKey: "bom",
  };
}

async function answerQuestion(
  question: string,
  currentPath: string
): Promise<AnswerResult> {
  const q = question.toLowerCase().trim();
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const isCount = has("how many", "count", "number of", "total number");

  const capacityResult = await answerProductionCapacityQuery(question);
  if (capacityResult) return capacityResult;

  const itemTypeFilter = detectItemTypeFilter(question);
  const itemEndpoint = matchEndpoint(question);

  if (itemTypeFilter && itemEndpoint) {
    const endpointKey = Object.keys(ERP_ENDPOINTS).find(
      (k) => ERP_ENDPOINTS[k] === itemEndpoint
    );

    if (
      endpointKey === "item" ||
      endpointKey === "itemProduct" ||
      endpointKey === "itemRaw"
    ) {
      const wantsList = isStatusListQuery(question) || !isStatusCountQuery(question);
      console.log(
        `🆕 Item type query detected: ${endpointKey} → "${itemTypeFilter}" (list=${wantsList})`
      );
      return await answerItemTypeQuery(itemTypeFilter, wantsList);
    }
  }

  const statusQuery = detectStatusQuery(question);
  if (statusQuery) {
    console.log(
      `🔢 Status query detected: ${statusQuery.endpointKey} → "${statusQuery.status}" ` +
      `(list=${statusQuery.wantsList})`
    );
    return await answerStatusQuery(
      statusQuery.endpointKey,
      statusQuery.status,
      statusQuery.wantsList
    );
  }

  const latestResult = await answerLatestListQuery(question);
  if (latestResult) {
    console.log("🆕 Latest-list answer returned with navigation button");
    return latestResult;
  }

  if (has("listing", "show me list", "show list", "list of", "show me the list", "list all")) {
    const endpointForListing = matchEndpoint(question);
    if (endpointForListing) {
      const endpointKey = Object.keys(ERP_ENDPOINTS).find(
        (k) => ERP_ENDPOINTS[k] === endpointForListing
      );
      if (endpointKey) {
        console.log(
          `🆕 Listing query detected: ${endpointKey} — building row-action list`
        );
        const listingResult = await answerListingWithRowActions(endpointKey);
        if (listingResult) {
          return listingResult;
        }
      }
    }
  }

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

  if (isOnSettings(currentPath)) {
    const settingsReply = answerSettingsQuestion(question);
    if (settingsReply) {
      console.log("⚙️ Settings answer");
      return { text: settingsReply };
    }
  }

  if (isNavigationQuestion(question)) {
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
      let resolvedRecord: any = null;
      let recordFound = false;

      if (apiBase) {
        const record = await resolveRecord(apiBase, detailTarget.searchId);
        if (record) {
          resolvedRecord = record;
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

      const endpointKey = MODULE_TO_ENDPOINT_KEY[moduleKey];
      if (endpointKey === "inventory") {
        navTo = buildInventoryDetailRoute(
          getInventoryNavKey(resolvedRecord, resolvedId),
          resolvedRecord
        );
      } else {
        const detailRoute = MODULE_DETAIL_ROUTES[moduleKey] || "";
        navTo = detailRoute
          ? detailRoute + encodeURIComponent(resolvedId)
          : undefined;
      }

      let fullDetail: any = null;

      const isNumericResolvedId = /^\d+$/.test(String(resolvedId));
      if (
        endpointKey &&
        DETAIL_PAGE_APIS[endpointKey] &&
        resolvedId &&
        isNumericResolvedId
      ) {
        console.log(`📄 Fetching full detail payload for ${endpointKey} #${resolvedId}`);
        try {
          fullDetail = await fetchDetailPageData(endpointKey, resolvedId);
        } catch (e: any) {
          console.warn(`⚠️ fetchDetailPageData failed: ${e?.message || e}`);
        }
      }

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

      return {
        text: `🧭 Navigating to **${prettyField(detailTarget.label)} ${resolvedId}** detail page...`,
        navigateTo: navTo,
        suggestionKey: endpointKey || undefined,
      };
    }

    const generic = detectGenericDetailNavigation(question);
    if (generic) {
      const { id: genericId, moduleHint, endpointHint } = generic;

      console.log(
        `🧭 Generic detail nav → id="${genericId}", moduleHint="${moduleHint}", endpointHint="${endpointHint}"`
      );

      if (moduleHint) {
        const apiBase =
          MODULE_API_BASES[moduleHint] ||
          (endpointHint ? ERP_ENDPOINTS[endpointHint]?.url : undefined);

        if (!apiBase) {
          console.warn(
            `⚠️ No API base for module "${moduleHint}" — falling back to search-all`
          );
        } else {
          const record = await resolveRecord(apiBase, genericId);
          if (record) {
            const resolvedId = getRecordNavId(record, genericId);
            const epKey = MODULE_TO_ENDPOINT_KEY[moduleHint] || endpointHint;

            let navTo: string | undefined;
            if (epKey === "inventory") {
              navTo = buildInventoryDetailRoute(
                getInventoryNavKey(record, resolvedId),
                record
              );
            } else {
              const detailRoute = MODULE_DETAIL_ROUTES[moduleHint] || "";
              navTo = detailRoute
                ? detailRoute + encodeURIComponent(resolvedId)
                : undefined;
            }

            const isNumericResolvedId = /^\d+$/.test(String(resolvedId));

            if (
              epKey &&
              DETAIL_PAGE_APIS[epKey] &&
              navTo &&
              isNumericResolvedId
            ) {
              try {
                const fullDetail = await fetchDetailPageData(epKey, resolvedId);
                stashDetailHandoff({
                  endpointKey: epKey,
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

            const prettyLabel = prettyField(moduleHint);
            console.log(
              `✅ Found "${genericId}" in ${prettyLabel} → ${navTo}`
            );

            return {
              text: `🧭 Navigating to **${prettyLabel} ${resolvedId}** detail page...`,
              navigateTo: navTo,
              suggestionKey: epKey || undefined,
            };
          }

          return {
            text: `🔍 I couldn't find a **${prettyField(moduleHint)}** matching **"${genericId}"**.`,
          };
        }
      }

      console.log(
        `🧭 No module hint → searching ALL modules for "${genericId}"`
      );

      const found = await searchAllModulesForRecord(genericId);
      if (found) {
        const resolvedId = getRecordNavId(found.record, genericId);

        const { route: detailRoute, moduleKey: matchedModuleKey } =
          resolveDetailRouteForRecord(found.endpointKey, found.endpoint);

        const endpointKey =
          MODULE_TO_ENDPOINT_KEY[matchedModuleKey] || found.endpointKey;

        let navTo: string | undefined;
        if (endpointKey === "inventory") {
          navTo = buildInventoryDetailRoute(
            getInventoryNavKey(found.record, resolvedId),
            found.record
          );
        } else {
          navTo = detailRoute
            ? detailRoute + encodeURIComponent(resolvedId)
            : undefined;
        }

        const isNumericResolvedId = /^\d+$/.test(String(resolvedId));
        if (
          endpointKey &&
          DETAIL_PAGE_APIS[endpointKey] &&
          navTo &&
          isNumericResolvedId
        ) {
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

        return {
          text: `🧭 Navigating to **${found.endpoint.label} ${resolvedId}** detail page...`,
          navigateTo: navTo,
          suggestionKey: endpointKey || undefined,
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

    const target = detectNavigationTarget(question);
    if (target) {
      const current = currentPath.replace(/\/$/, "");
      const dest = target.route.replace(/\/$/, "");
      if (current === dest || current.startsWith(dest + "/")) {
        return { text: `📍 You're already on the **${target.label}** page.` };
      }
      return {
        text: `🧭 Navigating to **${target.label}**...`,
        navigateTo: target.route,
      };
    }
  }

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

    const tableRows: (string | number)[][] = [];

    if (show("sales") && (soRes || qRes || leadRes)) {
      const soCount = soRes ? getTotalCount(soRes) : 0;
      const qCount = qRes ? getTotalCount(qRes) : 0;
      const leadCount = leadRes ? getTotalCount(leadRes) : 0;
      const so = soRes ? unwrap(soRes) : [];
      const qs = qRes ? unwrap(qRes) : [];
      const rev = so.reduce((s: number, o: any) => s + (o.grand_total || 0), 0);
      const quoteVal = qs.reduce((s: number, x: any) => s + (x.grand_total || 0), 0);
      if (leadRes) tableRows.push(["🛒 Sales", "Leads", leadCount, "—"]);
      if (qRes) tableRows.push(["🛒 Sales", "Quotations", qCount, fmtLakh(quoteVal)]);
      if (soRes) tableRows.push(["🛒 Sales", "Sales Orders", soCount, fmtLakh(rev)]);
    }

    if (show("purchasing") && (piRes || poRes || grnRes)) {
      const piCount = piRes ? getTotalCount(piRes) : 0;
      const poCount = poRes ? getTotalCount(poRes) : 0;
      const grnCount = grnRes ? getTotalCount(grnRes) : 0;
      const pi = piRes ? unwrap(piRes) : [];
      const spend = pi.reduce((s: number, i: any) => s + (i.grand_total || i.total || 0), 0);
      if (poRes) tableRows.push(["🛍️ Purchasing", "Purchase Orders", poCount, "—"]);
      if (grnRes) tableRows.push(["🛍️ Purchasing", "GRNs", grnCount, "—"]);
      if (piRes) tableRows.push(["🛍️ Purchasing", "Purchase Invoices", piCount, fmtLakh(spend)]);
    }

    if (show("manufacturing") && (woRes || jcRes || bomRes)) {
      const woCount = woRes ? getTotalCount(woRes) : 0;
      const jcCount = jcRes ? getTotalCount(jcRes) : 0;
      const bomCount = bomRes ? getTotalCount(bomRes) : 0;
      if (bomRes) tableRows.push(["🏭 Manufacturing", "BOMs", bomCount, "—"]);
      if (woRes) tableRows.push(["🏭 Manufacturing", "Work Orders", woCount, "—"]);
      if (jcRes) tableRows.push(["🏭 Manufacturing", "Job Cards", jcCount, "—"]);
    }

    if (show("inventory") && invRes) {
      const invCount = getTotalCount(invRes);
      const inv = unwrap(invRes);
      const stockVal = inv.reduce((s: number, i: any) => s + (i.stock_value || 0), 0);
      tableRows.push(["📦 Inventory", "Items", invCount, fmtLakh(stockVal)]);
    }

    if (show("setup") && (itemRes || igRes || whRes)) {
      const itemCount = itemRes ? getTotalCount(itemRes) : 0;
      const igCount = igRes ? getTotalCount(igRes) : 0;
      const whCount = whRes ? getTotalCount(whRes) : 0;
      if (itemRes) tableRows.push(["⚙️ Setup", "Items", itemCount, "—"]);
      if (igRes) tableRows.push(["⚙️ Setup", "Item Groups", igCount, "—"]);
      if (whRes) tableRows.push(["⚙️ Setup", "Warehouses", whCount, "—"]);
    }

    if (show("quality") && qiRes) {
      const qiCount = getTotalCount(qiRes);
      tableRows.push(["✅ Quality", "Inspections", qiCount, "—"]);
    }

    if (show("organization") && coRes) {
      const coCount = getTotalCount(coRes);
      tableRows.push(["🏢 Organization", "Companies", coCount, "—"]);
    }

    if (tableRows.length > 0) {
      lines.push(
        renderTable(["Module", "Metric", "Count", "Value"], tableRows)
      );
    } else {
      lines.push("_No summary data available._");
    }

    return { text: lines.join("\n").trim() };
  }

  if (has("revenue", "sales value", "total sales", "sales amount")) {
    const res = await api.get("/sales-order?page=1&limit=100");
    const orders = unwrap(res);
    const total = orders.reduce((s: number, o: any) => s + (o.grand_total || 0), 0);
    return {
      text: `💰 **Total Sales Revenue:** ₹${fmt(total)}\n\nFrom **${getTotalCount(res)}** orders.`,
      suggestionKey: "salesOrder",
    };
  }

  if (has("inventory value", "stock value", "item value")) {
    const res = await api.get("/inventory?page=1&limit=100");
    const totalCount = getTotalCount(res);
    const items = unwrap(res);
    const totalValue = items.reduce((s: number, i: any) => s + (i.stock_value || 0), 0);
    const lowStock = items.filter((i: any) => (i.actual_qty || 0) < 10).length;
    return {
      text:
        `📦 **Inventory Summary**\n\n` +
        renderTable(
          ["Metric", "Value"],
          [
            ["Items", totalCount],
            ["Total Value", fmtLakh(totalValue)],
            ["Low Stock Alerts", lowStock],
          ]
        ),
      suggestionKey: "inventory",
    };
  }

  if (has("help", "what can you", "how do you", "commands")) {
    return {
      text:
        "🤖 **ERP Assistant — Help**\n\n" +
        "I can answer questions about every module. Try:\n\n" +
        "**📊 Counting & Lists**\n" +
        "• How many sales orders?\n" +
        "• Show latest warehouses\n\n" +
        "**🏭 Production Capacity**\n" +
        "• Production capacity for wooden study table\n" +
        "• How many wooden study table can I make\n" +
        "• How many units of production capacity wooden study table\n" +
        "• Capacity for BOM 91\n\n" +
        "**🔢 Status Counts / Filtered Lists**\n" +
        "• How many work orders are completed?\n" +
        "• Show me which work orders are in process\n" +
        "• How many sales orders are draft?\n" +
        "• Show me sent quotations\n" +
        "• Show me submitted delivery challans\n" +
        "• Show me paid sales bills\n" +
        "• Show me partially paid sales bills\n" +
        "• Show me completed job cards\n\n" +
        "**🏷️ Item Type Filters**\n" +
        "• Show me raw items\n" +
        "• Show me product items\n" +
        "• How many raw items?\n" +
        "• Show me active items\n\n" +
        "**🔍 Detail Lookup**\n" +
        "• Detail about BOM-00123\n" +
        "• Detail of 12ABC item\n" +
        "• Detail of 381\n\n" +
        "**🧭 Navigate to Detail Page**\n" +
        "• Navigate on 12abc detail page\n" +
        "• Navigate on bolt bom detail page\n" +
        "• Go to work order 294 detail page\n\n" +
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

        const endpointKey = MODULE_TO_ENDPOINT_KEY[moduleKey];
        let navTo: string | undefined;
        if (shouldNavigate && records.length === 1) {
          if (endpointKey === "inventory") {
            navTo = buildInventoryDetailRoute(
              getInventoryNavKey(records[0], identifier),
              records[0]
            );
          } else {
            navTo = (MODULE_DETAIL_ROUTES[moduleKey] || "") +
              encodeURIComponent(getRecordNavId(records[0], identifier));
          }
        }

        if (navTo && endpointKey) {
          const navId = getRecordNavId(records[0], identifier);
          const isNumericNavId = /^\d+$/.test(String(navId));

          if (
            endpointKey !== "inventory" &&
            DETAIL_PAGE_APIS[endpointKey] &&
            isNumericNavId
          ) {
            try {
              const fullDetail = await fetchDetailPageData(endpointKey, navId);
              stashDetailHandoff({
                endpointKey,
                id: String(navId),
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

        const endpointKey =
          MODULE_TO_ENDPOINT_KEY[matchedModuleKey] || found.endpointKey;

        let navTo: string | undefined;
        if (endpointKey === "inventory") {
          navTo = buildInventoryDetailRoute(
            getInventoryNavKey(found.record, recordId),
            found.record
          );
        } else {
          navTo = detailRoute
            ? detailRoute + encodeURIComponent(recordId)
            : undefined;
        }
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

        if (shouldNavigate && navTo && endpointKey) {
          const isNumericRecordId = /^\d+$/.test(String(recordId));
          if (
            endpointKey !== "inventory" &&
            DETAIL_PAGE_APIS[endpointKey] &&
            isNumericRecordId
          ) {
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

  if (endpoint && needsAiAnalysis(question)) {
    console.log(`🤖 Analytical question → routing to AI with ERP context (${endpoint.label})`);
    const aiResult = await askAiWithErpContext(question);
    if (aiResult.ok && aiResult.reply) {
      return {
        text: aiResult.reply,
        navigateTo: aiResult.navigationRoute,
      };
    }
    console.warn(`⚠️ AI failed — falling back to list: ${aiResult.error}`);
  }

  if (endpoint) {
    console.log(`📦 Generic lookup → ${endpoint.label}`);
    const range = detectDateRange(question);
    const result = await answerModuleGeneric(endpoint.label, endpoint.url, range, isCount);

    const endpointKey = Object.keys(ERP_ENDPOINTS).find(
      (k) => ERP_ENDPOINTS[k] === endpoint
    );

    return { ...result, suggestionKey: result.suggestionKey || endpointKey };
  }

  console.log("🤖 Falling back to AI for:", question);
  const aiResult = await askAiWithErpContext(question);
  if (aiResult.ok && aiResult.reply) {
    return {
      text: aiResult.reply,
      navigateTo: aiResult.navigationRoute,
    };
  }

  return {
    text:
      `🤖 I couldn't reach the AI service. ${aiResult.error ?? ""}\n\n` +
      `Try asking:\n` +
      `• "How many sales orders?"\n` +
      `• "How many warehouses?"\n` +
      `• "Show me raw items"\n` +
      `• "Navigate on 12abc detail page"\n` +
      `• "Production capacity for wooden study table"\n` +
      `• "Show me flow of this page"\n` +
      `• "Summary"`,
  };
}

export default function ChatBot() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [wide, setWide] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "Hi 👋 I'm your ERP assistant.\n\n" +
        "I can help you with:\n" +
        "• 📊 Counting — *How many sales orders?*\n" +
        "• 🏭 Capacity — *Production capacity for wooden study table*\n" +
        "• 🔢 Status — *How many work orders are completed?*\n" +
        "• 🏷️ Items — *Show me raw items*\n" +
        "• 🔍 Details — *Detail about 12ABC*\n" +
        "• 🧭 Navigate — *Navigate on 12abc detail page*\n" +
        "• 🗺️ Page Flow — *Show me flow of this page*\n" +
        "• ⚙️ Settings — *What is the current theme?*\n\n" +
        "What would you like to know?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeEndpointKey, setActiveEndpointKey] = useState<string | null>(null);

  const pageChips = getChipsForPath(location.pathname);
  const quickChips = activeEndpointKey && ENDPOINT_CHIPS[activeEndpointKey]
    ? ENDPOINT_CHIPS[activeEndpointKey]
    : pageChips;

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
          navigateLabel: result.navigateLabel,
          rowActions: result.rowActions,
          tableRoutes: result.tableRoutes,
        },
      ]);

      if (result.suggestionKey) {
        setActiveEndpointKey(result.suggestionKey);
      }

      if (result.navigateTo && !result.navigateLabel) {
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

  const handleNavigateClick = (msg: Msg) => {
    if (msg.navigateTo) {
      navigate(msg.navigateTo);
      setOpen(false);
    }
  };

  const handleRowActionClick = (route: string) => {
    if (route) {
      navigate(route);
      setOpen(false);
    }
  };

  const handleTableRowClick = (route: string) => {
    if (route) {
      navigate(route);
      setOpen(false);
    }
  };

  const formatText = (text: string, tableRoutes?: string[]): React.ReactNode => {
    const rawLines = text.split("\n");
    const out: React.ReactNode[] = [];
    let tableBuffer: string[][] | null = null;
    let tableKey = 0;
    let rowIndex = 0;

    const flushTable = () => {
      if (!tableBuffer || tableBuffer.length === 0) return;
      const [header, ...body] = tableBuffer;
      const currentRowOffset = rowIndex;
      out.push(
        <div key={`table-${tableKey++}`} className="chat-table-wrap">
          <table className="chat-table">
            <thead>
              <tr>
                {header.map((h, i) => (
                  <th key={`th-${i}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => {
                const route =
                  tableRoutes && tableRoutes[currentRowOffset + ri]
                    ? tableRoutes[currentRowOffset + ri]
                    : undefined;
                return (
                  <tr
                    key={`tr-${ri}`}
                    className={route ? "chat-table-row-clickable" : ""}
                    onClick={() => route && handleTableRowClick(route)}
                    style={route ? { cursor: "pointer" } : undefined}
                    title={route ? "Click to open detail page" : undefined}
                  >
                    {row.map((c, ci) => (
                      <td key={`td-${ri}-${ci}`}>{c}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = null;
      rowIndex += body.length;
    };

    const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
    const isTableSep = (line: string) =>
      /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      if (isTableSep(line)) continue;

      if (isTableRow(line)) {
        const cells = line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
        if (!tableBuffer) tableBuffer = [];
        tableBuffer.push(cells);
        continue;
      }

      if (tableBuffer) flushTable();

      if (line.trim() === "") {
        out.push(<br key={`br-${i}`} />);
        continue;
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
          <strong key={`bold-${i}-${match.index}`} className="chat-bold">
            {match[1]}
          </strong>
        );
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      out.push(
        <div key={`line-${i}`} className="chat-line">
          {parts.length > 0 ? parts : line}
        </div>
      );
    }

    if (tableBuffer) flushTable();

    return out;
  };

  return (
    <>
      <button
        className="chat-fab chat-fab--small"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
        title="Ask ERP Assistant"
      >
        {open ? <FaTimes /> : <FaCommentDots />}
      </button>

      {open && (
        <div className={`chat-window ${wide ? "chat-window--wide" : "chat-window--compact"}`}>
          <div className="chat-header">
            <FaRobot />
            <span>ERP Assistant</span>
            <button
              className="chat-header-expand"
              onClick={() => setWide((w) => !w)}
              title={wide ? "Collapse" : "Expand"}
              aria-label={wide ? "Collapse" : "Expand"}
            >
              {wide ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
            </button>
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
                  {formatText(m.text, m.tableRoutes)}

                  {m.rowActions && m.rowActions.length > 0 && (
                    <div className="chat-row-actions">
                      {m.rowActions.map((a, idx) => (
                        <button
                          key={`row-${idx}`}
                          className="chat-row-btn"
                          onClick={() => handleRowActionClick(a.route)}
                          title={a.route || "No route available"}
                          disabled={!a.route}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {m.navigateTo && m.navigateLabel && (
                    <button
                      className="chat-nav-btn"
                      onClick={() => handleNavigateClick(m)}
                      title={m.navigateTo}
                    >
                      {m.navigateLabel} →
                    </button>
                  )}
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