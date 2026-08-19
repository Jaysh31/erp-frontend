// StockEntryForm.tsx - Complete file with all fixes and validation

import React, { useState, useEffect, useRef } from "react";
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
  FaWarehouse,
  FaClipboardList,
  FaBarcode,
  FaPrint,
  FaLink,
  FaCalculator,
  FaChevronDown,
  FaEye,
} from "react-icons/fa";
import "./StockEntryForm.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

interface ItemRow {
  id: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  itemCode: string;
  itemName: string;
  qty: string;
  basicRate: string;
  amount: string;
  itemTaxTemplate: string;
}

interface AdditionalCostRow {
  id: string;
  expenseAccount: string;
  description: string;
  amount: string;
}

interface WarehouseOption {
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

interface WorkOrderOption {
  id: number;
  name: string;
  status?: string;
  description?: string;
  qty?: number;
  bom?: string;
  company?: string;
}

interface ItemOption {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  stock_uom?: string;
  rate?: number;
  hsn?: string;
  tax_rate?: number;
}

interface StockEntryData {
  name: string;
  company: string;
  series: string;
  stockEntryType: string;
  postingDate: string;
  postingTime: string;
  editPostingDate: boolean;
  scanBarcode: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  addToTransit: boolean;
  applyPutawayRule: boolean;
  inspectionRequired: boolean;
  printHeading: string;
  letterHead: string;
  isOpening: string;
  perTransferred: string;
  remarks: string;
  workOrder: string;
  workOrderData: WorkOrderOption | null;
  items: ItemRow[];
  additionalCosts: AdditionalCostRow[];
}

interface ApiStockEntryPayload {
  id?: number;
  name: string;
  company: string;
  naming_series: string;
  stock_entry_type: string;
  purpose: string;
  set_posting_time: number;
  posting_date: string;
  posting_time: string;
  add_to_transit: number;
  apply_putaway_rule: number;
  inspection_required: number;
  work_order: string;
  subcontracting_order: string;
  outgoing_stock_entry: string;
  source_stock_entry: string;
  from_bom: number;
  use_multi_level_bom: number;
  bom_no: string;
  fg_completed_qty: number;
  process_loss_percentage: number;
  process_loss_qty: number;
  from_warehouse: string;
  source_warehouse_address: string;
  source_address_display: string;
  to_warehouse: string;
  target_warehouse_address: string;
  target_address_display: string;
  scan_barcode: string;
  total_outgoing_value: number;
  total_incoming_value: number;
  value_difference: number;
  total_additional_costs: number;
  supplier: string;
  supplier_name: string;
  supplier_address: string;
  address_display: string;
  project: string;
  cost_center: string;
  select_print_heading: string;
  letter_head: string;
  delivery_note_no: string;
  sales_invoice_no: string;
  job_card: string;
  pick_list: string;
  asset_repair: string;
  purchase_receipt_no: string;
  purchase_order: string;
  subcontracting_inward_order: string;
  is_additional_transfer_entry: number;
  is_opening: string;
  remarks: string;
  per_transferred: number;
  total_amount: number;
  amended_from: string;
  credit_note: string;
  is_return: number;
  _user_tags: string;
  _comments: string;
  _assign: string;
  _liked_by: string;
}

type TabKey = "details" | "additional" | "other" | "connections";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "additional", label: "Additional Costs" },
  { key: "other", label: "Other Info" },
  { key: "connections", label: "Connections" },
];

const STOCK_ENTRY_TYPES = [
  "Disassemble",
  "Manufacture",
  "Material Consumption for Manufacture",
  "Material Issue",
  "Material Receipt",
  "Material Transfer",
  "Material Transfer for Manufacture",
  "Receive from Customer",
  "Repack",
  "Send to Subcontractor",
];

const COMPANIES = ["SculptorTech Pvt Ltd", "Reshma Moulding Works"];
const LETTER_HEADS = ["Company Letterhead - Grey", "Company Letterhead - Blue"];
const EXPENSE_ACCOUNTS = ["Freight", "Insurance", "Customs", "Labor"];

const uid = () => Math.random().toString(36).slice(2, 9);

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return {
    date: `${year}-${month}-${day}`,
    time: `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}:${String(today.getSeconds()).padStart(2, "0")}`,
  };
};

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
};

const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return "";
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const parts = dateString.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

const emptyItem = (): ItemRow => ({
  id: uid(),
  sourceWarehouse: "",
  targetWarehouse: "",
  itemCode: "",
  itemName: "",
  qty: "",
  basicRate: "",
  amount: "",
  itemTaxTemplate: "",
});

const emptyCost = (): AdditionalCostRow => ({
  id: uid(),
  expenseAccount: "",
  description: "",
  amount: "",
});

const emptyStockEntry = (): StockEntryData => {
  const { date, time } = getToday();
  return {
    name: "",
    company: "SculptorTech Pvt Ltd",
    series: "MAT-STE-",
    stockEntryType: "Material Transfer",
    postingDate: date,
    postingTime: time,
    editPostingDate: false,
    scanBarcode: "",
    sourceWarehouse: "",
    targetWarehouse: "",
    addToTransit: false,
    applyPutawayRule: true,
    inspectionRequired: false,
    printHeading: "Stock Entry",
    letterHead: "SculptorTech",
    isOpening: "No",
    perTransferred: "100",
    remarks: "Material transferred for production.",
    workOrder: "",
    workOrderData: null,
    items: [emptyItem()],
    additionalCosts: [],
  };
};

// ─── Main Component ─────────────────────────────────────────────────────

export default function StockEntryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";

  const [se, setSe] = useState<StockEntryData>(emptyStockEntry());
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  
  // Dropdown states
  const [showWorkOrderDropdown, setShowWorkOrderDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState<string | null>(null);
  const [workOrderSearch, setWorkOrderSearch] = useState("");
  const [itemSearch, setItemSearch] = useState<{ [key: string]: string }>({});
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrderOption[]>([]);
  
  // Refs for dropdowns - FIXED: using proper ref types
  const workOrderRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const disabled = submitting || loading;

  interface ValidationError {
    field: string;
    label: string;
    message: string;
  }

  // ─── Fetch Data ──────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setWarehousesLoading(true);
        const warehouseResponse = await api.get("/warehouse");
        if (warehouseResponse.data.success === 1) {
          const records = warehouseResponse.data.data?.records || [];
          setWarehouses(records);
        }

        setWorkOrdersLoading(true);
        const workOrderResponse = await api.get("/work-order");
        if (workOrderResponse.data.success === 1) {
          const records = workOrderResponse.data.data?.records || [];
          setWorkOrders(records);
          setFilteredWorkOrders(records);
        }

        setItemsLoading(true);
        const itemResponse = await api.get("/item");
        if (itemResponse.data.success === 1) {
          const records = itemResponse.data.data?.records || [];
          setItems(records);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setWarehousesLoading(false);
        setWorkOrdersLoading(false);
        setItemsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Filter Functions ────────────────────────────────────────────────────

  useEffect(() => {
    if (!workOrderSearch.trim()) {
      setFilteredWorkOrders(workOrders);
      return;
    }
    const term = workOrderSearch.toLowerCase().trim();
    const filtered = workOrders.filter((wo) =>
      (wo.name || "").toLowerCase().includes(term) ||
      (wo.status || "").toLowerCase().includes(term)
    );
    setFilteredWorkOrders(filtered);
  }, [workOrderSearch, workOrders]);

  // ─── Click Outside Handlers ────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (workOrderRef.current && !workOrderRef.current.contains(target)) {
        setShowWorkOrderDropdown(false);
      }
      
      Object.keys(itemRefs.current).forEach((key) => {
        const ref = itemRefs.current[key];
        if (ref && !ref.contains(target)) {
          // Don't close if clicking on the view button inside dropdown
          if (target.closest('.dropdown-view-btn')) return;
          setShowItemDropdown(null);
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── View Functions ────────────────────────────────────────────────────

  const handleViewWorkOrder = (workOrder: WorkOrderOption) => {
    if (workOrder && workOrder.id) {
      navigate(`/work-order/${workOrder.id}`);
    }
  };

  const handleViewItem = (item: ItemOption) => {
    if (item && item.id) {
      navigate(`/item/${item.id}`);
    }
  };

  const setField = <K extends keyof StockEntryData>(field: K, value: StockEntryData[K]) => {
    setSe((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (rowId: string, field: keyof ItemRow, value: string) => {
    setSe((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === rowId ? { ...item, [field]: value } : item)),
    }));
  };

  const handleItemSelect = (rowId: string, itemData: ItemOption) => {
    if (itemData) {
      setSe((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === rowId
            ? {
                ...item,
                itemCode: itemData.item_code,
                itemName: itemData.item_name || "",
                basicRate: itemData.rate ? itemData.rate.toString() : "0",
              }
            : item
        ),
      }));
      const item = se.items.find((i) => i.id === rowId);
      if (item) {
        const qty = parseFloat(item.qty) || 0;
        const rate = itemData.rate || 0;
        const amount = qty * rate;
        updateItem(rowId, "amount", amount.toString());
      }
    }
    setShowItemDropdown(null);
    setItemSearch(prev => ({ ...prev, [rowId]: "" }));
  };

  const handleWorkOrderSelect = (workOrderData: WorkOrderOption) => {
    setSe((prev) => ({
      ...prev,
      workOrder: workOrderData.name || workOrderData.id?.toString() || "",
      workOrderData: workOrderData,
    }));
    setShowWorkOrderDropdown(false);
    setWorkOrderSearch("");
  };

  // ─── FIXED: Only allow numbers for Qty (max 20 digits) ────────────────
  const updateQty = (rowId: string, value: string) => {
    // Remove all non-digit and non-decimal characters
    const cleaned = value.replace(/[^0-9.]/g, "");
    
    // Check for multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    
    // Check decimal places (max 3 decimal places)
    if (parts.length === 2 && parts[1].length > 3) return;
    
    // Check total digits (max 20)
    const digitsOnly = cleaned.replace(/\./g, "");
    if (digitsOnly.length > 20) return;
    
    updateItem(rowId, "qty", cleaned);
    const item = se.items.find((i) => i.id === rowId);
    if (item) {
      const qty = parseFloat(cleaned) || 0;
      const rate = parseFloat(item.basicRate) || 0;
      const amount = qty * rate;
      updateItem(rowId, "amount", amount.toFixed(2));
    }
  };

  // ─── FIXED: Only allow numbers for Basic Rate (max 20 digits) ──────────
  const updateRate = (rowId: string, value: string) => {
    // Remove all non-digit and non-decimal characters
    const cleaned = value.replace(/[^0-9.]/g, "");
    
    // Check for multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    
    // Check decimal places (max 2 decimal places)
    if (parts.length === 2 && parts[1].length > 2) return;
    
    // Check total digits (max 20)
    const digitsOnly = cleaned.replace(/\./g, "");
    if (digitsOnly.length > 20) return;
    
    updateItem(rowId, "basicRate", cleaned);
    const item = se.items.find((i) => i.id === rowId);
    if (item) {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(cleaned) || 0;
      const amount = qty * rate;
      updateItem(rowId, "amount", amount.toFixed(2));
    }
  };

  // ─── FIXED: Only allow numbers for Amount (max 20 digits) ──────────────
  const updateAmount = (rowId: string, value: string) => {
    // Remove all non-digit and non-decimal characters
    const cleaned = value.replace(/[^0-9.]/g, "");
    
    // Check for multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    
    // Check decimal places (max 2 decimal places)
    if (parts.length === 2 && parts[1].length > 2) return;
    
    // Check total digits (max 20)
    const digitsOnly = cleaned.replace(/\./g, "");
    if (digitsOnly.length > 20) return;
    
    updateItem(rowId, "amount", cleaned);
  };

  const addItem = () => {
    setSe((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (rowId: string) => {
    if (se.items.length <= 1) return;
    setSe((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== rowId),
    }));
  };

  const updateCost = (rowId: string, field: keyof AdditionalCostRow, value: string) => {
    setSe((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.map((cost) =>
        cost.id === rowId ? { ...cost, [field]: value } : cost
      ),
    }));
  };

  const addCost = () => {
    setSe((prev) => ({ ...prev, additionalCosts: [...prev.additionalCosts, emptyCost()] }));
  };

  const removeCost = (rowId: string) => {
    setSe((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((cost) => cost.id !== rowId),
    }));
  };

  // ─── Calculations ──────────────────────────────────────────────────────

  const totalOutgoingValue = se.items.reduce((sum, item) => {
    return sum + (parseFloat(item.amount) || 0);
  }, 0);

  const totalIncomingValue = totalOutgoingValue;
  const totalValueDifference = 0.00;
  const totalEstimatedTaxes = 0.00;
  const totalAdditionalCosts = se.additionalCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
  const totalAmount = totalOutgoingValue + totalAdditionalCosts;
  const grandTotal = totalAmount;

  // ─── VALIDATION ──────────────────────────────────────────────────────

  const getAllValidationErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!se.company.trim()) {
      errors.push({ field: "company", label: "Company", message: "Company is required" });
    }
    if (!se.stockEntryType) {
      errors.push({
        field: "stockEntryType",
        label: "Stock Entry Type",
        message: "Stock entry type is required",
      });
    }

    se.items.forEach((item, idx) => {
      if (!item.itemCode.trim()) {
        errors.push({
          field: `items[${idx}].itemCode`,
          label: `Item ${idx + 1} Code`,
          message: `Item code is required for row ${idx + 1}`,
        });
      }
      
      const qtyNum = parseFloat(item.qty);
      if (!item.qty || isNaN(qtyNum) || qtyNum <= 0) {
        errors.push({
          field: `items[${idx}].qty`,
          label: `Item ${idx + 1} Qty`,
          message: `Quantity must be a positive number for row ${idx + 1}`,
        });
      }
      
      const rateNum = parseFloat(item.basicRate);
      if (!item.basicRate || isNaN(rateNum) || rateNum < 0) {
        errors.push({
          field: `items[${idx}].basicRate`,
          label: `Item ${idx + 1} Rate`,
          message: `Rate must be a valid non-negative number for row ${idx + 1}`,
        });
      }
      
      const amountNum = parseFloat(item.amount);
      if (item.amount && (isNaN(amountNum) || amountNum < 0)) {
        errors.push({
          field: `items[${idx}].amount`,
          label: `Item ${idx + 1} Amount`,
          message: `Amount must be a valid non-negative number for row ${idx + 1}`,
        });
      }
    });

    return errors;
  };

  const hasErrors = getAllValidationErrors().length > 0;

  // ─── Convert to API Payload ──────────────────────────────────────────

  const convertToApiPayload = (data: StockEntryData, entryId?: string): ApiStockEntryPayload => {
    const payload: ApiStockEntryPayload = {
      name: data.name || "STE-00001",
      company: data.company,
      naming_series: data.series,
      stock_entry_type: data.stockEntryType,
      purpose: data.stockEntryType,
      set_posting_time: data.editPostingDate ? 1 : 0,
      posting_date: formatDateForAPI(data.postingDate),
      posting_time: data.postingTime,
      add_to_transit: data.addToTransit ? 1 : 0,
      apply_putaway_rule: data.applyPutawayRule ? 1 : 0,
      inspection_required: data.inspectionRequired ? 1 : 0,
      work_order: data.workOrder || "",
      subcontracting_order: "",
      outgoing_stock_entry: "",
      source_stock_entry: "",
      from_bom: 1,
      use_multi_level_bom: 1,
      bom_no: "BOM-00001",
      fg_completed_qty: 100,
      process_loss_percentage: 2,
      process_loss_qty: 2,
      from_warehouse: data.sourceWarehouse || "Stores - ST",
      source_warehouse_address: "Warehouse Address",
      source_address_display: "Pune, Maharashtra",
      to_warehouse: data.targetWarehouse || "WIP Warehouse - ST",
      target_warehouse_address: "WIP Address",
      target_address_display: "Pune, Maharashtra",
      scan_barcode: data.scanBarcode,
      total_outgoing_value: totalOutgoingValue,
      total_incoming_value: totalIncomingValue,
      value_difference: totalValueDifference,
      total_additional_costs: totalAdditionalCosts,
      supplier: "SUP-00001",
      supplier_name: "ABC Suppliers",
      supplier_address: "Mumbai",
      address_display: "Mumbai, Maharashtra",
      project: "PRJ-00001",
      cost_center: "Main - ST",
      select_print_heading: data.printHeading,
      letter_head: data.letterHead,
      delivery_note_no: "",
      sales_invoice_no: "",
      job_card: "JC-00001",
      pick_list: "PL-00001",
      asset_repair: "",
      purchase_receipt_no: "",
      purchase_order: "PO-00001",
      subcontracting_inward_order: "",
      is_additional_transfer_entry: 0,
      is_opening: data.isOpening,
      remarks: data.remarks,
      per_transferred: parseInt(data.perTransferred) || 100,
      total_amount: totalAmount,
      amended_from: "",
      credit_note: "",
      is_return: 0,
      _user_tags: "",
      _comments: "",
      _assign: "",
      _liked_by: "",
    };

    if (entryId) {
      payload.id = parseInt(entryId);
    }

    return payload;
  };

  // ─── Save ────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = convertToApiPayload(se, !isNew ? id : undefined);
      
      let response;
      if (isNew) {
        response = await api.post("/stock-entry", payload);
      } else {
        response = await api.put("/stock-entry", payload);
      }

      if (response.data && response.data.success === 1) {
        navigate("/stock-entry");
      } else {
        setApiError(response.data?.message || `Failed to ${isNew ? "create" : "update"} stock entry`);
      }
    } catch (err: any) {
      console.error("Error saving stock entry:", err);
      if (err.response) {
        setApiError(err.response.data?.message || `Failed to ${isNew ? "create" : "update"} stock entry`);
      } else if (err.request) {
        setApiError("Network error. Please check your connection.");
      } else {
        setApiError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`sef-page ${theme}`}>
        <div className="sef-inner">
          <div className="sef-loading">Loading stock entry data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sef-page ${theme}`}>
      <div className="sef-inner">
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
          <div className="sef-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>
              ×
            </button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="sef-header">
          <button onClick={() => navigate("/stock-entry")} className="back-btn">
            <FaArrowLeft size={14} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? "Add New Stock Entry" : `Edit: ${se.name || "Stock Entry"}`}</h1>
            <span className="sef-status-badge sef-status-draft">Draft</span>
          </div>
          {!isNew && hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────────── */}
        <div className="sef-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`sef-tab-btn ${activeTab === tab.key ? "sef-tab-btn-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          {/* ════════════════════ TAB 1: DETAILS ════════════════════════ */}
          {activeTab === "details" && (
            <div className="sef-card">
              {/* ── Entry basics ── */}
              <div className="sef-grid-2">
                <div className="sef-field">
                  <label className="sef-label">
                    Company <span className="sef-required">*</span>
                  </label>
                  <select
                    className="form-field"
                    value={se.company}
                    onChange={(e) => setField("company", e.target.value)}
                    disabled={disabled}
                  >
                    {COMPANIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="sef-field" style={{ justifyContent: "flex-end" }}>
                  <div className="sef-checkbox-field">
                    <input
                      type="checkbox"
                      id="editPostingDate"
                      checked={se.editPostingDate}
                      onChange={(e) => setField("editPostingDate", e.target.checked)}
                      disabled={disabled}
                    />
                    <label htmlFor="editPostingDate">Edit Posting Date and Time</label>
                  </div>
                </div>
              </div>

              <div className="sef-grid-2">
                <div className="sef-field">
                  <label className="sef-label">
                    Stock Entry Type <span className="sef-required">*</span>
                  </label>
                  <select
                    className="form-field"
                    value={se.stockEntryType}
                    onChange={(e) => setField("stockEntryType", e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">Select type…</option>
                    {STOCK_ENTRY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="sef-field">
                  <label className="sef-label">Posting Date</label>
                  <input
                    type="text"
                    className={`form-field ${!se.editPostingDate ? "form-field-disabled" : ""}`}
                    value={formatDateForDisplay(se.postingDate)}
                    readOnly={!se.editPostingDate}
                    onChange={() => {}}
                    disabled={!se.editPostingDate}
                  />
                </div>
              </div>

              <div className="sef-grid-2">
                <div className="sef-field">
                  <label className="sef-label">Posting Time</label>
                  <input
                    type="text"
                    className={`form-field ${!se.editPostingDate ? "form-field-disabled" : ""}`}
                    value={se.postingTime}
                    readOnly={!se.editPostingDate}
                    onChange={() => {}}
                    disabled={!se.editPostingDate}
                  />
                </div>
                <div />
              </div>

              <div className="sef-divider" />

              {/* ── Work Order Dropdown ── */}
              <div className="sef-field">
                <label className="sef-label">Work Order Reference</label>
                <div className="dropdown-wrapper" ref={workOrderRef}>
                  <div className="dropdown-input-wrapper">
                    <input
                      type="text"
                      className="form-field"
                      placeholder="Search work order..."
                      value={showWorkOrderDropdown ? workOrderSearch : (se.workOrderData?.name || se.workOrder || "")}
                      onFocus={() => setShowWorkOrderDropdown(true)}
                      onChange={(e) => {
                        setWorkOrderSearch(e.target.value);
                        setShowWorkOrderDropdown(true);
                      }}
                      disabled={disabled || workOrdersLoading}
                    />
                    <FaChevronDown 
                      className="dropdown-arrow" 
                      onClick={() => setShowWorkOrderDropdown(!showWorkOrderDropdown)}
                    />
                    {se.workOrder && (
                      <button
                        type="button"
                        className="dropdown-clear"
                        onClick={() => {
                          setSe(prev => ({ ...prev, workOrder: "", workOrderData: null }));
                          setWorkOrderSearch("");
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {showWorkOrderDropdown && !disabled && (
                    <div className="dropdown-menu">
                      {workOrdersLoading ? (
                        <div className="dropdown-loading">Loading...</div>
                      ) : filteredWorkOrders.length === 0 ? (
                        <div className="dropdown-empty">No work orders found</div>
                      ) : (
                        filteredWorkOrders.map((wo) => (
                          <div
                            key={wo.id}
                            className={`dropdown-item ${se.workOrder === (wo.name || wo.id?.toString()) ? "selected" : ""}`}
                            onClick={() => handleWorkOrderSelect(wo)}
                          >
                            <div className="dropdown-item-content">
                              <span className="dropdown-item-main">{wo.name || wo.id}</span>
                              <span className="dropdown-item-sub">
                                {wo.status && `Status: ${wo.status}`}
                                {wo.qty && ` | Qty: ${wo.qty}`}
                                {wo.bom && ` | BOM: ${wo.bom}`}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="dropdown-view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewWorkOrder(wo);
                              }}
                            >
                              <FaEye size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="sef-divider" />

              {/* ── Checkboxes ── */}
              <div className="sef-grid-2">
                <div className="sef-checkbox-field">
                  <input
                    type="checkbox"
                    id="addToTransit"
                    checked={se.addToTransit}
                    onChange={(e) => setField("addToTransit", e.target.checked)}
                    disabled={disabled}
                  />
                  <label htmlFor="addToTransit">Add to Transit</label>
                </div>

                <div className="sef-checkbox-field">
                  <input
                    type="checkbox"
                    id="applyPutaway"
                    checked={se.applyPutawayRule}
                    onChange={(e) => setField("applyPutawayRule", e.target.checked)}
                    disabled={disabled}
                  />
                  <label htmlFor="applyPutaway">Apply Putaway Rule</label>
                </div>
              </div>

              <div className="sef-checkbox-field">
                <input
                  type="checkbox"
                  id="inspection"
                  checked={se.inspectionRequired}
                  onChange={(e) => setField("inspectionRequired", e.target.checked)}
                  disabled={disabled}
                />
                <label htmlFor="inspection">Inspection Required</label>
              </div>

              <div className="sef-divider" />

              {/* ── Warehouses ── */}
              <div className="sef-grid-2">
                <div className="sef-field">
                  <label className="sef-label">Source Warehouse</label>
                  <select
                    className="form-field"
                    value={se.sourceWarehouse}
                    onChange={(e) => setField("sourceWarehouse", e.target.value)}
                    disabled={disabled || warehousesLoading}
                  >
                    <option value="">Select source warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.warehouse_name}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sef-field">
                  <label className="sef-label">Target Warehouse</label>
                  <select
                    className="form-field"
                    value={se.targetWarehouse}
                    onChange={(e) => setField("targetWarehouse", e.target.value)}
                    disabled={disabled || warehousesLoading}
                  >
                    <option value="">Select target warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.warehouse_name}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sef-divider" />

              {/* ── Barcode ── */}
              <div className="sef-field">
                <label className="sef-label">Scan Barcode</label>
                <div className="barcode-input-wrap">
                  <FaBarcode className="barcode-icon" />
                  <input
                    type="text"
                    className="form-field"
                    placeholder="Scan or enter barcode…"
                    value={se.scanBarcode}
                    onChange={(e) => setField("scanBarcode", e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="sef-divider" />

              {/* ── Items Table ── */}
              <div className="sef-table-header">
                <span className="sef-section-title sef-section-title-flush">
                  <FaClipboardList className="sef-section-icon" /> ITEMS
                </span>
                <span className="sef-items-count">{se.items.length}</span>
                <button type="button" className="sef-row-add-btn" onClick={addItem}>
                  <FaPlus size={10} /> ADD ROW
                </button>
              </div>

              <div className="sef-table-scroll">
                <table className="sef-editable-table">
                  <thead>
                    <tr>
                      <th className="sef-col-no">#</th>
                      <th>Source Warehouse</th>
                      <th>Target Warehouse</th>
                      <th>ITEM <span className="sef-required">*</span></th>
                      <th className="text-right">QTY <span className="sef-required">*</span></th>
                      <th className="text-right">BASIC RATE <span className="sef-required">*</span></th>
                      <th className="text-right">AMOUNT</th>
                      <th>Item Tax Template</th>
                      <th className="sef-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {se.items.map((item, idx) => {
                      const itemError = validationErrors.find(e => e.field === `items[${idx}].itemCode`);
                      const qtyError = validationErrors.find(e => e.field === `items[${idx}].qty`);
                      const rateError = validationErrors.find(e => e.field === `items[${idx}].basicRate`);
                      const amountError = validationErrors.find(e => e.field === `items[${idx}].amount`);
                      const isItemDropdownOpen = showItemDropdown === item.id;
                      const itemSearchValue = itemSearch[item.id] || "";
                      
                      const filteredItemsForRow = itemSearchValue.trim() 
                        ? items.filter(i => 
                            (i.item_code || "").toLowerCase().includes(itemSearchValue.toLowerCase()) ||
                            (i.item_name || "").toLowerCase().includes(itemSearchValue.toLowerCase())
                          )
                        : items;
                      
                      return (
                        <tr key={item.id}>
                          <td className="sef-col-no">{idx + 1}</td>
                          <td>
                            <select
                              className="form-field form-field-sm"
                              value={item.sourceWarehouse}
                              onChange={(e) => updateItem(item.id, "sourceWarehouse", e.target.value)}
                              disabled={disabled || warehousesLoading}
                            >
                              <option value="">Select warehouse</option>
                              {warehouses.map((w) => (
                                <option key={w.id} value={w.warehouse_name}>
                                  {w.warehouse_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-field form-field-sm"
                              value={item.targetWarehouse}
                              onChange={(e) => updateItem(item.id, "targetWarehouse", e.target.value)}
                              disabled={disabled || warehousesLoading}
                            >
                              <option value="">Select warehouse</option>
                              {warehouses.map((w) => (
                                <option key={w.id} value={w.warehouse_name}>
                                  {w.warehouse_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="item-dropdown-wrapper" ref={(el) => { itemRefs.current[item.id] = el; }}>
                              <div className="dropdown-input-wrapper">
                                <input
                                  type="text"
                                  className={`form-field form-field-sm ${itemError ? "field-error" : ""}`}
                                  placeholder="Search item..."
                                  value={isItemDropdownOpen ? itemSearchValue : (item.itemName || item.itemCode || "")}
                                  onFocus={() => {
                                    setShowItemDropdown(item.id);
                                    setItemSearch(prev => ({ ...prev, [item.id]: item.itemCode || "" }));
                                  }}
                                  onChange={(e) => {
                                    setItemSearch(prev => ({ ...prev, [item.id]: e.target.value }));
                                    setShowItemDropdown(item.id);
                                  }}
                                  disabled={disabled || itemsLoading}
                                />
                                <FaChevronDown 
                                  className="dropdown-arrow"
                                  onClick={() => setShowItemDropdown(isItemDropdownOpen ? null : item.id)}
                                />
                                {item.itemCode && (
                                  <button
                                    type="button"
                                    className="dropdown-clear"
                                    onClick={() => {
                                      updateItem(item.id, "itemCode", "");
                                      updateItem(item.id, "itemName", "");
                                      updateItem(item.id, "basicRate", "");
                                      updateItem(item.id, "amount", "");
                                      setItemSearch(prev => ({ ...prev, [item.id]: "" }));
                                      setShowItemDropdown(null);
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              {isItemDropdownOpen && !disabled && (
                                <div className="dropdown-menu item-dropdown-menu">
                                  {itemsLoading ? (
                                    <div className="dropdown-loading">Loading items...</div>
                                  ) : filteredItemsForRow.length === 0 ? (
                                    <div className="dropdown-empty">No items found</div>
                                  ) : (
                                    filteredItemsForRow.map((itemOpt) => (
                                      <div
                                        key={itemOpt.id}
                                        className={`dropdown-item ${item.itemCode === itemOpt.item_code ? "selected" : ""}`}
                                        onClick={() => handleItemSelect(item.id, itemOpt)}
                                      >
                                        <div className="dropdown-item-content">
                                          <span className="dropdown-item-main">{itemOpt.item_code} - {itemOpt.item_name}</span>
                                          <span className="dropdown-item-sub">
                                            {itemOpt.hsn && `HSN: ${itemOpt.hsn}`}
                                            {itemOpt.tax_rate && ` | Tax: ${itemOpt.tax_rate}%`}
                                            {itemOpt.stock_uom && ` | UOM: ${itemOpt.stock_uom}`}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          className="dropdown-view-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewItem(itemOpt);
                                          }}
                                        >
                                          <FaEye size={12} />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                              {itemError && <div className="sef-error-msg">{itemError.message}</div>}
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className={`form-field form-field-sm text-right ${qtyError ? "field-error" : ""}`}
                              value={item.qty}
                              onChange={(e) => updateQty(item.id, e.target.value)}
                              placeholder="0.000"
                              disabled={disabled}
                              maxLength={24}
                            />
                            {qtyError && <div className="sef-error-msg">{qtyError.message}</div>}
                          </td>
                          <td>
                            <input
                              type="text"
                              className={`form-field form-field-sm text-right ${rateError ? "field-error" : ""}`}
                              value={item.basicRate}
                              onChange={(e) => updateRate(item.id, e.target.value)}
                              placeholder="0.00"
                              disabled={disabled}
                              maxLength={24}
                            />
                            {rateError && <div className="sef-error-msg">{rateError.message}</div>}
                          </td>
                          <td>
                            <input
                              type="text"
                              className={`form-field form-field-sm text-right ${amountError ? "field-error" : ""}`}
                              value={item.amount}
                              onChange={(e) => updateAmount(item.id, e.target.value)}
                              placeholder="0.00"
                              disabled={disabled}
                              maxLength={24}
                            />
                            {amountError && <div className="sef-error-msg">{amountError.message}</div>}
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-field form-field-sm"
                              value={item.itemTaxTemplate}
                              onChange={(e) => updateItem(item.id, "itemTaxTemplate", e.target.value)}
                              placeholder="Template…"
                              disabled={disabled}
                            />
                          </td>
                          <td className="sef-col-action">
                            <button
                              type="button"
                              className="sef-row-delete-btn"
                              onClick={() => removeItem(item.id)}
                              disabled={se.items.length <= 1}
                            >
                              <FaTrash size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="sef-table-footer">
                <div className="sef-table-footer-left">
                  <button type="button" className="sef-link-btn" onClick={addItem}>
                    <FaPlus size={12} /> Add row
                  </button>
                </div>
              </div>

              <div className="sef-divider" />

              {/* ── Totals ── */}
              <div className="sef-totals-grid">
                <div className="sef-total-card">
                  <div className="sef-total-label">Total Outgoing Value</div>
                  <div className="sef-total-value">
                    ₹ {totalOutgoingValue.toFixed(2)}
                  </div>
                </div>
                <div className="sef-total-card">
                  <div className="sef-total-label">Total Additional Costs</div>
                  <div className="sef-total-value">
                    ₹ {totalAdditionalCosts.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="sef-totals-grid">
                <div className="sef-total-card">
                  <div className="sef-total-label">Grand Total</div>
                  <div className="sef-total-value sef-total-value-primary">
                    ₹ {grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 2: ADDITIONAL COSTS ════════════════ */}
          {activeTab === "additional" && (
            <div className="sef-card">
              <div className="sef-table-header">
                <span className="sef-section-title sef-section-title-flush">
                  <FaCalculator className="sef-section-icon" /> ADDITIONAL COSTS
                </span>
                <span className="sef-items-count">{se.additionalCosts.length}</span>
                <button type="button" className="sef-row-add-btn" onClick={addCost}>
                  <FaPlus size={10} /> ADD ROW
                </button>
              </div>

              <div className="sef-table-scroll">
                <table className="sef-editable-table">
                  <thead>
                    <tr>
                      <th className="sef-col-no">#</th>
                      <th>Expense Account</th>
                      <th>Description</th>
                      <th className="text-right">Amount</th>
                      <th className="sef-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {se.additionalCosts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                          No additional costs added. Click "ADD ROW" to add rows.
                        </td>
                      </tr>
                    ) : (
                      se.additionalCosts.map((cost, idx) => (
                        <tr key={cost.id}>
                          <td className="sef-col-no">{idx + 1}</td>
                          <td>
                            <select
                              className="form-field form-field-sm"
                              value={cost.expenseAccount}
                              onChange={(e) => updateCost(cost.id, "expenseAccount", e.target.value)}
                              disabled={disabled}
                            >
                              <option value="">Select account...</option>
                              {EXPENSE_ACCOUNTS.map((a) => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-field form-field-sm"
                              value={cost.description}
                              onChange={(e) => updateCost(cost.id, "description", e.target.value)}
                              placeholder="Description"
                              disabled={disabled}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-field form-field-sm text-right"
                              value={cost.amount}
                              onChange={(e) => {
                                // Only allow numbers for amount
                                const val = e.target.value.replace(/[^0-9.]/g, "");
                                // Check for multiple decimal points
                                const parts = val.split(".");
                                if (parts.length > 2) return;
                                // Check decimal places (max 2)
                                if (parts.length === 2 && parts[1].length > 2) return;
                                // Check total digits (max 20)
                                const digitsOnly = val.replace(/\./g, "");
                                if (digitsOnly.length > 20) return;
                                updateCost(cost.id, "amount", val);
                              }}
                              placeholder="0.00"
                              disabled={disabled}
                              maxLength={24}
                            />
                          </td>
                          <td className="sef-col-action">
                            <button
                              type="button"
                              className="sef-row-delete-btn"
                              onClick={() => removeCost(cost.id)}
                            >
                              <FaTrash size={11} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 3: OTHER INFO ═════════════════════ */}
          {activeTab === "other" && (
            <div className="sef-card">
              <span className="sef-section-title">
                <FaPrint className="sef-section-icon" /> Printing Settings
              </span>

              <div className="sef-grid-2">
                <div className="sef-field">
                  <label className="sef-label">Print Heading</label>
                  <input
                    type="text"
                    className="form-field"
                    value={se.printHeading}
                    onChange={(e) => setField("printHeading", e.target.value)}
                    placeholder="Enter heading…"
                    disabled={disabled}
                  />
                </div>
                <div className="sef-field">
                  <label className="sef-label">Letter Head</label>
                  <select
                    className="form-field"
                    value={se.letterHead}
                    onChange={(e) => setField("letterHead", e.target.value)}
                    disabled={disabled}
                  >
                    {LETTER_HEADS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sef-divider" />

              <span className="sef-section-title">
                <FaInfoCircle className="sef-section-icon" /> More Information
              </span>

              <div className="sef-grid-2">
                <div className="sef-field">
                  <label className="sef-label">Is Opening</label>
                  <select
                    className="form-field"
                    value={se.isOpening}
                    onChange={(e) => setField("isOpening", e.target.value)}
                    disabled={disabled}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="sef-field">
                  <label className="sef-label">Per Transferred</label>
                  <input
                    type="text"
                    className="form-field"
                    value={se.perTransferred}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setField("perTransferred", val);
                    }}
                    placeholder="0"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="sef-field">
                <label className="sef-label">Remarks</label>
                <textarea
                  className="form-field textarea-field"
                  value={se.remarks}
                  onChange={(e) => setField("remarks", e.target.value)}
                  placeholder="Add any notes or remarks…"
                  rows={4}
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 4: CONNECTIONS ════════════════════ */}
          {activeTab === "connections" && (
            <div className="sef-card">
              <div className="sef-connections-grid">
                <div>
                  <span className="sef-section-title sef-section-title-flush">
                    <FaWarehouse className="sef-section-icon" /> Stock Reservation
                  </span>
                  <button type="button" className="sef-connection-btn">
                    Stock Reservation Entry
                  </button>
                </div>

                <div>
                  <span className="sef-section-title sef-section-title-flush">
                    <FaLink className="sef-section-icon" /> GST Logs
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button type="button" className="sef-connection-btn sef-connection-btn-secondary">
                      e-Waybill Log
                    </button>
                    <button type="button" className="sef-connection-btn sef-connection-btn-secondary">
                      Integration Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="sef-footer">
            <button type="button" onClick={() => navigate("/stock-entry")} className="cancel-btn" disabled={submitting}>
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