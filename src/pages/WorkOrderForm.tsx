// WorkOrderForm.tsx
import { useState, type FormEvent, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaExclamationTriangle,
  FaInfoCircle, FaTimesCircle, FaPlus, FaTrash,
  FaPaperPlane, FaSearch, FaSyncAlt,
} from "react-icons/fa";
import "./WorkOrderForm.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "Draft" | "Not Started" | "In Process" | "Completed" | "Stopped";

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

interface WorkOrderData {
  id?: number;
  name: string;
  status: Status;
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

type TabKey = "production_item" | "configuration" | "more_info" | "total_produced";
const TABS: { key: TabKey; label: string }[] = [
  { key: "production_item", label: "Production Item" },
  { key: "configuration", label: "Configuration" },
  { key: "more_info", label: "More Info" },
  { key: "total_produced", label: "Total Produced" },
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
});

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

  // BOM state
  const [selectedBomLabel, setSelectedBomLabel] = useState("");
  const [bomDetail, setBomDetail] = useState<{ bom: BomDetail; items: BomApiItem[]; operations: BomApiOperation[] } | null>(null);
  const [bomLoading, setBomLoading] = useState(false);

  const disabled = submitting || loading;

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
          // Auto-fill source/target warehouse from BOM defaults
          setWo(prev => ({
            ...prev,
            source_warehouse: prev.source_warehouse || detail.bom.default_source_warehouse || "",
            target_warehouse: prev.target_warehouse || detail.bom.default_target_warehouse || "",
          }));
          // Apply initial scaling with current qty
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

    // Map operations directly from BOM API shape
    const ops: OperationRow[] = detail.operations.map(op => ({
      id: uid(),
      operation: op.operation,
      workstation: op.workstation,
      time_in_mins: Math.round(op.time_in_mins * scale * 100) / 100,
      hour_rate: op.hour_rate,
      operating_cost: Math.round(op.operating_cost * scale * 100) / 100,
    }));

    // Map items directly from BOM API shape
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
    // const totalRawMaterialCost = items.reduce((s, i) => s + (i.amount || 0), 0);

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
          {TABS.map(t => (
            <button key={t.key} type="button"
              className={`wof-tab-btn${activeTab === t.key ? " wof-tab-btn-active" : ""}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>

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

            </div>
          )}

          {/* ══════════ TAB 2: CONFIGURATION ══════════ */}
          {activeTab === "configuration" && (
            <div className="wof-card">
              <span className="wof-section-title">Dates</span>

              <div className="wof-grid-2" style={{ marginTop: 10 }}>
                <div className="wof-field">
                  <label className="wof-label">Planned Start Date <span className="wof-required">*</span></label>
                  <input type="date" value={wo.planned_start_date}
                    onChange={e => set("planned_start_date", e.target.value)}
                    className="form-field" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Planned End Date</label>
                  <input type="date" value={wo.planned_end_date}
                    onChange={e => set("planned_end_date", e.target.value)}
                    className="form-field" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Expected Delivery Date</label>
                  <input type="date" value={wo.expected_delivery_date}
                    onChange={e => set("expected_delivery_date", e.target.value)}
                    className="form-field" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Actual Start Date</label>
                  <input type="date" value={wo.actual_start_date}
                    onChange={e => set("actual_start_date", e.target.value)}
                    className="form-field" disabled={disabled} />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Actual End Date</label>
                  <input type="date" value={wo.actual_end_date}
                    onChange={e => set("actual_end_date", e.target.value)}
                    className="form-field" disabled={disabled} />
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
    </div>
  );
}