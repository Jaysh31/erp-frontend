import React, { useState, useMemo, useCallback,  useEffect } from "react";

/* ---------------- Types ---------------- */
type EntryType = "Debit" | "Credit";
type ReferenceType = "None" | "Purchase Invoice" | "Sales Invoice" | "Journal";
type Status = "Draft" | "Submitted" | "Cancelled";
type VoucherType = "General Entry" | "Payment" | "Receipt" | "Adjustment";
type Currency = "INR" | "USD" | "EUR" | "GBP";

interface AccountRow {
  id: string; account: string; partyType: string; party: string;
  entryType: EntryType; referenceType: ReferenceType; referenceNo: string;
  invoiceDate: string; invoiceAmount: string; debit: string; credit: string;
  costCenter: string; remarks: string;
}
interface HeaderState {
  entryNo: string; postingDate: string; company: string;
  voucherType: VoucherType; referenceNo: string; referenceDate: string;
  remarks: string; currency: Currency; exchangeRate: string; status: Status;
}

/* ---------------- Helpers ---------------- */
let rowSeq = 2;
const makeRow = (o: Partial<AccountRow> = {}): AccountRow => ({
  id: `row-${rowSeq++}`, account: "", partyType: "", party: "",
  entryType: "Debit", referenceType: "None", referenceNo: "",
  invoiceDate: "", invoiceAmount: "", debit: "", credit: "",
  costCenter: "", remarks: "", ...o,
});
const toNumber = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

const companies = ["SculptorTech", "SculptorTech Retail", "SculptorTech Exports"];
const accounts = ["Purchase Account","Sales Account","Cash Account","Bank Account","Accounts Payable","Accounts Receivable","Freight Charges"];
const costCenters = ["Main", "Warehouse", "Admin", "Sales - North"];
const partyTypes = ["", "Supplier", "Customer", "Employee"];

/* ---------------- Component ---------------- */
export interface GeneralAccountEntryProps {
  entryNo?: string;
  onSaveDraft?: (h: HeaderState, r: AccountRow[]) => void;
  onSubmit?: (h: HeaderState, r: AccountRow[]) => void;
}

export default function GeneralAccountEntry({
  entryNo = "JV-000012", onSaveDraft, onSubmit,
}: GeneralAccountEntryProps) {
  const [header, setHeader] = useState<HeaderState>({
    entryNo, postingDate: "2026-09-09", company: companies[0],
    voucherType: "General Entry", referenceNo: "", referenceDate: "",
    remarks: "", currency: "INR", exchangeRate: "1.00", status: "Draft",
  });

  const [rows, setRows] = useState<AccountRow[]>([
    makeRow({ id:"row-0", account:"Purchase Account", partyType:"Supplier", party:"ABC Suppliers",
      entryType:"Debit", referenceType:"Purchase Invoice", referenceNo:"PI-000123",
      invoiceDate:"2026-09-09", invoiceAmount:"50000.00", debit:"50000.00", credit:"",
      costCenter:"Main", remarks:"Purchase" }),
    makeRow({ id:"row-1", account:"Sales Account", partyType:"Customer", party:"XYZ Customer",
      entryType:"Credit", referenceType:"Sales Invoice", referenceNo:"SI-000456",
      invoiceDate:"2026-09-09", invoiceAmount:"75000.00", debit:"", credit:"50000.00",
      costCenter:"Main", remarks:"Sale settlement" }),
  ]);

  const [expandedRowId, setExpandedRowId] = useState<string | null>("row-0");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // ---------- Derived totals (memoized) ----------
  const totals = useMemo(() => {
    const debit = rows.reduce((s, r) => s + toNumber(r.debit), 0);
    const credit = rows.reduce((s, r) => s + toNumber(r.credit), 0);
    return { debit, credit, difference: debit - credit };
  }, [rows]);
  const isBalanced = Math.abs(totals.difference) < 0.005;

  // ---------- Header updater ----------
  const updateHeader = useCallback(
    <K extends keyof HeaderState>(k: K, v: HeaderState[K]) =>
      setHeader(h => ({ ...h, [k]: v })),
    []
  );

  // ---------- Row updater (uses functional setState — never loses data) ----------
  const updateRow = useCallback(
    <K extends keyof AccountRow>(id: string, k: K, v: AccountRow[K]) => {
      setRows(rs => rs.map(r => (r.id === id ? { ...r, [k]: v } : r)));
    },
    []
  );

  // ---------- Debit/Credit with mutual exclusion done safely ----------
  const updateDebit = useCallback((id: string, value: string) => {
    setRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, debit: value };
      // only clear credit if debit has a non-empty value
      if (value.trim() !== "") next.credit = "";
      return next;
    }));
  }, []);

  const updateCredit = useCallback((id: string, value: string) => {
    setRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, credit: value };
      if (value.trim() !== "") next.debit = "";
      return next;
    }));
  }, []);

  const addRow = useCallback(() => {
    const nr = makeRow();
    setRows(rs => [...rs, nr]);
    setExpandedRowId(nr.id);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(rs => (rs.length > 1 ? rs.filter(r => r.id !== id) : rs));
    setExpandedRowId(c => (c === id ? null : c));
  }, []);

  // ---------- Validation ----------
  const validate = useCallback(() => {
    if (!rows.length) return "Add at least one account entry.";
    if (rows.some(r => !r.account)) return "Every row needs an account selected.";
    if (!isBalanced) return "Total debit and total credit must match before you can submit.";
    return null;
  }, [rows, isBalanced]);

  // ---------- Actions ----------
  const handleSaveDraft = useCallback(() => {
    setError(null);
    setHeader(h => ({ ...h, status: "Draft" }));
    setSavedAt(new Date());
    onSaveDraft?.(header, rows);
  }, [header, rows, onSaveDraft]);

  const handleSubmit = useCallback(() => {
    const p = validate();
    if (p) { setError(p); return; }
    setError(null);
    setHeader(h => ({ ...h, status: "Submitted" }));
    setSavedAt(new Date());
    onSubmit?.(header, rows);
  }, [validate, header, rows, onSubmit]);

  // ---------- Autosave (localStorage) — survives refresh ----------
  // Comment this out if you don't want persistence across reloads.
  const AUTOSAVE_KEY = "gaep-form-state-v1";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.header && Array.isArray(parsed?.rows)) {
          setHeader(parsed.header);
          setRows(parsed.rows);
          // bump rowSeq so new rows don't collide
          const maxId = parsed.rows.reduce((m: number, r: AccountRow) => {
            const n = parseInt(String(r.id).replace("row-", ""), 10);
            return Number.isFinite(n) ? Math.max(m, n) : m;
          }, 0);
          rowSeq = Math.max(rowSeq, maxId + 1);
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ header, rows }));
    } catch { /* ignore */ }
  }, [header, rows]);

  const clearSaved = () => {
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* ignore */ }
  };

  return (
    <div className="gaep">
      <div className="gaep__inner">

        {/* Masthead */}
        <div className="gaep__masthead">
          <div>
            <h1 className="gaep__title">General account entry</h1>
            <p className="gaep__subtitle">Journal voucher · double-entry ledger</p>
          </div>
          <div className="gaep__masthead-right">
            {savedAt && (
              <span className="gaep__saved">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
            <StatusBadge status={header.status} />
          </div>
        </div>

        {/* Header card */}
        <section className="gaep__card">
          <div className="gaep__section-label">Voucher details</div>
          <div className="gaep__form-grid">
            <Field label="Entry no.">
              <input value={header.entryNo} disabled className="ledger-input ledger-input--disabled font-mono" />
            </Field>
            <Field label="Posting date">
              <input type="date" value={header.postingDate}
                onChange={e => updateHeader("postingDate", e.target.value)}
                className="ledger-input font-mono" />
            </Field>
            <Field label="Company">
              <select value={header.company} onChange={e => updateHeader("company", e.target.value)} className="ledger-input">
                {companies.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Voucher type">
              <select value={header.voucherType}
                onChange={e => updateHeader("voucherType", e.target.value as VoucherType)}
                className="ledger-input">
                {(["General Entry","Payment","Receipt","Adjustment"] as VoucherType[]).map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Reference no.">
              <input value={header.referenceNo} placeholder="External reference"
                onChange={e => updateHeader("referenceNo", e.target.value)} className="ledger-input" />
            </Field>
            <Field label="Reference date">
              <input type="date" value={header.referenceDate}
                onChange={e => updateHeader("referenceDate", e.target.value)}
                className="ledger-input font-mono" />
            </Field>
            <Field label="Currency">
              <select value={header.currency}
                onChange={e => updateHeader("currency", e.target.value as Currency)}
                className="ledger-input">
                {(["INR","USD","EUR","GBP"] as Currency[]).map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            {header.currency !== "INR" && (
              <Field label="Exchange rate">
                <input value={header.exchangeRate}
                  onChange={e => updateHeader("exchangeRate", e.target.value)}
                  className="ledger-input text-right font-mono" />
              </Field>
            )}
            <Field label="Remarks" span={header.currency === "INR" ? 4 : 3}>
              <textarea value={header.remarks} rows={2} placeholder="Describe this entry"
                onChange={e => updateHeader("remarks", e.target.value)}
                className="ledger-input ledger-input--textarea" />
            </Field>
          </div>
        </section>

        {/* Entries */}
        <section className="gaep__card">
          <div className="gaep__card-header">
            <span className="gaep__section-label-inline">Account entries</span>
            <button onClick={addRow} className="btn btn--outline btn--sm">+ Add row</button>
          </div>

          <div className="gaep__table-wrap">
            <table className="gaep__table">
              <thead>
                <tr>
                  <th className="col-toggle" />
                  <th>Account</th>
                  <th>Party type</th>
                  <th>Party</th>
                  <th>Cost center</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                  <th className="col-actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <React.Fragment key={row.id}>
                    <tr className={idx % 2 === 1 ? "row-alt" : ""}>
                      <td className="col-toggle">
                        <button className="toggle-btn" aria-label="Toggle reference details"
                          onClick={() => setExpandedRowId(c => (c === row.id ? null : row.id))}>
                          {expandedRowId === row.id ? "▾" : "▸"}
                        </button>
                      </td>
                      <td>
                        <select value={row.account} onChange={e => updateRow(row.id, "account", e.target.value)} className="cell-input">
                          <option value="">Select account</option>
                          {accounts.map(a => <option key={a}>{a}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={row.partyType} onChange={e => updateRow(row.id, "partyType", e.target.value)} className="cell-input">
                          {partyTypes.map(p => <option key={p || "none"} value={p}>{p || "—"}</option>)}
                        </select>
                      </td>
                      <td>
                        <input value={row.party} disabled={!row.partyType} placeholder="—"
                          onChange={e => updateRow(row.id, "party", e.target.value)}
                          className="cell-input" />
                      </td>
                      <td>
                        <select value={row.costCenter} onChange={e => updateRow(row.id, "costCenter", e.target.value)} className="cell-input">
                          <option value="">—</option>
                          {costCenters.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td>
                        <input value={row.debit} placeholder="0.00"
                          onChange={e => updateDebit(row.id, e.target.value)}
                          className="cell-input cell-input--debit font-mono" />
                      </td>
                      <td>
                        <input value={row.credit} placeholder="0.00"
                          onChange={e => updateCredit(row.id, e.target.value)}
                          className="cell-input cell-input--credit font-mono" />
                      </td>
                      <td className="col-actions">
                        <button className="remove-btn" aria-label="Remove row"
                          onClick={() => removeRow(row.id)} disabled={rows.length === 1}>✕</button>
                      </td>
                    </tr>

                    {expandedRowId === row.id && (
                      <tr className="row-expanded" key={`${row.id}-expanded`}>
                        <td />
                        <td colSpan={7}>
                          <ReferenceDetails row={row} updateRow={updateRow} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="tfoot-total">
                  <td colSpan={5} className="text-right total-label">Totals</td>
                  <td className="text-right total-debit font-mono">{formatINR(totals.debit)}</td>
                  <td className="text-right total-credit font-mono">{formatINR(totals.credit)}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={5} className="text-right difference-label">Difference</td>
                  <td colSpan={2} className={`text-right difference-value font-mono ${isBalanced ? "is-balanced" : "is-not-balanced"}`}>
                    {formatINR(totals.difference)}
                    {!isBalanced && <span className="badge-warning">Not balanced</span>}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {error && <div className="gaep__error">{error}</div>}

        <div className="gaep__actions">
          <button onClick={clearSaved} className="btn btn--ghost" title="Clear autosaved state">
            Reset
          </button>
          <button onClick={handleSaveDraft} className="btn btn--secondary">Save draft</button>
          <button onClick={handleSubmit} className="btn btn--primary">Submit</button>
        </div>
      </div>

      <style>{`
        /* ============ Layout ============ */
        .gaep {
          min-height: 100vh;
          background: linear-gradient(to bottom, #EEF1F5, #E6EAF0);
          padding: 2.5rem 1rem;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          color: #14213D;
        }
        .gaep__inner { max-width: 64rem; margin: 0 auto; }

        /* ============ Masthead ============ */
        .gaep__masthead {
          display: flex; align-items: baseline; justify-content: space-between;
          border-bottom: 2px solid #14213D; padding-bottom: 0.75rem; margin-bottom: 1.5rem;
        }
        .gaep__masthead-right { display: flex; align-items: center; gap: 0.75rem; }
        .gaep__saved {
          font-size: 0.7rem; color: #5B6B8C; font-family: ui-monospace, SFMono-Regular, monospace;
        }
        .gaep__title { font-size: 1.125rem; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
        .gaep__subtitle { font-size: 0.75rem; color: #5B6B8C; margin: 0.15rem 0 0; }

        /* ============ Cards ============ */
        .gaep__card {
          background: #fff; border: 1px solid #C7CDD6; border-radius: 6px;
          box-shadow: 0 1px 2px rgba(20,33,61,0.06), 0 1px 0 #C7CDD6;
          margin-bottom: 1.5rem; overflow: hidden;
        }
        .gaep__section-label {
          background: #F7F8FA; border-bottom: 1px solid #C7CDD6;
          padding: 0.6rem 1.25rem; font-size: 0.7rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.04em; color: #5B6B8C;
        }
        .gaep__card-header {
          display: flex; align-items: center; justify-content: space-between;
          background: #F7F8FA; border-bottom: 1px solid #C7CDD6;
          padding: 0.6rem 1.25rem;
        }
        .gaep__section-label-inline {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.04em; color: #5B6B8C;
        }

        /* ============ Form grid ============ */
        .gaep__form-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem 1.5rem; padding: 1.25rem;
        }
        @media (max-width: 768px) { .gaep__form-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .gaep__form-grid { grid-template-columns: 1fr; } }

        .gaep-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .gaep-field__label { font-size: 0.75rem; font-weight: 500; color: #5B6B8C; }

        /* ============ Inputs ============ */
        .ledger-input {
          width: 100%; border: 1px solid #C7CDD6; border-radius: 4px;
          background: #fff; padding: 7px 9px; font-size: 13px; color: #14213D;
          outline: none; transition: border-color .15s, box-shadow .15s;
          font-family: inherit; box-sizing: border-box;
        }
        .ledger-input:hover { border-color: #A7AEBB; }
        .ledger-input:focus { border-color: #14213D; box-shadow: 0 0 0 1px #14213D; }
        .ledger-input--disabled { background: #F4F5F7; color: #5B6B8C; cursor: not-allowed; }
        .ledger-input--textarea { resize: none; line-height: 1.4; min-height: 2.6rem; }

        .cell-input {
          width: 100%; border: 1px solid transparent; border-radius: 4px;
          background: transparent; padding: 5px 6px; font-size: 13px;
          color: #14213D; outline: none; font-family: inherit; box-sizing: border-box;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }
        .cell-input:hover { border-color: #C7CDD6; }
        .cell-input:focus { border-color: #14213D; background: #fff; box-shadow: 0 0 0 1px #14213D; }
        .cell-input:disabled { background: #F4F5F7; color: #A7AEBB; cursor: not-allowed; }
        .cell-input--debit { color: #9A3324; text-align: right; }
        .cell-input--credit { color: #1B6F5C; text-align: right; }

        select.ledger-input, select.cell-input { cursor: pointer; }

        /* ============ Table ============ */
        .gaep__table-wrap { overflow-x: auto; }
        .gaep__table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .gaep__table thead tr {
          background: #FAFBFC; border-bottom: 1px solid #C7CDD6;
          text-align: left; font-size: 0.7rem; text-transform: uppercase;
          letter-spacing: 0.04em; color: #5B6B8C;
        }
        .gaep__table th { padding: 0.5rem 0.75rem; font-weight: 500; }
        .gaep__table td { padding: 0.4rem 0.75rem; border-bottom: 1px solid #E4E7EC; vertical-align: middle; }
        .gaep__table tbody tr.row-alt td { background: #FAFBFC; }
        .gaep__table tbody tr:hover td { background: #F4F6F9; }
        .gaep__table tbody tr.row-expanded td { background: #F4F6F9 !important; padding: 1rem 0.75rem; }

        .col-toggle { width: 2rem; text-align: center; padding: 0.4rem 0.2rem !important; }
        .col-actions { width: 2.5rem; text-align: center; padding: 0.4rem 0.2rem !important; }

        .toggle-btn, .remove-btn {
          background: none; border: none; cursor: pointer; padding: 0 0.15rem;
          transition: color .15s; font-size: 1rem; line-height: 1;
        }
        .toggle-btn { color: #5B6B8C; }
        .toggle-btn:hover { color: #14213D; }
        .remove-btn { color: #A7AEBB; font-size: 0.9rem; }
        .remove-btn:hover:not(:disabled) { color: #9A3324; }
        .remove-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ============ Tfoot ============ */
        .gaep__table tfoot tr.tfoot-total td { border-top: 2px solid #14213D; padding: 0.65rem 0.75rem; }
        .gaep__table tfoot td { padding: 0.4rem 0.75rem; border-bottom: none; }
        .total-label { font-weight: 500; color: #5B6B8C; }
        .total-debit { font-weight: 600; color: #9A3324; }
        .total-credit { font-weight: 600; color: #1B6F5C; }
        .difference-label { font-size: 0.75rem; color: #5B6B8C; }
        .difference-value { font-size: 0.75rem; font-weight: 600; }
        .is-balanced { color: #1B6F5C; }
        .is-not-balanced { color: #C08A1E; }
        .badge-warning {
          margin-left: 0.5rem; background: #FBEFDA; color: #854F0B;
          padding: 0.15rem 0.4rem; border-radius: 2px;
          font-size: 0.65rem; font-weight: 500;
        }

        /* ============ Reference details grid ============ */
        .reference-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem 1.5rem;
        }
        @media (max-width: 768px) { .reference-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .reference-grid { grid-template-columns: 1fr; } }

        /* ============ Buttons ============ */
        .btn {
          border-radius: 4px; padding: 0.5rem 1.25rem; font-size: 0.8125rem;
          font-weight: 500; cursor: pointer; border: 1px solid transparent;
          font-family: inherit; transition: background .15s, border-color .15s, color .15s;
        }
        .btn--sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 4px; }
        .btn--outline { background: transparent; border-color: #14213D; color: #14213D; }
        .btn--outline:hover { background: #14213D; color: #fff; }
        .btn--secondary { background: #fff; border-color: #C7CDD6; color: #14213D; }
        .btn--secondary:hover { border-color: #14213D; background: #F7F8FA; }
        .btn--primary { background: #14213D; color: #fff; border-color: #14213D; }
        .btn--primary:hover { background: #1F2E52; border-color: #1F2E52; }
        .btn--ghost { background: transparent; border-color: transparent; color: #5B6B8C; }
        .btn--ghost:hover { color: #9A3324; }

        /* ============ Error + actions ============ */
        .gaep__error {
          background: #FAECE7; border: 1px solid #F0997B; border-radius: 4px;
          padding: 0.65rem 1rem; font-size: 0.8125rem; color: #712B13;
          margin-bottom: 1rem;
        }
        .gaep__actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
        @media (max-width: 480px) {
          .gaep__actions { flex-direction: column-reverse; }
          .gaep__actions .btn { width: 100%; text-align: center; }
        }

        /* ============ Status badge ============ */
        .status-badge {
          border-radius: 4px; border: 1px solid; padding: 0.25rem 0.65rem;
          font-size: 0.75rem; font-weight: 500;
        }
        .status-badge--draft { background: #F1EFE8; color: #5F5E5A; border-color: #B4B2A9; }
        .status-badge--submitted { background: #E1F5EE; color: #085041; border-color: #5DCAA5; }
        .status-badge--cancelled { background: #FCEBEB; color: #791F1F; border-color: #F09595; }

        /* ============ Utility ============ */
        .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace; }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <label className="gaep-field" style={{ gridColumn: span > 1 ? `span ${span} / span ${span}` : undefined }}>
      <span className="gaep-field__label">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cls =
    status === "Draft" ? "status-badge--draft"
    : status === "Submitted" ? "status-badge--submitted"
    : "status-badge--cancelled";
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

function ReferenceDetails({
  row, updateRow,
}: {
  row: AccountRow;
  updateRow: <K extends keyof AccountRow>(id: string, key: K, value: AccountRow[K]) => void;
}) {
  const isPurchase = row.referenceType === "Purchase Invoice";
  const isSales = row.referenceType === "Sales Invoice";

  return (
    <div className="reference-grid">
      <Field label="Entry type">
        <select value={row.entryType} onChange={e => updateRow(row.id, "entryType", e.target.value as EntryType)} className="ledger-input">
          <option>Debit</option><option>Credit</option>
        </select>
      </Field>
      <Field label="Reference type">
        <select value={row.referenceType} onChange={e => updateRow(row.id, "referenceType", e.target.value as ReferenceType)} className="ledger-input">
          <option>None</option><option>Purchase Invoice</option><option>Sales Invoice</option><option>Journal</option>
        </select>
      </Field>

      {(isPurchase || isSales) && (
        <>
          <Field label={isPurchase ? "Purchase invoice" : "Sales invoice"}>
            <input value={row.referenceNo} onChange={e => updateRow(row.id, "referenceNo", e.target.value)}
              placeholder={isPurchase ? "PI-000123" : "SI-000456"} className="ledger-input font-mono" />
          </Field>
          <Field label={isPurchase ? "Supplier" : "Customer"}>
            <input value={row.party} onChange={e => updateRow(row.id, "party", e.target.value)} className="ledger-input" />
          </Field>
          <Field label="Invoice date">
            <input type="date" value={row.invoiceDate} onChange={e => updateRow(row.id, "invoiceDate", e.target.value)} className="ledger-input font-mono" />
          </Field>
          <Field label="Invoice amount">
            <input value={row.invoiceAmount} onChange={e => updateRow(row.id, "invoiceAmount", e.target.value)} className="ledger-input text-right font-mono" />
          </Field>
        </>
      )}

      <Field label="Remarks" span={2}>
        <input value={row.remarks} onChange={e => updateRow(row.id, "remarks", e.target.value)}
          placeholder="Line description" className="ledger-input" />
      </Field>
    </div>
  );
}