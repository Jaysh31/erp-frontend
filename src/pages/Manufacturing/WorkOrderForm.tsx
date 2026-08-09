import { useState, type FormEvent, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaExclamationTriangle,
  FaInfoCircle, FaPlus, FaTrash,
  FaSearch, FaBuilding, FaTruck,
  FaImage, FaCalendarAlt,
  FaCheckCircle, FaBoxOpen, FaCogs, FaGripVertical,
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
  sequence_id?: number; // Added for drag and drop ordering
}

interface RequiredItemRow {
  id: string;
  item_id?: number;
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
  operation?: string;
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

// Full GRN detail — GET /grn/:id
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
  company: string;
  qty_to_manufacture: number;
  item_to_manufacture: string;
  item_name: string;
  item_id: string;
  stock_uom: string;
  bom_no: string;
  material_transferred_for_manufacturing: number;
  manufactured_qty: number;
  additional_transferred_qty: number;
  disassembled_qty: number;
  source_warehouse: string;
  target_warehouse: string;
  wip_warehouse: string;
  transfer_material_against: "Work Order" | "Job Card";
  operations: OperationRow[];
  required_items: RequiredItemRow[];
  planned_start_date: string;
  actual_start_date: string;
  actual_end_date: string;
  lead_time_mins: number;
  planned_operating_cost: number;
  actual_operating_cost: number;
  additional_operating_cost: number;
  corrective_operation_cost: number;
  comments: CommentRow[];
  activity: { id: string; text: string; time: string }[];
  items_produced_pct: number;
  completed_operations: string[];
  stock_entry_count: number;
  job_card_count: number;
  pick_list_count: number;
  serial_no_count: number;
  batch_count: number;
  material_request_count: number;
  selected_grn_id?: number;
  selected_grn?: GRNData;
  customer_name?: string;
  customer_po?: string;
  media_files: { id: string; type: "image" | "video"; url: string; name: string; }[];
}

// ─── BOM API shape ────────────────────────────────────────────────────────────

interface BomListItem {
  id: number;
  item_Id: number;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  company: string;
  is_default: number;
  type: string;
  operating_cost?: number;
  total_cost?: number;
}

interface BomListResponse {
  success: number;
  data: { total: number; page: number; limit: number; records: BomListItem[] };
}

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

interface BomItemWarehouseStock {
  id: number;
  warehouse_name: string;
  actual_qty: number;
  reserved_qty: number;
  available_qty: number;
  projected_qty: number;
  stock_value: number;
  valuation_rate: number;
}

interface BomApiItem {
  item_Id: any;
  id: number;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  stock_uom: string;
  source_warehouse?: string | null;
  rate: number;
  amount: number;
  actual_qty?: number;
  available_qty?: number;
  total_available_stock?: number;
  total_stock?: number;
  stock_by_warehouse?: BomItemWarehouseStock[];
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
  item_Id?: number;
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

// ─── Operation master API shape ─────────────────────────────────────────────

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

// ─── Raw Item API shape ──────────────────────────────────────────────────────

interface RawItemMaster {
  id: number;
  item_code: string;
  item_name: string;
  item_group?: string;
  stock_uom: string;
  standard_rate: number;
  valuation_rate: number;
}

interface RawItemListResponse {
  success: number;
  data: RawItemMaster[];
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

interface WOPayloadOperation {
  operation: string;
  sequence_id: number;
  workstation: string;
  time_in_mins: number;
}

interface WOPayloadItem {
  item_id: number;
  item_code: string;
  item_name: string;
  required_qty: number;
  stock_uom: string;
  rate: number;
  amount: number;
  source_warehouse: string;
  operation: string;
}

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
  selected_grn_id?: number;
  order_type?: OrderType;
  type: string;
  operations: WOPayloadOperation[];
  items: WOPayloadItem[];
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
  id: uid(), operation: "", workstation: "", time_in_mins: 0, hour_rate: 0, operating_cost: 0, sequence_id: 0,
});

const emptyItem = (): RequiredItemRow => ({
  id: uid(), 
  item_id: undefined,
  item_code: "", 
  item_name: "", 
  source_warehouse: "", 
  required_qty: 0,
  uom: "", 
  transferred_qty: 0, 
  consumed_qty: 0, 
  returned_qty: 0, 
  rate: 0, 
  amount: 0, 
  operation: "",
});

const emptyWO = (): WorkOrderData => ({
  name: "", status: "Draft",
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
            className={`form-field date-picker-input`}
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
      {error && <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}

// ─── DigitInput ───────────────────────────────────────────────────────────────

function DigitInput({
  label, value, onChange, placeholder, maxLength, disabled = false,
  allowDecimal = true, className = "form-field form-field-sm", hint, error,
}: {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  allowDecimal?: boolean;
  className?: string;
  hint?: string;
  error?: string;
}) {
  const [raw, setRaw] = useState(value === 0 || value === "" ? "" : String(value));

  useEffect(() => {
    setRaw(value === 0 || value === "" ? "" : String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = allowDecimal
      ? e.target.value.replace(/[^0-9.]/g, "")
      : e.target.value.replace(/[^0-9]/g, "");
    if (allowDecimal) {
      const parts = v.split(".");
      if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    }
    if (maxLength && v.replace(".", "").length > maxLength) return;
    setRaw(v);
    onChange(v === "" || v === "." ? 0 : Number(v));
  };

  return (
    <div className="digit-input-field">
      {label && <label className="wof-label">{label}</label>}
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {hint && <span className="wof-hint">{hint}</span>}
      {error && <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>{error}</div>}
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
            className="form-field warehouse-search-input"
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
      {error && <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}

// ─── BomSearchField ───────────────────────────────────────────────────────────

function BomSearchField({
  value, onSelect, onClear, disabled = false, error, filterType,
}: {
  value: string; onSelect: (b: BomListItem) => void;
  onClear: () => void; disabled?: boolean; error?: string;
  filterType?: "Internal" | "External";
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

  const byType = filterType ? all.filter(b => b.type === filterType) : all;

  const filtered = term.trim()
    ? byType.filter(b =>
        b.item.toLowerCase().includes(term.toLowerCase()) ||
        b.item_name.toLowerCase().includes(term.toLowerCase()))
    : byType;

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
            placeholder={filterType === "External" ? "Search External BOM by item code or name…" : "Search BOM by item code or name…"}
            disabled={disabled || loading}
            className="form-field warehouse-search-input"
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
              ? <div className="warehouse-dropdown-empty">{term ? "No BOMs found" : `No ${filterType || ""} BOMs`}</div>
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
      <span className="wof-hint">
        {filterType === "External"
          ? "Select an External BOM to auto-fill Operations."
          : "Select a BOM to auto-fill operations and required items."}
      </span>
      {error && <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}

// ─── OperationPickerField ────────────────────────────────────────────────────

function OperationPickerField({
  value, operations, loading, onSelect, onTextChange, disabled = false,
}: {
  value: string;
  operations: OperationMaster[];
  loading?: boolean;
  onSelect: (op: OperationMaster) => void;
  onTextChange?: (text: string) => void;
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
            onChange={e => {
              setTerm(e.target.value);
              onTextChange?.(e.target.value);
              if (!open) openDropdown();
            }}
            onFocus={openDropdown}
            onKeyDown={e => e.key === "Escape" && setOpen(false)}
            placeholder="Select or type operation…"
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

// ─── ItemPickerField ──────────────────────────────────────────────────────────

function ItemPickerField({
  value, items, loading, onSelect, disabled = false, placeholder = "Search raw material…",
}: {
  value: string;
  items: RawItemMaster[];
  loading?: boolean;
  onSelect: (item: RawItemMaster) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = term.trim()
    ? items.filter(it =>
        it.item_name.toLowerCase().includes(term.toLowerCase()) ||
        it.item_code.toLowerCase().includes(term.toLowerCase()))
    : items;

  const positionDropdown = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  const openDropdown = () => {
    if (disabled) return;
    positionDropdown();
    setOpen(true);
  };

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

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      const dropdownEl = document.getElementById("item-picker-portal-dropdown");
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
            type="text"
            value={open ? term : value}
            onChange={e => { setTerm(e.target.value); if (!open) openDropdown(); }}
            onFocus={openDropdown}
            onKeyDown={e => e.key === "Escape" && setOpen(false)}
            placeholder={placeholder}
            disabled={disabled || loading}
            className="form-field form-field-sm warehouse-search-input"
          />
          {loading && <FaSpinner className="warehouse-loading-spinner spinning" />}
        </div>
      </div>

      {open && !disabled && coords && createPortal(
        <div
          id="item-picker-portal-dropdown"
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
            ? <div className="warehouse-dropdown-empty">{term ? "No match" : "No raw material items found"}</div>
            : <ul className="warehouse-dropdown-list">
                {filtered.map(it => (
                  <li key={it.id} className="warehouse-dropdown-item"
                    onClick={() => { onSelect(it); setTerm(""); setOpen(false); }}>
                    <div className="warehouse-item-name">
                      {it.item_name} <span style={{ opacity: 0.6 }}>({it.item_code})</span>
                    </div>
                    <div className="warehouse-item-company">
                      {it.stock_uom} · ₹{it.standard_rate ?? it.valuation_rate ?? 0}/unit
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; label: string; message: string }[]>([]);

  // ─── Drag and Drop state for operations ────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
  const [completionSummary, setCompletionSummary] = useState<{
    show: boolean;
    loading: boolean;
    error: string | null;
    readOnly?: boolean;
    jobCardId?: number;
    totalCompletedQty?: number;
    processLossQty?: number;
    itemName?: string;
    woStatusUpdated?: boolean;
    stockEntryPosting?: boolean;
    stockEntryPosted?: boolean;
    stockEntryError?: string | null;
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

  // Operation master state
  const [operationMasters, setOperationMasters] = useState<OperationMaster[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);

  // Raw item master state
  const [rawItems, setRawItems] = useState<RawItemMaster[]>([]);
  const [rawItemsLoading, setRawItemsLoading] = useState(false);

  // Material availability
  const [materialAvailability, setMaterialAvailability] = useState<
    { item_code: string; item_name: string; received_qty: number; uom: string; warehouse: string }[]
  >([]);
  const [, setAvailabilityWarehouse] = useState<string>("");

  // BOM state (Internal WO)
  const [selectedBomLabel, setSelectedBomLabel] = useState("");
  const [bomDetail, setBomDetail] = useState<{ bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] } | null>(null);
  const [bomLoading, setBomLoading] = useState(false);

  // BOM state (External WO)
  const [selectedExternalBomLabel, setSelectedExternalBomLabel] = useState("");
  const [externalBomDetail, setExternalBomDetail] = useState<
    { bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] } | null
  >(null);

  // ── Material availability constraints ──
  const [materialConstraints, setMaterialConstraints] = useState<
    { item_code: string; item_name: string; available: number; required: number; uom: string; shortfall: boolean }[]
  >([]);
  const [maxProducibleQty, setMaxProducibleQty] = useState<number | null>(null);

  // Media upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<
    { id: string; file: File; url: string; name: string; type: "image" | "video" }[]
  >([]);

  const disabled = submitting || loading;

  // ─── Drag and Drop Handlers ──────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setWo(prev => {
      const newOps = [...prev.operations];
      const draggedRow = newOps[dragIndex];
      newOps.splice(dragIndex, 1);
      newOps.splice(dropIndex, 0, draggedRow);
      // Update sequence numbers
      return {
        ...prev,
        operations: newOps.map((op, idx) => ({
          ...op,
          sequence_id: idx + 1
        }))
      };
    });

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

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

  // ─── Load operation masters ────────────────────────────────────────────────
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

  // ─── Load raw material item masters ─────────────────────────────────────────
  const loadRawItems = async () => {
    setRawItemsLoading(true);
    try {
      const response = await api.get<RawItemListResponse>("/item?type=raw");
      if (response.data?.success === 1) {
        setRawItems(response.data.data || []);
      }
    } catch (err) {
      console.error("Error loading raw items:", err);
    } finally {
      setRawItemsLoading(false);
    }
  };

  // Load operation + raw item masters once on mount
  useEffect(() => {
    loadOperations();
    loadRawItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wo.type === "external") {
      loadGRNs();
      setActiveTab("grn_selection");
    } else {
      setSelectedExternalBomLabel("");
      setExternalBomDetail(null);
      if (activeTab === "grn_selection") setActiveTab("production_item");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo.type]);

  // ─── Load existing WO ────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      api.get(`/work-order/${id}`).then(async (r) => {
        console.log("GET work-order response:", r.data);
        
        if (r.data.success === 1) {
          const d = r.data.data;

          // Load operations from the work order
          let loadedOperations: OperationRow[] = [];
          if (d.operations && Array.isArray(d.operations)) {
            loadedOperations = d.operations.map((op: any, idx: number) => ({
              id: op.id || uid(),
              operation: op.operation || "",
              workstation: op.workstation || "",
              time_in_mins: op.time_in_mins || 0,
              hour_rate: op.hour_rate || 0,
              operating_cost: op.operating_cost || 0,
              sequence_id: op.sequence_id || idx + 1,
            }));
          }

          let loadedRequiredItems: RequiredItemRow[] = [];
          if (d.items && Array.isArray(d.items)) {
            loadedRequiredItems = d.items.map((item: any) => ({
              id: item.id || uid(),
              item_id: item.item_id,
              item_code: item.item_code || "",
              item_name: item.item_name || "",
              source_warehouse: item.source_warehouse || "",
              required_qty: item.required_qty || 0,
              uom: item.stock_uom || item.uom || "",
              transferred_qty: item.transferred_qty || 0,
              consumed_qty: item.consumed_qty || 0,
              returned_qty: item.returned_qty || 0,
              rate: item.rate || 0,
              amount: item.amount || 0,
              operation: item.operation || "",
            }));
          }

          setWo(prev => ({
            ...prev,
            id: d.id,
            name: d.name ?? prev.name,
            status: (d.status as Status) ?? prev.status,
            type: d.selected_grn_id || (d.type && String(d.type).toLowerCase() === "external")
              ? "external"
              : (prev.type ?? "internal"),
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
            operations: loadedOperations.length ? loadedOperations : prev.operations,
            required_items: loadedRequiredItems.length ? loadedRequiredItems : prev.required_items,
          }));

          // External WO: re-hydrate the GRN detail + material availability
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

          // Fetch the linked BOM
          if (d.bom_no) {
            const isExternal = !!d.selected_grn_id;
            if (isExternal) {
              setSelectedExternalBomLabel(d.item_name ? `${d.item_name} (${d.production_item})` : String(d.bom_no));
            } else {
              setSelectedBomLabel(d.item_name ? `${d.item_name} (${d.production_item})` : String(d.bom_no));
            }
            setBomLoading(true);
            try {
              const br = await api.get<BomDetailResponse>(`/bom/${d.bom_no}`);
              if (br.data.success === 1) {
                const detail = br.data.data;

                if (isExternal) {
                  setExternalBomDetail(detail);
                  setSelectedExternalBomLabel(`${detail.bom.item_name} (${detail.bom.item})`);
                  const ops: OperationRow[] = detail.operations.map((op, idx) => ({
                    id: uid(),
                    operation: op.operation,
                    workstation: op.workstation,
                    time_in_mins: op.time_in_mins,
                    hour_rate: op.hour_rate,
                    operating_cost: op.operating_cost,
                    sequence_id: idx + 1,
                  }));
                  const totalTime = ops.reduce((s, o) => s + o.time_in_mins, 0);
                  const totalCost = ops.reduce((s, o) => s + o.operating_cost, 0);
                  setWo(prev => ({
                    ...prev,
                    operations: ops.length ? ops : prev.operations,
                    lead_time_mins: ops.length ? Math.round(totalTime * 100) / 100 : prev.lead_time_mins,
                    planned_operating_cost: ops.length ? Math.round(totalCost * 100) / 100 : prev.planned_operating_cost,
                  }));
                } else {
                  setBomDetail(detail);
                  setSelectedBomLabel(`${detail.bom.item_name} (${detail.bom.item})`);

                  const base = detail.bom.quantity > 0 ? detail.bom.quantity : 1;
                  const qty = d.qty ?? 0;
                  const scale = qty > 0 ? qty / base : 0;

                  const ops: OperationRow[] = detail.operations.map((op, idx) => ({
                    id: uid(),
                    operation: op.operation,
                    workstation: op.workstation,
                    time_in_mins: Math.round(op.time_in_mins * scale * 100) / 100,
                    hour_rate: op.hour_rate,
                    operating_cost: Math.round(op.operating_cost * scale * 100) / 100,
                    sequence_id: idx + 1,
                  }));

                  const items: RequiredItemRow[] = detail.items.map(it => ({
                    id: uid(),
                    item_id: it.item_Id,
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
                    operation: "",
                  }));

                  setWo(prev => ({
                    ...prev,
                    operations: ops.length ? ops : [emptyOp()],
                    required_items: items.length ? items : [emptyItem()],
                  }));

                  computeMaterialConstraints(detail, qty);
                }
              }
            } catch {
              setApiError("Failed to load linked BOM details");
            } finally {
              setBomLoading(false);
            }
          }
          
          // Load job card totals for Total Produced tab
          if (d.id) {
            setTimeout(() => {
              loadTotalProducedData();
            }, 500);
          }
        }
      })
      .catch(() => setApiError("Failed to load work order"))
      .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  // ─── BOM selection (Internal WO) ───────────────────────────────────────
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
          const qtyToUse = wo.qty_to_manufacture || bom.quantity;
          applyBomToWo(detail, qtyToUse);
          computeMaterialConstraints(detail, qtyToUse);
        }
      })
      .catch(() => setApiError("Failed to load BOM details"))
      .finally(() => setBomLoading(false));
  };

  const handleClearBom = () => {
    setSelectedBomLabel("");
    setBomDetail(null);
    setMaterialConstraints([]);
    setMaxProducibleQty(null);
    setWo(prev => ({
      ...prev,
      bom_no: "", item_to_manufacture: "", item_name: "",
      operations: [emptyOp()], required_items: [emptyItem()],
      lead_time_mins: 0, planned_operating_cost: 0,
    }));
  };

  // ─── BOM selection (External WO) ───────────────────────────────────────
  const handleSelectExternalBom = (bom: BomListItem) => {
    setSelectedExternalBomLabel(`${bom.item_name} (${bom.item})`);
    setWo(prev => ({
      ...prev,
      bom_no: String(bom.id),
      item_to_manufacture: bom.item,
      item_name: bom.item_name,
      stock_uom: bom.uom || prev.stock_uom,
      company: prev.company || bom.company,
    }));
    setExternalBomDetail(null);
    api.get<BomDetailResponse>(`/bom/${bom.id}`)
      .then(r => {
        if (r.data.success === 1) {
          const detail = r.data.data;
          setExternalBomDetail(detail);
          const ops: OperationRow[] = detail.operations.map((op, idx) => ({
            id: uid(),
            operation: op.operation,
            workstation: op.workstation,
            time_in_mins: op.time_in_mins,
            hour_rate: op.hour_rate,
            operating_cost: op.operating_cost,
            sequence_id: idx + 1,
          }));
          const totalTime = ops.reduce((s, o) => s + o.time_in_mins, 0);
          const totalCost = ops.reduce((s, o) => s + o.operating_cost, 0);
          setWo(prev => ({
            ...prev,
            operations: ops.length ? ops : [emptyOp()],
            lead_time_mins: Math.round(totalTime * 100) / 100,
            planned_operating_cost: Math.round(totalCost * 100) / 100,
          }));
        }
      })
      .catch(() => setApiError("Failed to load BOM operations"));
  };

  const handleClearExternalBom = () => {
    setSelectedExternalBomLabel("");
    setExternalBomDetail(null);
    setWo(prev => ({
      ...prev,
      bom_no: "",
      operations: [emptyOp()],
      lead_time_mins: 0,
      planned_operating_cost: 0,
    }));
  };

  // ─── Apply BOM data to WO rows ────────────────────────────────────────
  const applyBomToWo = (
    detail: { bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] },
    qty: number
  ) => {
    const base = detail.bom.quantity > 0 ? detail.bom.quantity : 1;
    const scale = qty > 0 ? qty / base : 0;

    const ops: OperationRow[] = detail.operations.map((op, idx) => ({
      id: uid(),
      operation: op.operation,
      workstation: op.workstation,
      time_in_mins: Math.round(op.time_in_mins * scale * 100) / 100,
      hour_rate: op.hour_rate,
      operating_cost: Math.round(op.operating_cost * scale * 100) / 100,
      sequence_id: idx + 1,
    }));

    const items: RequiredItemRow[] = detail.items.map(it => ({
      id: uid(),
      item_id: it.item_Id,
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
      operation: "",
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

  // ─── Material availability check ──────────────────────────────────────
  const getItemAvailableQty = (item: BomApiItem) => {
    if (Array.isArray(item.stock_by_warehouse) && item.stock_by_warehouse.length > 0) {
      return item.stock_by_warehouse.reduce((sum, w) => sum + (w.actual_qty || 0), 0);
    }
    if (typeof item.total_stock === "number") return item.total_stock;
    if (typeof item.actual_qty === "number") return item.actual_qty;
    if (typeof item.available_qty === "number") return item.available_qty;
    return 0;
  };

  const computeMaterialConstraints = (
    detail: { bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] },
    qty: number
  ) => {
    const base = detail.bom.quantity > 0 ? detail.bom.quantity : 1;

    const constraints = detail.items.map(it => {
      const perUnitQty = it.qty / base;
      const available = getItemAvailableQty(it);
      const required = Math.round(perUnitQty * qty * 1000) / 1000;
      return {
        item_code: it.item_code,
        item_name: it.item_name,
        available,
        required,
        uom: it.stock_uom || it.uom,
        shortfall: qty > 0 && required > available,
        perUnitQty,
      };
    });

    const bounded = constraints
      .filter(c => c.perUnitQty > 0)
      .map(c => Math.floor(c.available / c.perUnitQty));

    const max = bounded.length > 0 ? Math.min(...bounded) : null;

    setMaterialConstraints(constraints.map(({ perUnitQty, ...rest }) => rest));
    setMaxProducibleQty(max);
  };

  // Re-scale when qty changes and BOM is loaded (internal WOs only)
  useEffect(() => {
    if (wo.type === "internal" && bomDetail && wo.qty_to_manufacture > 0) {
      applyBomToWo(bomDetail, wo.qty_to_manufacture);
      computeMaterialConstraints(bomDetail, wo.qty_to_manufacture);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo.qty_to_manufacture]);

  // ─── Keep planned_operating_cost / lead_time_mins in sync ────────────
  useEffect(() => {
    if (wo.type === "external") {
      const totalTime = wo.operations.reduce((s, o) => s + (o.time_in_mins || 0), 0);
      const totalCost = wo.operations.reduce((s, o) => s + (o.operating_cost || 0), 0);
      setWo(prev => {
        const roundedTime = Math.round(totalTime * 100) / 100;
        const roundedCost = Math.round(totalCost * 100) / 100;
        if (prev.lead_time_mins === roundedTime && prev.planned_operating_cost === roundedCost) {
          return prev;
        }
        return { ...prev, lead_time_mins: roundedTime, planned_operating_cost: roundedCost };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo.operations, wo.type]);

  // ─── GRN → Required Items + material availability ─────────────────────
  const hydrateFromGrnDetail = async (detail: GRNDetail) => {
    const codeOf = (it: GRNItemDetail) => it.item_code || `ITEM-${it.item_id}`;
    const nameOf = (it: GRNItemDetail) => it.item_name || `Unnamed item (ID ${it.item_id})`;

    const items: RequiredItemRow[] = (detail.items || []).map(it => ({
      id: uid(),
      item_id: it.item_id,
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
      operation: "",
    }));

    setWo(prev => ({
      ...prev,
      required_items: items.length ? items : prev.required_items,
      source_warehouse: detail.warehouse_name || prev.source_warehouse,
    }));

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

    if (operationMasters.length === 0 && !operationsLoading) {
      loadOperations();
    }
  };

  // ─── GRN Selection ────────────────────────────────────────────────────
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
  const uploadMediaFiles = async (files: File[], workOrderId: number) => {
    if (files.length === 0) return;
    setUploadingMedia(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    formData.append("type", "wo");
    formData.append("woID", String(workOrderId));

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
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!wo.id) {
      const staged = Array.from(files).map((file) => ({
        id: uid(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: (file.type.startsWith("video") ? "video" : "image") as "image" | "video",
      }));
      setPendingMedia(prev => [...prev, ...staged]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    await uploadMediaFiles(Array.from(files), wo.id);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingMedia = (id: string) => {
    setPendingMedia(prev => {
      const target = prev.find(f => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(f => f.id !== id);
    });
  };

  // ─── Load Total Produced Data from Job Cards ──────────────────────────
  const loadTotalProducedData = async () => {
    if (!wo.id) return;
    
    try {
      const jcListRes = await api.get<JobCardListResponse>("/job-card");
      const jobCards = jcListRes.data?.data || [];
      
      const matchedJobCards = jobCards.filter(
        (jc) => String(jc.work_order) === String(wo.id)
      );

      if (matchedJobCards.length > 0) {
        const totalCompleted = matchedJobCards
          .filter(jc => jc.status === "Completed")
          .reduce((sum, jc) => sum + (jc.total_completed_qty || 0), 0);
        
        const totalLoss = matchedJobCards
          .filter(jc => jc.status === "Completed")
          .reduce((sum, jc) => sum + (jc.process_loss_qty || 0), 0);

        setCompletionSummary({
          show: false,
          loading: false,
          error: null,
          readOnly: true,
          totalCompletedQty: totalCompleted,
          processLossQty: totalLoss,
          itemName: wo.item_name,
          jobCardId: matchedJobCards[0]?.id,
        });
        
        setWo(prev => ({
          ...prev,
          manufactured_qty: totalCompleted,
        }));
      }
    } catch (err) {
      console.error("Error loading total produced data:", err);
    }
  };

  // ─── Work Order Completion ────────────────────────────────────────────
  const handleWorkOrderCompletion = async () => {
    if (!wo.id) return;
    setCompletionSummary({ show: true, loading: true, error: null });

    try {
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

      const jcDetailRes = await api.get<JobCardDetailResponse>(`/job-card/${matched.id}`);
      const jc = jcDetailRes.data?.data;
      if (!jc) {
        setCompletionSummary({ show: true, loading: false, error: "Failed to load job card details." });
        return;
      }

      const totalCompletedQty = jc.total_completed_qty ?? 0;
      const processLossQty = jc.process_loss_qty ?? 0;

      setCompletionSummary({
        show: true,
        loading: false,
        error: null,
        jobCardId: jc.id,
        totalCompletedQty,
        processLossQty,
        itemName: jc.item_name,
        woStatusUpdated: false,
        stockEntryPosting: false,
        stockEntryPosted: false,
        stockEntryError: null,
        inventoryPosted: false,
        inventoryPosting: false,
        inventoryError: null,
      });

      try {
        const whRes = await api.get<WarehouseResponse>("/warehouse");
        const warehouses: Warehouse[] = whRes.data?.data?.records || [];
        const fgWarehouse = warehouses.find(w => w.warehouse_name === "Finished Goods");
        setCompletionSummary(prev => (prev
          ? { ...prev, fgWarehouseId: fgWarehouse?.id, fgWarehouseName: fgWarehouse?.warehouse_name }
          : prev));
      } catch (whErr) {
        console.error("Error loading warehouse list:", whErr);
      }
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
        } : {}),
      }));
    }
  };

  // ─── Manual step: post stock entry ────────────────────────────────────
  const handlePostStockEntry = async () => {
    if (!wo.id || !completionSummary || completionSummary.totalCompletedQty === undefined || !completionSummary.jobCardId) return;

    setCompletionSummary(prev => (prev ? { ...prev, stockEntryPosting: true, stockEntryError: null } : prev));

    try {
      const totalCompletedQty = completionSummary.totalCompletedQty;
      const processLossQty = completionSummary.processLossQty ?? 0;

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
        to_warehouse: completionSummary.fgWarehouseName || wo.target_warehouse || "Finished Goods",
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
        job_card: String(completionSummary.jobCardId),
        pick_list: "",
        asset_repair: "",
        purchase_receipt_no: "",
        purchase_order: "",
        subcontracting_inward_order: "",
        is_additional_transfer_entry: 0,
        is_opening: "No",
        remarks: `Posted on completion of Work Order #${wo.id}`,
        per_transferred: 100,
        total_amount: 0,
        amended_from: "",
        credit_note: "",
        is_return: 0,
      });

      setCompletionSummary(prev => (prev ? { ...prev, stockEntryPosting: false, stockEntryPosted: true } : prev));
    } catch (err: any) {
      console.error("Error posting stock entry:", err);
      setCompletionSummary(prev => (prev
        ? { ...prev, stockEntryPosting: false, stockEntryError: err.response?.data?.message || "Failed to post stock entry." }
        : prev));
    }
  };

  // ─── Read-only view for completed WO ──────────────────────────────────
  const viewCompletionSummary = async () => {
    if (!wo.id) return;
    setCompletionSummary({ show: true, loading: true, error: null, readOnly: true });

    try {
      const jcListRes = await api.get<JobCardListResponse>("/job-card");
      const jobCards = jcListRes.data?.data || [];
      
      const matchedJobCards = jobCards.filter(
        (jc) => String(jc.work_order) === String(wo.id)
      );

      if (matchedJobCards.length === 0) {
        setCompletionSummary({
          show: true, 
          loading: false, 
          error: "No job cards found for this Work Order.", 
          readOnly: true,
        });
        return;
      }

      const completedJobCard = matchedJobCards.find(jc => jc.status === "Completed");
      
      if (!completedJobCard) {
        setCompletionSummary({
          show: true,
          loading: false,
          error: "No completed job card found for this Work Order yet.",
          readOnly: true,
        });
        return;
      }

      const jcDetailRes = await api.get<JobCardDetailResponse>(`/job-card/${completedJobCard.id}`);
      const jc = jcDetailRes.data?.data;
      if (!jc) {
        setCompletionSummary({ 
          show: true, 
          loading: false, 
          error: "Failed to load job card details.", 
          readOnly: true 
        });
        return;
      }

      const totalCompleted = matchedJobCards
        .filter(jc => jc.status === "Completed")
        .reduce((sum, jc) => sum + (jc.total_completed_qty || 0), 0);
      
      const totalLoss = matchedJobCards
        .filter(jc => jc.status === "Completed")
        .reduce((sum, jc) => sum + (jc.process_loss_qty || 0), 0);

      setCompletionSummary({
        show: true,
        loading: false,
        error: null,
        readOnly: true,
        jobCardId: completedJobCard.id,
        totalCompletedQty: totalCompleted,
        processLossQty: totalLoss,
        itemName: completedJobCard.item_name || jc.item_name,
      });
    } catch (err) {
      console.error("Error fetching completion summary:", err);
      setCompletionSummary({ 
        show: true, 
        loading: false, 
        error: "Failed to load completion summary.", 
        readOnly: true 
      });
    }
  };

  // ─── Manual step: post inventory and update WO status ────────────────
  const handlePostInventory = async () => {
    if (!completionSummary || completionSummary.totalCompletedQty === undefined) return;
    if (!completionSummary.fgWarehouseId) {
      setCompletionSummary(prev => (prev ? { ...prev, inventoryError: "Finished Goods warehouse not found." } : prev));
      return;
    }

    setCompletionSummary(prev => (prev ? { ...prev, inventoryPosting: true, inventoryError: null } : prev));

    try {
      const itemId = bomDetail?.bom?.item_Id || externalBomDetail?.bom?.item_Id || 62;
      
      await api.post("/inventory", {
        name: `INV-${wo.item_to_manufacture}-${Date.now()}`,
        item_Id: itemId,
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

      if (wo.id) {
        try {
          const completedPayload = {
            ...buildPayload("Completed"),
            id: wo.id,
          };
          
          console.log("🔄 Updating Work Order to Completed after inventory posted:", completedPayload);
          await api.put("/work-order", completedPayload);
          
          setWo(prev => ({ ...prev, status: "Completed" }));
          
          setCompletionSummary(prev => (prev 
            ? { 
                ...prev, 
                inventoryPosting: false, 
                inventoryPosted: true,
                woStatusUpdated: true
              } 
            : prev));
            
        } catch (woErr: any) {
          console.error("Error updating work order status:", woErr);
          setCompletionSummary(prev => (prev
            ? { 
                ...prev, 
                inventoryPosting: false, 
                inventoryPosted: true,
                woStatusUpdated: false,
                inventoryError: "Inventory posted successfully, but failed to update Work Order status to Completed. Please try updating the status manually or contact support."
              }
            : prev));
        }
      }
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

  const updateItem = (rowId: string, field: keyof RequiredItemRow, value: string | number | undefined) =>
    setWo(prev => ({ ...prev, required_items: prev.required_items.map(r => r.id === rowId ? { ...r, [field]: value } : r) }));

  const availabilityFor = (itemCode: string) =>
    materialAvailability.find(m => m.item_code === itemCode);

  // ─── Validation ───────────────────────────────────────────────────────
  const validate = () => {
    const errs: { field: string; label: string; message: string }[] = [];

    if (wo.type === "internal") {
      if (!wo.bom_no.trim()) {
        errs.push({ field: "bom_no", label: "BOM", message: "Please select a BOM" });
      }
      if (!wo.item_to_manufacture.trim()) {
        errs.push({ field: "item_to_manufacture", label: "Item To Manufacture", message: "Required" });
      }
      if (wo.qty_to_manufacture <= 0) {
        errs.push({ field: "qty_to_manufacture", label: "Qty To Manufacture", message: "Must be greater than 0" });
      }
      if (materialConstraints.some(c => c.shortfall)) {
        const shortfalls = materialConstraints.filter(c => c.shortfall);
        const detail = shortfalls
          .map(c => `${c.item_name} (need ${c.required} ${c.uom}, have ${c.available} ${c.uom})`)
          .join("; ");
        errs.push({
          field: "qty_to_manufacture",
          label: "Material Availability",
          message: `Not enough stock to manufacture ${wo.qty_to_manufacture} ${wo.stock_uom}: ${detail}. Please add stock in Inventory${maxProducibleQty !== null ? `, or reduce the quantity to ${maxProducibleQty} ${wo.stock_uom} or below` : ""}.`,
        });
      }
    }

    if (wo.type === "external") {
      if (!wo.selected_grn_id) {
        errs.push({ field: "selected_grn_id", label: "GRN", message: "Please select a GRN" });
      }
      if (!wo.item_to_manufacture.trim()) {
        errs.push({ field: "item_to_manufacture", label: "Item To Manufacture", message: "Select an Operations Source BOM to set this" });
      }
      if (wo.qty_to_manufacture <= 0) {
        errs.push({ field: "qty_to_manufacture", label: "Qty To Manufacture", message: "Must be greater than 0" });
      }
      const hasRequiredItems = wo.required_items.some(item => item.item_code.trim() && item.required_qty > 0);
      if (!hasRequiredItems) {
        errs.push({ field: "required_items", label: "Required Items", message: "At least one required item with quantity is needed" });
      }
    }

    if (!wo.company.trim()) {
      errs.push({ field: "company", label: "Company", message: "Company is required" });
    }
    if (!wo.source_warehouse.trim()) {
      errs.push({ field: "source_warehouse", label: "Source Warehouse", message: "Required" });
    }
    if (!wo.target_warehouse.trim()) {
      errs.push({ field: "target_warehouse", label: "Target Warehouse (FG)", message: "Required" });
    }
    if (!wo.wip_warehouse.trim()) {
      errs.push({ field: "wip_warehouse", label: "WIP Warehouse", message: "Required" });
    }
    if (!wo.planned_start_date) {
      errs.push({ field: "planned_start_date", label: "Planned Start Date", message: "Required" });
    }

    const hasValidOperation = wo.operations.some(op => op.operation.trim() && op.workstation.trim());
    if (!hasValidOperation) {
      errs.push({ field: "operations", label: "Operations", message: "At least one operation with name and workstation is required" });
    }

    return errs;
  };

  // ─── Build payload ────────────────────────────────────────────────────
  const buildPayload = (overrideStatus?: Status): WOPayload => {
    const validOperations = wo.operations.filter(op => op.operation.trim() && op.workstation.trim());
    const firstOperationName = validOperations[0]?.operation || "";

    return {
      name: wo.name || "sc",
      company: wo.company || "SculptorTech",
      naming_series: "WO-.YYYY.-",
      production_item: wo.item_to_manufacture,
      bom_no: wo.bom_no,
      qty: wo.qty_to_manufacture,
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
      selected_grn_id: wo.selected_grn_id,
      type: wo.type === "internal" ? "Internal" : "External",
      sales_order: "",
      operations: validOperations.map((op, idx) => ({
        operation: op.operation,
        sequence_id: op.sequence_id || idx + 1,
        workstation: op.workstation,
        time_in_mins: op.time_in_mins,
      })),
      items: wo.required_items
        .filter(ri => ri.item_code.trim() && ri.required_qty > 0)
        .map(ri => ({
          item_id: ri.item_id ?? 0,
          item_code: ri.item_code,
          item_name: ri.item_name,
          required_qty: ri.required_qty,
          stock_uom: ri.uom,
          rate: ri.rate || 0,
          amount: ri.amount || 0,
          source_warehouse: ri.source_warehouse,
          operation: ri.operation || firstOperationName,
        })),
    };
  };

  // ─── Submit ───────────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (errs.length) {
      setValidationErrors(errs);
      const firstErrorField = errs[0]?.field;
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    setSubmitting(true);
    try {
      let response;

      const isUpdate = !isNew && wo.id !== undefined && wo.id !== null;

      if (isUpdate) {
        const updatePayload = {
          ...buildPayload(),
          id: wo.id,
        };

        console.log("🔄 Updating Work Order with ID:", wo.id);
        console.log("Update Payload:", updatePayload);

        response = await api.put("/work-order", updatePayload);

        if (response.data?.success === 1) {
          const workOrderId = wo.id;

          if (pendingMedia.length > 0 && workOrderId) {
            await uploadMediaFiles(pendingMedia.map(p => p.file), workOrderId);
            pendingMedia.forEach(p => URL.revokeObjectURL(p.url));
            setPendingMedia([]);
          }

          try {
            console.log("📋 Creating job cards for Work Order ID:", workOrderId);
            const jobCardResponse = await api.post(`/job-card/create-job-cards-from-wo/${workOrderId}`);
            console.log("📦 Job Card Response:", jobCardResponse.data);
            
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
            console.error("❌ Error creating job cards for update:", jobCardErr);
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
          }
          navigate("/work-order");
        } else {
          setApiError(response.data?.message || "Failed to update work order");
        }
      } else {
        console.log("✨ Creating new Work Order, type:", wo.type);
        response = await api.post("/work-order", buildPayload());

        if (response.data?.success === 1) {
          const workOrderId = response.data?.data?.workOrderId || response.data?.data?.insertId;
          console.log("📝 Work Order created with ID:", workOrderId);
          
          if (workOrderId) {
            if (pendingMedia.length > 0) {
              await uploadMediaFiles(pendingMedia.map(p => p.file), workOrderId);
              pendingMedia.forEach(p => URL.revokeObjectURL(p.url));
              setPendingMedia([]);
            }

            try {
              console.log("📋 Creating job cards for Work Order ID:", workOrderId);
              const jobCardResponse = await api.post(`/job-card/create-job-cards-from-wo/${workOrderId}`);
              console.log("📦 Job Card Response:", jobCardResponse.data);
              
              if (jobCardResponse.data?.success === 0) {
                const errorMessage = jobCardResponse.data?.message || "";

                if (errorMessage.toLowerCase().includes("insufficient stock") ||
                    errorMessage.toLowerCase().includes("insufficient material")) {
                  const itemMatch = errorMessage.match(/for\s+([A-Z0-9\-_]+)/i);
                  const itemName = itemMatch ? itemMatch[1] : "material";

                  setStockWarningModal({
                    show: true,
                    message: `Work Order has been created but remains in "Draft" status due to insufficient stock of "${itemName}". Please check your inventory levels and update the Work Order when stock is available.`,
                    itemName: itemName,
                    woId: workOrderId,
                  });

                  setWo(prev => ({ ...prev, status: "Draft" }));
                  setSubmitting(false);
                  return;
                } else {
                  console.warn("⚠️ Job card creation returned non-success:", errorMessage);
                }
              } else if (jobCardResponse.data?.success === 1) {
                console.log("✅ Job cards created successfully");
              }
            } catch (jobCardErr: any) {
              console.error("❌ Error creating job cards:", jobCardErr);
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
                  woId: workOrderId,
                });

                setWo(prev => ({ ...prev, status: "Draft" }));
                setSubmitting(false);
                return;
              }
            }
          }
          navigate("/work-order");
        } else {
          setApiError(response.data?.message || "Failed to create work order");
        }
      }
    } catch (err: any) {
      console.error("Error saving work order:", err);
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

  const handleCloseStockWarning = () => {
    setStockWarningModal({ show: false, message: "", itemName: "", woId: undefined });
    navigate("/work-order");
  };

  const totalRawMaterialCost = wo.required_items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find(e => e.field === field)?.message;
  };

  const hasFieldError = (field: string): boolean => {
    return !!getFieldError(field);
  };

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

        {/* Stock Warning Modal */}
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

        {/* Work Order Completion Summary Modal */}
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
                    <FaSpinner className="spinning" /> {completionSummary.readOnly ? "Loading production summary…" : "Fetching job card & preparing completion…"}
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
                          {completionSummary.processLossQty ?? 0}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                      Job Card #{completionSummary.jobCardId} · {completionSummary.itemName}
                    </div>

                    {!completionSummary.readOnly ? (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, marginBottom: 16 }}>
                          <div style={{ color: completionSummary.stockEntryPosted ? "#166534" : "#94a3b8" }}>
                            <FaCheckCircle style={{ marginRight: 6 }} />
                            Step 1: Stock entry posted (WIP → Finished Goods)
                          </div>
                          <div style={{ color: completionSummary.inventoryPosted ? "#166534" : "#94a3b8" }}>
                            <FaCheckCircle style={{ marginRight: 6 }} />
                            Step 2: Inventory updated
                          </div>
                          <div style={{ color: completionSummary.woStatusUpdated ? "#166534" : "#94a3b8" }}>
                            <FaCheckCircle style={{ marginRight: 6 }} />
                            Step 3: Work Order marked as Completed
                          </div>
                        </div>

                        {completionSummary.stockEntryError && (
                          <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>
                            {completionSummary.stockEntryError}
                          </div>
                        )}

                        {!completionSummary.stockEntryPosted && (
                          <button
                            type="button"
                            className="submit-btn"
                            onClick={handlePostStockEntry}
                            disabled={completionSummary.stockEntryPosting}
                            style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
                          >
                            {completionSummary.stockEntryPosting
                              ? <><FaSpinner className="spinning" /> Posting Stock Entry…</>
                              : <>Step 1: Add to Stock Entry (WIP → Finished Goods)</>}
                          </button>
                        )}

                        {completionSummary.inventoryError && (
                          <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>
                            {completionSummary.inventoryError}
                          </div>
                        )}

                        {completionSummary.stockEntryPosted && !completionSummary.inventoryPosted && (
                          <button
                            type="button"
                            className="submit-btn"
                            onClick={handlePostInventory}
                            disabled={completionSummary.inventoryPosting}
                            style={{ width: "100%", justifyContent: "center" }}
                          >
                            {completionSummary.inventoryPosting
                              ? <><FaSpinner className="spinning" /> Posting to Inventory & Completing WO…</>
                              : <>Step 2: Post {completionSummary.totalCompletedQty} {wo.stock_uom} to Inventory & Complete WO</>}
                          </button>
                        )}

                        {completionSummary.inventoryPosted && completionSummary.woStatusUpdated && (
                          <div style={{ color: "#166534", fontSize: 14, fontWeight: 600, textAlign: "center", padding: "12px", background: "#f0fdf4", borderRadius: 6, marginTop: 10 }}>
                            <FaCheckCircle style={{ marginRight: 6 }} />
                            Work Order #{wo.id} has been completed successfully!
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 12px" }}>
                        This Work Order is already completed.
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

        {/* Status Selector */}
        <div className="wof-status-bar">
          <label className="wof-label">Status</label>
          <div className="wof-status-selector">
            {STATUS_OPTIONS.map(s => (
              <button key={s} type="button"
                className={`wof-status-btn${wo.status === s ? " wof-status-btn-active" : ""}`}
                onClick={() => {
                  const alreadyCompleted = wo.status === "Completed";
                  set("status", s);
                  if (s === "Completed") {
                    if (alreadyCompleted) {
                      viewCompletionSummary();
                    } else {
                      handleWorkOrderCompletion();
                    }
                  }
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
            if (t.key === "grn_selection" && wo.type !== "external") return null;
            if (t.key === "production_item" && wo.type === "external") return null;
            return (
              <button key={t.key} type="button"
                className={`wof-tab-btn${activeTab === t.key ? " wof-tab-btn-active" : ""}`}
                onClick={() => {
                  setActiveTab(t.key);
                  if (t.key === "total_produced" && wo.id) {
                    loadTotalProducedData();
                  }
                }}>
                {t.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave}>

          {/* ══════════ TAB: GRN SELECTION (External WO) ══════════ */}
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

              {hasFieldError("selected_grn_id") && (
                <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '8px', marginBottom: '8px' }}>
                  {getFieldError("selected_grn_id")}
                </div>
              )}

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

                    <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 95, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Total Items</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{wo.selected_grn.total_items}</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 95, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ fontSize: 11, color: "#166534" }}>Received Qty</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#166534" }}>{wo.selected_grn.total_received_qty}</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 95, background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ fontSize: 11, color: "#1e40af" }}>Accepted Qty</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e40af" }}>{wo.selected_grn.total_accepted_qty}</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 95, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ fontSize: 11, color: "#991b1b" }}>Rejected Qty</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#991b1b" }}>{wo.selected_grn.total_rejected_qty}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Operations Source ── */}
                  <div className="wof-divider" />
                  <span className="wof-section-title">Operations Source</span>
                  <div style={{ marginTop: 10 }}>
                    <BomSearchField
                      value={selectedExternalBomLabel}
                      onSelect={handleSelectExternalBom}
                      onClear={handleClearExternalBom}
                      disabled={disabled}
                      filterType="External"
                      error={getFieldError("bom_no")}
                    />
                  </div>

                  {/* ── Production Details ── */}
                  <div className="wof-divider" />
                  <span className="wof-section-title">Production Details</span>
                  <div className="wof-grid-2" style={{ marginTop: 10 }}>
                    <div className="wof-field" data-field="item_to_manufacture">
                      <label className="wof-label">Item To Manufacture <span className="wof-required">*</span></label>
                      <input
                        type="text"
                        value={wo.item_name || wo.item_to_manufacture}
                        readOnly
                        className="form-field"
                        placeholder="Select an Operations Source BOM above to auto-fill"
                      />
                      <span className="wof-hint">Comes from the Operations Source BOM selected above.</span>
                      {hasFieldError("item_to_manufacture") && (
                        <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>
                          {getFieldError("item_to_manufacture")}
                        </div>
                      )}
                    </div>
                    <div className="wof-field" data-field="qty_to_manufacture">
                      <label className="wof-label">Qty To Manufacture <span className="wof-required">*</span></label>
                      <div className="input-group">
                        <DigitInput
                          value={wo.qty_to_manufacture}
                          onChange={v => set("qty_to_manufacture", v)}
                          placeholder="e.g. 100"
                          className="form-field"
                          disabled={disabled}
                          error={getFieldError("qty_to_manufacture")}
                        />
                      </div>
                      <span className="wof-hint">How many units this Work Order is producing.</span>
                    </div>
                  </div>

                  {/* ── Operations Table with Drag & Drop ── */}
                  <div className="wof-divider" />
                  <div className="wof-table-header">
                    <span className="wof-section-title wof-section-title-flush">
                      <FaCogs style={{ marginRight: 6 }} />
                      Operations To Perform <span className="wof-required">*</span>
                    </span>
                    <button type="button" className="wof-row-add-btn"
                      onClick={() => setWo(p => ({ ...p, operations: [...p.operations, emptyOp()] }))}>
                      <FaPlus size={10} /> Add Row
                    </button>
                  </div>
                  {hasFieldError("operations") && (
                    <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '8px', marginBottom: '8px' }}>
                      {getFieldError("operations")}
                    </div>
                  )}
                  <div className="wof-table-scroll">
                    <table className="wof-editable-table">
                      <thead>
                        <tr>
                          <th className="wof-col-drag" style={{ width: 30 }}></th>
                          <th className="wof-col-no">#</th>
                          <th>Operation <span className="wof-required">*</span></th>
                          <th>Workstation <span className="wof-required">*</span></th>
                          <th>Time (mins)</th>
                          <th>Hour Rate</th>
                          <th>Operating Cost</th>
                          <th className="wof-col-action" />
                        </tr>
                      </thead>
                      <tbody>
                        {wo.operations.map((op, idx) => (
                          <tr
                            key={op.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`wof-draggable-row ${dragOverIndex === idx ? 'wof-drag-over' : ''} ${dragIndex === idx ? 'wof-dragging' : ''}`}
                          >
                            <td className="wof-col-drag">
                              <FaGripVertical className="wof-drag-handle" size={14} />
                            </td>
                            <td className="wof-col-no">{idx + 1}</td>
                            <td>
                              <OperationPickerField
                                value={op.operation}
                                operations={operationMasters}
                                loading={operationsLoading}
                                disabled={disabled}
                                onTextChange={(text) => updateOp(op.id, "operation", text)}
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
                              <div className="input-group">
                                <DigitInput value={op.time_in_mins}
                                  onChange={v => updateOp(op.id, "time_in_mins", v)} disabled={disabled} />
                              </div>
                            </td>
                            <td>
                              <div className="input-group">
                                <DigitInput value={op.hour_rate}
                                  onChange={v => updateOp(op.id, "hour_rate", v)} disabled={disabled} />
                              </div>
                            </td>
                            <td>
                              <div className="input-group">
                                <DigitInput value={op.operating_cost}
                                  onChange={v => updateOp(op.id, "operating_cost", v)} disabled={disabled} />
                              </div>
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

                  {/* ── Required Items ── */}
                  <div className="wof-divider" />
                  <div className="wof-table-header">
                    <span className="wof-section-title wof-section-title-flush">Required Items <span className="wof-required">*</span></span>
                    <button type="button" className="wof-row-add-btn"
                      onClick={() => setWo(p => ({ ...p, required_items: [...p.required_items, emptyItem()] }))}>
                      <FaPlus size={10} /> Add Row
                    </button>
                  </div>
                  {hasFieldError("required_items") && (
                    <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '8px', marginBottom: '8px' }}>
                      {getFieldError("required_items")}
                    </div>
                  )}
                  <div className="wof-table-scroll">
                    <table className="wof-editable-table">
                      <thead>
                        <tr>
                          <th className="wof-col-no">#</th>
                          <th>Item</th>
                          <th>Operation</th>
                          <th>Source Warehouse <span className="wof-required">*</span></th>
                          <th>Required Qty <span className="wof-required">*</span></th>
                          <th>Available Qty</th>
                          <th>UOM</th>
                          <th>Rate</th>
                          <th>Amount</th>
                          <th className="wof-col-action" />
                        </tr>
                      </thead>
                      <tbody>
                        {wo.required_items.map((ri, idx) => {
                          const avail = availabilityFor(ri.item_code);
                          const shortfall = avail !== undefined && ri.required_qty > avail.received_qty;
                          return (
                            <tr key={ri.id}>
                              <td className="wof-col-no">{idx + 1}</td>
                              <td>
                                <ItemPickerField
                                  value={ri.item_code ? `${ri.item_name} (${ri.item_code})` : ""}
                                  items={rawItems}
                                  loading={rawItemsLoading}
                                  disabled={disabled}
                                  onSelect={(it) => {
                                    setWo(prev => ({
                                      ...prev,
                                      required_items: prev.required_items.map(r =>
                                        r.id === ri.id
                                          ? {
                                              ...r,
                                              item_id: it.id,
                                              item_code: it.item_code,
                                              item_name: it.item_name,
                                              uom: it.stock_uom,
                                              rate: it.standard_rate ?? it.valuation_rate ?? 0,
                                              operation: r.operation || "",
                                            }
                                          : r
                                      ),
                                    }));
                                  }}
                                />
                              </td>
                              <td>
                                <select
                                  value={ri.operation || ""}
                                  onChange={e => updateItem(ri.id, "operation", e.target.value)}
                                  className="form-field form-field-sm"
                                  disabled={disabled}
                                >
                                  <option value="">— none —</option>
                                  {wo.operations.filter(o => o.operation.trim()).map(o => (
                                    <option key={o.id} value={o.operation}>{o.operation}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input type="text" value={ri.source_warehouse}
                                  onChange={e => updateItem(ri.id, "source_warehouse", e.target.value)}
                                  className="form-field form-field-sm" disabled={disabled} />
                              </td>
                              <td>
                                <div className="input-group">
                                  <DigitInput value={ri.required_qty}
                                    onChange={v => updateItem(ri.id, "required_qty", v)} disabled={disabled} />
                                </div>
                              </td>
                              <td style={{ fontWeight: 600, color: shortfall ? "#b91c1c" : "#166534", whiteSpace: "nowrap" }}>
                                {avail ? avail.received_qty : "—"}
                                {shortfall && <FaExclamationTriangle style={{ marginLeft: 4 }} title="Required qty exceeds what's available" />}
                              </td>
                              <td>
                                <input type="text" value={ri.uom}
                                  onChange={e => updateItem(ri.id, "uom", e.target.value)}
                                  className="form-field form-field-sm" disabled={disabled} />
                              </td>
                              <td>
                                <div className="input-group">
                                  <DigitInput value={ri.rate || 0}
                                    onChange={v => updateItem(ri.id, "rate", v)} disabled={disabled} />
                                </div>
                              </td>
                              <td>
                                <div className="input-group">
                                  <DigitInput value={ri.amount || 0}
                                    onChange={v => updateItem(ri.id, "amount", v)} disabled={disabled} />
                                </div>
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

                  {/* ── Warehouses ── */}
                  <div className="wof-divider" />
                  <span className="wof-section-title">Warehouses <span className="wof-required">*</span></span>
                  <div className="wof-grid-3" style={{ marginTop: 10 }}>
                    <WarehouseSearchField 
                      label="Source Warehouse" 
                      value={wo.source_warehouse}
                      onChange={v => set("source_warehouse", v)} 
                      required 
                      disabled={disabled}
                      hint="Where raw materials are picked from" 
                      error={getFieldError("source_warehouse")}
                    />
                    <WarehouseSearchField 
                      label="WIP Warehouse" 
                      value={wo.wip_warehouse}
                      onChange={v => set("wip_warehouse", v)} 
                      required 
                      disabled={disabled}
                      hint="Where production operations happen" 
                      error={getFieldError("wip_warehouse")}
                    />
                    <WarehouseSearchField 
                      label="Target Warehouse (FG)" 
                      value={wo.target_warehouse}
                      onChange={v => set("target_warehouse", v)} 
                      required 
                      disabled={disabled}
                      hint="Where finished goods are stored" 
                      error={getFieldError("target_warehouse")}
                    />
                  </div>

                  {/* ── Media Attachments ── */}
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
                    <span className="wof-hint">
                      Upload product images, process videos, or inspection photos (optional).
                      {!wo.id && " These will be uploaded once the Work Order is saved."}
                    </span>
                  </div>

                  {/* ── Cost Summary ── */}
                  <div className="wof-divider" />
                  <div className="wof-cost-summary">
                    <div className="wof-section-title"> Cost Summary</div>
                    <div className="cost-summary-grid">
                      <div className="cost-card operation">
                        <div className="cost-label">
                          <span className="label-icon">⚙️</span> Operation Cost
                        </div>
                        <div className="cost-value">₹ {wo.planned_operating_cost.toFixed(2)}</div>
                        <div className="cost-sub">
                          {wo.operations.filter(op => op.operating_cost > 0).length} operations
                        </div>
                      </div>
                      <div className="cost-card total">
                        <div className="cost-label">
                          <span className="label-icon">📊</span> Lead Time
                        </div>
                        <div className="cost-value">{wo.lead_time_mins.toFixed(2)} mins</div>
                        <div className="cost-sub">
                          Total across all operations
                        </div>
                      </div>
                    </div>
                  </div>

                  {(pendingMedia.length > 0 || wo.media_files.length > 0) && (
                    <div className="wof-media-gallery">
                      {pendingMedia.map((file) => (
                        <div key={file.id} className="wof-media-item" style={{ position: "relative" }}>
                          {file.type === "image" ? (
                            <img src={file.url} alt={file.name} className="wof-media-preview" />
                          ) : (
                            <video src={file.url} className="wof-media-preview" controls />
                          )}
                          <span
                            style={{
                              position: "absolute",
                              top: 4,
                              left: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              background: "#fbbf24",
                              color: "#78350f",
                              padding: "1px 6px",
                              borderRadius: 3,
                            }}
                          >
                            Pending
                          </span>
                          <button
                            type="button"
                            className="wof-media-delete"
                            onClick={() => removePendingMedia(file.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
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
              ) : (
                <div className="wof-no-grn">
                  <p>No GRN selected. Please click "Select GRN" to choose a Goods Receipt Note.</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary, #6b7280)", marginTop: "8px" }}>
                    <FaInfoCircle /> {grnList.length} GRN{grnList.length === 1 ? "" : "s"} available in the system
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══════════ TAB 1: PRODUCTION ITEM (Internal WO) ══════════ */}
          {activeTab === "production_item" && wo.type === "internal" && (
            <div className="wof-card">

              <span className="wof-section-title">Bill of Materials</span>

              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <div data-field="bom_no">
                  <BomSearchField
                    value={selectedBomLabel || wo.bom_no}
                    onSelect={handleSelectBom}
                    onClear={handleClearBom}
                    disabled={disabled}
                    filterType="Internal"
                    error={getFieldError("bom_no")}
                  />
                </div>
                <div className="wof-field" data-field="qty_to_manufacture">
                  <label className="wof-label">Qty To Manufacture <span className="wof-required">*</span></label>
                  <div className="input-group">
                    <DigitInput
                      value={wo.qty_to_manufacture}
                      onChange={v => set("qty_to_manufacture", v)}
                      placeholder="e.g. 100"
                      className="form-field"
                      disabled={disabled}
                      error={getFieldError("qty_to_manufacture")}
                    />
                  </div>
                  {bomDetail && (
                    <span className="wof-hint">
                      BOM base: {bomDetail.bom.quantity} {bomDetail.bom.uom} — rows scale automatically
                    </span>
                  )}
                  {bomDetail && maxProducibleQty !== null && (
                    <span
                      className="wof-hint"
                      style={{
                        display: "block",
                        marginTop: 4,
                        fontWeight: 600,
                        color: materialConstraints.some(c => c.shortfall) ? "#b91c1c" : "#166534",
                      }}
                    >
                      <FaBoxOpen style={{ marginRight: 4 }} />
                      Can make up to {maxProducibleQty} {wo.stock_uom} from current stock
                    </span>
                  )}
                </div>
              </div>

              {bomLoading && (
                <div className="wof-hint" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <FaSpinner className="spinning" /> Loading BOM details…
                </div>
              )}

              {materialConstraints.some(c => c.shortfall) && (
                <div style={{
                  marginTop: 10, background: "#fef2f2", border: "1px solid #fca5a5",
                  borderRadius: 6, padding: "10px 12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#991b1b", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    <FaExclamationTriangle /> Not enough stock to manufacture {wo.qty_to_manufacture} {wo.stock_uom}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: "#7f1d1d" }}>
                    {materialConstraints.filter(c => c.shortfall).map(c => (
                      <li key={c.item_code}>
                        {c.item_name} ({c.item_code}): need {c.required} {c.uom}, only {c.available} {c.uom} available
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontSize: 12, color: "#7f1d1d", marginTop: 6 }}>
                    Please add stock in Inventory{maxProducibleQty !== null ? `, or reduce the quantity to ${maxProducibleQty} ${wo.stock_uom} or below` : ""}.
                  </div>
                </div>
              )}

              <div className="wof-divider" />
              <span className="wof-section-title">Warehouses <span className="wof-required">*</span></span>

              <div className="wof-grid-3" style={{ marginTop: 10 }}>
                <WarehouseSearchField 
                  label="Source Warehouse" 
                  value={wo.source_warehouse}
                  onChange={v => set("source_warehouse", v)} 
                  required 
                  disabled={disabled}
                  hint="Where raw materials are picked from" 
                  error={getFieldError("source_warehouse")}
                />
                <WarehouseSearchField 
                  label="WIP Warehouse" 
                  value={wo.wip_warehouse}
                  onChange={v => set("wip_warehouse", v)} 
                  required 
                  disabled={disabled}
                  hint="Where production operations happen" 
                  error={getFieldError("wip_warehouse")}
                />
                <WarehouseSearchField 
                  label="Target Warehouse (FG)" 
                  value={wo.target_warehouse}
                  onChange={v => set("target_warehouse", v)} 
                  required 
                  disabled={disabled}
                  hint="Where finished goods are stored" 
                  error={getFieldError("target_warehouse")}
                />
              </div>

              <div className="wof-divider" />

              {/* ── Operations Table with Drag & Drop ── */}
              <div className="wof-table-header">
                <span className="wof-section-title wof-section-title-flush">Operations <span className="wof-required">*</span></span>
                <button type="button" className="wof-row-add-btn" onClick={() => setWo(p => ({ ...p, operations: [...p.operations, emptyOp()] }))}>
                  <FaPlus size={10} /> Add Row
                </button>
              </div>
              {hasFieldError("operations") && (
                <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '8px', marginBottom: '8px' }}>
                  {getFieldError("operations")}
                </div>
              )}
              <div className="wof-table-scroll">
                <table className="wof-editable-table">
                  <thead>
                    <tr>
                      <th className="wof-col-drag" style={{ width: 30 }}></th>
                      <th className="wof-col-no">#</th>
                      <th>Operation <span className="wof-required">*</span></th>
                      <th>Workstation <span className="wof-required">*</span></th>
                      <th>Time (mins)</th>
                      <th>Hour Rate</th>
                      <th>Operating Cost</th>
                      <th className="wof-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {wo.operations.map((op, idx) => (
                      <tr
                        key={op.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`wof-draggable-row ${dragOverIndex === idx ? 'wof-drag-over' : ''} ${dragIndex === idx ? 'wof-dragging' : ''}`}
                      >
                        <td className="wof-col-drag">
                          <FaGripVertical className="wof-drag-handle" size={14} />
                        </td>
                        <td className="wof-col-no">{idx + 1}</td>
                        <td>
                          <OperationPickerField
                            value={op.operation}
                            operations={operationMasters}
                            loading={operationsLoading}
                            disabled={disabled}
                            onTextChange={(text) => updateOp(op.id, "operation", text)}
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
                            className="form-field form-field-sm" placeholder="e.g. CNC Machine 1" disabled={disabled} />
                        </td>
                        <td>
                          <div className="input-group">
                            <DigitInput value={op.time_in_mins}
                              onChange={v => updateOp(op.id, "time_in_mins", v)} disabled={disabled} />
                          </div>
                        </td>
                        <td>
                          <div className="input-group">
                            <DigitInput value={op.hour_rate}
                              onChange={v => updateOp(op.id, "hour_rate", v)} disabled={disabled} />
                          </div>
                        </td>
                        <td>
                          <div className="input-group">
                            <DigitInput value={op.operating_cost}
                              onChange={v => updateOp(op.id, "operating_cost", v)} disabled={disabled} />
                          </div>
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
                      <th>Item</th>
                      <th>Operation</th>
                      <th>Source Warehouse</th>
                      <th>Required Qty</th>
                      <th>Available Qty</th>
                      <th>UOM</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th className="wof-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {wo.required_items.map((ri, idx) => {
                      const bomConstraint = materialConstraints.find(c => c.item_code === ri.item_code);
                      return (
                        <tr key={ri.id}>
                          <td className="wof-col-no">{idx + 1}</td>
                          <td>
                            <ItemPickerField
                              value={ri.item_code ? `${ri.item_name} (${ri.item_code})` : ""}
                              items={rawItems}
                              loading={rawItemsLoading}
                              disabled={disabled}
                              onSelect={(it) => {
                                setWo(prev => ({
                                  ...prev,
                                  required_items: prev.required_items.map(r =>
                                    r.id === ri.id
                                      ? {
                                          ...r,
                                          item_id: it.id,
                                          item_code: it.item_code,
                                          item_name: it.item_name,
                                          uom: it.stock_uom,
                                          rate: it.standard_rate ?? it.valuation_rate ?? 0,
                                          operation: r.operation || "",
                                        }
                                      : r
                                  ),
                                }));
                              }}
                            />
                          </td>
                          <td>
                            <select
                              value={ri.operation || ""}
                              onChange={e => updateItem(ri.id, "operation", e.target.value)}
                              className="form-field form-field-sm"
                              disabled={disabled}
                            >
                              <option value="">— none —</option>
                              {wo.operations.filter(o => o.operation.trim()).map(o => (
                                <option key={o.id} value={o.operation}>{o.operation}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={ri.source_warehouse}
                              onChange={e => updateItem(ri.id, "source_warehouse", e.target.value)}
                              className="form-field form-field-sm" placeholder="e.g. Raw Material Store" disabled={disabled} />
                          </td>
                          <td>
                            <div className="input-group">
                              <DigitInput value={ri.required_qty}
                                onChange={v => updateItem(ri.id, "required_qty", v)} disabled={disabled} />
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: bomConstraint?.shortfall ? "#b91c1c" : "#166534", whiteSpace: "nowrap" }}>
                            {bomConstraint ? bomConstraint.available : "—"}
                            {bomConstraint?.shortfall && <FaExclamationTriangle style={{ marginLeft: 4 }} title="Required qty exceeds what's in stock" />}
                          </td>
                          <td>
                            <input type="text" value={ri.uom}
                              onChange={e => updateItem(ri.id, "uom", e.target.value)}
                              className="form-field form-field-sm" placeholder="Nos" disabled={disabled} />
                          </td>
                          <td>
                            <div className="input-group">
                              <DigitInput value={ri.rate || 0}
                                onChange={v => updateItem(ri.id, "rate", v)} disabled={disabled} />
                            </div>
                          </td>
                          <td>
                            <div className="input-group">
                              <DigitInput value={ri.amount || 0}
                                onChange={v => updateItem(ri.id, "amount", v)} disabled={disabled} />
                            </div>
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

              <div className="wof-divider" />

              {/* ── Cost Summary Card ── */}
              <div className="wof-cost-summary">
                <div className="wof-section-title"> Cost Summary</div>

                <div className="cost-summary-grid">
                  <div className="cost-card material">
                    <div className="cost-label">
                      <span className="label-icon">📦</span> Raw Material Cost
                    </div>
                    <div className="cost-value">₹ {totalRawMaterialCost.toFixed(2)}</div>
                    <div className="cost-sub">
                      {wo.required_items.filter(item => item.amount && item.amount > 0).length} items
                    </div>
                  </div>

                  <div className="cost-card operation">
                    <div className="cost-label">
                      <span className="label-icon">⚙️</span> Operation Cost
                    </div>
                    <div className="cost-value">₹ {wo.planned_operating_cost.toFixed(2)}</div>
                    <div className="cost-sub">
                      {wo.operations.filter(op => op.operating_cost > 0).length} operations
                    </div>
                  </div>

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

              {/* ── Media Upload Section ── */}
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
                <span className="wof-hint">
                  Upload product images, process videos, or inspection photos (optional).
                  {!wo.id && " These will be uploaded once the Work Order is saved."}
                </span>
              </div>

              {(pendingMedia.length > 0 || wo.media_files.length > 0) && (
                <div className="wof-media-gallery">
                  {pendingMedia.map((file) => (
                    <div key={file.id} className="wof-media-item" style={{ position: "relative" }}>
                      {file.type === "image" ? (
                        <img src={file.url} alt={file.name} className="wof-media-preview" />
                      ) : (
                        <video src={file.url} className="wof-media-preview" controls />
                      )}
                      <span
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: "#fbbf24",
                          color: "#78350f",
                          padding: "1px 6px",
                          borderRadius: 3,
                        }}
                      >
                        Pending
                      </span>
                      <button
                        type="button"
                        className="wof-media-delete"
                        onClick={() => removePendingMedia(file.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
                <div className="wof-field" data-field="planned_start_date">
                  <DatePickerField
                    label="Planned Start Date"
                    value={wo.planned_start_date}
                    onChange={v => set("planned_start_date", v)}
                    required
                    disabled={disabled}
                    error={getFieldError("planned_start_date")}
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

              {/* ── Company Field ── */}
              <div className="wof-divider" />
              <span className="wof-section-title">Company Details</span>
              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <div className="wof-field" data-field="company">
                  <label className="wof-label">Company <span className="wof-required">*</span></label>
                  <input
                    type="text"
                    value={wo.company}
                    onChange={e => set("company", e.target.value)}
                    className="form-field"
                    placeholder="Enter company name"
                    disabled={disabled}
                  />
                  {hasFieldError("company") && (
                    <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>
                      {getFieldError("company")}
                    </div>
                  )}
                </div>
                <div className="wof-field">
                  <label className="wof-label">Stock UOM</label>
                  <input
                    type="text"
                    value={wo.stock_uom}
                    onChange={e => set("stock_uom", e.target.value)}
                    className="form-field"
                    placeholder="e.g. Nos"
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* ── Transfer Material Against ── */}
              <div className="wof-divider" />
              <span className="wof-section-title">Transfer Settings</span>
              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <div className="wof-field">
                  <label className="wof-label">Transfer Material Against</label>
                  <select
                    value={wo.transfer_material_against}
                    onChange={e => set("transfer_material_against", e.target.value as "Work Order" | "Job Card")}
                    className="form-field"
                    disabled={disabled}
                  >
                    <option value="Work Order">Work Order</option>
                    <option value="Job Card">Job Card</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 4: TOTAL PRODUCED ══════════ */}
          {activeTab === "total_produced" && (
            <div className="wof-card">
              <span className="wof-section-title">Production Progress</span>
              
              {/* Progress bar for items produced using job card data */}
              <div className="wof-progress-block" style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Items Produced
                  </span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {completionSummary?.totalCompletedQty || wo.manufactured_qty || 0} / {wo.qty_to_manufacture} {wo.stock_uom}
                  </span>
                </div>
                <div className="wof-progress-bar">
                  <div 
                    className="wof-progress-fill"
                    style={{ 
                      width: `${wo.qty_to_manufacture > 0 
                        ? Math.min(100, Math.max(0, ((completionSummary?.totalCompletedQty || wo.manufactured_qty || 0) / wo.qty_to_manufacture) * 100)) 
                        : 0}%` 
                    }} 
                  />
                </div>
                <span className="wof-progress-label">
                  {wo.qty_to_manufacture > 0 
                    ? `${Math.round(((completionSummary?.totalCompletedQty || wo.manufactured_qty || 0) / wo.qty_to_manufacture) * 100)}% complete` 
                    : "0% complete"}
                </span>
              </div>

              {/* Progress bar for operations */}
              <div className="wof-progress-block" style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Operations Completed
                  </span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {wo.completed_operations.length} / {wo.operations.length}
                  </span>
                </div>
                <div className="wof-progress-bar">
                  <div 
                    className="wof-progress-fill"
                    style={{ 
                      width: wo.operations.length > 0 
                        ? `${(wo.completed_operations.length / wo.operations.length) * 100}%` 
                        : "0%" 
                    }} 
                  />
                </div>
                <span className="wof-progress-label">
                  Completed Operations: <strong>{wo.completed_operations.join(", ") || "None"}</strong>
                </span>
              </div>

              <div className="wof-divider" />

              {/* Job Card Production Summary */}
              <span className="wof-section-title">Job Card Production Summary</span>
              
              {completionSummary && (completionSummary.totalCompletedQty !== undefined && (completionSummary.totalCompletedQty > 0 || (completionSummary.processLossQty ?? 0) > 0)) ? (
                <>
                  <div style={{ display: "flex", gap: 16, marginTop: 16, marginBottom: 16 }}>
                    <div style={{ 
                      flex: 1, 
                      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", 
                      border: "1px solid #86efac", 
                      borderRadius: 12, 
                      padding: 20,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 8, 
                        marginBottom: 8 
                      }}>
                        <FaCheckCircle style={{ color: "#16a34a", fontSize: 18 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>
                          End Product
                        </span>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#166534", marginBottom: 4 }}>
                        {completionSummary.totalCompletedQty}
                      </div>
                      <div style={{ fontSize: 12, color: "#15803d" }}>
                        {wo.stock_uom} completed from job cards
                      </div>
                    </div>

                    <div style={{ 
                      flex: 1, 
                      background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", 
                      border: "1px solid #fca5a5", 
                      borderRadius: 12, 
                      padding: 20,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 8, 
                        marginBottom: 8 
                      }}>
                        <FaExclamationTriangle style={{ color: "#dc2626", fontSize: 18 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
                          Scrap / Loss
                        </span>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>
                        {completionSummary.processLossQty ?? 0}
                      </div>
                      <div style={{ fontSize: 12, color: "#b91c1c" }}>
                        {wo.qty_to_manufacture > 0 
                          ? `${(((completionSummary.processLossQty ?? 0) / wo.qty_to_manufacture) * 100).toFixed(1)}% of target qty` 
                          : "0% of target qty"}
                      </div>
                    </div>
                  </div>

                  {/* Efficiency metrics */}
                  <div style={{ 
                    background: "#f8fafc", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: 8, 
                    padding: 16,
                    marginTop: 8
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                      Production Efficiency
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                          Yield Rate
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#059669" }}>
                          {wo.qty_to_manufacture > 0 
                            ? `${(((completionSummary.totalCompletedQty) / wo.qty_to_manufacture) * 100).toFixed(1)}%` 
                            : "0%"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                          Scrap Rate
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#dc2626" }}>
                          {wo.qty_to_manufacture > 0 
                            ? `${(((completionSummary.processLossQty ?? 0) / wo.qty_to_manufacture) * 100).toFixed(1)}%` 
                            : "0%"}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ 
                  marginTop: 16, 
                  padding: 32, 
                  textAlign: "center", 
                  color: "#64748b",
                  background: "#f8fafc",
                  border: "2px dashed #e2e8f0",
                  borderRadius: 8
                }}>
                  <FaBoxOpen style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    No production data available yet
                  </div>
                  <div style={{ fontSize: 12 }}>
                    Job card completion data will appear here once production starts
                  </div>
                  {wo.status === "Completed" && (
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={viewCompletionSummary}
                      style={{ marginTop: 12 }}
                    >
                      <FaCheckCircle style={{ marginRight: 6 }} />
                      Load Completion Data
                    </button>
                  )}
                </div>
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
              {isNew ? "Create" : "Save"}
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