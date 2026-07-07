// StockEntryForm.tsx - Complete fixed version

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
  FaSearch,
  FaWarehouse,
  
  FaClipboardList,
  FaBarcode,
  FaPrint,
  FaLink,
  FaCalculator,
} from "react-icons/fa";
import "./StockEntryForm.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

interface ItemRow {
  id: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  itemCode: string;
  qty: string;
  basicRate: string;
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
  qty: "0.000",
  basicRate: "0.00",
  itemTaxTemplate: "",
});

const emptyCost = (): AdditionalCostRow => ({
  id: uid(),
  expenseAccount: "",
  description: "",
  amount: "0.00",
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
    items: [emptyItem(), emptyItem()],
    additionalCosts: [], // Start with empty additional costs
  };
};

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
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await api.get("/warehouse");
        if (response.data.success === 1) {
          const records = response.data.data?.records || [];
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectWarehouse = (warehouse: WarehouseOption) => {
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
      <label className="sef-label">
        {label}
        {required && <span className="sef-required"> *</span>}
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
      {hint && <span className="sef-hint">{hint}</span>}
      {error && <div className="sef-error-msg">{error}</div>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function StockEntryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";

  const [se, setSe] = useState<StockEntryData>(emptyStockEntry());
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [loading, ] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  const disabled = submitting || loading;

  interface ValidationError {
    field: string;
    label: string;
    message: string;
  }

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setWarehousesLoading(true);
        const response = await api.get("/warehouse");
        if (response.data.success === 1) {
          const records = response.data.data?.records || [];
          setWarehouses(records);
        }
      } catch (error) {
        console.error("Error fetching warehouses:", error);
        setWarehouses([]);
      } finally {
        setWarehousesLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  const setField = <K extends keyof StockEntryData>(field: K, value: StockEntryData[K]) => {
    setSe((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const updateItem = (rowId: string, field: keyof ItemRow, value: string) => {
    setSe((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === rowId ? { ...item, [field]: value } : item)),
    }));
    setIsDirty(true);
  };

  const addItem = () => {
    setSe((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
    setIsDirty(true);
  };

  const removeItem = (rowId: string) => {
    setSe((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== rowId),
    }));
    setIsDirty(true);
  };

  const updateCost = (rowId: string, field: keyof AdditionalCostRow, value: string) => {
    setSe((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.map((cost) =>
        cost.id === rowId ? { ...cost, [field]: value } : cost
      ),
    }));
    setIsDirty(true);
  };

  const addCost = () => {
    setSe((prev) => ({ ...prev, additionalCosts: [...prev.additionalCosts, emptyCost()] }));
    setIsDirty(true);
  };

  const removeCost = (rowId: string) => {
    setSe((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((cost) => cost.id !== rowId),
    }));
    setIsDirty(true);
  };

  // ─── Calculations ──────────────────────────────────────────────────────

  const totalOutgoingValue = 50000.00;
  const totalIncomingValue = 50000.00;
  const totalValueDifference = 0.00;
  const totalEstimatedTaxes = 0.00;
  const totalAdditionalCosts = se.additionalCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
  const totalAmount = 50500.00;
  const grandTotal = 50500.00;

  // ─── Validation ──────────────────────────────────────────────────────

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
      if (!item.qty || parseFloat(item.qty) <= 0) {
        errors.push({
          field: `items[${idx}].qty`,
          label: `Item ${idx + 1} Qty`,
          message: `Quantity must be greater than 0 for row ${idx + 1}`,
        });
      }
    });

    // Additional Costs are optional - only validate if they have values
    se.additionalCosts.forEach((cost, idx) => {
      if (cost.description.trim() || cost.amount) {
        if (!cost.description.trim()) {
          errors.push({
            field: `additionalCosts[${idx}].description`,
            label: `Cost ${idx + 1} Description`,
            message: `Description is required for cost row ${idx + 1}`,
          });
        }
        if (!cost.amount || parseFloat(cost.amount) <= 0) {
          errors.push({
            field: `additionalCosts[${idx}].amount`,
            label: `Cost ${idx + 1} Amount`,
            message: `Amount must be greater than 0 for cost row ${idx + 1}`,
          });
        }
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
      work_order: "WO-00001",
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
      const firstField = validationErrorsList[0].field;
      if (["company", "stockEntryType"].includes(firstField)) {
        setActiveTab("details");
      } else if (firstField.startsWith("items")) {
        setActiveTab("details");
      } else if (firstField.startsWith("additionalCosts")) {
        setActiveTab("additional");
      }
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
        console.log(isNew ? "Stock entry created successfully:" : "Stock entry updated successfully:", response.data);
        setIsDirty(false);
        navigate("/stock-entry");
      } else {
        setApiError(response.data?.message || `Failed to ${isNew ? "create" : "update"} stock entry`);
      }
    } catch (err: any) {
      console.error("Error saving stock entry:", err);
      if (err.response) {
        if (err.response.status === 409) {
          setApiError("A stock entry with this name already exists");
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || "Invalid data provided");
        } else {
          setApiError(err.response.data?.message || `Failed to ${isNew ? "create" : "update"} stock entry`);
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
            <FaArrowLeft size={28} />
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
              <span className="sef-section-title">
                <FaWarehouse className="sef-section-icon" /> Default Warehouse
              </span>

              <div className="sef-grid-2">
                <WarehouseSearchField
                  label="Default Source Warehouse"
                  value={se.sourceWarehouse}
                  onChange={(val) => setField("sourceWarehouse", val)}
                  disabled={disabled}
                  placeholder="Search source warehouse..."
                  hint="This is the location where items are taken from."
                />

                <WarehouseSearchField
                  label="Default Target Warehouse"
                  value={se.targetWarehouse}
                  onChange={(val) => setField("targetWarehouse", val)}
                  disabled={disabled}
                  placeholder="Search target warehouse..."
                  hint="This is the location where items are sent to."
                />
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
                  <FaClipboardList className="sef-section-icon" /> Items
                </span>
                <span className="sef-items-count">{se.items.length}</span>
                <button type="button" className="sef-row-add-btn" onClick={addItem}>
                  <FaPlus size={10} /> Add Row
                </button>
              </div>

              <div className="sef-table-scroll">
                <table className="sef-editable-table">
                  <thead>
                    <tr>
                      <th className="sef-col-no">#</th>
                      <th>Source Warehouse</th>
                      <th>Target Warehouse</th>
                      <th>Item Code <span className="sef-required">*</span></th>
                      <th className="text-right">Qty <span className="sef-required">*</span></th>
                      <th className="text-right">Basic Rate</th>
                      <th>Item Tax Template</th>
                      <th className="sef-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {se.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="sef-col-no">{idx + 1}</td>
                        <td>
                          <select
                            className="form-field form-field-sm"
                            value={item.sourceWarehouse}
                            onChange={(e) => updateItem(item.id, "sourceWarehouse", e.target.value)}
                            disabled={disabled || warehousesLoading}
                          >
                            <option value="">Select warehouse...</option>
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
                            <option value="">Select warehouse...</option>
                            {warehouses.map((w) => (
                              <option key={w.id} value={w.warehouse_name}>
                                {w.warehouse_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-field form-field-sm"
                            value={item.itemCode}
                            onChange={(e) => updateItem(item.id, "itemCode", e.target.value)}
                            placeholder="Item code…"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-field form-field-sm text-right"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-field form-field-sm text-right"
                            value={item.basicRate}
                            onChange={(e) => updateItem(item.id, "basicRate", e.target.value)}
                            placeholder="0.00"
                            disabled={disabled}
                          />
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
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sef-table-footer">
                <div className="sef-table-footer-left">
                  <button type="button" className="sef-link-btn" onClick={addItem}>
                    <FaPlus size={12} /> Add row
                  </button>
                  <button type="button" className="sef-link-btn sef-link-btn-muted">
                    Add multiple
                  </button>
                </div>
                <div className="sef-table-footer-right">
                  <button type="button" className="sef-update-btn">
                    Download
                  </button>
                  <button type="button" className="sef-update-btn">
                    Upload
                  </button>
                </div>
              </div>

              <div style={{ paddingTop: 12 }}>
                <button type="button" className="sef-update-btn">
                  Update Rate and Availability
                </button>
              </div>

              <div className="sef-divider" />

              {/* ── Totals ── */}
              <div className="sef-totals-grid">
                <div className="sef-total-card">
                  <div className="sef-total-label">Total Estimated Taxes</div>
                  <div className="sef-total-value">₹ {totalEstimatedTaxes.toFixed(2)}</div>
                </div>
                <div className="sef-total-card">
                  <div className="sef-total-label">Grand Total</div>
                  <div className="sef-total-value sef-total-value-primary">
                    ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="sef-totals-grid">
                <div className="sef-total-card">
                  <div className="sef-total-label">Total Outgoing Value (Consumption)</div>
                  <div className="sef-total-value">
                    ₹ {totalOutgoingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="sef-total-card">
                  <div className="sef-total-label">Total Incoming Value (Receipt)</div>
                  <div className="sef-total-value">
                    ₹ {totalIncomingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="sef-totals-grid">
                <div />
                <div className="sef-total-card">
                  <div className="sef-total-label">Total Value Difference (Incoming - Outgoing)</div>
                  <div className="sef-total-value">₹ {totalValueDifference.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 2: ADDITIONAL COSTS ════════════════ */}
          {activeTab === "additional" && (
            <div className="sef-card">
              <div className="sef-table-header">
                <span className="sef-section-title sef-section-title-flush">
                  <FaCalculator className="sef-section-icon" /> Additional Costs
                </span>
                <span className="sef-items-count">{se.additionalCosts.length}</span>
                <button type="button" className="sef-row-add-btn" onClick={addCost}>
                  <FaPlus size={10} /> Add Row
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
                          No additional costs added. Click "Add Row" to add one.
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
                              placeholder="Description (optional)"
                              disabled={disabled}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-field form-field-sm text-right"
                              value={cost.amount}
                              onChange={(e) => updateCost(cost.id, "amount", e.target.value)}
                              placeholder="0.00"
                              disabled={disabled}
                            />
                          </td>
                          <td className="sef-col-action">
                            <button
                              type="button"
                              className="sef-row-delete-btn"
                              onClick={() => removeCost(cost.id)}
                              disabled={se.additionalCosts.length <= 0}
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

              <div className="sef-table-footer">
                <div className="sef-table-footer-left">
                  <button type="button" className="sef-link-btn" onClick={addCost}>
                    <FaPlus size={12} /> Add row
                  </button>
                </div>
                <div className="sef-table-footer-right">
                  <span className="sef-total-label" style={{ marginBottom: 0 }}>
                    Total Additional Costs: ₹ {totalAdditionalCosts.toFixed(2)}
                  </span>
                </div>
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
                    onChange={(e) => setField("perTransferred", e.target.value)}
                    placeholder="0%"
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

              <div className="sef-field">
                <label className="sef-label">Total Amount</label>
                <input
                  type="text"
                  className="form-field form-field-disabled"
                  value={`₹ ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  readOnly
                  disabled
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