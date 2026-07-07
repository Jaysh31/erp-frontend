// WorkOrderForm.tsx
import { useState, type FormEvent, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaExclamationTriangle,
  FaInfoCircle, FaTimesCircle, FaPlus, FaTrash,
  FaPaperPlane, FaSearch, FaSyncAlt, FaBuilding, FaTruck,
  FaImage, FaVideo, FaCalendarAlt,
} from "react-icons/fa";
import "./WorkOrderForm.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";

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

interface GRNItem {
  id: number;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse: string;
}

interface GRNData {
  id: number;
  name: string;
  supplier: string;
  date: string;
  items: GRNItem[];
  total_qty: number;
  total_amount: number;
  status: string;
  po_number?: string;
  delivery_note?: string;
}

interface WorkOrderData {
  id?: number;
  name: string;
  status: Status;
  order_type: OrderType;
  // Core
  company: string;
  qty_to_manufacture: number;
  item_to_manufacture: string;
  item_name: string;
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
  planned_end_date: string;
  actual_start_date: string;
  actual_end_date: string;
  expected_delivery_date: string;
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
  grn_items?: GRNItem[];
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
  planned_end_date: string;
  expected_delivery_date: string;
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
  _user_tags: string;
  _comments: string;
  _assign: string;
  _liked_by: string;
  _seen: string;
  // External WO fields
  customer_name?: string;
  customer_po?: string;
  selected_grn_id?: number;
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

type TabKey = "production_item" | "configuration" | "more_info" | "total_produced" | "grn_selection";
const TABS: { key: TabKey; label: string }[] = [
  { key: "production_item", label: "Production Item" },
  { key: "configuration", label: "Configuration" },
  { key: "more_info", label: "More Info" },
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
  name: "", status: "Draft", order_type: "internal",
  company: "", qty_to_manufacture: 0, item_to_manufacture: "", item_name: "", stock_uom: "Nos",
  bom_no: "",
  material_transferred_for_manufacturing: 0, manufactured_qty: 0,
  additional_transferred_qty: 0, disassembled_qty: 0,
  source_warehouse: "", target_warehouse: "", wip_warehouse: "",
  transfer_material_against: "Work Order",
  operations: [emptyOp()],
  required_items: [emptyItem()],
  planned_start_date: new Date().toISOString().split("T")[0],
  planned_end_date: "",
  actual_start_date: "", actual_end_date: "", expected_delivery_date: "",
  lead_time_mins: 0, planned_operating_cost: 0, actual_operating_cost: 0,
  additional_operating_cost: 0, corrective_operation_cost: 0,
  comments: [], activity: [],
  items_produced_pct: 0, completed_operations: [],
  stock_entry_count: 0, job_card_count: 0, pick_list_count: 0,
  serial_no_count: 0, batch_count: 0, material_request_count: 0,
  media_files: [],
});

// ─── Hardcoded GRN Data ──────────────────────────────────────────────────────

const HARDCODED_GRNS: GRNData[] = [
  {
    id: 1001,
    name: "GRN-2026-001",
    supplier: "ABC Engineering Supplies",
    date: "2026-07-01",
    po_number: "PO-2026-0042",
    delivery_note: "DN-2026-0089",
    status: "Received",
    total_qty: 150,
    total_amount: 42500,
    items: [
      {
        id: 1,
        item_code: "MS_Hex_Bolt_M12_100",
        item_name: "MS Hex Bolt M12 x 100mm",
        qty: 50,
        uom: "Nos",
        rate: 150,
        amount: 7500,
        warehouse: "Raw Material Store"
      },
      {
        id: 2,
        item_code: "MS_Hex_Nut_M12",
        item_name: "MS Hex Nut M12",
        qty: 100,
        uom: "Nos",
        rate: 45,
        amount: 4500,
        warehouse: "Raw Material Store"
      }
    ]
  },
  {
    id: 1002,
    name: "GRN-2026-002",
    supplier: "Precision Metal Works",
    date: "2026-07-03",
    po_number: "PO-2026-0056",
    delivery_note: "DN-2026-0094",
    status: "Received",
    total_qty: 80,
    total_amount: 125000,
    items: [
      {
        id: 3,
        item_code: "SS_Plate_316_5mm",
        item_name: "Stainless Steel Plate 316 5mm",
        qty: 20,
        uom: "Kg",
        rate: 4500,
        amount: 90000,
        warehouse: "Raw Material Store"
      },
      {
        id: 4,
        item_code: "Alu_Sheet_2mm",
        item_name: "Aluminum Sheet 2mm",
        qty: 60,
        uom: "Kg",
        rate: 583.33,
        amount: 35000,
        warehouse: "Raw Material Store"
      }
    ]
  },
  {
    id: 1003,
    name: "GRN-2026-003",
    supplier: "Electronic Components Ltd",
    date: "2026-07-05",
    po_number: "PO-2026-0068",
    delivery_note: "DN-2026-0102",
    status: "Received",
    total_qty: 500,
    total_amount: 87500,
    items: [
      {
        id: 5,
        item_code: "PCB_Controller_v2",
        item_name: "PCB Controller Board v2.0",
        qty: 250,
        uom: "Pcs",
        rate: 250,
        amount: 62500,
        warehouse: "Electronic Store"
      },
      {
        id: 6,
        item_code: "Wire_Harness_12C",
        item_name: "Wire Harness 12 Core",
        qty: 250,
        uom: "Mtr",
        rate: 100,
        amount: 25000,
        warehouse: "Electronic Store"
      }
    ]
  },
  {
    id: 1004,
    name: "GRN-2026-004",
    supplier: "Fastener World Inc",
    date: "2026-07-08",
    po_number: "PO-2026-0074",
    delivery_note: "DN-2026-0115",
    status: "Received",
    total_qty: 1000,
    total_amount: 28000,
    items: [
      {
        id: 7,
        item_code: "Machine_Screw_M4_20mm",
        item_name: "Machine Screw M4 x 20mm",
        qty: 500,
        uom: "Nos",
        rate: 12,
        amount: 6000,
        warehouse: "Raw Material Store"
      },
      {
        id: 8,
        item_code: "Washer_Spring_M4",
        item_name: "Spring Washer M4",
        qty: 500,
        uom: "Nos",
        rate: 44,
        amount: 22000,
        warehouse: "Raw Material Store"
      }
    ]
  },
  {
    id: 1005,
    name: "GRN-2026-005",
    supplier: "Industrial Paints & Chemicals",
    date: "2026-07-10",
    po_number: "PO-2026-0082",
    delivery_note: "DN-2026-0128",
    status: "Received",
    total_qty: 200,
    total_amount: 65000,
    items: [
      {
        id: 9,
        item_code: "Paint_Red_Oxide_5L",
        item_name: "Red Oxide Paint 5L",
        qty: 100,
        uom: "Ltr",
        rate: 350,
        amount: 35000,
        warehouse: "Chemical Store"
      },
      {
        id: 10,
        item_code: "Thinner_General_5L",
        item_name: "General Thinner 5L",
        qty: 100,
        uom: "Ltr",
        rate: 300,
        amount: 30000,
        warehouse: "Chemical Store"
      }
    ]
  },
  {
    id: 1006,
    name: "GRN-2026-006",
    supplier: "Advanced Machining Solutions",
    date: "2026-07-12",
    po_number: "PO-2026-0093",
    delivery_note: "DN-2026-0137",
    status: "Received",
    total_qty: 30,
    total_amount: 210000,
    items: [
      {
        id: 11,
        item_code: "CNC_Tool_Holder_HSK63",
        item_name: "CNC Tool Holder HSK63",
        qty: 10,
        uom: "Pcs",
        rate: 12000,
        amount: 120000,
        warehouse: "Tool Store"
      },
      {
        id: 12,
        item_code: "Carbide_Insert_CNMG1204",
        item_name: "Carbide Insert CNMG 120408",
        qty: 20,
        uom: "Box",
        rate: 4500,
        amount: 90000,
        warehouse: "Tool Store"
      }
    ]
  },
  {
    id: 1007,
    name: "GRN-2026-007",
    supplier: "Packaging Solutions Ltd",
    date: "2026-07-15",
    po_number: "PO-2026-0101",
    delivery_note: "DN-2026-0145",
    status: "Received",
    total_qty: 1000,
    total_amount: 120000,
    items: [
      {
        id: 13,
        item_code: "Carton_Box_30x20x15",
        item_name: "Carton Box 30x20x15 cm",
        qty: 500,
        uom: "Pcs",
        rate: 180,
        amount: 90000,
        warehouse: "Packaging Store"
      },
      {
        id: 14,
        item_code: "Foam_Sheet_5mm",
        item_name: "Foam Sheet 5mm",
        qty: 500,
        uom: "Sheet",
        rate: 60,
        amount: 30000,
        warehouse: "Packaging Store"
      }
    ]
  }
];

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
                const isDisabled = (min && dateStr < min) || (max && dateStr > max);

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
  const [newComment, setNewComment] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; label: string; message: string }[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  // GRN state
  const [grnList, setGrnList] = useState<GRNData[]>(HARDCODED_GRNS);
  const [grnLoading, setGrnLoading] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);

  // BOM state
  const [selectedBomLabel, setSelectedBomLabel] = useState("");
  const [bomDetail, setBomDetail] = useState<{ bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] } | null>(null);
  const [bomLoading, setBomLoading] = useState(false);

  // Media upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const disabled = submitting || loading;

  // ─── Load GRNs ──────────────────────────────────────────────────────
  const loadGRNs = async () => {
    setGrnLoading(true);
    try {
      // Try to fetch from API first, fallback to hardcoded
      const response = await api.get("/grn?status=received");
      if (response.data?.success === 1) {
        const apiGrns = response.data.data?.records || [];
        if (apiGrns.length > 0) {
          setGrnList(apiGrns);
        } else {
          // If API returns empty, use hardcoded
          setGrnList(HARDCODED_GRNS);
        }
      } else {
        // If API fails, use hardcoded
        setGrnList(HARDCODED_GRNS);
      }
    } catch (err) {
      console.log("Using hardcoded GRN data");
      setGrnList(HARDCODED_GRNS);
    } finally {
      setGrnLoading(false);
    }
  };

  useEffect(() => {
    if (wo.order_type === "external") {
      loadGRNs();
      setActiveTab("grn_selection");
    }
  }, [wo.order_type]);

  // ─── Load existing WO ────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      api.get(`/work-order/${id}`)
        .then(r => {
          if (r.data.success === 1) {
            const d = r.data.data;
            setWo(prev => ({
              ...prev, ...d,
              planned_start_date: d.planned_start_date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
              planned_end_date: d.planned_end_date?.split("T")[0] ?? "",
              actual_start_date: d.actual_start_date?.split("T")[0] ?? "",
              actual_end_date: d.actual_end_date?.split("T")[0] ?? "",
              expected_delivery_date: d.expected_delivery_date?.split("T")[0] ?? "",
              operations: d.operations?.length ? d.operations : [emptyOp()],
              required_items: d.required_items?.length ? d.required_items : [emptyItem()],
            }));
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

  // Re-scale when qty changes and BOM is loaded
  useEffect(() => {
    if (bomDetail && wo.qty_to_manufacture > 0) {
      applyBomToWo(bomDetail, wo.qty_to_manufacture);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo.qty_to_manufacture]);

  // ─── GRN Selection ────────────────────────────────────────────────────
  const handleSelectGRN = (grn: GRNData) => {
    // Get the first item's warehouse as source
    const sourceWarehouse = grn.items.length > 0 ? grn.items[0].warehouse : "";
    
    setWo(prev => ({
      ...prev,
      selected_grn_id: grn.id,
      grn_items: grn.items,
      customer_name: grn.supplier,
      customer_po: grn.po_number || "",
      source_warehouse: prev.source_warehouse || sourceWarehouse,
      // Auto-fill item from GRN if only one item
      ...(grn.items.length === 1 ? {
        item_to_manufacture: grn.items[0].item_code,
        item_name: grn.items[0].item_name,
        qty_to_manufacture: grn.items[0].qty,
        stock_uom: grn.items[0].uom,
      } : {}),
    }));
    setShowGrnModal(false);
  };

  // ─── Media Upload ─────────────────────────────────────────────────────
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("media", files[i]);
    }

    try {
      const response = await api.post("/work-order/media", formData, {
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

  // ─── Field helpers ────────────────────────────────────────────────────
  const set = <K extends keyof WorkOrderData>(k: K, v: WorkOrderData[K]) =>
    setWo(prev => ({ ...prev, [k]: v }));

  const updateOp = (rowId: string, field: keyof OperationRow, value: string | number) =>
    setWo(prev => ({ ...prev, operations: prev.operations.map(o => o.id === rowId ? { ...o, [field]: value } : o) }));

  const updateItem = (rowId: string, field: keyof RequiredItemRow, value: string | number) =>
    setWo(prev => ({ ...prev, required_items: prev.required_items.map(r => r.id === rowId ? { ...r, [field]: value } : r) }));

  // ─── Validation ───────────────────────────────────────────────────────
  const validate = () => {
    const errs: { field: string; label: string; message: string }[] = [];
    if (!wo.bom_no.trim()) errs.push({ field: "bom_no", label: "BOM", message: "Please select a BOM" });
    if (!wo.item_to_manufacture.trim()) errs.push({ field: "item_to_manufacture", label: "Item To Manufacture", message: "Required" });
    if (wo.qty_to_manufacture <= 0) errs.push({ field: "qty_to_manufacture", label: "Qty To Manufacture", message: "Must be > 0" });
    if (!wo.target_warehouse.trim()) errs.push({ field: "target_warehouse", label: "Target Warehouse (FG)", message: "Required" });
    if (!wo.wip_warehouse.trim()) errs.push({ field: "wip_warehouse", label: "WIP Warehouse", message: "Required" });
    if (!wo.planned_start_date) errs.push({ field: "planned_start_date", label: "Planned Start Date", message: "Required" });
    return errs;
  };

  // ─── Build payload ────────────────────────────────────────────────────
  const buildPayload = (): WOPayload => ({
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
    planned_end_date: wo.planned_end_date,
    expected_delivery_date: wo.expected_delivery_date,
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
    status: wo.status,
    track_semi_finished_goods: 0,
    amended_from: "",
    _user_tags: "", _comments: "", _assign: "", _liked_by: "", _seen: "",
    customer_name: wo.customer_name,
    customer_po: wo.customer_po,
    selected_grn_id: wo.selected_grn_id,
  });

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
      return;
    }
    setSubmitting(true);
    try {
      let response;
      if (isNew) {
        response = await api.post("/work-order", buildPayload());
        if (response.data?.success === 1) {
          const insertId = response.data?.data?.insertId;
          if (insertId) {
            try {
              const jobCardResponse = await api.post(`/job-card/create-job-cards-from-wo/${insertId}`);
              if (jobCardResponse.data?.success === 1) {
                console.log("✅ Job cards created successfully");
              } else {
                console.warn("⚠️ Job card creation returned non-success");
              }
            } catch (jobCardErr) {
              console.error("❌ Error creating job cards:", jobCardErr);
            }
          }
          navigate("/work-order");
        } else {
          setApiError(response.data?.message || "Failed to create work order");
        }
      } else {
        response = await api.post(`/work-order`, buildPayload());
        if (response.data?.success === 1) {
          const workOrderId = id || response.data?.data?.insertId || response.data?.data?.id;
          if (workOrderId) {
            try {
              await api.post(`/job-card/create-job-cards-from-wo/${workOrderId}`);
            } catch (jobCardErr) {
              console.error("❌ Error creating job cards for update:", jobCardErr);
            }
          }
          navigate("/work-order");
        } else {
          setApiError(response.data?.message || "Failed to update work order");
        }
      }
    } catch (err: any) {
      console.error("Error saving work order:", err);
      setApiError(err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            className={`order-type-btn ${wo.order_type === "internal" ? "active" : ""}`}
            onClick={() => set("order_type", "internal")}
            disabled={disabled}
          >
            <FaBuilding /> Internal WO
          </button>
          <button
            type="button"
            className={`order-type-btn ${wo.order_type === "external" ? "active" : ""}`}
            onClick={() => set("order_type", "external")}
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
                onClick={() => set("status", s)} disabled={disabled}>
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
            if (t.key === "grn_selection" && wo.order_type !== "external") return null;
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
          {activeTab === "grn_selection" && wo.order_type === "external" && (
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

              {wo.selected_grn_id ? (
                <div className="wof-selected-grn">
                  <div className="wof-grn-info">
                    <div className="wof-grn-row">
                      <span className="wof-grn-label">GRN ID:</span>
                      <span className="wof-grn-value">#{wo.selected_grn_id}</span>
                    </div>
                    <div className="wof-grn-row">
                      <span className="wof-grn-label">Customer:</span>
                      <span className="wof-grn-value">{wo.customer_name || "N/A"}</span>
                    </div>
                    <div className="wof-grn-row">
                      <span className="wof-grn-label">Customer PO:</span>
                      <span className="wof-grn-value">{wo.customer_po || "N/A"}</span>
                    </div>
                  </div>
                  {wo.grn_items && wo.grn_items.length > 0 && (
                    <div className="wof-grn-items">
                      <span className="wof-section-title" style={{ fontSize: "12px" }}>GRN Items</span>
                      <table className="wof-editable-table">
                        <thead>
                          <tr>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>UOM</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wo.grn_items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.item_code}</td>
                              <td>{item.item_name}</td>
                              <td>{item.qty}</td>
                              <td>{item.uom}</td>
                              <td>₹{item.rate}</td>
                              <td>₹{item.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="wof-no-grn">
                  <p>No GRN selected. Please click "Select GRN" to choose a Goods Receipt Note.</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary, #6b7280)", marginTop: "8px" }}>
                    <FaInfoCircle /> {grnList.length} GRNs available in the system
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══════════ TAB 1: PRODUCTION ITEM ══════════ */}
          {activeTab === "production_item" && (
            <div className="wof-card">

              {/* Row 1: Qty */}
              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Qty To Manufacture <span className="wof-required">*</span></label>
                  <input type="number" value={wo.qty_to_manufacture || ""}
                    onChange={e => set("qty_to_manufacture", Number(e.target.value))}
                    className="form-field" placeholder="e.g. 100" min="0" disabled={disabled} />
                  {bomDetail && (
                    <span className="wof-hint">
                      BOM base: {bomDetail.bom.quantity} {bomDetail.bom.uom} — rows scale automatically
                    </span>
                  )}
                </div>
                <div className="wof-field">
                  <label className="wof-label">Transfer Material Against</label>
                  <select value={wo.transfer_material_against}
                    onChange={e => set("transfer_material_against", e.target.value as "Work Order" | "Job Card")}
                    className="form-field" disabled={disabled}>
                    <option value="Work Order">Work Order</option>
                    <option value="Job Card">Job Card</option>
                  </select>
                </div>
              </div>

              <div className="wof-divider" />
              <span className="wof-section-title">Bill of Materials</span>

              {/* Row 2: BOM search + Item (auto-filled) */}
              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <BomSearchField
                  value={selectedBomLabel || wo.bom_no}
                  onSelect={handleSelectBom}
                  onClear={handleClearBom}
                  disabled={disabled}
                  error={!wo.bom_no.trim() ? "Please select a BOM" : undefined}
                />
                <div className="wof-field">
                  <label className="wof-label">Item To Manufacture <span className="wof-required">*</span></label>
                  <input type="text" value={wo.item_to_manufacture}
                    className="form-field" placeholder="Auto-filled from BOM" disabled />
                  {wo.item_name && wo.item_name !== wo.item_to_manufacture && (
                    <span className="wof-hint">{wo.item_name} · {wo.stock_uom}</span>
                  )}
                </div>
              </div>

              {bomLoading && (
                <div className="wof-hint" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <FaSpinner className="spinning" /> Loading BOM details…
                </div>
              )}

              {/* BOM summary strip */}
              {bomDetail && !bomLoading && (
                <div className="wof-bom-summary">
                  <div className="wof-connection-row">
                    <span>Base Qty</span>
                    <span className="wof-connection-count">{bomDetail.bom.quantity} {bomDetail.bom.uom}</span>
                  </div>
                  <div className="wof-connection-row">
                    <span>Scaled Lead Time</span>
                    <span className="wof-connection-count">{wo.lead_time_mins} mins</span>
                  </div>
                  <div className="wof-connection-row">
                    <span>Scaled Operating Cost</span>
                    <span className="wof-connection-count">₹ {wo.planned_operating_cost.toFixed(2)}</span>
                  </div>
                  <button type="button" className="wof-row-add-btn" style={{ marginTop: 6 }}
                    onClick={() => bomDetail && applyBomToWo(bomDetail, wo.qty_to_manufacture)}
                    disabled={disabled || !wo.qty_to_manufacture}>
                    <FaSyncAlt size={10} /> Recalculate
                  </button>
                </div>
              )}

              <div className="wof-divider" />
              <span className="wof-section-title">Warehouses</span>

              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <WarehouseSearchField label="Source Warehouse" value={wo.source_warehouse}
                  onChange={v => set("source_warehouse", v)} disabled={disabled}
                  hint="Where raw materials are picked from" />
                <WarehouseSearchField label="Target Warehouse (FG)" value={wo.target_warehouse}
                  onChange={v => set("target_warehouse", v)} required disabled={disabled}
                  hint="Where finished goods are stored"
                  error={!wo.target_warehouse.trim() ? "Required" : ""} />
              </div>

              <div className="wof-grid-2">
                <WarehouseSearchField label="WIP Warehouse" value={wo.wip_warehouse}
                  onChange={v => set("wip_warehouse", v)} required disabled={disabled}
                  hint="Where production operations happen"
                  error={!wo.wip_warehouse.trim() ? "Required" : ""} />
              </div>

              <div className="wof-divider" />

              {/* ── Operations Table ── */}
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
                      <th>UOM</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th className="wof-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {wo.required_items.map((ri, idx) => (
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Raw Material Cost */}
              <div className="wof-total-cost">
                <span className="wof-total-label">Total Raw Material Cost:</span>
                <span className="wof-total-value">₹ {totalRawMaterialCost.toFixed(2)}</span>
              </div>

              <div className="wof-divider" />
              <span className="wof-section-title">Operating Costs</span>

              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <div className="wof-field">
                  <label className="wof-label">
                    Planned Operating Cost
                    {bomDetail && <span className="wof-hint" style={{ marginLeft: 6 }}>auto from BOM</span>}
                  </label>
                  <input type="number" value={wo.planned_operating_cost || ""}
                    onChange={e => set("planned_operating_cost", Number(e.target.value))}
                    className="form-field" min="0" step="0.01" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Actual Operating Cost</label>
                  <input type="number" value={wo.actual_operating_cost || ""}
                    onChange={e => set("actual_operating_cost", Number(e.target.value))}
                    className="form-field" min="0" step="0.01" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Additional Operating Cost</label>
                  <input type="number" value={wo.additional_operating_cost || ""}
                    onChange={e => set("additional_operating_cost", Number(e.target.value))}
                    className="form-field" min="0" step="0.01" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Corrective Operation Cost</label>
                  <input type="number" value={wo.corrective_operation_cost || ""}
                    onChange={e => set("corrective_operation_cost", Number(e.target.value))}
                    className="form-field" min="0" step="0.01" disabled={disabled} />
                  <span className="wof-hint">From Corrective Job Card</span>
                </div>
                <div className="wof-field">
                  <label className="wof-label">Total Operating Cost</label>
                  <input type="number"
                    value={wo.planned_operating_cost + wo.corrective_operation_cost + wo.additional_operating_cost}
                    className="form-field" disabled />
                </div>
              </div>

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
                    label="Planned End Date"
                    value={wo.planned_end_date}
                    onChange={v => set("planned_end_date", v)}
                    disabled={disabled}
                    min={wo.planned_start_date}
                  />
                </div>
                <div className="wof-field">
                  <DatePickerField
                    label="Expected Delivery Date"
                    value={wo.expected_delivery_date}
                    onChange={v => set("expected_delivery_date", v)}
                    disabled={disabled}
                    min={wo.planned_start_date}
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
                <div className="wof-field">
                  <label className="wof-label">
                    Lead Time (mins)
                    {bomDetail && <span className="wof-hint" style={{ marginLeft: 6 }}>auto from BOM ops</span>}
                  </label>
                  <input type="number" value={wo.lead_time_mins || ""}
                    onChange={e => set("lead_time_mins", Number(e.target.value))}
                    className="form-field" min="0" step="0.01" disabled={disabled} />
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 3: MORE INFO ══════════ */}
          {activeTab === "more_info" && (
            <div className="wof-card">
              <span className="wof-section-title">Production Item Info</span>
              <div className="wof-grid-2" style={{ marginTop: 14 }}>
                <div className="wof-field">
                  <label className="wof-label">Item Name</label>
                  <input type="text" value={wo.item_name}
                    onChange={e => set("item_name", e.target.value)}
                    className="form-field" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Stock UOM</label>
                  <input type="text" value={wo.stock_uom}
                    onChange={e => set("stock_uom", e.target.value)}
                    className="form-field" disabled={disabled} />
                </div>
              </div>

              {wo.order_type === "external" && (
                <>
                  <div className="wof-divider" />
                  <span className="wof-section-title">External Order Details</span>
                  <div className="wof-grid-2" style={{ marginTop: 14 }}>
                    <div className="wof-field">
                      <label className="wof-label">Customer Name</label>
                      <input type="text" value={wo.customer_name || ""}
                        onChange={e => set("customer_name", e.target.value)}
                        className="form-field" disabled={disabled} />
                    </div>
                    <div className="wof-field">
                      <label className="wof-label">Customer PO Number</label>
                      <input type="text" value={wo.customer_po || ""}
                        onChange={e => set("customer_po", e.target.value)}
                        className="form-field" disabled={disabled} />
                    </div>
                  </div>
                </>
              )}

              <div className="wof-divider" />
              <span className="wof-section-title">Comments</span>

              <div className="wof-comment-input-row" style={{ marginTop: 12 }}>
                <div className="wof-comment-avatar">You</div>
                <input type="text" value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="wof-comment-input" placeholder="Add a comment…"
                  disabled={disabled}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newComment.trim()) {
                        setWo(p => ({ ...p, comments: [...p.comments, { id: uid(), author: "You", text: newComment.trim(), time: "Just now" }] }));
                        setNewComment("");
                      }
                    }
                  }} />
                <button type="button" className="wof-comment-send" disabled={disabled || !newComment.trim()}
                  onClick={() => {
                    if (newComment.trim()) {
                      setWo(p => ({ ...p, comments: [...p.comments, { id: uid(), author: "You", text: newComment.trim(), time: "Just now" }] }));
                      setNewComment("");
                    }
                  }}>
                  <FaPaperPlane size={11} />
                </button>
              </div>

              {wo.comments.map(c => (
                <div key={c.id} className="wof-comment-row" style={{ marginTop: 10 }}>
                  <div className="wof-comment-avatar">{c.author.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <span className="wof-comment-author">{c.author} <span className="wof-comment-time">· {c.time}</span></span>
                    <div className="wof-comment-text">{c.text}</div>
                  </div>
                </div>
              ))}

              <div className="wof-divider" />
              <span className="wof-section-title">Activity</span>
              <ul className="wof-activity-list">
                {wo.activity.length === 0
                  ? <li className="wof-activity-item" style={{ opacity: 0.5 }}>No activity yet.</li>
                  : wo.activity.map(a => (
                    <li key={a.id} className="wof-activity-item">
                      {a.text} <span className="wof-activity-time">· {a.time}</span>
                    </li>
                  ))
                }
              </ul>
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
              ) : grnList.length === 0 ? (
                <div className="grn-empty">No GRNs available</div>
              ) : (
                <div className="grn-list">
                  {grnList.map(grn => (
                    <div key={grn.id} className="grn-item" onClick={() => handleSelectGRN(grn)}>
                      <div className="grn-item-header">
                        <span className="grn-item-id">GRN #{grn.id}</span>
                        <span className="grn-item-status">{grn.status}</span>
                      </div>
                      <div className="grn-item-details">
                        <span>Supplier: {grn.supplier}</span>
                        <span>Date: {new Date(grn.date).toLocaleDateString()}</span>
                        <span>Items: {grn.items.length}</span>
                        <span>Total: ₹{grn.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="grn-item-items">
                        {grn.items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="grn-item-tag">
                            {item.item_name} ({item.qty} {item.uom})
                          </span>
                        ))}
                        {grn.items.length > 3 && (
                          <span className="grn-item-tag">+{grn.items.length - 3} more</span>
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