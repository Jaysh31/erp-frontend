// src/pages/components/chatbot/ChatBot.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaUser, FaSpinner,
} from "react-icons/fa";
import "./ChatBot.css";
import api from "../../../services/api";
import { askAiWithErpContext, matchEndpoint } from "../../../services/erpApi";
interface Msg {
  role: "user" | "bot";
  text: string;
}
// ... rest of the file stays exactly the same {


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
  const all = unwrap(res);
  const total = getTotalCount(res);

  let rows = all;
  if (range) {
    rows = filterByDate(all, range);
  }

  // No data at all in this module
  if (total === 0 && all.length === 0) {
    return `You have no ${documentLabel.toLowerCase()} yet.`;
  }

  // Date filter returned nothing
  if (range && rows.length === 0) {
    return `No ${documentLabel.toLowerCase()} ${range.label}.`;
  }

  // Just asking for a count (no date)
  if (isCount && !range) {
    return `You have **${total}** ${documentLabel.toLowerCase()}.`;
  }

  // Count with date filter
  if (isCount && range) {
    return `**${rows.length}** ${documentLabel.toLowerCase()} ${range.label}.`;
  }

  // List the latest 10 with dates
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

// ─── The "brain" ──────────────────────────────────────────────────────
async function answerQuestion(question: string): Promise<string> {
  const q = question.toLowerCase().trim();

  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const isCount = has("how many", "count", "number of", "total number");

  // ════════════════════════════════════════════════════════════════════
  // 1. SPECIAL RULES — need custom logic, handled before the generic path
  // ════════════════════════════════════════════════════════════════════

  // ── SUMMARY ────────────────────────────────────────────────────────
  if (has("summary", "overview", "dashboard", "everything", "snapshot")) {
    const [soRes, piRes, invRes, woRes] = await Promise.all([
      api.get("/sales-order?page=1&limit=100").catch(() => null),
      api.get("/purchase-invoice?page=1&limit=100").catch(() => null),
      api.get("/inventory?page=1&limit=100").catch(() => null),
      api.get("/work-order?page=1&limit=100").catch(() => null),
    ]);

    const soCount = soRes ? getTotalCount(soRes) : 0;
    const piCount = piRes ? getTotalCount(piRes) : 0;
    const invCount = invRes ? getTotalCount(invRes) : 0;
    const woCount = woRes ? getTotalCount(woRes) : 0;

    const so = soRes ? unwrap(soRes) : [];
    const pi = piRes ? unwrap(piRes) : [];
    const inv = invRes ? unwrap(invRes) : [];
    const wo = woRes ? unwrap(woRes) : [];

    const rev = so.reduce((s: number, o: any) => s + (o.grand_total || 0), 0);
    const spend = pi.reduce((s: number, i: any) => s + (i.grand_total || i.total || 0), 0);
    const stockVal = inv.reduce((s: number, i: any) => s + (i.stock_value || 0), 0);
    const wip = wo.filter((w: any) => w.status === "In Process").length;

    return (
      `📊 Business Snapshot\n` +
      `• Sales: ${soCount} orders · ₹${fmtLakh(rev)}\n` +
      `• Purchases: ${piCount} invoices · ₹${fmtLakh(spend)}\n` +
      `• Inventory: ${invCount} items · ₹${fmtLakh(stockVal)}\n` +
      `• Manufacturing: ${woCount} WOs · ${wip} in process`
    );
  }

  // ── REVENUE ────────────────────────────────────────────────────────
  if (has("revenue", "sales value", "total sales", "sales amount")) {
    const res = await api.get("/sales-order?page=1&limit=100");
    const orders = unwrap(res);
    const total = orders.reduce((s: number, o: any) => s + (o.grand_total || 0), 0);
    return `Total sales revenue: ₹${fmt(total)} from ${getTotalCount(res)} orders.`;
  }

  // ── INVENTORY VALUE ────────────────────────────────────────────────
  if (has("inventory value", "stock value", "item value")) {
    const res = await api.get("/inventory?page=1&limit=100");
    const totalCount = getTotalCount(res);
    const items = unwrap(res);
    const totalValue = items.reduce((s: number, i: any) => s + (i.stock_value || 0), 0);
    const lowStock = items.filter((i: any) => (i.actual_qty || 0) < 10).length;
    return `Inventory: ${totalCount} items · Value ₹${fmtLakh(totalValue)} · ${lowStock} low-stock items.`;
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
        return `${n} work orders are currently in process.`;
      }
      if (has("completed", "done", "finished")) {
        const n = wos.filter((w: any) => w.status === "Completed").length;
        return `${n} work orders are completed.`;
      }
      const n = wos.filter((w: any) =>
        ["Open", "Not Started", "Draft"].includes(w.status)
      ).length;
      return `${n} work orders are open / not started.`;
    }
  }

  // ── HELP ───────────────────────────────────────────────────────────
  if (has("help", "what can you", "how do you", "commands")) {
    return (
      "I can answer questions about every module. Try:\n" +
      "• How many sales orders?\n" +
      "• How many quotations?\n" +
      "• How many warehouses?\n" +
      "• How many items?\n" +
      "• How many work orders?\n" +
      "• How many stock entries?\n" +
      "• How many delivery challans?\n" +
      "• How many proforma invoices?\n" +
      "• Warehouse created today\n" +
      "• Sales orders yesterday\n" +
      "• Work orders this week\n" +
      "• Summary"
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 2. GENERIC LOOKUP — every module in ERP_ENDPOINTS
  //    Handles: work order, job card, inventory, BOM, stock entry,
  //    item, item group, warehouse, workstation, operation, UOM,
  //    quality inspection, lead, quotation, sales order, proforma
  //    invoice, delivery note, sales invoice, company, purchase order,
  //    GRN, purchase invoice — anything in erpApi.ts.
  // ════════════════════════════════════════════════════════════════════

  const endpoint = matchEndpoint(question);
  if (endpoint) {
    console.log(`📦 Generic lookup → ${endpoint.label}`);
    debugCount(endpoint.label, await api.get(endpoint.url).catch((e) => e));

    const range = detectDateRange(question);
    return answerModuleGeneric(endpoint.label, endpoint.url, range, isCount);
  }

  // ════════════════════════════════════════════════════════════════════
  // 3. AI FALLBACK — anything that doesn't match a known module
  // ════════════════════════════════════════════════════════════════════
  console.log("🤖 Falling back to AI for:", question);

  const aiResult = await askAiWithErpContext(question);

  if (aiResult.ok && aiResult.reply) {
    return aiResult.reply;
  }

  return (
    `🤖 I couldn't reach the AI service. ${aiResult.error ?? ""}\n\n` +
    `Try asking:\n` +
    `• "How many sales orders?"\n` +
    `• "How many warehouses?"\n` +
    `• "Warehouse created today"\n` +
    `• "Summary"`
  );
}

// ─── Component ─────────────────────────────────────────────────────────
export default function ChatBot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "Hi 👋 I'm your ERP assistant. Ask about any module:\n" +
        "• How many sales orders?\n" +
        "• How many warehouses?\n" +
        "• How many items?\n" +
        "• How many work orders?\n" +
        "• Warehouse created today\n" +
        "• Summary",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await answerQuestion(q);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
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

  const sendQuestion = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);

    try {
      const reply = await answerQuestion(q);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
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

  const quickChips = [
    "Summary",
    "How many sales orders?",
    "How many quotations?",
    "How many warehouses?",
    "How many items?",
    "How many work orders?",
    "How many stock entries?",
    "How many delivery challans?",
    "How many proforma invoices?",
    "Warehouse created today",
    "Sales orders today",
    "Inventory value",
  ];

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