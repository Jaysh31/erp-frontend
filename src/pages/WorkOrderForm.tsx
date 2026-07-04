// WorkOrderForm.tsx - ERPNext-style tabbed Work Order form (Production Item / Configuration / More Info / Connections)
import { useState, type FormEvent, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaPlus,
  FaTrash,
  FaPaperPlane,
  FaSearch,
} from "react-icons/fa";
import "./WorkOrderForm.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────
type Status = "Draft" | "Not Started" | "In Process" | "Completed" | "Stopped";

interface OperationRow {
  id: string;
  operation: string;
  workstation: string;
  semi_finished_warehouse: string;
  source_warehouse: string;
  finished_goods_warehouse: string;
  time: number;
}

interface RequiredItemRow {
  id: string;
  item_code: string;
  source_warehouse: string;
  required_qty: number;
  transferred_qty: number;
  consumed_qty: number;
  returned_qty: number;
}

interface CommentRow {
  id: string;
  author: string;
  text: string;
  time: string;
}

interface ActivityRow {
  id: string;
  text: string;
  time: string;
}

interface WorkOrderData {
  id?: number;
  name: string;
  status: Status;

  // Production Item tab
  company: string;
  qty_to_manufacture: number;
  item_to_manufacture: string;
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

  // Configuration tab
  allow_alternative_item: boolean;
  skip_material_transfer: boolean;
  use_multi_level_bom: boolean;
  update_consumed_material_cost_in_project: boolean;
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

  // More Info tab
  item_name: string;
  stock_uom: string;
  comments: CommentRow[];
  activity: ActivityRow[];

  // Connections tab
  items_produced_pct: number;
  completed_operations: string[];
  stock_entry_count: number;
  job_card_count: number;
  pick_list_count: number;
  serial_no_count: number;
  batch_count: number;
  material_request_count: number;
}

interface ApiWorkOrderPayload {
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

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

// ─── Warehouse Types ────────────────────────────────────────────────────
interface Warehouse {
  id: number;
  warehouse_name: string;
  company: string | null;
  parent_warehouse: string | null;
  warehouse_type: string | null;
  city: string | null;
  state: string | null;
  email_id: string | null;
  phone_no: string | null;
  disabled: number;
}

interface WarehouseResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Warehouse[];
  };
}

const STATUS_OPTIONS: Status[] = ["Draft", "Not Started", "In Process", "Completed", "Stopped"];
const STATUS_LABELS: Record<Status, string> = {
  Draft: "Draft",
  "Not Started": "Not Started",
  "In Process": "In Process",
  Completed: "Completed",
  Stopped: "Stopped",
};
const STATUS_CLASS: Record<Status, string> = {
  Draft: "s-draft",
  "Not Started": "s-notstarted",
  "In Process": "s-inprocess",
  Completed: "s-completed",
  Stopped: "s-stopped",
};

type TabKey = "production_item" | "configuration" | "more_info" | "connections";
const TABS: { key: TabKey; label: string }[] = [
  { key: "production_item", label: "Production Item" },
  { key: "configuration", label: "Configuration" },
  { key: "more_info", label: "More Info" },
  { key: "connections", label: "Connections" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const emptyOperation = (): OperationRow => ({
  id: uid(),
  operation: "",
  workstation: "",
  semi_finished_warehouse: "",
  source_warehouse: "",
  finished_goods_warehouse: "",
  time: 0,
});

const emptyRequiredItem = (): RequiredItemRow => ({
  id: uid(),
  item_code: "",
  source_warehouse: "",
  required_qty: 0,
  transferred_qty: 0,
  consumed_qty: 0,
  returned_qty: 0,
});

const emptyWorkOrder = (): WorkOrderData => ({
  name: "",
  status: "Draft",

  company: "",
  qty_to_manufacture: 0,
  item_to_manufacture: "",
  bom_no: "",
  material_transferred_for_manufacturing: 0,
  manufactured_qty: 0,
  additional_transferred_qty: 0,
  disassembled_qty: 0,
  source_warehouse: "",
  target_warehouse: "",
  wip_warehouse: "",
  transfer_material_against: "Work Order",
  operations: [emptyOperation()],
  required_items: [emptyRequiredItem()],

  allow_alternative_item: false,
  skip_material_transfer: false,
  use_multi_level_bom: true,
  update_consumed_material_cost_in_project: false,
  planned_start_date: "",
  planned_end_date: "",
  actual_start_date: "",
  actual_end_date: "",
  expected_delivery_date: "",
  lead_time_mins: 0,
  planned_operating_cost: 0,
  actual_operating_cost: 0,
  additional_operating_cost: 0,
  corrective_operation_cost: 0,

  item_name: "",
  stock_uom: "Nos",
  comments: [],
  activity: [],

  items_produced_pct: 0,
  completed_operations: [],
  stock_entry_count: 0,
  job_card_count: 0,
  pick_list_count: 0,
  serial_no_count: 0,
  batch_count: 0,
  material_request_count: 0,
});

interface ApiResponse {
  success: number;
  data: WorkOrderData;
  message?: string;
}

// ─── Warehouse Search Component ────────────────────────────────────────
interface WarehouseSearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  error?: string;
}

function WarehouseSearchField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Search warehouse...",
  hint,
  className = "",
  error,
}: WarehouseSearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await api.get<WarehouseResponse>("/warehouse");
        if (response.data.success === 1) {
          const records = response.data.data.records || [];
          setWarehouses(records);
          setFilteredWarehouses(records);
        } else {
          setFetchError("Failed to load warehouses");
        }
      } catch (err) {
        console.error("Error fetching warehouses:", err);
        setFetchError("Could not load warehouse list");
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  // Filter warehouses based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWarehouses(warehouses);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = warehouses.filter((w) =>
      w.warehouse_name.toLowerCase().includes(term) ||
      (w.company && w.company.toLowerCase().includes(term))
    );
    setFilteredWarehouses(filtered);
  }, [searchTerm, warehouses]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectWarehouse = (warehouse: Warehouse) => {
    onChange(warehouse.warehouse_name);
    setSearchTerm(warehouse.warehouse_name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleFocus = () => {
    if (!disabled) {
      setSearchTerm(value);
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`warehouse-search-field ${className}`} ref={wrapperRef}>
      <label className="wof-label">
        {label}
        {required && <span className="wof-required"> *</span>}
      </label>
      <div className="warehouse-search-wrapper">
        <div className="warehouse-search-input-wrap">
          <FaSearch className="warehouse-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm || value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={`form-field warehouse-search-input ${error ? "field-error" : ""}`}
          />
          {loading && <FaSpinner className="warehouse-loading-spinner spinning" />}
          {value && !disabled && (
            <button
              type="button"
              className="warehouse-clear-btn"
              onClick={() => {
                onChange("");
                setSearchTerm("");
                setIsOpen(false);
              }}
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
        </div>

        {isOpen && !disabled && (
          <div className="warehouse-dropdown">
            {loading ? (
              <div className="warehouse-dropdown-loading">Loading warehouses...</div>
            ) : fetchError ? (
              <div className="warehouse-dropdown-error">{fetchError}</div>
            ) : filteredWarehouses.length === 0 ? (
              <div className="warehouse-dropdown-empty">
                {searchTerm ? "No warehouses found" : "No warehouses available"}
              </div>
            ) : (
              <ul className="warehouse-dropdown-list">
                {filteredWarehouses.map((warehouse) => (
                  <li
                    key={warehouse.id}
                    className={`warehouse-dropdown-item ${value === warehouse.warehouse_name ? "selected" : ""}`}
                    onClick={() => handleSelectWarehouse(warehouse)}
                  >
                    <div className="warehouse-item-name">{warehouse.warehouse_name}</div>
                    {warehouse.company && (
                      <div className="warehouse-item-company">{warehouse.company}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {hint && <span className="wof-hint">{hint}</span>}
      {error && <div className="wof-error-msg">{error}</div>}
    </div>
  );
}

export default function WorkOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";

  const [wo, setWo] = useState<WorkOrderData>(emptyWorkOrder());
  const [activeTab, setActiveTab] = useState<TabKey>("production_item");
  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const disabled = submitting || loading;

  // ─── Fetch existing work order ──────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      const fetchWorkOrder = async () => {
        setLoading(true);
        try {
          const response = await api.get<ApiResponse>(`/work-order/${id}`);
          if (response.data.success === 1) {
            const data = response.data.data;
            setWo({
              ...emptyWorkOrder(),
              ...data,
              planned_start_date: data.planned_start_date?.split("T")[0] ?? "",
              planned_end_date: data.planned_end_date?.split("T")[0] ?? "",
              actual_start_date: data.actual_start_date?.split("T")[0] ?? "",
              actual_end_date: data.actual_end_date?.split("T")[0] ?? "",
              expected_delivery_date: data.expected_delivery_date?.split("T")[0] ?? "",
              operations: data.operations?.length ? data.operations : [emptyOperation()],
              required_items: data.required_items?.length ? data.required_items : [emptyRequiredItem()],
            });
          }
        } catch (err) {
          console.error("Error fetching work order:", err);
          setApiError("Failed to load work order data");
        } finally {
          setLoading(false);
        }
      };
      fetchWorkOrder();
    }
  }, [id, isNew]);

  // ─── Field helpers ───────────────────────────────────────────────────
  const setField = <K extends keyof WorkOrderData>(field: K, value: WorkOrderData[K]) => {
    setWo((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Operations row helpers
  const updateOperation = (rowId: string, field: keyof OperationRow, value: string | number) => {
    setWo((prev) => ({
      ...prev,
      operations: prev.operations.map((op) => (op.id === rowId ? { ...op, [field]: value } : op)),
    }));
    setIsDirty(true);
  };
  const addOperation = () => setWo((prev) => ({ ...prev, operations: [...prev.operations, emptyOperation()] }));
  const removeOperation = (rowId: string) =>
    setWo((prev) => ({ ...prev, operations: prev.operations.filter((op) => op.id !== rowId) }));

  // Required item row helpers
  const updateRequiredItem = (rowId: string, field: keyof RequiredItemRow, value: string | number) => {
    setWo((prev) => ({
      ...prev,
      required_items: prev.required_items.map((ri) => (ri.id === rowId ? { ...ri, [field]: value } : ri)),
    }));
    setIsDirty(true);
  };
  const addRequiredItem = () =>
    setWo((prev) => ({ ...prev, required_items: [...prev.required_items, emptyRequiredItem()] }));
  const removeRequiredItem = (rowId: string) =>
    setWo((prev) => ({ ...prev, required_items: prev.required_items.filter((ri) => ri.id !== rowId) }));

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setWo((prev) => ({
      ...prev,
      comments: [
        ...prev.comments,
        { id: uid(), author: "You", text: newComment.trim(), time: "Just now" },
      ],
    }));
    setNewComment("");
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!wo.company.trim()) {
      allErrors.push({ field: "company", label: "Company", message: "Company is required" });
    }
    if (!wo.item_to_manufacture.trim()) {
      allErrors.push({
        field: "item_to_manufacture",
        label: "Item To Manufacture",
        message: "Item to manufacture is required",
      });
    }
    if (!wo.bom_no.trim()) {
      allErrors.push({ field: "bom_no", label: "BOM No", message: "BOM number is required" });
    }
    if (wo.qty_to_manufacture <= 0) {
      allErrors.push({
        field: "qty_to_manufacture",
        label: "Qty To Manufacture",
        message: "Quantity must be greater than 0",
      });
    }
    if (!wo.target_warehouse.trim()) {
      allErrors.push({
        field: "target_warehouse",
        label: "Target Warehouse",
        message: "Target warehouse is required",
      });
    }
    if (!wo.wip_warehouse.trim() && !wo.skip_material_transfer) {
      allErrors.push({
        field: "wip_warehouse",
        label: "Work-in-Progress Warehouse",
        message: "WIP warehouse is required",
      });
    }
    if (!wo.planned_start_date) {
      allErrors.push({
        field: "planned_start_date",
        label: "Planned Start Date",
        message: "Planned start date is required",
      });
    }
    if (wo.planned_start_date && wo.planned_end_date && wo.planned_start_date > wo.planned_end_date) {
      allErrors.push({
        field: "planned_end_date",
        label: "Planned End Date",
        message: "End date must be after start date",
      });
    }

    return allErrors;
  };

  const hasErrors = getAllValidationErrors().length > 0;

  // ─── Convert form data to API payload ──────────────────────────────
  const convertToApiPayload = (data: WorkOrderData): ApiWorkOrderPayload => {
    return {
      name: data.name || "",
      company: data.company || "",
      naming_series: "WO-.YYYY.-",
      production_item: data.item_to_manufacture || "",
      bom_no: data.bom_no || "",
      qty: data.qty_to_manufacture || 0,
      sales_order: "",
      reserve_stock: 0,
      max_producible_qty: data.qty_to_manufacture || 0,
      material_transferred_for_manufacturing: data.material_transferred_for_manufacturing || 0,
      additional_transferred_qty: data.additional_transferred_qty || 0,
      produced_qty: data.manufactured_qty || 0,
      process_loss_qty: 0,
      disassembled_qty: data.disassembled_qty || 0,
      source_warehouse: data.source_warehouse || "",
      wip_warehouse: data.wip_warehouse || "",
      fg_warehouse: data.target_warehouse || "",
      scrap_warehouse: "",
      transfer_material_against: data.transfer_material_against || "Work Order",
      allow_alternative_item: data.allow_alternative_item ? 1 : 0,
      use_multi_level_bom: data.use_multi_level_bom ? 1 : 0,
      skip_transfer: data.skip_material_transfer ? 1 : 0,
      from_wip_warehouse: 0,
      update_consumed_material_cost_in_project: data.update_consumed_material_cost_in_project ? 1 : 0,
      planned_start_date: data.planned_start_date || "",
      planned_end_date: data.planned_end_date || "",
      expected_delivery_date: data.expected_delivery_date || "",
      actual_start_date: data.actual_start_date || null,
      actual_end_date: data.actual_end_date || null,
      lead_time: data.lead_time_mins || 0,
      planned_operating_cost: data.planned_operating_cost || 0,
      actual_operating_cost: data.actual_operating_cost || 0,
      additional_operating_cost: data.additional_operating_cost || 0,
      corrective_operation_cost: data.corrective_operation_cost || 0,
      total_operating_cost: (data.planned_operating_cost || 0) + (data.corrective_operation_cost || 0) + (data.additional_operating_cost || 0),
      image: "",
      item_name: data.item_name || "",
      stock_uom: data.stock_uom || "Nos",
      description: "",
      has_serial_no: 0,
      has_batch_no: 0,
      batch_size: 0,
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
      status: data.status || "Draft",
      track_semi_finished_goods: 0,
      amended_from: "",
      _user_tags: "",
      _comments: "",
      _assign: "",
      _liked_by: "",
      _seen: "",
    };
  };

  // ─── Save ────────────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      // jump to the tab containing the first error
      const firstField = validationErrorsList[0].field;
      if (["company", "qty_to_manufacture", "item_to_manufacture", "bom_no", "target_warehouse", "wip_warehouse"].includes(firstField)) {
        setActiveTab("production_item");
      } else if (["planned_start_date", "planned_end_date"].includes(firstField)) {
        setActiveTab("configuration");
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = convertToApiPayload(wo);
      let response;
      if (isNew) {
        response = await api.post("/work-order", payload);
      } else {
        response = await api.put(`/work-order/${id}`, payload);
      }

      if (response.data && response.data.success === 1) {
        console.log(isNew ? "Work order created successfully:" : "Work order updated successfully:", response.data);
        setIsDirty(false);
        navigate("/work-order");
      } else {
        setApiError(response.data?.message || `Failed to ${isNew ? "create" : "update"} work order`);
      }
    } catch (err: any) {
      console.error("Error saving work order:", err);
      if (err.response) {
        if (err.response.status === 409) {
          setApiError("A work order with this name already exists");
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || "Invalid data provided");
        } else {
          setApiError(err.response.data?.message || `Failed to ${isNew ? "create" : "update"} work order`);
        }
      } else if (err.request) {
        setApiError("Network error. Please check your connection.");
      } else {
        setApiError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (newStatus: Status) => setField("status", newStatus);

  if (loading) {
    return (
      <div className={`wof-page ${theme}`}>
        <div className="wof-inner">
          <div className="wof-loading">Loading work order data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wof-page ${theme}`}>
      <div className="wof-inner">
        {/* ─── Validation Summary Modal ────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">Please fill in the following required fields before submitting:</p>
                <div className="validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="validation-error-item">
                      <div className="error-header">
                        <FaTimesCircle className="error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="validation-tip">
                  <FaInfoCircle className="tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="wof-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>
              ×
            </button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="wof-header">
          <button onClick={() => navigate("/work-order")} className="back-btn">
            <FaArrowLeft size={28} /> 
          </button>
          <div className="header-title">
            <h1>{isNew ? "Add New Work Order" : `Edit: ${wo.item_name || wo.name}`}</h1>
            {!isNew && <span className={`wof-status-badge ${STATUS_CLASS[wo.status]}`}>{STATUS_LABELS[wo.status]}</span>}
          </div>
          {!isNew && hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────────── */}
        <div className="wof-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`wof-tab-btn ${activeTab === tab.key ? "wof-tab-btn-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          {/* ════════════════════ TAB 1: PRODUCTION ITEM ════════════════════ */}
          {activeTab === "production_item" && (
            <div className="wof-card">
              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">
                    Company <span className="wof-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={wo.company}
                    onChange={(e) => setField("company", e.target.value)}
                    className="form-field"
                    placeholder="e.g. Reshma Moulding Works"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">
                    Qty To Manufacture <span className="wof-required">*</span>
                  </label>
                  <input
                    type="number"
                    value={wo.qty_to_manufacture || ""}
                    onChange={(e) => setField("qty_to_manufacture", Number(e.target.value))}
                    className="form-field"
                    placeholder="e.g. 50"
                    min="0"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="wof-field">
                <label className="wof-label">
                  Item To Manufacture <span className="wof-required">*</span>
                </label>
                <input
                  type="text"
                  value={wo.item_to_manufacture}
                  onChange={(e) => setField("item_to_manufacture", e.target.value)}
                  className="form-field"
                  placeholder="e.g. Frp_box: FRP Box"
                  disabled={disabled}
                />
              </div>

              <div className="wof-field">
                <label className="wof-label">
                  BOM No <span className="wof-required">*</span>
                </label>
                <input
                  type="text"
                  value={wo.bom_no}
                  onChange={(e) => setField("bom_no", e.target.value)}
                  className="form-field"
                  placeholder="e.g. BOM-Frp_box-001"
                  disabled={disabled}
                />
              </div>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Material Transferred for Manufacturing</label>
                  <input
                    type="number"
                    value={wo.material_transferred_for_manufacturing || ""}
                    onChange={(e) => setField("material_transferred_for_manufacturing", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Manufactured Qty</label>
                  <input
                    type="number"
                    value={wo.manufactured_qty || ""}
                    onChange={(e) => setField("manufactured_qty", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Additional Transferred Qty</label>
                  <input
                    type="number"
                    value={wo.additional_transferred_qty || ""}
                    onChange={(e) => setField("additional_transferred_qty", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Disassembled Qty</label>
                  <input
                    type="number"
                    value={wo.disassembled_qty || ""}
                    onChange={(e) => setField("disassembled_qty", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="wof-divider" />
              <span className="wof-section-title">Warehouse</span>

              {/* ─── Warehouse Fields in 2-column grid ────────────────── */}
              <div className="wof-grid-2">
                {/* Source Warehouse */}
                <WarehouseSearchField
                  label="Source Warehouse"
                  value={wo.source_warehouse}
                  onChange={(val) => setField("source_warehouse", val)}
                  disabled={disabled}
                  placeholder="Search source warehouse..."
                  hint="This is a location where raw materials are available."
                />

                {/* Target Warehouse */}
                <WarehouseSearchField
                  label="Target Warehouse"
                  value={wo.target_warehouse}
                  onChange={(val) => setField("target_warehouse", val)}
                  required={true}
                  disabled={disabled}
                  placeholder="Search target warehouse..."
                  hint="This is a location where final product is stored."
                  error={!wo.target_warehouse.trim() ? "Target warehouse is required" : ""}
                />
              </div>

              <div className="wof-grid-2">
                {/* WIP Warehouse */}
                <WarehouseSearchField
                  label="Work-in-Progress Warehouse"
                  value={wo.wip_warehouse}
                  onChange={(val) => setField("wip_warehouse", val)}
                  required={!wo.skip_material_transfer}
                  disabled={disabled}
                  placeholder="Search WIP warehouse..."
                  hint="This is a location where operations are executed."
                  error={
                    !wo.wip_warehouse.trim() && !wo.skip_material_transfer
                      ? "WIP warehouse is required"
                      : ""
                  }
                />

                {/* Transfer Material Against */}
                <div className="wof-field">
                  <label className="wof-label">Transfer Material Against</label>
                  <select
                    value={wo.transfer_material_against}
                    onChange={(e) => setField("transfer_material_against", e.target.value as "Work Order" | "Job Card")}
                    className="form-field"
                    disabled={disabled}
                  >
                    <option value="Work Order">Work Order</option>
                    <option value="Job Card">Job Card</option>
                  </select>
                </div>
              </div>

              <div className="wof-divider" />

              {/* ── Operations table (editable) ───────────────────── */}
              <div className="wof-table-header">
                <span className="wof-section-title wof-section-title-flush">Operations</span>
                <button type="button" className="wof-row-add-btn" onClick={addOperation}>
                  <FaPlus size={10} /> Add Row
                </button>
              </div>
              <div className="wof-table-scroll">
                <table className="wof-editable-table">
                  <thead>
                    <tr>
                      <th className="wof-col-no">No.</th>
                      <th>Operation *</th>
                      <th>Workstation</th>
                      <th>Semi Finished Whse</th>
                      <th>Source Warehouse</th>
                      <th>Finished Goods Whse</th>
                      <th>Time *</th>
                      <th className="wof-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {wo.operations.map((op, idx) => (
                      <tr key={op.id}>
                        <td className="wof-col-no">{idx + 1}</td>
                        <td>
                          <input
                            type="text"
                            value={op.operation}
                            onChange={(e) => updateOperation(op.id, "operation", e.target.value)}
                            className="form-field form-field-sm"
                            placeholder="e.g. Moulding"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={op.workstation}
                            onChange={(e) => updateOperation(op.id, "workstation", e.target.value)}
                            className="form-field form-field-sm"
                            placeholder="e.g. moulding-1"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={op.semi_finished_warehouse}
                            onChange={(e) => updateOperation(op.id, "semi_finished_warehouse", e.target.value)}
                            className="form-field form-field-sm"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={op.source_warehouse}
                            onChange={(e) => updateOperation(op.id, "source_warehouse", e.target.value)}
                            className="form-field form-field-sm"
                            placeholder="e.g. Stores - T"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={op.finished_goods_warehouse}
                            onChange={(e) => updateOperation(op.id, "finished_goods_warehouse", e.target.value)}
                            className="form-field form-field-sm"
                            placeholder="e.g. Finished Goods - T"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={op.time || ""}
                            onChange={(e) => updateOperation(op.id, "time", Number(e.target.value))}
                            className="form-field form-field-sm"
                            min="0"
                            disabled={disabled}
                          />
                        </td>
                        <td className="wof-col-action">
                          <button
                            type="button"
                            className="wof-row-delete-btn"
                            onClick={() => removeOperation(op.id)}
                            disabled={wo.operations.length <= 1}
                          >
                            <FaTrash size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="wof-divider" />

              {/* ── Required Items table (editable) ───────────────── */}
              <div className="wof-table-header">
                <span className="wof-section-title wof-section-title-flush">Required Items</span>
                <button type="button" className="wof-row-add-btn" onClick={addRequiredItem}>
                  <FaPlus size={10} /> Add Row
                </button>
              </div>
              <div className="wof-table-scroll">
                <table className="wof-editable-table">
                  <thead>
                    <tr>
                      <th className="wof-col-no">No.</th>
                      <th>Item Code *</th>
                      <th>Source Warehouse</th>
                      <th>Required Qty</th>
                      <th>Transferred Qty</th>
                      <th>Consumed Qty</th>
                      <th>Returned Qty</th>
                      <th className="wof-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {wo.required_items.map((ri, idx) => (
                      <tr key={ri.id}>
                        <td className="wof-col-no">{idx + 1}</td>
                        <td>
                          <input
                            type="text"
                            value={ri.item_code}
                            onChange={(e) => updateRequiredItem(ri.id, "item_code", e.target.value)}
                            className="form-field form-field-sm"
                            placeholder="e.g. hinge_02: Hinge"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={ri.source_warehouse}
                            onChange={(e) => updateRequiredItem(ri.id, "source_warehouse", e.target.value)}
                            className="form-field form-field-sm"
                            placeholder="e.g. Stores - T"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={ri.required_qty || ""}
                            onChange={(e) => updateRequiredItem(ri.id, "required_qty", Number(e.target.value))}
                            className="form-field form-field-sm"
                            min="0"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={ri.transferred_qty || ""}
                            onChange={(e) => updateRequiredItem(ri.id, "transferred_qty", Number(e.target.value))}
                            className="form-field form-field-sm"
                            min="0"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={ri.consumed_qty || ""}
                            onChange={(e) => updateRequiredItem(ri.id, "consumed_qty", Number(e.target.value))}
                            className="form-field form-field-sm"
                            min="0"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={ri.returned_qty || ""}
                            onChange={(e) => updateRequiredItem(ri.id, "returned_qty", Number(e.target.value))}
                            className="form-field form-field-sm"
                            min="0"
                            disabled={disabled}
                          />
                        </td>
                        <td className="wof-col-action">
                          <button
                            type="button"
                            className="wof-row-delete-btn"
                            onClick={() => removeRequiredItem(ri.id)}
                            disabled={wo.required_items.length <= 1}
                          >
                            <FaTrash size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="wof-field" style={{ marginTop: 18 }}>
                <label className="wof-label">Status</label>
                <div className="wof-status-selector">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`wof-status-btn ${wo.status === s ? "wof-status-btn-active" : ""}`}
                      onClick={() => handleStatusChange(s)}
                      disabled={disabled}
                    >
                      <span className={`wof-status-dot ${STATUS_CLASS[s]}`} />
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 2: CONFIGURATION ════════════════════ */}
          {activeTab === "configuration" && (
            <div className="wof-card">
              <div className="wof-grid-2">
                <div className="wof-checkbox-field">
                  <input
                    type="checkbox"
                    id="allow_alternative_item"
                    checked={wo.allow_alternative_item}
                    onChange={(e) => setField("allow_alternative_item", e.target.checked)}
                    disabled={disabled}
                  />
                  <label htmlFor="allow_alternative_item">Allow Alternative Item</label>
                </div>
                <div className="wof-checkbox-field">
                  <input
                    type="checkbox"
                    id="skip_material_transfer"
                    checked={wo.skip_material_transfer}
                    onChange={(e) => setField("skip_material_transfer", e.target.checked)}
                    disabled={disabled}
                  />
                  <div>
                    <label htmlFor="skip_material_transfer">Skip Material Transfer to WIP Warehouse</label>
                    <div className="wof-hint">Check if material transfer entry is not required</div>
                  </div>
                </div>
              </div>

              <div className="wof-grid-2">
                <div className="wof-checkbox-field">
                  <input
                    type="checkbox"
                    id="use_multi_level_bom"
                    checked={wo.use_multi_level_bom}
                    onChange={(e) => setField("use_multi_level_bom", e.target.checked)}
                    disabled={disabled}
                  />
                  <div>
                    <label htmlFor="use_multi_level_bom">Use Multi-Level BOM</label>
                    <div className="wof-hint">Plan material for sub-assemblies</div>
                  </div>
                </div>
                <div className="wof-checkbox-field">
                  <input
                    type="checkbox"
                    id="update_consumed_material_cost_in_project"
                    checked={wo.update_consumed_material_cost_in_project}
                    onChange={(e) => setField("update_consumed_material_cost_in_project", e.target.checked)}
                    disabled={disabled}
                  />
                  <label htmlFor="update_consumed_material_cost_in_project">
                    Update Consumed Material Cost In Project
                  </label>
                </div>
              </div>

              <div className="wof-divider" />
              <span className="wof-section-title">Time</span>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">
                    Planned Start Date <span className="wof-required">*</span>
                  </label>
                  <input
                    type="date"
                    value={wo.planned_start_date}
                    onChange={(e) => setField("planned_start_date", e.target.value)}
                    className="form-field"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Actual Start Date</label>
                  <input
                    type="date"
                    value={wo.actual_start_date}
                    onChange={(e) => setField("actual_start_date", e.target.value)}
                    className="form-field"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Planned End Date</label>
                  <input
                    type="date"
                    value={wo.planned_end_date}
                    onChange={(e) => setField("planned_end_date", e.target.value)}
                    className="form-field"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Actual End Date</label>
                  <input
                    type="date"
                    value={wo.actual_end_date}
                    onChange={(e) => setField("actual_end_date", e.target.value)}
                    className="form-field"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={wo.expected_delivery_date}
                    onChange={(e) => setField("expected_delivery_date", e.target.value)}
                    className="form-field"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Lead Time (mins)</label>
                  <input
                    type="number"
                    value={wo.lead_time_mins || ""}
                    onChange={(e) => setField("lead_time_mins", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    step="0.001"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="wof-divider" />
              <span className="wof-section-title">Operation Cost</span>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Planned Operating Cost</label>
                  <input
                    type="number"
                    value={wo.planned_operating_cost || ""}
                    onChange={(e) => setField("planned_operating_cost", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    step="0.01"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Corrective Operation Cost</label>
                  <input
                    type="number"
                    value={wo.corrective_operation_cost || ""}
                    onChange={(e) => setField("corrective_operation_cost", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    step="0.01"
                    disabled={disabled}
                  />
                  <span className="wof-hint">From Corrective Job Card</span>
                </div>
              </div>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Actual Operating Cost</label>
                  <input
                    type="number"
                    value={wo.actual_operating_cost || ""}
                    onChange={(e) => setField("actual_operating_cost", Number(e.target.value))}
                    className="form-field"
                    min="0"
                    step="0.01"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">Total Operating Cost</label>
                  <input
                    type="number"
                    value={
                      wo.actual_operating_cost + wo.corrective_operation_cost + wo.additional_operating_cost || ""
                    }
                    className="form-field"
                    disabled
                  />
                </div>
              </div>

              <div className="wof-field">
                <label className="wof-label">Additional Operating Cost</label>
                <input
                  type="number"
                  value={wo.additional_operating_cost || ""}
                  onChange={(e) => setField("additional_operating_cost", Number(e.target.value))}
                  className="form-field"
                  min="0"
                  step="0.01"
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 3: MORE INFO ════════════════════ */}
          {activeTab === "more_info" && (
            <div className="wof-card">
              <span className="wof-section-title wof-section-title-flush">Production Item Info</span>

              <div className="wof-field" style={{ marginTop: 14 }}>
                <label className="wof-label">Item Name</label>
                <input
                  type="text"
                  value={wo.item_name}
                  onChange={(e) => setField("item_name", e.target.value)}
                  className="form-field"
                  placeholder="e.g. FRP Box"
                  disabled={disabled}
                />
              </div>

              <div className="wof-grid-2">
                <div className="wof-field">
                  <label className="wof-label">Stock UOM</label>
                  <input
                    type="text"
                    value={wo.stock_uom}
                    onChange={(e) => setField("stock_uom", e.target.value)}
                    className="form-field"
                    placeholder="e.g. Nos"
                    disabled={disabled}
                  />
                </div>
                <div className="wof-field">
                  <label className="wof-label">
                    Status <span className="wof-required">*</span>
                  </label>
                  <input type="text" value={wo.status} className="form-field" disabled />
                </div>
              </div>

              <div className="wof-divider" />
              <span className="wof-section-title wof-section-title-flush">Comments</span>

              <div className="wof-comment-input-row" style={{ marginTop: 12 }}>
                <div className="wof-comment-avatar">TT</div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="wof-comment-input"
                  placeholder="Type a reply / comment"
                  disabled={submitting || loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <button
                  type="button"
                  className="wof-comment-send"
                  onClick={handleAddComment}
                  disabled={submitting || loading || !newComment.trim()}
                >
                  <FaPaperPlane size={11} />
                </button>
              </div>

              {wo.comments.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {wo.comments.map((c) => (
                    <div key={c.id} className="wof-comment-row">
                      <div className="wof-comment-avatar">{c.author.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <span className="wof-comment-author">
                          {c.author} <span className="wof-comment-time">· {c.time}</span>
                        </span>
                        <div className="wof-comment-text">{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="wof-divider" />
              <div className="wof-activity-header">
                <span className="wof-section-title wof-activity-title">Activity</span>
              </div>
              <ul className="wof-activity-list">
                {wo.activity.length === 0 && <li className="wof-activity-item">No activity yet.</li>}
                {wo.activity.map((a) => (
                  <li key={a.id} className="wof-activity-item">
                    {a.text} <span className="wof-activity-time">· {a.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ════════════════════ TAB 4: CONNECTIONS ════════════════════ */}
          {activeTab === "connections" && (
            <div className="wof-card">
              <div className="wof-progress-block">
                <div className="wof-progress-bar">
                  <div
                    className="wof-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, wo.items_produced_pct))}%` }}
                  />
                </div>
                <span className="wof-progress-label">
                  {wo.manufactured_qty || 0} items produced
                </span>
              </div>

              <div className="wof-progress-block">
                <div className="wof-progress-bar">
                  <div
                    className="wof-progress-fill"
                    style={{
                      width:
                        wo.operations.length > 0
                          ? `${(wo.completed_operations.length / wo.operations.length) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="wof-progress-label">
                  Completed Operations:{" "}
                  <strong>{wo.completed_operations.length > 0 ? wo.completed_operations.join(", ") : "None"}</strong>
                </span>
              </div>

              <div className="wof-divider" />

              <div className="wof-connections-grid">
                <div>
                  <span className="wof-section-title wof-section-title-flush">Transactions</span>
                  <div className="wof-connection-row">
                    <span>Stock Entry</span>
                    <span className="wof-connection-count">{wo.stock_entry_count}</span>
                  </div>
                  <div className="wof-connection-row">
                    <span>Job Card</span>
                    <span className="wof-connection-count">{wo.job_card_count}</span>
                  </div>
                  <div className="wof-connection-row">
                    <span>Pick List</span>
                    <span className="wof-connection-count">{wo.pick_list_count}</span>
                  </div>
                </div>

                <div>
                  <span className="wof-section-title wof-section-title-flush">Reference</span>
                  <div className="wof-connection-row">
                    <span>Serial No</span>
                    <span className="wof-connection-count">{wo.serial_no_count || "+"}</span>
                  </div>
                  <div className="wof-connection-row">
                    <span>Batch</span>
                    <span className="wof-connection-count">{wo.batch_count || "+"}</span>
                  </div>
                  <div className="wof-connection-row">
                    <span>Material Request</span>
                    <span className="wof-connection-count">{wo.material_request_count || "+"}</span>
                  </div>
                </div>

                <div>
                  <span className="wof-section-title wof-section-title-flush">Stock Reservation</span>
                  <div className="wof-connection-row">
                    <span>Stock Reservation Entry</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="wof-footer">
            <button type="button" onClick={() => navigate("/work-order")} className="cancel-btn" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="submit-btn">
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