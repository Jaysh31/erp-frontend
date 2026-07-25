// WorkOrderForm.tsx
import { useState, type FormEvent, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaExclamationTriangle,
  FaInfoCircle, FaTimesCircle, FaPlus, FaTrash,
   FaSearch,  FaBuilding, FaTruck,
  FaImage,  FaCalendarAlt,
  FaCheckCircle, FaBoxOpen, FaCogs,
} from "react-icons/fa";
import "./WorkOrderForm.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "Draft" | "Not Started" | "In Process" | "Completed" | "Stopped";
type OrderType = "internal" | "external";

interface OperationRow {
  id: string;
  operation: string;
  workstation: string;
  time_in_mins: number;
  hour_rate: number;
  operating_cost: number;
}

interface RequiredItemRow {
  id: string;
  item_code: string;
  item_name: string;
  source_warehouse: string;
  required_qty: number;
  uom: string;
  transferred_qty: number;
  consumed_qty: number;
  returned_qty: number;
  rate?: number;
  amount?: number;
}

interface CommentRow {
  id: string;
  author: string;
  text: string;
  time: string;
}

// Exact shape from GET /grn?page=1&limit=10&type=External
interface GRNData {
  id: number;
  grn_number: string;
  grn_date: string;
  supplier_id: number | null;
  supplier_name: string | null;
  customer_id: number | null;
  customer_name: string | null;
  party_name: string | null;
  purchase_order_id: number | null;
  warehouse_id: number | null;
  received_by: string | null;
  vehicle_number: string | null;
  delivery_challan_no: string | null;
  invoice_number: string | null;
  status: string;
  type: string;
  is_completed: number;
  total_ordered_qty: number;
  total_received_qty: number;
  total_accepted_qty: number;
  total_rejected_qty: number;
  remarks: string | null;
  creation: string;
  modified: string;
  modified_by: string;
  total_items: number;
}

interface GRNListResponse {
  success: number;
  data: {
    data: GRNData[];
    totalRecords: number;
    page: number;
    limit: number;
  };
}

// Full GRN detail — GET /grn/:id. This is the shape that actually carries
// the item lines + warehouse, which the list endpoint above does not.
interface GRNItemDetail {
  id: number;
  grn_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  ordered_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  uom: string;
  rate: number;
  purchase_rate: number;
  amount: number;
  batch_no: string | null;
  expiry_date: string | null;
  remarks: string | null;
}

interface GRNDetail extends Omit<GRNData, "warehouse_id"> {
  warehouse_id: number | null;
  warehouse_name: string | null;
  items: GRNItemDetail[];
}

interface GRNDetailResponse {
  success: number;
  data: GRNDetail;
}

interface WorkOrderData {
  id?: number;
  name: string;
  status: Status;
  type: OrderType;
  // Core
  company: string;
  qty_to_manufacture: number;
  item_to_manufacture: string;
  item_name: string;
  item_id:String;
  stock_uom: string;
  bom_no: string;
  // Qty tracking (read-only in most cases)
  material_transferred_for_manufacturing: number;
  manufactured_qty: number;
  additional_transferred_qty: number;
  disassembled_qty: number;
  // Warehouses
  source_warehouse: string;
  target_warehouse: string;
  wip_warehouse: string;
  transfer_material_against: "Work Order" | "Job Card";
  // Tables
  operations: OperationRow[];
  required_items: RequiredItemRow[];
  // Configuration
  planned_start_date: string;
  actual_start_date: string;
  actual_end_date: string;
  lead_time_mins: number;
  planned_operating_cost: number;
  actual_operating_cost: number;
  additional_operating_cost: number;
  corrective_operation_cost: number;
  // Comments / Activity
  comments: CommentRow[];
  activity: { id: string; text: string; time: string }[];
  // Connections
  items_produced_pct: number;
  completed_operations: string[];
  stock_entry_count: number;
  job_card_count: number;
  pick_list_count: number;
  serial_no_count: number;
  batch_count: number;
  material_request_count: number;
  // External WO fields
  selected_grn_id?: number;
  selected_grn?: GRNData;
  customer_name?: string;
  customer_po?: string;
  // Media
  media_files: { id: string; type: "image" | "video"; url: string; name: string; }[];
}

// ─── BOM API shape ────────────────────────────────────────────────────────────

interface BomListItem {
  id: number;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  company: string;
  is_default: number;
  operating_cost?: number;
  total_cost?: number;
}

interface BomListResponse {
  success: number;
  data: { total: number; page: number; limit: number; records: BomListItem[] };
}

// Exact shape from your /bom/:id response
interface BomApiOperation {
  id: number;
  operation: string;
  workstation: string;
  workstation_type?: string;
  time_in_mins: number;
  hour_rate: number;
  operating_cost: number;
  source_warehouse?: string | null;
  wip_warehouse?: string | null;
  fg_warehouse?: string | null;
  
}

interface BomApiItem {
  id: number;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  stock_uom: string;
  source_warehouse?: string | null;
  rate: number;
  amount: number;
}

interface BomDetail {
  id: number;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  company: string;
  operating_cost?: number;
  total_cost?: number;
  default_source_warehouse?: string;
  default_target_warehouse?: string;
  item_Id?: number; // Add this line - it's optional since it might not always be present



}

interface BomDetailResponse {
  success: number;
  data: {
    bom: BomDetail;
    items: BomApiItem[];
    operations: BomApiOperation[];
  };
}

// ─── Warehouse API shape ──────────────────────────────────────────────────────

interface Warehouse {
  id: number;
  warehouse_name: string;
  company?: string | null;
}

interface WarehouseResponse {
  success: number;
  data: { records: Warehouse[] };
}

// ─── Operation master API shape (GET /operation) ─────────────────────────────
// Used only for External Work Orders: lets the user pick a defined
// operation (with its workstation + hour rate) rather than typing free text.

interface OperationMaster {
  id: number;
  name: string;
  workstationId: number;
  workstation_name: string;
  batch_size: number;
  total_operation_time: number;
  hour_rate: number;
  description: string | null;
}

interface OperationListResponse {
  success: number;
  data: OperationMaster[];
}

// ─── Job Card API shape ───────────────────────────────────────────────────────

interface JobCardRecord {
  id: number;
  work_order: string;
  production_item: string;
  for_quantity: number;
  bom_no: string;
  company: string;
  item_name: string;
  process_loss_qty: number;
  total_completed_qty: number;
  transferred_qty: number;
  manufactured_qty: number;
  source_warehouse: string | null;
  wip_warehouse: string | null;
  target_warehouse: string | null;
  status: string;
  [key: string]: any;
}

interface JobCardListResponse {
  success: number;
  data: JobCardRecord[];
}

interface JobCardDetailResponse {
  success: number;
  data: JobCardRecord;
}

// ─── Payload to POST ──────────────────────────────────────────────────────────

interface WOPayload {
  name: string;
  company: string;
  naming_series: string;
  production_item: string;
  bom_no: string;
  qty: number;
  sales_order: string;
  reserve_stock: number;
  max_producible_qty: number;
  material_transferred_for_manufacturing: number;
  additional_transferred_qty: number;
  produced_qty: number;
  process_loss_qty: number;
  disassembled_qty: number;
  source_warehouse: string;
  wip_warehouse: string;
  fg_warehouse: string;
  scrap_warehouse: string;
  transfer_material_against: string;
  allow_alternative_item: number;
  use_multi_level_bom: number;
  skip_transfer: number;
  from_wip_warehouse: number;
  update_consumed_material_cost_in_project: number;
  planned_start_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  lead_time: number;
  planned_operating_cost: number;
  actual_operating_cost: number;
  additional_operating_cost: number;
  corrective_operation_cost: number;
  total_operating_cost: number;
  image: string;
  item_name: string;
  stock_uom: string;
  description: string;
  has_serial_no: number;
  has_batch_no: number;
  batch_size: number;
  project: string;
  subcontracting_inward_order: string;
  production_plan: string;
  mps: string;
  material_request: string;
  material_request_item: string;
  subcontracting_inward_order_item: string;
  sales_order_item: string;
  production_plan_sub_assembly_item: string;
  production_plan_item: string;
  product_bundle_item: string;
  status: string;
  track_semi_finished_goods: number;
  amended_from: string;

  // External WO fields
  selected_grn_id?: number;
  order_type?: OrderType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const STATUS_OPTIONS: Status[] = ["Draft", "Not Started", "In Process", "Completed", "Stopped"];
const STATUS_CLASS: Record<Status, string> = {
  Draft: "s-draft",
  "Not Started": "s-notstarted",
  "In Process": "s-inprocess",
  Completed: "s-completed",
  Stopped: "s-stopped",
};

type TabKey = "production_item" | "configuration" | "total_produced" | "grn_selection";
const TABS: { key: TabKey; label: string }[] = [
  { key: "production_item", label: "Production Item" },
  { key: "configuration", label: "Configuration" },
  { key: "total_produced", label: "Total Produced" },
  { key: "grn_selection", label: "GRN Selection" },
];

const emptyOp = (): OperationRow => ({
  id: uid(), operation: "", workstation: "", time_in_mins: 0, hour_rate: 0, operating_cost: 0,
});
const emptyItem = (): RequiredItemRow => ({
  id: uid(), item_code: "", item_name: "", source_warehouse: "", required_qty: 0,
  uom: "", transferred_qty: 0, consumed_qty: 0, returned_qty: 0, rate: 0, amount: 0,
});
const emptyWO = (): WorkOrderData => ({
  name: "", status: "Draft",
  // order_type: "internal",
  company: "", qty_to_manufacture: 0, item_to_manufacture: "", item_name: "", stock_uom: "Nos",
  bom_no: "",
  material_transferred_for_manufacturing: 0, manufactured_qty: 0,
  additional_transferred_qty: 0, disassembled_qty: 0,
  source_warehouse: "", target_warehouse: "", wip_warehouse: "",
  transfer_material_against: "Work Order",
  operations: [emptyOp()],
  required_items: [emptyItem()],
  planned_start_date: new Date().toISOString().split("T")[0],
  actual_start_date: "", actual_end_date: "",
  lead_time_mins: 0, planned_operating_cost: 0, actual_operating_cost: 0,
  additional_operating_cost: 0, corrective_operation_cost: 0,
  comments: [], activity: [],
  items_produced_pct: 0, completed_operations: [],
  stock_entry_count: 0, job_card_count: 0, pick_list_count: 0,
  serial_no_count: 0, batch_count: 0, material_request_count: 0,
  media_files: [],
  type: "internal",
  item_id: ""
});

// ─── Custom DatePicker with Calendar ─────────────────────────────────────────

function DatePickerField({
  label, value, onChange, required = false, disabled = false,
  min, max, hint, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; disabled?: boolean; min?: string; max?: string;
  hint?: string; error?: string;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getMonth();
  });

  const handleDateSelect = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const formatted = date.toISOString().split("T")[0];
    onChange(formatted);
    setShowCalendar(false);
  };

  return (
    <div className="date-picker-field" ref={ref}>
      <label className="wof-label">{label}{required && <span className="wof-required"> *</span>}</label>
      <div className="date-picker-wrapper">
        <div className="date-picker-input-wrap">
          <FaCalendarAlt className="date-picker-icon" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowCalendar(true)}
            placeholder="Select date..."
            disabled={disabled}
            className={`form-field date-picker-input${error ? " field-error" : ""}`}
            readOnly
          />
          {value && !disabled && (
            <button
              type="button"
              className="date-picker-clear-btn"
              onClick={() => { onChange(""); setShowCalendar(false); }}
            >
              ×
            </button>
          )}
        </div>

        {showCalendar && !disabled && (
          <div className="date-picker-calendar">
            <div className="calendar-header">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear(viewYear - 1);
                  } else {
                    setViewMonth(viewMonth - 1);
                  }
                }}
              >
                ‹
              </button>
              <span className="calendar-month-year">
                {new Date(viewYear, viewMonth).toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear(viewYear + 1);
                  } else {
                    setViewMonth(viewMonth + 1);
                  }
                }}
              >
                ›
              </button>
            </div>
            <div className="calendar-weekdays">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {Array.from({ length: getFirstDayOfMonth(viewYear, viewMonth) }, (_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty" />
              ))}
              {Array.from({ length: getDaysInMonth(viewYear, viewMonth) }, (_, i) => {
                const day = i + 1;
                const dateObj = new Date(viewYear, viewMonth, day);
                const dateStr = dateObj.toISOString().split("T")[0];
                const isToday = dateStr === new Date().toISOString().split("T")[0];
                const isSelected = dateStr === value;
                const isDisabled = (min ? dateStr < min : false) || (max ? dateStr > max : false);

                return (
                  <button
                    key={day}
                    type="button"
                    className={`calendar-day${isSelected ? " selected" : ""}${isToday ? " today" : ""}${isDisabled ? " disabled" : ""}`}
                    onClick={() => !isDisabled && handleDateSelect(day)}
                    disabled={isDisabled}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="calendar-footer">
              <button
                type="button"
                className="calendar-today-btn"
                onClick={() => {
                  const today = new Date();
                  const formatted = today.toISOString().split("T")[0];
                  onChange(formatted);
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                  setShowCalendar(false);
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="calendar-clear-btn"
                onClick={() => { onChange(""); setShowCalendar(false); }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
      {hint && <span className="wof-hint">{hint}</span>}
      {error && <div className="wof-error-msg">{error}</div>}
    </div>
  );
}

// ─── WarehouseSearchField ─────────────────────────────────────────────────────

function WarehouseSearchField({
  label, value, onChange, required = false, disabled = false,
  placeholder = "Search warehouse…", hint, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; disabled?: boolean; placeholder?: string; hint?: string; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [all, setAll] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api.get<WarehouseResponse>("/warehouse")
      .then(r => { if (r.data.success === 1) setAll(r.data.data.records || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = term.trim()
    ? all.filter(w => w.warehouse_name.toLowerCase().includes(term.toLowerCase()))
    : all;

  return (
    <div className="warehouse-search-field" ref={ref}>
      <label className="wof-label">{label}{required && <span className="wof-required"> *</span>}</label>
      <div className="warehouse-search-wrapper">
        <div className="warehouse-search-input-wrap">
          <FaSearch className="warehouse-search-icon" />
          <input
            type="text"
            value={open ? term : value}
            onChange={e => { setTerm(e.target.value); onChange(e.target.value); setOpen(true); }}
            onFocus={() => { if (!disabled) { setTerm(""); setOpen(true); } }}
            onKeyDown={e => e.key === "Escape" && setOpen(false)}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={`form-field warehouse-search-input${error ? " field-error" : ""}`}
          />
          {loading && <FaSpinner className="warehouse-loading-spinner spinning" />}
          {value && !disabled && (
            <button type="button" className="warehouse-clear-btn"
              onClick={() => { onChange(""); setTerm(""); setOpen(false); }}>×</button>
          )}
        </div>
        {open && !disabled && (
          <div className="warehouse-dropdown">
            {filtered.length === 0
              ? <div className="warehouse-dropdown-empty">{term ? "No match" : "No warehouses"}</div>
              : <ul className="warehouse-dropdown-list">
                  {filtered.map(w => (
                    <li key={w.id}
                      className={`warehouse-dropdown-item${value === w.warehouse_name ? " selected" : ""}`}
                      onClick={() => { onChange(w.warehouse_name); setTerm(w.warehouse_name); setOpen(false); }}>
                      <div className="warehouse-item-name">{w.warehouse_name}</div>
                      {w.company && <div className="warehouse-item-company">{w.company}</div>}
                    </li>
                  ))}
                </ul>
            }
          </div>
        )}
      </div>
      {hint && <span className="wof-hint">{hint}</span>}
      {error && <div className="wof-error-msg">{error}</div>}
    </div>
  );
}

// ─── BomSearchField ───────────────────────────────────────────────────────────

function BomSearchField({
  value, onSelect, onClear, disabled = false, error,
}: {
  value: string; onSelect: (b: BomListItem) => void;
  onClear: () => void; disabled?: boolean; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [all, setAll] = useState<BomListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api.get<BomListResponse>("/bom?limit=100")
      .then(r => { if (r.data.success === 1) setAll(r.data.data.records || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = term.trim()
    ? all.filter(b =>
        b.item.toLowerCase().includes(term.toLowerCase()) ||
        b.item_name.toLowerCase().includes(term.toLowerCase()))
    : all;

  return (
    <div className="warehouse-search-field" ref={ref}>
      <label className="wof-label">BOM <span className="wof-required">*</span></label>
      <div className="warehouse-search-wrapper">
        <div className="warehouse-search-input-wrap">
          <FaSearch className="warehouse-search-icon" />
          <input
            type="text"
            value={open ? term : value}
            onChange={e => { setTerm(e.target.value); setOpen(true); }}
            onFocus={() => { if (!disabled) { setTerm(""); setOpen(true); } }}
            onKeyDown={e => e.key === "Escape" && setOpen(false)}
            placeholder="Search BOM by item code or name…"
            disabled={disabled || loading}
            className={`form-field warehouse-search-input${error ? " field-error" : ""}`}
          />
          {loading && <FaSpinner className="warehouse-loading-spinner spinning" />}
          {value && !disabled && (
            <button type="button" className="warehouse-clear-btn"
              onClick={() => { onClear(); setTerm(""); setOpen(false); }}>×</button>
          )}
        </div>
        {open && !disabled && (
          <div className="warehouse-dropdown">
            {filtered.length === 0
              ? <div className="warehouse-dropdown-empty">{term ? "No BOMs found" : "No BOMs"}</div>
              : <ul className="warehouse-dropdown-list">
                  {filtered.map(b => (
                    <li key={b.id} className="warehouse-dropdown-item"
                      onClick={() => { onSelect(b); setTerm(""); setOpen(false); }}>
                      <div className="warehouse-item-name">
                        {b.item_name} <span style={{ opacity: 0.6 }}>({b.item})</span>
                      </div>
                      <div className="warehouse-item-company">
                        Qty {b.quantity} {b.uom} · {b.company}{b.is_default ? " · Default" : ""}
                      </div>
                    </li>
                  ))}
                </ul>
            }
          </div>
        )}
      </div>
      <span className="wof-hint">Select a BOM to auto-fill operations and required items.</span>
      {error && <div className="wof-error-msg">{error}</div>}
    </div>
  );
}

// ─── OperationPickerField ─────────────────────────────────────────────────────
// Used for External Work Orders — lets the user choose a defined operation
// (GET /operation) instead of typing free text. Selecting one auto-fills
// the workstation, hour rate, and default time on the row.

// / ─── OperationPickerField (portal-based dropdown — same look, no clipping) ──
function OperationPickerField({
  value, operations, loading, onSelect, disabled = false,
}: {
  value: string;
  operations: OperationMaster[];
  loading?: boolean;
  onSelect: (op: OperationMaster) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = term.trim()
    ? operations.filter(o => o.name.toLowerCase().includes(term.toLowerCase()))
    : operations;

  const positionDropdown = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  const openDropdown = () => {
    if (disabled) return;
    positionDropdown();
    setOpen(true);
  };

  // Reposition on scroll/resize while open (table scroll container, window resize, etc.)
  useEffect(() => {
    if (!open) return;
    const handler = () => positionDropdown();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      const dropdownEl = document.getElementById("op-picker-portal-dropdown");
      if (dropdownEl?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="warehouse-search-field" ref={wrapRef}>
      <div className="warehouse-search-wrapper">
        <div className="warehouse-search-input-wrap">
          <FaSearch className="warehouse-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={open ? term : value}
            onChange={e => { setTerm(e.target.value); if (!open) openDropdown(); }}
            onFocus={openDropdown}
            onKeyDown={e => e.key === "Escape" && setOpen(false)}
            placeholder="Select operation…"
            disabled={disabled || loading}
            className="form-field form-field-sm warehouse-search-input"
          />
          {loading && <FaSpinner className="warehouse-loading-spinner spinning" />}
        </div>
      </div>

      {open && !disabled && coords && createPortal(
  <div
    id="op-picker-portal-dropdown"
    className="warehouse-dropdown"
    style={{
      position: "fixed",
      top: coords.top,
      left: coords.left,
      width: coords.width,
      zIndex: 5000,
      background: "#ffffff",
    }}
  
        >
          {filtered.length === 0
            ? <div className="warehouse-dropdown-empty">{term ? "No match" : "No operations found"}</div>
            : <ul className="warehouse-dropdown-list">
                {filtered.map(op => (
                  <li key={op.id} className="warehouse-dropdown-item"
                    onClick={() => { onSelect(op); setTerm(""); setOpen(false); }}>
                    <div className="warehouse-item-name">{op.name.trim()}</div>
                    <div className="warehouse-item-company">
                      {op.workstation_name} · ₹{op.hour_rate}/hr · {op.total_operation_time} min
                    </div>
                  </li>
                ))}
              </ul>
          }
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function WorkOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";

  const [wo, setWo] = useState<WorkOrderData>(emptyWO());
  const [activeTab, setActiveTab] = useState<TabKey>("production_item");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [newComment, setNewComment] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; label: string; message: string }[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  // Stock Warning Modal state
  const [stockWarningModal, setStockWarningModal] = useState<{
    show: boolean;
    message: string;
    itemName: string;
    woId?: number;
  }>({
    show: false,
    message: "",
    itemName: "",
    woId: undefined,
  });

  // ─── Work Order Completion summary state ───────────────────────────────
  // Populated when the status is switched to "Completed": we look up the
  // job card for this WO, pull produced-vs-scrap qty, persist the WO status,
  // and post the stock entry. The finished-goods inventory post is a
  // separate, manual step triggered by a button in the modal — it is never
  // fired automatically.
  const [completionSummary, setCompletionSummary] = useState<{
    show: boolean;
    loading: boolean;
    error: string | null;
    jobCardId?: number;
    totalCompletedQty?: number;
    processLossQty?: number;
    itemName?: string;
    woStatusUpdated?: boolean;
    stockEntryPosted?: boolean;
    inventoryPosting?: boolean;
    inventoryPosted?: boolean;
    inventoryError?: string | null;
    fgWarehouseId?: number;
    fgWarehouseName?: string;
  } | null>(null);

  // GRN state
  const [grnList, setGrnList] = useState<GRNData[]>([]);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnError, setGrnError] = useState<string | null>(null);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnDetailLoading, setGrnDetailLoading] = useState(false);

  // Operation master state (External WO — GET /operation)
  const [operationMasters, setOperationMasters] = useState<OperationMaster[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);

  // Material availability: what the GRN actually brought in, and where it's
  // sitting, compared against the full warehouse list. Populated once a GRN
  // is selected on an External Work Order.
  const [materialAvailability, setMaterialAvailability] = useState<
    { item_code: string; item_name: string; received_qty: number; uom: string; warehouse: string }[]
  >([]);
  const [availabilityWarehouse, setAvailabilityWarehouse] = useState<string>("");

  // BOM state
  const [selectedBomLabel, setSelectedBomLabel] = useState("");
  const [bomDetail, setBomDetail] = useState<{ bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] } | null>(null);
  const [bomLoading, setBomLoading] = useState(false);

  // Media upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const disabled = submitting || loading;

  // ─── Load GRNs (External type only) ───────────────────────────────────
  const loadGRNs = async (page = 1, limit = 10) => {
    setGrnLoading(true);
    setGrnError(null);
    try {
      const response = await api.get<GRNListResponse>(`/grn?page=${page}&limit=${limit}&type=External`);
      if (response.data?.success === 1) {
        setGrnList(response.data.data?.data || []);
      } else {
        setGrnList([]);
        setGrnError("Failed to load GRNs");
      }
    } catch (err) {
      console.error("Error loading GRNs:", err);
      setGrnList([]);
      setGrnError("Failed to load GRNs. Please check your connection and try again.");
    } finally {
      setGrnLoading(false);
    }
  };

  // ─── Load operation masters (External type only) ──────────────────────
  // Populates the operation picker so the user chooses "what operation we
  // have to do" from the real list instead of typing free text.
  const loadOperations = async () => {
    setOperationsLoading(true);
    try {
      const response = await api.get<OperationListResponse>("/operation");
      if (response.data?.success === 1) {
        setOperationMasters(response.data.data || []);
      }
    } catch (err) {
      console.error("Error loading operations:", err);
    } finally {
      setOperationsLoading(false);
    }
  };

  useEffect(() => {
    if (wo.type === "external") {
      loadGRNs();
      loadOperations();
      setActiveTab("grn_selection");
    }
  }, [wo.type]);

  // ─── Load existing WO ────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      api.get(`/work-order/${id}`).then(async (r) => {
        console.log("GET work-order response:", r.data); // <- check this shape
        
          if (r.data.success === 1) {
            const d = r.data.data;

            // Map the flat API response onto our WorkOrderData shape.
            // Field names differ between the API and the form state, so
            // each one is mapped explicitly rather than relying on a spread.
            setWo(prev => ({
              ...prev,
              id: d.id,
              name: d.name ?? prev.name,
              status: (d.status as Status) ?? prev.status,
              // order_type: d.selected_grn_id ? "external" : (d.order_type as OrderType) ?? prev.order_type,
              company: d.company ?? prev.company,
              qty_to_manufacture: d.qty ?? 0,
              item_to_manufacture: d.production_item ?? "",
              item_name: d.item_name ?? "",
              stock_uom: d.stock_uom ?? prev.stock_uom,
              bom_no: d.bom_no != null ? String(d.bom_no) : "",
              material_transferred_for_manufacturing: d.material_transferred_for_manufacturing ?? 0,
              manufactured_qty: d.produced_qty ?? 0,
              additional_transferred_qty: d.additional_transferred_qty ?? 0,
              disassembled_qty: d.disassembled_qty ?? 0,
              source_warehouse: d.source_warehouse ?? "",
              target_warehouse: d.fg_warehouse ?? "",
              wip_warehouse: d.wip_warehouse ?? "",
              transfer_material_against: (d.transfer_material_against as "Work Order" | "Job Card") ?? prev.transfer_material_against,
              planned_start_date: d.planned_start_date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
              actual_start_date: d.actual_start_date?.split("T")[0] ?? "",
              actual_end_date: d.actual_end_date?.split("T")[0] ?? "",
              lead_time_mins: d.lead_time ?? 0,
              planned_operating_cost: d.planned_operating_cost ?? 0,
              actual_operating_cost: d.actual_operating_cost ?? 0,
              additional_operating_cost: d.additional_operating_cost ?? 0,
              corrective_operation_cost: d.corrective_operation_cost ?? 0,
           
              selected_grn_id: d.selected_grn_id ?? undefined,
              // Operations / required items aren't returned by the WO API —
              // they get populated below from the linked BOM (internal) or
              // from the linked GRN (external, see the effect below).
              operations: prev.operations,
              required_items: prev.required_items,
            }));

            // External WO: re-hydrate the GRN detail + material availability
            // so re-opening a saved WO shows the same comparison.
            if (d.selected_grn_id) {
              try {
                const gr = await api.get<GRNDetailResponse>(`/grn/${d.selected_grn_id}`);
                if (gr.data.success === 1) {
                  await hydrateFromGrnDetail(gr.data.data);
                }
              } catch (e) {
                console.error("Failed to reload linked GRN detail:", e);
              }
            }

            // Fetch the linked BOM so we can show its label, operations,
            // and required items (scaled to the WO's saved qty).
            if (d.bom_no) {
              setSelectedBomLabel(d.item_name ? `${d.item_name} (${d.production_item})` : String(d.bom_no));
              setBomLoading(true);
              try {
                const br = await api.get<BomDetailResponse>(`/bom/${d.bom_no}`);
                if (br.data.success === 1) {
                  const detail = br.data.data;
                  setBomDetail(detail);
                  setSelectedBomLabel(`${detail.bom.item_name} (${detail.bom.item})`);

                  const base = detail.bom.quantity > 0 ? detail.bom.quantity : 1;
                  const qty = d.qty ?? 0;
                  const scale = qty > 0 ? qty / base : 0;

                  const ops: OperationRow[] = detail.operations.map(op => ({
                    id: uid(),
                    operation: op.operation,
                    workstation: op.workstation,
                    time_in_mins: Math.round(op.time_in_mins * scale * 100) / 100,
                    hour_rate: op.hour_rate,
                    operating_cost: Math.round(op.operating_cost * scale * 100) / 100,
                  }));

                  const items: RequiredItemRow[] = detail.items.map(it => ({
                    id: uid(),
                    item_code: it.item_code,
                    item_name: it.item_name,
                    source_warehouse: it.source_warehouse || detail.bom.default_source_warehouse || "",
                    required_qty: Math.round(it.qty * scale * 1000) / 1000,
                    uom: it.uom,
                    transferred_qty: 0,
                    consumed_qty: 0,
                    returned_qty: 0,
                    rate: it.rate || 0,
                    amount: Math.round((it.amount || 0) * scale * 100) / 100,
                  }));

                  // Note: lead_time_mins / planned_operating_cost are kept as
                  // saved on the WO record (set above) rather than being
                  // recalculated here, so edits made after WO creation aren't lost.
                  setWo(prev => ({
                    ...prev,
                    operations: ops.length ? ops : [emptyOp()],
                    required_items: items.length ? items : [emptyItem()],
                  }));
                }
              } catch {
                setApiError("Failed to load linked BOM details");
              } finally {
                setBomLoading(false);
              }
            }
          }
        })
        .catch(() => setApiError("Failed to load work order"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  // ─── BOM selection ───────────────────────────────────────────────────
  const handleSelectBom = (bom: BomListItem) => {
    setSelectedBomLabel(`${bom.item_name} (${bom.item})`);
    setWo(prev => ({
      ...prev,
      bom_no: String(bom.id),
      item_to_manufacture: bom.item,
      item_name: bom.item_name,
      stock_uom: bom.uom || prev.stock_uom,
      company: prev.company || bom.company,
    }));
    setBomDetail(null);
    setBomLoading(true);
    api.get<BomDetailResponse>(`/bom/${bom.id}`)
      .then(r => {
        if (r.data.success === 1) {
          const detail = r.data.data;
          setBomDetail(detail);
          setWo(prev => ({
            ...prev,
            source_warehouse: prev.source_warehouse || detail.bom.default_source_warehouse || "",
            target_warehouse: prev.target_warehouse || detail.bom.default_target_warehouse || "",
          }));
          applyBomToWo(detail, wo.qty_to_manufacture || bom.quantity);
        }
      })
      .catch(() => setApiError("Failed to load BOM details"))
      .finally(() => setBomLoading(false));
  };

  const handleClearBom = () => {
    setSelectedBomLabel("");
    setBomDetail(null);
    setWo(prev => ({
      ...prev,
      bom_no: "", item_to_manufacture: "", item_name: "",
      operations: [emptyOp()], required_items: [emptyItem()],
      lead_time_mins: 0, planned_operating_cost: 0,
    }));
  };

  // ─── Apply BOM data to WO rows (with qty scaling) ────────────────────
  const applyBomToWo = (
    detail: { bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] },
    qty: number
  ) => {
    const base = detail.bom.quantity > 0 ? detail.bom.quantity : 1;
    const scale = qty > 0 ? qty / base : 0;

    const ops: OperationRow[] = detail.operations.map(op => ({
      id: uid(),
      operation: op.operation,
      workstation: op.workstation,
      time_in_mins: Math.round(op.time_in_mins * scale * 100) / 100,
      hour_rate: op.hour_rate,
      operating_cost: Math.round(op.operating_cost * scale * 100) / 100,
    }));

    const items: RequiredItemRow[] = detail.items.map(it => ({
      id: uid(),
      item_code: it.item_code,
      item_name: it.item_name,
      source_warehouse: it.source_warehouse || detail.bom.default_source_warehouse || "",
      required_qty: Math.round(it.qty * scale * 1000) / 1000,
      uom: it.uom,
      transferred_qty: 0,
      consumed_qty: 0,
      returned_qty: 0,
      rate: it.rate || 0,
      amount: Math.round((it.amount || 0) * scale * 100) / 100,
    }));

    const totalTime = ops.reduce((s, o) => s + o.time_in_mins, 0);
    const totalCost = ops.reduce((s, o) => s + o.operating_cost, 0);

    setWo(prev => ({
      ...prev,
      operations: ops.length ? ops : [emptyOp()],
      required_items: items.length ? items : [emptyItem()],
      lead_time_mins: Math.round(totalTime * 100) / 100,
      planned_operating_cost: Math.round(totalCost * 100) / 100,
    }));
  };

  // Re-scale when qty changes and BOM is loaded (internal WOs only)
  useEffect(() => {
    if (wo.type === "internal" && bomDetail && wo.qty_to_manufacture > 0) {
      applyBomToWo(bomDetail, wo.qty_to_manufacture);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo.qty_to_manufacture]);

  // ─── GRN → Required Items + material availability ─────────────────────
  // Shared by both the live "select a GRN" flow and re-hydration when
  // reopening a saved External WO. Given a full GRN detail record:
  //   1. Populate the Required Items table from the GRN's item lines
  //      (received_qty is what actually came in, not what was ordered).
  //   2. Set the source warehouse to wherever the GRN was received into.
  //   3. Cross-check that warehouse against /warehouse and build the
  //      "material we have" comparison shown in the GRN Selection tab.
  const hydrateFromGrnDetail = async (detail: GRNDetail) => {
    // Some GRN item lines come back with item_code/item_name as null (the
    // item master lookup wasn't joined server-side) — only item_id is
    // reliable in that case. Fall back to an item_id-based label so the
    // row is still usable and identifiable rather than showing "null".
    const codeOf = (it: GRNItemDetail) => it.item_code || `ITEM-${it.item_id}`;
    const nameOf = (it: GRNItemDetail) => it.item_name || `Unnamed item (ID ${it.item_id})`;

    const items: RequiredItemRow[] = (detail.items || []).map(it => ({
      id: uid(),
      item_code: codeOf(it),
      item_name: nameOf(it),
      source_warehouse: detail.warehouse_name || "",
      required_qty: it.received_qty,
      uom: it.uom,
      transferred_qty: 0,
      consumed_qty: 0,
      returned_qty: 0,
      rate: it.rate || 0,
      amount: it.amount || 0,
    }));

    setWo(prev => ({
      ...prev,
      required_items: items.length ? items : prev.required_items,
      source_warehouse: detail.warehouse_name || prev.source_warehouse,
    }));

    // Confirm the GRN's warehouse actually exists in /warehouse, and use
    // that as the definitive "where is this material" label.
    try {
      const whRes = await api.get<WarehouseResponse>("/warehouse");
      const warehouses = whRes.data?.data?.records || [];
      const match = warehouses.find(w => w.id === detail.warehouse_id);
      const warehouseName = match?.warehouse_name || detail.warehouse_name || "Unknown warehouse";
      setAvailabilityWarehouse(warehouseName);

      setMaterialAvailability(
        (detail.items || []).map(it => ({
          item_code: codeOf(it),
          item_name: nameOf(it),
          received_qty: it.received_qty,
          uom: it.uom,
          warehouse: warehouseName,
        }))
      );
    } catch (e) {
      console.error("Error loading warehouse list for availability check:", e);
    }

    // Make sure the operation master list is on hand as soon as material
    // from the GRN is loaded, so the Operations To Perform picker on the
    // GRN Selection tab has options immediately — not just whenever the
    // order type happened to switch earlier.
    if (operationMasters.length === 0 && !operationsLoading) {
      loadOperations();
    }
  };

  // ─── GRN Selection ────────────────────────────────────────────────────
  // Selecting a GRN in the picker fetches the FULL detail record (the list
  // endpoint only has summary counts), then populates the material table
  // and availability comparison via hydrateFromGrnDetail above.
  const handleSelectGRN = async (grn: GRNData) => {
    setShowGrnModal(false);
    setWo(prev => ({
      ...prev,
      selected_grn_id: grn.id,
      selected_grn: grn,
      customer_name: grn.customer_name || grn.party_name || prev.customer_name,
      customer_po: grn.delivery_challan_no || prev.customer_po,
    }));

    setGrnDetailLoading(true);
    setGrnError(null);
    try {
      const res = await api.get<GRNDetailResponse>(`/grn/${grn.id}`);
      if (res.data?.success === 1) {
        await hydrateFromGrnDetail(res.data.data);
      } else {
        setApiError("Failed to load GRN item details");
      }
    } catch (err) {
      console.error("Error loading GRN detail:", err);
      setApiError("Failed to load GRN item details");
    } finally {
      setGrnDetailLoading(false);
    }
  };

  // ─── Media Upload ─────────────────────────────────────────────────────
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);   // <-- change media -> file
    }

    formData.append("itemID", String(wo.id)); // or whatever your item id is
    formData.append("type", "item");

    try {
      const response = await api.post("/uploadmedia", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.success === 1) {
        const uploadedFiles = response.data.data || [];
        setWo(prev => ({
          ...prev,
          media_files: [...prev.media_files, ...uploadedFiles],
        }));
      }
    } catch (err) {
      console.error("Error uploading media:", err);
      setApiError("Failed to upload media files");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── Work Order Completion: job card lookup → WO update → stock entry ──
  // Triggered when the status is set to "Completed". Sequence:
  //   1. GET /job-card, find the record whose work_order matches this WO
  //      and whose status is "Completed".
  //   2. GET /job-card/:id for the full detail (gives total_completed_qty
  //      and process_loss_qty — the end product vs. scrap split).
  //   3. Persist the "Completed" status onto the Work Order record itself
  //      (POST /work-order) so the change isn't lost until the form is saved.
  //   4. Resolve the "Finished Goods" warehouse from /warehouse.
  //   5. POST /stock-entry to move the produced qty from WIP to Finished Goods.
  // Posting to /inventory is NOT done here — it's a manual step the user
  // triggers via a button once they've reviewed the numbers (see
  // handlePostInventory below).
  const handleWorkOrderCompletion = async () => {
    if (!wo.id) return;
    setCompletionSummary({ show: true, loading: true, error: null });
  
    try {
      // 1. Find the job card belonging to this Work Order that's Completed
      const jcListRes = await api.get<JobCardListResponse>("/job-card");
      const jobCards = jcListRes.data?.data || [];
      const matched = jobCards.find(
        (jc) => String(jc.work_order) === String(wo.id) && jc.status === "Completed"
      );
  
      if (!matched) {
        setCompletionSummary({
          show: true,
          loading: false,
          error: "No completed job card found for this Work Order yet.",
        });
        return;
      }
  
      // 2. Pull the full job card detail (gives us process_loss_qty / total_completed_qty)
      const jcDetailRes = await api.get<JobCardDetailResponse>(`/job-card/${matched.id}`);
      const jc = jcDetailRes.data?.data;
      if (!jc) {
        setCompletionSummary({ show: true, loading: false, error: "Failed to load job card details." });
        return;
      }
  
      const totalCompletedQty = jc.total_completed_qty ?? 0;
      const processLossQty = jc.process_loss_qty ?? 0;
  
      // Show the produced-vs-scrap breakdown immediately
      setCompletionSummary({
        show: true,
        loading: false,
        error: null,
        jobCardId: jc.id,
        totalCompletedQty,
        processLossQty,
        itemName: jc.item_name,
        woStatusUpdated: false,
        stockEntryPosted: false,
        inventoryPosted: false,
        inventoryPosting: false,
        inventoryError: null,
      });
  
      // 3. Persist the Completed status onto the Work Order record
      try {
        await api.put("/work-order", { ...buildPayload("Completed"), id: wo.id });
        setCompletionSummary(prev => (prev ? { ...prev, woStatusUpdated: true } : prev));
      } catch (woErr) {
        console.error("Error updating work order status:", woErr);
        // Non-fatal — still proceed to show job card numbers / stock entry,
        // but surface it so the user knows the WO record wasn't saved.
        setCompletionSummary(prev => (prev
          ? { ...prev, woStatusUpdated: false, error: "Job card fetched, but failed to update the Work Order status. Your other changes here are still shown." }
          : prev));
      }
  
      // 4. Resolve the Finished Goods warehouse id (kept for the manual
      // inventory-post button below)
      const whRes = await api.get<WarehouseResponse>("/warehouse");
      const warehouses: Warehouse[] = whRes.data?.data?.records || [];
      const fgWarehouse = warehouses.find(w => w.warehouse_name === "Finished Goods");
      setCompletionSummary(prev => (prev
        ? { ...prev, fgWarehouseId: fgWarehouse?.id, fgWarehouseName: fgWarehouse?.warehouse_name }
        : prev));
  
      // 5. Post the stock entry (Manufacture, WIP -> Finished Goods)
      await api.post("/stock-entry", {
        name: "",
        company: wo.company || "SculptorTech",
        naming_series: "STE-.YYYY.-",
        stock_entry_type: "Manufacture",
        purpose: "Manufacture",
        set_posting_time: 1,
        posting_date: new Date().toISOString().split("T")[0],
        posting_time: new Date().toTimeString().split(" ")[0],
        add_to_transit: 0,
        apply_putaway_rule: 1,
        inspection_required: 0,
        work_order: String(wo.id),
        subcontracting_order: "",
        outgoing_stock_entry: "",
        source_stock_entry: "",
        from_bom: 1,
        use_multi_level_bom: 1,
        bom_no: wo.bom_no,
        fg_completed_qty: totalCompletedQty,
        process_loss_percentage:
          wo.qty_to_manufacture > 0
            ? Math.round((processLossQty / wo.qty_to_manufacture) * 10000) / 100
            : 0,
        process_loss_qty: processLossQty,
        from_warehouse: wo.wip_warehouse || "",
        source_warehouse_address: "",
        source_address_display: "",
        to_warehouse: fgWarehouse?.warehouse_name || wo.target_warehouse || "Finished Goods",
        target_warehouse_address: "",
        target_address_display: "",
        scan_barcode: "",
        total_outgoing_value: 0,
        total_incoming_value: 0,
        value_difference: 0,
        total_additional_costs: 0,
        supplier: "",
        supplier_name: "",
        supplier_address: "",
        address_display: "",
        project: "",
        cost_center: "",
        select_print_heading: "Stock Entry",
        letter_head: "",
        delivery_note_no: "",
        sales_invoice_no: "",
        job_card: String(jc.id),
        pick_list: "",
        asset_repair: "",
        purchase_receipt_no: "",
        purchase_order: "",
        subcontracting_inward_order: "",
        is_additional_transfer_entry: 0,
        is_opening: "No",
        remarks: `Auto-posted on completion of Work Order #${wo.id}`,
        per_transferred: 100,
        total_amount: 0,
        amended_from: "",
        credit_note: "",
        is_return: 0,
      });
  
      setCompletionSummary(prev => (prev ? { ...prev, stockEntryPosted: true } : prev));
    } catch (err: any) {
      console.error("Error processing work order completion:", err);
      setCompletionSummary(prev => ({
        show: true,
        loading: false,
        error: err.response?.data?.message || "Failed to process completion.",
        ...(prev ? {
          jobCardId: prev.jobCardId,
          totalCompletedQty: prev.totalCompletedQty,
          processLossQty: prev.processLossQty,
          itemName: prev.itemName,
          woStatusUpdated: prev.woStatusUpdated,
          stockEntryPosted: prev.stockEntryPosted,
        } : {}),
      }));
    }
  };

  // ─── Manual step: push the produced qty into Finished Goods inventory ──
  // Only runs when the user clicks the "Post to Inventory" button in the
  // completion modal — never automatically.
 // ─── Manual step: push the produced qty into Finished Goods inventory ──
// Only runs when the user clicks the "Post to Inventory" button in the
// completion modal — never automatically.
// ─── Manual step: push the produced qty into Finished Goods inventory ──
// Only runs when the user clicks the "Post to Inventory" button in the
// completion modal — never automatically.
const handlePostInventory = async () => {
  if (!completionSummary || completionSummary.totalCompletedQty === undefined) return;
  if (!completionSummary.fgWarehouseId) {
    setCompletionSummary(prev => (prev ? { ...prev, inventoryError: "Finished Goods warehouse not found." } : prev));
    return;
  }

  setCompletionSummary(prev => (prev ? { ...prev, inventoryPosting: true, inventoryError: null } : prev));

  try {
    // Get the item_Id from the BOM detail
    const itemId = bomDetail?.bom?.item_Id || 62; // Fallback to 62 if not found
    
    await api.post("/inventory", {
      name: `INV-${wo.item_to_manufacture}-${Date.now()}`,
      item_Id: itemId, // Now passing the correct item_Id (62)
      item_code: wo.item_to_manufacture,
      warehouse_Id: completionSummary.fgWarehouseId,
      actual_qty: completionSummary.totalCompletedQty,
      planned_qty: 0,
      indented_qty: 0,
      ordered_qty: 0,
      reserved_qty: 0,
      reserved_qty_for_production: 0,
      reserved_qty_for_sub_contract: 0,
      reserved_qty_for_production_plan: 0,
      reserved_stock: 0,
      stock_uom: wo.stock_uom,
      company: wo.company || "SculptorTech",
      valuation_rate: 0,
      modified_by: "Administrator",
      type: "Internal",
    });

    setCompletionSummary(prev => (prev ? { ...prev, inventoryPosting: false, inventoryPosted: true } : prev));
  } catch (err: any) {
    console.error("Error posting finished-goods inventory:", err);
    setCompletionSummary(prev => (prev
      ? { ...prev, inventoryPosting: false, inventoryError: err.response?.data?.message || "Failed to post inventory." }
      : prev));
  }
};

  // ─── Field helpers ────────────────────────────────────────────────────
  const set = <K extends keyof WorkOrderData>(k: K, v: WorkOrderData[K]) =>
    setWo(prev => ({ ...prev, [k]: v }));

  const updateOp = (rowId: string, field: keyof OperationRow, value: string | number) =>
    setWo(prev => ({ ...prev, operations: prev.operations.map(o => o.id === rowId ? { ...o, [field]: value } : o) }));

  const updateItem = (rowId: string, field: keyof RequiredItemRow, value: string | number) =>
    setWo(prev => ({ ...prev, required_items: prev.required_items.map(r => r.id === rowId ? { ...r, [field]: value } : r) }));

  // ─── Availability lookup for a given item code (used in Required Items
  // table so the user can see "available: X" next to what they're editing) ──
  const availabilityFor = (itemCode: string) =>
    materialAvailability.find(m => m.item_code === itemCode);

  // ─── Validation ───────────────────────────────────────────────────────
  const validate = () => {
    const errs: { field: string; label: string; message: string }[] = [];
    if (wo.type === "internal" && !wo.bom_no.trim()) errs.push({ field: "bom_no", label: "BOM", message: "Please select a BOM" });
    if (wo.type === "external" && !wo.selected_grn_id) errs.push({ field: "selected_grn_id", label: "GRN", message: "Please select a GRN" });
    if (!wo.item_to_manufacture.trim() && wo.type === "internal") errs.push({ field: "item_to_manufacture", label: "Item To Manufacture", message: "Required" });
    if (wo.qty_to_manufacture <= 0 && wo.type === "internal") errs.push({ field: "qty_to_manufacture", label: "Qty To Manufacture", message: "Must be > 0" });
    if (!wo.target_warehouse.trim()) errs.push({ field: "target_warehouse", label: "Target Warehouse (FG)", message: "Required" });
    if (!wo.wip_warehouse.trim()) errs.push({ field: "wip_warehouse", label: "WIP Warehouse", message: "Required" });
    if (!wo.planned_start_date) errs.push({ field: "planned_start_date", label: "Planned Start Date", message: "Required" });
    return errs;
  };

  // ─── Build payload ────────────────────────────────────────────────────
  const buildPayload = (overrideStatus?: Status): WOPayload => ({
    name: wo.name || "sc",
    company: wo.company || "SculptorTech",
    naming_series: "WO-.YYYY.-",
    production_item: wo.item_to_manufacture,
    bom_no: wo.bom_no,
    qty: wo.qty_to_manufacture,
    sales_order: "",
    reserve_stock: 0,
    max_producible_qty: wo.qty_to_manufacture,
    material_transferred_for_manufacturing: wo.material_transferred_for_manufacturing,
    additional_transferred_qty: wo.additional_transferred_qty,
    produced_qty: wo.manufactured_qty,
    process_loss_qty: 0,
    disassembled_qty: wo.disassembled_qty,
    source_warehouse: wo.source_warehouse,
    wip_warehouse: wo.wip_warehouse,
    fg_warehouse: wo.target_warehouse,
    scrap_warehouse: "",
    transfer_material_against: wo.transfer_material_against,
    allow_alternative_item: 0,
    use_multi_level_bom: 1,
    skip_transfer: 0,
    from_wip_warehouse: 0,
    update_consumed_material_cost_in_project: 0,
    planned_start_date: wo.planned_start_date,
    actual_start_date: wo.actual_start_date || null,
    actual_end_date: wo.actual_end_date || null,
    lead_time: wo.lead_time_mins,
    planned_operating_cost: wo.planned_operating_cost,
    actual_operating_cost: wo.actual_operating_cost,
    additional_operating_cost: wo.additional_operating_cost,
    corrective_operation_cost: wo.corrective_operation_cost,
    total_operating_cost: wo.planned_operating_cost + wo.corrective_operation_cost + wo.additional_operating_cost,
    image: "",
    item_name: wo.item_name,
    stock_uom: wo.stock_uom,
    description: "",
    has_serial_no: 0,
    has_batch_no: 0,
    batch_size: wo.qty_to_manufacture,
    project: "",
    subcontracting_inward_order: "",
    production_plan: "",
    mps: "",
    material_request: "",
    material_request_item: "",
    subcontracting_inward_order_item: "",
    sales_order_item: "",
    production_plan_sub_assembly_item: "",
    production_plan_item: "",
    product_bundle_item: "",
    status: overrideStatus ?? wo.status,
    track_semi_finished_goods: 0,
    amended_from: "",

    // Pass the order type through so External WOs are tagged as such on
    // the backend record, and carry the linked GRN id along with it.
    // order_type: wo.order_type,
    selected_grn_id: wo.selected_grn_id,
  });

  // ─── Submit ───────────────────────────────────────────────────────────
 // ─── Submit ───────────────────────────────────────────────────────────
 const handleSave = async (e: FormEvent) => {
  e.preventDefault();
  setApiError(null);
  const errs = validate();
  if (errs.length) {
    setValidationErrors(errs);
    setShowValidation(true);
    if (["bom_no","item_to_manufacture","qty_to_manufacture","target_warehouse","wip_warehouse"].some(f => errs.find(e => e.field === f)))
      setActiveTab("production_item");
    else if (errs.find(e => e.field === "planned_start_date"))
      setActiveTab("configuration");
    else if (errs.find(e => e.field === "selected_grn_id"))
      setActiveTab("grn_selection");
    return;
  }
  setSubmitting(true);
  try {
    let response;

    // Determine if this is a create or update based on whether we have an ID
    const isUpdate = !isNew && wo.id !== undefined && wo.id !== null;

    if (isUpdate) {
      // UPDATE: Use PUT with ID in the payload body
      const updatePayload = {
        ...buildPayload(),
        id: wo.id, // Pass the ID in the payload body
      };

      console.log("🔄 Updating Work Order with ID:", wo.id);
      console.log("Update Payload:", updatePayload);

      response = await api.put("/work-order", updatePayload);

      if (response.data?.success === 1) {
        const workOrderId = wo.id;
        try {
          const jobCardResponse = await api.post(`/job-card/create-job-cards-from-wo/${workOrderId}`);
          if (jobCardResponse.data?.success === 0) {
            const errorMessage = jobCardResponse.data?.message || "";
            if (errorMessage.toLowerCase().includes("insufficient stock") ||
                errorMessage.toLowerCase().includes("insufficient material")) {
              const itemMatch = errorMessage.match(/for\s+([A-Z0-9\-_]+)/i);
              const itemName = itemMatch ? itemMatch[1] : "material";

              setStockWarningModal({
                show: true,
                message: `Work Order has been updated but remains in "Draft" status due to insufficient stock of "${itemName}". Please check your inventory levels and update the Work Order when stock is available.`,
                itemName: itemName,
                woId: workOrderId,
              });

              setWo(prev => ({ ...prev, status: "Draft" }));
              setSubmitting(false);
              return;
            }
          } else if (jobCardResponse.data?.success === 1) {
            console.log("✅ Job cards updated successfully");
          }
        } catch (jobCardErr: any) {
          const errorData = jobCardErr?.response?.data;
          if (errorData?.success === 0 &&
              (errorData?.message?.toLowerCase().includes("insufficient stock") ||
               errorData?.message?.toLowerCase().includes("insufficient material"))) {
            const itemMatch = errorData.message.match(/for\s+([A-Z0-9\-_]+)/i);
            const itemName = itemMatch ? itemMatch[1] : "material";

            setStockWarningModal({
              show: true,
              message: `Work Order has been updated but remains in "Draft" status due to insufficient stock of "${itemName}". Please check your inventory levels and update the Work Order when stock is available.`,
              itemName: itemName,
              woId: workOrderId,
            });

            setWo(prev => ({ ...prev, status: "Draft" }));
            setSubmitting(false);
            return;
          }
          console.error("❌ Error creating job cards for update:", jobCardErr);
        }
        navigate("/work-order");
      } else {
        setApiError(response.data?.message || "Failed to update work order");
      }
    } else {
      // CREATE: Use POST for new work order (no ID needed)
      console.log("✨ Creating new Work Order, type:", wo.type);
      response = await api.post("/work-order", buildPayload());

      if (response.data?.success === 1) {
        const insertId = response.data?.data?.workOrder?.insertId;
        if (insertId) {
          try {
            const jobCardResponse = await api.post(`/job-card/create-job-cards-from-wo/${insertId}`);
            // Check if job card creation failed due to insufficient stock
            if (jobCardResponse.data?.success === 0) {
              const errorMessage = jobCardResponse.data?.message || "";

              // Check if the error is about insufficient stock
              if (errorMessage.toLowerCase().includes("insufficient stock") ||
                  errorMessage.toLowerCase().includes("insufficient material")) {
                // Extract the item name from the error message
                const itemMatch = errorMessage.match(/for\s+([A-Z0-9\-_]+)/i);
                const itemName = itemMatch ? itemMatch[1] : "material";

                // Show the warning modal instead of API error
                setStockWarningModal({
                  show: true,
                  message: `Work Order has been created but remains in "Draft" status due to insufficient stock of "${itemName}". Please check your inventory levels and update the Work Order when stock is available.`,
                  itemName: itemName,
                  woId: insertId,
                });

                // Update the WO status to "Draft"
                setWo(prev => ({ ...prev, status: "Draft" }));

                setSubmitting(false);
                return; // Exit early, don't navigate
              } else {
                console.warn("⚠️ Job card creation returned non-success:", errorMessage);
              }
            } else if (jobCardResponse.data?.success === 1) {
              console.log("✅ Job cards created successfully");
            }
          } catch (jobCardErr: any) {
            // Check if the error response contains stock-related message
            const errorData = jobCardErr?.response?.data;
            if (errorData?.success === 0 &&
                (errorData?.message?.toLowerCase().includes("insufficient stock") ||
                 errorData?.message?.toLowerCase().includes("insufficient material"))) {
              const itemMatch = errorData.message.match(/for\s+([A-Z0-9\-_]+)/i);
              const itemName = itemMatch ? itemMatch[1] : "material";

              setStockWarningModal({
                show: true,
                message: `Work Order has been created but remains in "Draft" status due to insufficient stock of "${itemName}". Please check your inventory levels and update the Work Order when stock is available.`,
                itemName: itemName,
                woId: insertId,
              });

              setWo(prev => ({ ...prev, status: "Draft" }));
              setSubmitting(false);
              return;
            }
            console.error("❌ Error creating job cards:", jobCardErr);
          }
        }
        navigate("/work-order");
      } else {
        setApiError(response.data?.message || "Failed to create work order");
      }
    }
  } catch (err: any) {
    console.error("Error saving work order:", err);
    // Check if the error response contains stock-related message
    const errorData = err?.response?.data;
    if (errorData?.success === 0 &&
        (errorData?.message?.toLowerCase().includes("insufficient stock") ||
         errorData?.message?.toLowerCase().includes("insufficient material"))) {
      const itemMatch = errorData.message.match(/for\s+([A-Z0-9\-_]+)/i);
      const itemName = itemMatch ? itemMatch[1] : "material";

      setStockWarningModal({
        show: true,
        message: `Work Order ${isNew ? 'creation' : 'update'} failed due to insufficient stock of "${itemName}". Please check your inventory levels and try again.`,
        itemName: itemName,
        woId: isNew ? undefined : wo.id,
      });

      setSubmitting(false);
      return;
    }
    setApiError(err.response?.data?.message || "Network error. Please try again.");
  } finally {
    setSubmitting(false);
  }
};
  // Handle closing the stock warning modal - navigates to work order list
  const handleCloseStockWarning = () => {
    setStockWarningModal({ show: false, message: "", itemName: "", woId: undefined });
    navigate("/work-order");
  };

  // Calculate total raw material cost
  const totalRawMaterialCost = wo.required_items.reduce((sum, item) => sum + (item.amount || 0), 0);

  if (loading) {
    return (
      <div className={`wof-page ${theme}`}>
        <div className="wof-inner wof-loading"><FaSpinner className="spinning" /> Loading…</div>
      </div>
    );
  }

  return (
    <div className={`wof-page ${theme}`}>
      <div className="wof-inner">

        {/* Validation modal */}
        {showValidation && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidation(false)}>
            <div className="validation-summary-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2><FaExclamationTriangle /> Missing Required Fields</h2>
                <button className="modal-close" onClick={() => setShowValidation(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="validation-errors-list">
                  {validationErrors.map((e, i) => (
                    <div key={i} className="validation-error-item">
                      <div className="error-header"><FaTimesCircle className="error-icon" /><strong>{e.label}</strong></div>
                      <div className="error-message">{e.message}</div>
                    </div>
                  ))}
                </div>
                <div className="validation-tip"><FaInfoCircle className="tip-icon" /> Fix the errors above before submitting</div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidation(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Warning Modal - Compulsory to close before navigating */}
        {stockWarningModal.show && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="stock-warning-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ backgroundColor: "#fef3c7", borderBottom: "2px solid #f59e0b" }}>
                <h2 style={{ color: "#92400e", display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaExclamationTriangle style={{ color: "#d97706", fontSize: "24px" }} />
                  Insufficient Stock Warning
                </h2>
                <button className="modal-close" onClick={handleCloseStockWarning}>×</button>
              </div>
              <div className="modal-body" style={{ padding: "24px" }}>
                <div style={{
                  backgroundColor: "#fffbeb",
                  borderLeft: "4px solid #f59e0b",
                  padding: "16px",
                  borderRadius: "4px",
                  marginBottom: "16px"
                }}>
                  <p style={{
                    fontSize: "16px",
                    color: "#78350f",
                    margin: 0,
                    lineHeight: "1.6"
                  }}>
                    {stockWarningModal.message}
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0"
                }}>
                  <FaInfoCircle style={{ color: "#3b82f6", fontSize: "18px" }} />
                  <span style={{ fontSize: "14px", color: "#475569" }}>
                    Please check your inventory and update the Work Order when stock is available.
                  </span>
                </div>

                {stockWarningModal.woId && (
                  <div style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "4px",
                    fontSize: "13px",
                    color: "#64748b"
                  }}>
                    Work Order ID: #{stockWarningModal.woId}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ justifyContent: "center", padding: "16px 24px" }}>
                <button
                  className="submit-btn"
                  onClick={handleCloseStockWarning}
                  style={{
                    backgroundColor: "#f59e0b",
                    borderColor: "#f59e0b",
                    padding: "10px 32px",
                    fontSize: "15px"
                  }}
                >
                  <FaCheckCircle size={14} style={{ marginRight: "8px" }} />
                  I Understand, Go to Work Orders
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Work Order Completion Summary Modal:
            shown when status is switched to "Completed". Fetches the job
            card for this WO, persists the Completed status onto the Work
            Order, displays end-product vs. scrap qty, and posts the stock
            entry. Posting to Finished Goods inventory is a manual step —
            the button below only fires when the user clicks it. */}
        {completionSummary?.show && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="stock-warning-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ backgroundColor: "#dcfce7", borderBottom: "2px solid #16a34a" }}>
                <h2 style={{ color: "#166534", display: "flex", alignItems: "center", gap: 10 }}>
                  <FaCheckCircle style={{ color: "#16a34a" }} /> Work Order Completion
                </h2>
                <button className="modal-close" onClick={() => setCompletionSummary(null)}>×</button>
              </div>
              <div className="modal-body" style={{ padding: 24 }}>
                {completionSummary.loading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FaSpinner className="spinning" /> Fetching job card & updating Work Order…
                  </div>
                ) : completionSummary.error && completionSummary.totalCompletedQty === undefined ? (
                  <div style={{ color: "#b91c1c" }}>{completionSummary.error}</div>
                ) : (
                  <>
                    {completionSummary.error && (
                      <div style={{
                        color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d",
                        borderRadius: 6, padding: "8px 12px", marginBottom: 14, fontSize: 13,
                      }}>
                        <FaExclamationTriangle style={{ marginRight: 6 }} />
                        {completionSummary.error}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 12, color: "#166534" }}>End Product</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#166534" }}>
                          {completionSummary.totalCompletedQty}
                        </div>
                      </div>
                      <div style={{ flex: 1, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 12, color: "#991b1b" }}>Scrap / Loss</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#991b1b" }}>
                          {completionSummary.processLossQty}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                      Job Card #{completionSummary.jobCardId} · {completionSummary.itemName}
                    </div>

                    {/* Progress checklist */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, marginBottom: 16 }}>
                      <div style={{ color: completionSummary.woStatusUpdated ? "#166534" : "#94a3b8" }}>
                        <FaCheckCircle style={{ marginRight: 6 }} />
                        Work Order status updated to Completed
                      </div>
                      <div style={{ color: completionSummary.stockEntryPosted ? "#166534" : "#94a3b8" }}>
                        <FaCheckCircle style={{ marginRight: 6 }} />
                        Stock entry posted (WIP → Finished Goods)
                      </div>
                      <div style={{ color: completionSummary.inventoryPosted ? "#166534" : "#94a3b8" }}>
                        <FaCheckCircle style={{ marginRight: 6 }} />
                        Finished-goods inventory posted
                      </div>
                    </div>

                    {completionSummary.inventoryError && (
                      <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>
                        {completionSummary.inventoryError}
                      </div>
                    )}

                    {/* Manual inventory post — only fires on click */}
                    {completionSummary.stockEntryPosted && !completionSummary.inventoryPosted && (
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={handlePostInventory}
                        disabled={completionSummary.inventoryPosting}
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {completionSummary.inventoryPosting
                          ? <><FaSpinner className="spinning" /> Posting to Inventory…</>
                          : <>Post {completionSummary.totalCompletedQty} {wo.stock_uom} to Finished Goods Inventory</>}
                      </button>
                    )}

                    {completionSummary.inventoryPosted && (
                      <div style={{ color: "#166534", fontSize: 13 }}>
                        <FaCheckCircle /> Finished-goods inventory updated.
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer" style={{ justifyContent: "center", padding: "16px 24px" }}>
                <button className="btn-cancel" onClick={() => setCompletionSummary(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* API error */}
        {apiError && (
          <div className="wof-api-error">
            <FaExclamationTriangle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="wof-header">
          <button type="button" onClick={() => navigate("/work-order")} className="back-btn">
            <FaArrowLeft size={20} />
          </button>
          <div className="header-title">
            <h1>{isNew ? "New Work Order" : `Edit: ${wo.item_name || wo.name}`}</h1>
            {!isNew && <span className={`wof-status-badge ${STATUS_CLASS[wo.status]}`}>{wo.status}</span>}
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="wof-order-type-bar">
          <button
            type="button"
            className={`order-type-btn ${wo.type === "internal" ? "active" : ""}`}
            onClick={() => set("type", "internal")}
            disabled={disabled}
          >
            <FaBuilding /> Internal WO
          </button>
          <button
            type="button"
            className={`order-type-btn ${wo.type === "external" ? "active" : ""}`}
            onClick={() => set("type", "external")}
            disabled={disabled}
          >
            <FaTruck /> External WO
          </button>
        </div>

        {/* Status Selector - Moved to top */}
        <div className="wof-status-bar">
          <label className="wof-label">Status</label>
          <div className="wof-status-selector">
            {STATUS_OPTIONS.map(s => (
              <button key={s} type="button"
                className={`wof-status-btn${wo.status === s ? " wof-status-btn-active" : ""}`}
                onClick={() => {
                  set("status", s);
                  // When the WO is marked Completed, pull the linked job card,
                  // surface the end-product/scrap split, and post the
                  // resulting stock entry + finished-goods inventory record.
                  if (s === "Completed") handleWorkOrderCompletion();
                }}
                disabled={disabled}>
                <span className={`wof-status-dot ${STATUS_CLASS[s]}`} />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="wof-tabs">
          {TABS.map(t => {
            // Hide GRN Selection tab for internal WO
            if (t.key === "grn_selection" && wo.type !== "external") return null;
            return (
              <button key={t.key} type="button"
                className={`wof-tab-btn${activeTab === t.key ? " wof-tab-btn-active" : ""}`}
                onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave}>

          {/* ══════════ TAB: GRN SELECTION ══════════ */}
          {activeTab === "grn_selection" && wo.type === "external" && (
            <div className="wof-card">
              <div className="wof-section-header">
                <span className="wof-section-title">Select GRN for External Work Order</span>
                <button
                  type="button"
                  className="wof-row-add-btn"
                  onClick={() => setShowGrnModal(true)}
                  disabled={grnLoading}
                >
                  <FaPlus size={10} /> Select GRN
                </button>
              </div>

              {wo.selected_grn_id && wo.selected_grn ? (
                <div className="wof-selected-grn">
                  {grnDetailLoading && (
                    <div className="wof-hint" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <FaSpinner className="spinning" /> Loading GRN item details…
                    </div>
                  )}
                  <div className="wof-grn-info">
                    <div className="wof-grn-row">
                      <span className="wof-grn-label">GRN Number:</span>
                      <span className="wof-grn-value">{wo.selected_grn.grn_number} (#{wo.selected_grn.id})</span>
                    </div>
                    <div className="wof-grn-row">
                      <span className="wof-grn-label">Customer:</span>
                      <span className="wof-grn-value">{wo.customer_name || "N/A"}</span>
                    </div>
                    <div className="wof-grn-row">
                      <span className="wof-grn-label">GRN Date:</span>
                      <span className="wof-grn-value">
                        {wo.selected_grn.grn_date ? new Date(wo.selected_grn.grn_date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  
                    <div className="wof-grn-row">
                      <span className="wof-grn-label">Delivery Challan No:</span>
                      <span className="wof-grn-value">{wo.selected_grn.delivery_challan_no || "N/A"}</span>
                    </div>
                    
                  
                  </div>

                  <div className="wof-grn-items">
  <span className="wof-section-title" style={{ fontSize: "12px" }}>
    GRN Quantities
  </span>

  <div
    style={{
      display: "flex",
      gap: 10,
      marginTop: 8,
      flexWrap: "wrap",
    }}
  >
    <div
      style={{
        flex: 1,
        minWidth: 95,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 6,
        padding: "8px 10px",
      }}
    >
      <div style={{ fontSize: 11, color: "#64748b" }}>Total Items</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>
        {wo.selected_grn.total_items}
      </div>
    </div>

    <div
      style={{
        flex: 1,
        minWidth: 95,
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: 6,
        padding: "8px 10px",
      }}
    >
      <div style={{ fontSize: 11, color: "#166534" }}>Received Qty</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#166534",
        }}
      >
        {wo.selected_grn.total_received_qty}
      </div>
    </div>

    <div
      style={{
        flex: 1,
        minWidth: 95,
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        borderRadius: 6,
        padding: "8px 10px",
      }}
    >
      <div style={{ fontSize: 11, color: "#1e40af" }}>Accepted Qty</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#1e40af",
        }}
      >
        {wo.selected_grn.total_accepted_qty}
      </div>
    </div>

    <div
      style={{
        flex: 1,
        minWidth: 95,
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: 6,
        padding: "8px 10px",
      }}
    >
      <div style={{ fontSize: 11, color: "#991b1b" }}>Rejected Qty</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#991b1b",
        }}
      >
        {wo.selected_grn.total_rejected_qty}
      </div>
    </div>
  </div>
</div>
  {/* ── Operations to perform ──
                      Same table UI as an Internal WO, but each row's
                      operation is chosen from the operation master list
                      (GET /operation) rather than typed free text. */}
                  <div className="wof-divider" />
                  <div className="wof-table-header">
                    <span className="wof-section-title wof-section-title-flush">
                      <FaCogs style={{ marginRight: 6 }} />
                      Operations To Perform
                    </span>
                    <button type="button" className="wof-row-add-btn"
                      onClick={() => setWo(p => ({ ...p, operations: [...p.operations, emptyOp()] }))}>
                      <FaPlus size={10} /> Add Row
                    </button>
                  </div>
                  <div className="wof-table-scroll">
                    <table className="wof-editable-table">
                      <thead>
                        <tr>
                          <th className="wof-col-no">#</th>
                          <th>Operation</th>
                          <th>Workstation</th>
                          <th>Time (mins)</th>
                          <th>Hour Rate</th>
                          <th>Operating Cost</th>
                          <th className="wof-col-action" />
                        </tr>
                      </thead>
                      <tbody>
                        {wo.operations.map((op, idx) => (
                          <tr key={op.id}>
                            <td className="wof-col-no">{idx + 1}</td>
                            <td>
                              <OperationPickerField
                                value={op.operation}
                                operations={operationMasters}
                                loading={operationsLoading}
                                disabled={disabled}
                                onSelect={(o) => {
                                  updateOp(op.id, "operation", o.name.trim());
                                  updateOp(op.id, "workstation", o.workstation_name);
                                  updateOp(op.id, "hour_rate", o.hour_rate);
                                  updateOp(op.id, "time_in_mins", o.total_operation_time);
                                  updateOp(
                                    op.id,
                                    "operating_cost",
                                    Math.round((o.hour_rate / 60) * o.total_operation_time * 100) / 100
                                  );
                                }}
                              />
                            </td>
                            <td>
                              <input type="text" value={op.workstation}
                                onChange={e => updateOp(op.id, "workstation", e.target.value)}
                                className="form-field form-field-sm" placeholder="Auto-filled" disabled={disabled} />
                            </td>
                            <td>
                              <input type="number" value={op.time_in_mins || ""}
                                onChange={e => updateOp(op.id, "time_in_mins", Number(e.target.value))}
                                className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                            </td>
                            <td>
                              <input type="number" value={op.hour_rate || ""}
                                onChange={e => updateOp(op.id, "hour_rate", Number(e.target.value))}
                                className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                            </td>
                            <td>
                              <input type="number" value={op.operating_cost || ""}
                                onChange={e => updateOp(op.id, "operating_cost", Number(e.target.value))}
                                className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                            </td>
                            <td className="wof-col-action">
                              <button type="button" className="wof-row-delete-btn"
                                onClick={() => setWo(p => ({ ...p, operations: p.operations.filter(o => o.id !== op.id) }))}
                                disabled={wo.operations.length <= 1}>
                                <FaTrash size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="wof-no-grn">
                  <p>No GRN selected. Please click "Select GRN" to choose a Goods Receipt Note.</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary, #6b7280)", marginTop: "8px" }}>
                    <FaInfoCircle /> {grnList.length} GRN{grnList.length === 1 ? "" : "s"} available in the system
                  </p>
                </div>
              )}
                  {/* ── Material Available section ──
                      Shows exactly what came in on this GRN (item, qty,
                      uom) and which warehouse it's sitting in — the
                      "how much material we have" comparison. */}
                  {materialAvailability.length > 0 && (
                    <>
                      <div className="wof-divider" />
                      <div className="wof-section-header">
                        <span className="wof-section-title">
                          <FaBoxOpen style={{ marginRight: 6 }} />
                          Material Available {availabilityWarehouse && `— ${availabilityWarehouse}`}
                        </span>
                      </div>
                      <div className="wof-table-scroll">
                        <table className="wof-editable-table">
                          <thead>
                            <tr>
                              <th className="wof-col-no">#</th>
                              <th>Item Code</th>
                              <th>Item Name</th>
                              <th>Available Qty</th>
                              <th>UOM</th>
                              <th>Warehouse</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materialAvailability.map((m, idx) => (
                              <tr key={`${m.item_code}-${idx}`}>
                                <td className="wof-col-no">{idx + 1}</td>
                                <td>{m.item_code}</td>
                                <td>{m.item_name}</td>
                                <td style={{ fontWeight: 700, color: "#166534" }}>{m.received_qty}</td>
                                <td>{m.uom}</td>
                                <td>{m.warehouse}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                
            </div>
          )}

          {/* ══════════ TAB 1: PRODUCTION ITEM ══════════ */}
          {activeTab === "production_item" && (
            <div className="wof-card">



{wo.type === "internal" && (
                <>
                  <span className="wof-section-title">Bill of Materials</span>

                  {/* Row 2: BOM search + Item (auto-filled) */}
                  <div className="wof-grid-2" style={{ marginTop: 10 }}>
                    <BomSearchField
                      value={selectedBomLabel || wo.bom_no}
                      onSelect={handleSelectBom}
                      onClear={handleClearBom}
                      disabled={disabled}
                    />
                     <div className="wof-field">
                  <label className="wof-label">Qty To Manufacture <span className="wof-required">*</span></label>
                  <input type="number" value={wo.qty_to_manufacture || ""}
                    onChange={e => set("qty_to_manufacture", Number(e.target.value))}
                    className="form-field" placeholder="e.g. 100"  />
                  {bomDetail && (
                    <span className="wof-hint">
                      BOM base: {bomDetail.bom.quantity} {bomDetail.bom.uom} — rows scale automatically
                    </span>
                  )}
                </div>
                  </div>

                  {bomLoading && (
                    <div className="wof-hint" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                      <FaSpinner className="spinning" /> Loading BOM details…
                    </div>
                  )}
                </>
              )}

              {wo.type === "external" && (
                <>
                  <span className="wof-section-title">Item To Manufacture</span>
                  <div className="wof-grid-2" style={{ marginTop: 10 }}>
                    <div className="wof-field">
                      <label className="wof-label">Item Code</label>
                      <input type="text" value={wo.item_to_manufacture}
                        onChange={e => set("item_to_manufacture", e.target.value)}
                        className="form-field" placeholder="e.g. ANKIT1234" disabled={disabled} />
                    </div>
                    <div className="wof-field">
                      <label className="wof-label">Item Name</label>
                      <input type="text" value={wo.item_name}
                        onChange={e => set("item_name", e.target.value)}
                        className="form-field" placeholder="e.g. Ankit1234" disabled={disabled} />
                    </div>
                    
                  </div>
                  
                  <span className="wof-hint">
                    For External Work Orders, the required items and available quantities come from
                    the selected GRN (see the "GRN Selection" tab), not a BOM.
                  </span>



                </>
              )}
              {/* Row 1: Qty */}

              
             

             

              <div className="wof-divider" />
              <span className="wof-section-title">Warehouses</span>

              <div className="wof-grid-3" style={{ marginTop: 10 }}>
                <WarehouseSearchField label="Source Warehouse" value={wo.source_warehouse}
                  onChange={v => set("source_warehouse", v)}required disabled={disabled}
                  hint="Where raw materials are picked from" 
                  />
                  
                <WarehouseSearchField label="Target Warehouse (FG)" value={wo.target_warehouse}
                  onChange={v => set("target_warehouse", v)} required disabled={disabled}
                  hint="Where finished goods are stored"
                />
                <WarehouseSearchField label="WIP Warehouse" value={wo.wip_warehouse}
                  onChange={v => set("wip_warehouse", v)} required disabled={disabled}
                  hint="Where production operations happen"
               />
              </div>

             

              <div className="wof-divider" />

              {/* ── Operations Table ── (Internal WO only — External WO has
                  its own operation-picker table on the GRN Selection tab) */}
              {wo.type === "internal" && (
                <>
                  <div className="wof-table-header">
                    <span className="wof-section-title wof-section-title-flush">Operations</span>
                    <button type="button" className="wof-row-add-btn" onClick={() => setWo(p => ({ ...p, operations: [...p.operations, emptyOp()] }))}>
                      <FaPlus size={10} /> Add Row
                    </button>
                  </div>
                  <div className="wof-table-scroll">
                    <table className="wof-editable-table">
                      <thead>
                        <tr>
                          <th className="wof-col-no">#</th>
                          <th>Operation</th>
                          <th>Workstation</th>
                          <th>Time (mins)</th>
                          <th>Hour Rate</th>
                          <th>Operating Cost</th>
                          <th className="wof-col-action" />
                        </tr>
                      </thead>
                      <tbody>
                        {wo.operations.map((op, idx) => (
                          <tr key={op.id}>
                            <td className="wof-col-no">{idx + 1}</td>
                            <td>
                              <input type="text" value={op.operation}
                                onChange={e => updateOp(op.id, "operation", e.target.value)}
                                className="form-field form-field-sm" placeholder="e.g. CNC Turning" disabled={disabled} />
                            </td>
                            <td>
                              <input type="text" value={op.workstation}
                                onChange={e => updateOp(op.id, "workstation", e.target.value)}
                                className="form-field form-field-sm" placeholder="e.g. CNC Machine 1" disabled={disabled} />
                            </td>
                            <td>
                              <input type="number" value={op.time_in_mins || ""}
                                onChange={e => updateOp(op.id, "time_in_mins", Number(e.target.value))}
                                className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                            </td>
                            <td>
                              <input type="number" value={op.hour_rate || ""}
                                onChange={e => updateOp(op.id, "hour_rate", Number(e.target.value))}
                                className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                            </td>
                            <td>
                              <input type="number" value={op.operating_cost || ""}
                                onChange={e => updateOp(op.id, "operating_cost", Number(e.target.value))}
                                className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                            </td>
                            <td className="wof-col-action">
                              <button type="button" className="wof-row-delete-btn"
                                onClick={() => setWo(p => ({ ...p, operations: p.operations.filter(o => o.id !== op.id) }))}
                                disabled={wo.operations.length <= 1}>
                                <FaTrash size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="wof-divider" />
                </>
              )}

              {/* ── Required Items Table ── */}
              <div className="wof-table-header">
                <span className="wof-section-title wof-section-title-flush">Required Items</span>
                <button type="button" className="wof-row-add-btn" onClick={() => setWo(p => ({ ...p, required_items: [...p.required_items, emptyItem()] }))}>
                  <FaPlus size={10} /> Add Row
                </button>
              </div>
              <div className="wof-table-scroll">
                <table className="wof-editable-table">
                  <thead>
                    <tr>
                      <th className="wof-col-no">#</th>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Source Warehouse</th>
                      <th>Required Qty</th>
                      {wo.type === "external" && <th>Available Qty</th>}
                      <th>UOM</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th className="wof-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {wo.required_items.map((ri, idx) => {
                      const avail = wo.type === "external" ? availabilityFor(ri.item_code) : undefined;
                      const shortfall = avail !== undefined && ri.required_qty > avail.received_qty;
                      return (
                        <tr key={ri.id}>
                          <td className="wof-col-no">{idx + 1}</td>
                          <td>
                            <input type="text" value={ri.item_code}
                              onChange={e => updateItem(ri.id, "item_code", e.target.value)}
                              className="form-field form-field-sm" placeholder="e.g. MS_Hex_Nut_Blank_M12" disabled={disabled} />
                          </td>
                          <td>
                            <input type="text" value={ri.item_name}
                              onChange={e => updateItem(ri.id, "item_name", e.target.value)}
                              className="form-field form-field-sm" placeholder="e.g. MS Hex Nut Blank M12" disabled={disabled} />
                          </td>
                          <td>
                            <input type="text" value={ri.source_warehouse}
                              onChange={e => updateItem(ri.id, "source_warehouse", e.target.value)}
                              className="form-field form-field-sm" placeholder="e.g. Raw Material Store" disabled={disabled} />
                          </td>
                          <td>
                            <input type="number" value={ri.required_qty || ""}
                              onChange={e => updateItem(ri.id, "required_qty", Number(e.target.value))}
                              className="form-field form-field-sm" min="0" step="0.001" disabled={disabled} />
                          </td>
                          {wo.type === "external" && (
                            <td style={{ fontWeight: 600, color: shortfall ? "#b91c1c" : "#166534", whiteSpace: "nowrap" }}>
                              {avail ? avail.received_qty : "—"}
                              {shortfall && <FaExclamationTriangle style={{ marginLeft: 4 }} title="Required qty exceeds what's available" />}
                            </td>
                          )}
                          <td>
                            <input type="text" value={ri.uom}
                              onChange={e => updateItem(ri.id, "uom", e.target.value)}
                              className="form-field form-field-sm" placeholder="Nos" disabled={disabled} />
                          </td>
                          <td>
                            <input type="number" value={ri.rate || ""}
                              onChange={e => updateItem(ri.id, "rate", Number(e.target.value))}
                              className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                          </td>
                          <td>
                            <input type="number" value={ri.amount || ""}
                              onChange={e => updateItem(ri.id, "amount", Number(e.target.value))}
                              className="form-field form-field-sm" min="0" step="0.01" disabled={disabled} />
                          </td>
                          <td className="wof-col-action">
                            <button type="button" className="wof-row-delete-btn"
                              onClick={() => setWo(p => ({ ...p, required_items: p.required_items.filter(r => r.id !== ri.id) }))}
                              disabled={wo.required_items.length <= 1}>
                              <FaTrash size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>


              {wo.type === "internal" && (
  <>
    <div className="wof-divider" />
    
    {/* ── Cost Summary Card ── */}
    <div className="wof-cost-summary">
      <div className="wof-section-title"> Cost Summary</div>
      
      <div className="cost-summary-grid">
        {/* Raw Material Cost */}
        <div className="cost-card material">
          <div className="cost-label">
            <span className="label-icon">📦</span> Raw Material Cost
          </div>
          <div className="cost-value">₹ {totalRawMaterialCost.toFixed(2)}</div>
          <div className="cost-sub">
            {wo.required_items.filter(item => item.amount && item.amount > 0).length} items
          </div>
        </div>
        
        {/* Operation Cost */}
        <div className="cost-card operation">
          <div className="cost-label">
            <span className="label-icon">⚙️</span> Operation Cost
          </div>
          <div className="cost-value">₹ {wo.planned_operating_cost.toFixed(2)}</div>
          <div className="cost-sub">
            {wo.operations.filter(op => op.operating_cost > 0).length} operations
          </div>
        </div>
        
        {/* Total Cost */}
        <div className="cost-card total">
          <div className="cost-label">
            <span className="label-icon">📊</span> Total Cost
          </div>
          <div className="cost-value">₹ {(totalRawMaterialCost + wo.planned_operating_cost).toFixed(2)}</div>
          <div className="cost-sub">
            Material + Operations
          </div>
        </div>
      </div>
    </div>
    
    <div className="wof-divider" />
    
   
  </>
)}

              {/* ── Media Upload Section ── */}
              <div className="wof-divider" />
              <span className="wof-section-title">Media Attachments</span>
              <div className="wof-media-upload">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaUpload}
                  accept="image/*,video/*"
                  multiple
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="wof-media-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia || disabled}
                >
                  {uploadingMedia ? <FaSpinner className="spinning" /> : <FaImage />}
                  {uploadingMedia ? "Uploading..." : "Upload Images/Videos"}
                </button>
                <span className="wof-hint">Upload product images, process videos, or inspection photos (optional)</span>
              </div>

              {wo.media_files.length > 0 && (
                <div className="wof-media-gallery">
                  {wo.media_files.map((file) => (
                    <div key={file.id} className="wof-media-item">
                      {file.type === "image" ? (
                        <img src={file.url} alt={file.name} className="wof-media-preview" />
                      ) : (
                        <video src={file.url} className="wof-media-preview" controls />
                      )}
                      <button
                        type="button"
                        className="wof-media-delete"
                        onClick={() => setWo(prev => ({
                          ...prev,
                          media_files: prev.media_files.filter(f => f.id !== file.id)
                        }))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ══════════ TAB 2: CONFIGURATION ══════════ */}
          {activeTab === "configuration" && (
            <div className="wof-card">
              <span className="wof-section-title">Dates</span>

              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <div className="wof-field">
                  <DatePickerField
                    label="Planned Start Date"
                    value={wo.planned_start_date}
                    onChange={v => set("planned_start_date", v)}
                    required
                    disabled={disabled}
                  />
                </div>
           
                <div className="wof-field">
                  <DatePickerField
                    label="Actual Start Date"
                    value={wo.actual_start_date}
                    onChange={v => set("actual_start_date", v)}
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <DatePickerField
                    label="Actual End Date"
                    value={wo.actual_end_date}
                    onChange={v => set("actual_end_date", v)}
                    disabled={disabled}
                    min={wo.actual_start_date}
                  />
                </div>
               
              </div>
            </div>
          )}

        

          {/* ══════════ TAB 4: TOTAL PRODUCED ══════════ */}
          {activeTab === "total_produced" && (
            <div className="wof-card">
              <div className="wof-progress-block">
                <div className="wof-progress-bar">
                  <div className="wof-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, wo.items_produced_pct))}%` }} />
                </div>
                <span className="wof-progress-label">{wo.manufactured_qty} items produced</span>
              </div>
              <div className="wof-progress-block">
                <div className="wof-progress-bar">
                  <div className="wof-progress-fill"
                    style={{ width: wo.operations.length > 0 ? `${(wo.completed_operations.length / wo.operations.length) * 100}%` : "0%" }} />
                </div>
                <span className="wof-progress-label">
                  Completed Operations: <strong>{wo.completed_operations.join(", ") || "None"}</strong>
                </span>
              </div>

              {/* End Product vs Scrap, from the linked job card fetched
                  during handleWorkOrderCompletion(). */}
              {completionSummary?.totalCompletedQty !== undefined && (
                <>
                  <div className="wof-divider" />
                  <span className="wof-section-title">Job Card Output</span>
                  <div className="wof-progress-block" style={{ display: "flex", gap: 16, marginTop: 10 }}>
                    <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 12, color: "#166534" }}>End Product</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#166534" }}>
                        {completionSummary.totalCompletedQty}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 12, color: "#991b1b" }}>Scrap / Loss</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#991b1b" }}>
                        {completionSummary.processLossQty}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="wof-footer">
            <button type="button" className="cancel-btn" onClick={() => navigate("/work-order")} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting && <FaSpinner className="spinning" />}
              <FaSave size={12} />
              {isNew ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </div>

      {/* GRN Selection Modal */}
      {showGrnModal && (
        <div className="modal-overlay" onClick={() => setShowGrnModal(false)}>
          <div className="grn-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select GRN</h2>
              <button className="modal-close" onClick={() => setShowGrnModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {grnLoading ? (
                <div className="grn-loading"><FaSpinner className="spinning" /> Loading GRNs...</div>
              ) : grnError ? (
                <div className="grn-empty" style={{ color: "#b91c1c" }}>
                  <FaExclamationTriangle style={{ marginRight: 6 }} />
                  {grnError}
                </div>
              ) : grnList.length === 0 ? (
                <div className="grn-empty">No External GRNs available</div>
              ) : (
                <div className="grn-list">
                  {grnList.map(grn => (
                    <div key={grn.id} className="grn-item" onClick={() => handleSelectGRN(grn)}>
                      <div className="grn-item-header">
                        <span className="grn-item-id">{grn.grn_number}</span>
                        <span className="grn-item-status">{grn.status}</span>
                      </div>
                      <div className="grn-item-details">
                        <span>Customer: {grn.customer_name || grn.party_name || "N/A"}</span>
                        <span>Date: {grn.grn_date ? new Date(grn.grn_date).toLocaleDateString() : "N/A"}</span>
                        <span>Items: {grn.total_items}</span>
                        <span>Received Qty: {grn.total_received_qty}</span>
                      </div>
                      <div className="grn-item-items">
                        <span className="grn-item-tag">Accepted: {grn.total_accepted_qty}</span>
                        <span className="grn-item-tag">Rejected: {grn.total_rejected_qty}</span>
                        {grn.delivery_challan_no && (
                          <span className="grn-item-tag">DC: {grn.delivery_challan_no}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowGrnModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}