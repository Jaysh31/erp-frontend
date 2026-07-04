// StockEntryForm2.tsx - Fixed with proper portal-based dropdown

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
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
  FaClipboardList,
  FaCalculator,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";
import "./StockEntryForm2.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

interface ItemRow {
  id: string;
  targetWarehouse: string;
  itemCode: string;
  itemName: string;
  itemGroup: string;
  qty: string;
  basicRate: string;
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

interface SupplierOption {
  id: number;
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country: string;
  mobile_no: string;
  email_id: string;
  disabled: number;
}

interface ItemOption {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  brand: string;
  description: string;
  standard_rate: number;
  disabled: number;
}

interface StockEntryData {
  name: string;
  supplier: string;
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
  targetWarehouse: "",
  itemCode: "",
  itemName: "",
  itemGroup: "",
  qty: "0.000",
  basicRate: "0.00",
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
    supplier: "",
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
    items: [emptyItem()],
    additionalCosts: [],
  };
};

// ─── Item Search Component ─────────────────────────────────────────────

interface ItemSearchFieldProps {
  value: string;
  onSelect: (item: ItemOption) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

function ItemSearchField({
  value,
  onSelect,
  disabled = false,
  placeholder = "Search item...",
  error,
}: ItemSearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Portal positioning state
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // Update search term when value prop changes
  useEffect(() => {
    if (value && !selectedItem) {
      setSearchTerm(value);
    }
  }, [value, selectedItem]);

  // Search items with debounce
  const searchItems = useCallback(async (search: string) => {
    if (!search.trim()) {
      setItems([]);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get(
        `/item?page=1&limit=10&search=${encodeURIComponent(search.trim())}`
      );
      if (response.data.success === 1) {
        const records = response.data.data || [];
        setItems(records);
      } else {
        setFetchError("Failed to load items");
        setItems([]);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      setFetchError("Could not load items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Calculate dropdown position ──────────────────────────────────────
  const calculateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return null;
    
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(280, items.length * 45 + 20);
    
    // Calculate available space below and above
    const spaceBelow = viewportHeight - rect.bottom;
    // const spaceAbove = rect.top;
    
    let top: number;
    // Prefer showing below, but if not enough space, show above
    if (spaceBelow >= dropdownHeight || spaceBelow >= 200) {
      top = rect.bottom + 4;
    } else {
      top = rect.top - dropdownHeight - 4;
    }
    
    return {
      top,
      left: rect.left,
      width: rect.width,
    };
  }, [items.length]);

  // ─── Update dropdown position ────────────────────────────────────────
  const updateDropdownPosition = useCallback(() => {
    if (!isOpen) return;
    const position = calculateDropdownPosition();
    if (position) {
      setDropdownPosition(position);
    }
  }, [isOpen, calculateDropdownPosition]);

  // ─── Handle scroll and resize ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Use requestAnimationFrame for smooth updates
    let rafId: number | null = null;
    const handleUpdate = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updateDropdownPosition();
      });
    };

    // Listen to all scroll events (capture phase)
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    
    // Also listen to scroll events on the document
    document.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      document.removeEventListener('scroll', handleUpdate, true);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isOpen, updateDropdownPosition]);

  // ─── Handle click outside ────────────────────────────────────────────
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(target) &&
      dropdownRef.current &&
      !dropdownRef.current.contains(target)
    ) {
      setIsOpen(false);
      setHighlightedIndex(-1);
      setDropdownPosition(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [handleClickOutside]);

  // ─── Input handlers ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setHighlightedIndex(-1);

    // Clear selection if user types something different
    if (selectedItem && val !== selectedItem.item_code) {
      setSelectedItem(null);
      onSelect({} as ItemOption);
    }

    // Open dropdown if there's input
    if (val.trim()) {
      setIsOpen(true);
      // Update position after opening
      setTimeout(updateDropdownPosition, 0);
    } else {
      setIsOpen(false);
      setItems([]);
      setDropdownPosition(null);
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchItems(val);
    }, 300);
  };

  const handleSelectItem = (item: ItemOption) => {
    setSelectedItem(item);
    setSearchTerm(item.item_code);
    onSelect(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setDropdownPosition(null);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (!disabled) {
      // If we have a search term, open dropdown and search
      if (searchTerm.trim()) {
        setIsOpen(true);
        searchItems(searchTerm);
        setTimeout(updateDropdownPosition, 0);
      } else {
        // Open empty dropdown
        setIsOpen(true);
        setItems([]);
        setTimeout(updateDropdownPosition, 0);
      }
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click events on dropdown items
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      setDropdownPosition(null);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle keyboard navigation if dropdown is open with items
    if (!isOpen || items.length === 0) {
      // Handle Enter to close dropdown if open but empty
      if (e.key === 'Enter' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setDropdownPosition(null);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : prev
        );
        // Scroll highlighted item into view
        setTimeout(() => {
          const highlightedElement = document.querySelector(
            `.item-dropdown-item.highlighted`
          );
          if (highlightedElement && dropdownRef.current) {
            highlightedElement.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            });
          }
        }, 0);
        break;
        
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        // Scroll highlighted item into view
        setTimeout(() => {
          const highlightedElement = document.querySelector(
            `.item-dropdown-item.highlighted`
          );
          if (highlightedElement && dropdownRef.current) {
            highlightedElement.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            });
          }
        }, 0);
        break;
        
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < items.length) {
          handleSelectItem(items[highlightedIndex]);
        }
        break;
        
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        setDropdownPosition(null);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedItem(null);
    onSelect({} as ItemOption);
    setItems([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setDropdownPosition(null);
    inputRef.current?.focus();
  };

  // ─── Render dropdown content ──────────────────────────────────────────
  const renderDropdownContent = () => {
    if (!isOpen || disabled || !dropdownPosition) return null;

    return (
      <div
        ref={dropdownRef}
        className="item-dropdown-portal"
        style={{
          position: 'fixed',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          maxHeight: 280,
          overflowY: 'auto',
          zIndex: 99999,
        }}
        onMouseDown={(e) => e.preventDefault()} // Prevent blur
      >
        {loading ? (
          <div className="item-dropdown-loading">
            <FaSpinner className="spinning" />
            <span>Searching items...</span>
          </div>
        ) : fetchError ? (
          <div className="item-dropdown-error">
            <FaExclamationCircle />
            <span>{fetchError}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="item-dropdown-empty">
            {searchTerm.trim() ? (
              <>
                <FaSearch />
                <span>No items found for "{searchTerm}"</span>
              </>
            ) : (
              <span>Type to search items</span>
            )}
          </div>
        ) : (
          <ul className="item-dropdown-list">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={`item-dropdown-item ${
                  selectedItem?.id === item.id ? "selected" : ""
                } ${highlightedIndex === index ? "highlighted" : ""}`}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="item-main-info">
                  <span className="item-code">{item.item_code}</span>
                  <span className="item-name">{item.item_name}</span>
                  {item.stock_uom && (
                    <span className="item-uom-badge">{item.stock_uom}</span>
                  )}
                </div>
                <div className="item-sub-info">
                  {item.item_group && (
                    <span className="item-tag">{item.item_group}</span>
                  )}
                  {item.brand && <span className="item-tag">{item.brand}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="item-search-field" ref={wrapperRef}>
      <div className="item-search-wrapper">
        <div className="item-search-input-wrap">
          <FaSearch className="item-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`form-field form-field-sm item-search-input ${
              error ? "field-error" : ""
            } ${selectedItem ? "item-selected" : ""}`}
            autoComplete="off"
          />
          {selectedItem && !disabled && (
            <button
              type="button"
              className="item-clear-btn"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
          {loading && <FaSpinner className="item-loading-spinner spinning" />}
          {!loading && !selectedItem && (
            <FaChevronDown className="item-dropdown-icon" />
          )}
        </div>
      </div>
      
      {/* Render dropdown in portal - NOTHING ELSE AFTER THE INPUT */}
      {createPortal(renderDropdownContent(), document.body)}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function StockEntryForm2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";

  const [se, setSe] = useState<StockEntryData>(emptyStockEntry());
  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [loading, ] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

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

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        const response = await api.get("/supplier");
        if (response.data.success === 1) {
          const records = response.data.data?.records || [];
          setSuppliers(records);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setSuppliers([]);
      } finally {
        setSuppliersLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const setField = <K extends keyof StockEntryData>(
    field: K,
    value: StockEntryData[K]
  ) => {
    setSe((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const updateItem = (
    rowId: string,
    field: keyof ItemRow,
    value: string
  ) => {
    setSe((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === rowId ? { ...item, [field]: value } : item
      ),
    }));
    setIsDirty(true);
  };

  const handleItemSelect = (rowId: string, item: ItemOption) => {
    if (item && item.item_code) {
      setSe((prev) => ({
        ...prev,
        items: prev.items.map((itemRow) =>
          itemRow.id === rowId
            ? {
                ...itemRow,
                itemCode: item.item_code,
                itemName: item.item_name || "",
                itemGroup: item.item_group || "",
                basicRate: item.standard_rate
                  ? item.standard_rate.toString()
                  : "0.00",
              }
            : itemRow
        ),
      }));
      setIsDirty(true);
    }
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

  const updateCost = (
    rowId: string,
    field: keyof AdditionalCostRow,
    value: string
  ) => {
    setSe((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.map((cost) =>
        cost.id === rowId ? { ...cost, [field]: value } : cost
      ),
    }));
    setIsDirty(true);
  };

  const addCost = () => {
    setSe((prev) => ({
      ...prev,
      additionalCosts: [...prev.additionalCosts, emptyCost()],
    }));
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

  const totalAdditionalCosts = se.additionalCosts.reduce(
    (sum, cost) => sum + (parseFloat(cost.amount) || 0),
    0
  );

  // ─── Validation ──────────────────────────────────────────────────────

  const getAllValidationErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];

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

  const convertToApiPayload = (
    data: StockEntryData,
    entryId?: string
  ): ApiStockEntryPayload => {
    const payload: ApiStockEntryPayload = {
      name: data.name || "STE-00001",
      company: "SculptorTech Pvt Ltd",
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
      total_outgoing_value: 0,
      total_incoming_value: 0,
      value_difference: 0,
      total_additional_costs: totalAdditionalCosts,
      supplier: data.supplier || "",
      supplier_name: "",
      supplier_address: "",
      address_display: "",
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
      total_amount: 0,
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
        console.log(
          isNew
            ? "Stock entry created successfully:"
            : "Stock entry updated successfully:",
          response.data
        );
        setIsDirty(false);
        navigate("/stock-entry");
      } else {
        setApiError(
          response.data?.message ||
            `Failed to ${isNew ? "create" : "update"} stock entry`
        );
      }
    } catch (err: any) {
      console.error("Error saving stock entry:", err);
      if (err.response) {
        if (err.response.status === 409) {
          setApiError("A stock entry with this name already exists");
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || "Invalid data provided");
        } else {
          setApiError(
            err.response.data?.message ||
              `Failed to ${isNew ? "create" : "update"} stock entry`
          );
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
          <div
            className="modal-overlay"
            onClick={() => setShowValidationSummary(false)}
          >
            <div
              className="validation-summary-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setShowValidationSummary(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Please fill in the following required fields before submitting:
                </p>
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
                <button
                  className="btn-cancel"
                  onClick={() => setShowValidationSummary(false)}
                >
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
          <button
            onClick={() => navigate("/stock-entry")}
            className="back-btn"
          >
            <FaArrowLeft size={28} />
          </button>
          <div className="header-title">
            <h1>
              {isNew ? "Add New Stock Entry" : `Edit: ${se.name || "Stock Entry"}`}
            </h1>
            <span className="sef-status-badge sef-status-draft">Draft</span>
          </div>
          {!isNew && hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field
              {getAllValidationErrors().length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>
          {/* ─── Main Form Content ─────────────────────────────────────── */}
          <div className="sef-card">
            {/* ── Entry basics ── */}
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
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sef-field">
                <label className="sef-label">Supplier</label>
                <select
                  className="form-field"
                  value={se.supplier}
                  onChange={(e) => setField("supplier", e.target.value)}
                  disabled={disabled || suppliersLoading}
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.supplier_name}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>
                {suppliersLoading && (
                  <span className="sef-hint">Loading suppliers...</span>
                )}
              </div>
            </div>

            <div className="sef-grid-2">
              <div className="sef-field">
                <div className="sef-checkbox-field">
                  <input
                    type="checkbox"
                    id="editPostingDate"
                    checked={se.editPostingDate}
                    onChange={(e) =>
                      setField("editPostingDate", e.target.checked)
                    }
                    disabled={disabled}
                  />
                  <label htmlFor="editPostingDate">
                    Edit Posting Date and Time
                  </label>
                </div>
              </div>
              <div />
            </div>

            <div className="sef-grid-2">
              <div className="sef-field">
                <label className="sef-label">Posting Date</label>
                <input
                  type="text"
                  className={`form-field ${
                    !se.editPostingDate ? "form-field-disabled" : ""
                  }`}
                  value={formatDateForDisplay(se.postingDate)}
                  readOnly={!se.editPostingDate}
                  onChange={() => {}}
                  disabled={!se.editPostingDate}
                />
              </div>

              <div className="sef-field">
                <label className="sef-label">Posting Time</label>
                <input
                  type="text"
                  className={`form-field ${
                    !se.editPostingDate ? "form-field-disabled" : ""
                  }`}
                  value={se.postingTime}
                  readOnly={!se.editPostingDate}
                  onChange={() => {}}
                  disabled={!se.editPostingDate}
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
              <button
                type="button"
                className="sef-row-add-btn"
                onClick={addItem}
              >
                <FaPlus size={10} /> Add Row
              </button>
            </div>

            <div className="sef-table-scroll">
              <table className="sef-editable-table">
                <thead>
                  <tr>
                    <th className="sef-col-no">#</th>
                    <th>Target Warehouse</th>
                    <th>
                      Item <span className="sef-required">*</span>
                    </th>
                    <th className="text-right">
                      Qty <span className="sef-required">*</span>
                    </th>
                    <th className="text-right">Basic Rate</th>
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
                          value={item.targetWarehouse}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "targetWarehouse",
                              e.target.value
                            )
                          }
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
                        <ItemSearchField
                          value={item.itemCode}
                          onSelect={(selectedItem) =>
                            handleItemSelect(item.id, selectedItem)
                          }
                          disabled={disabled}
                          placeholder="Search item..."
                          error=""
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-field form-field-sm text-right"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(item.id, "qty", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-field form-field-sm text-right"
                          value={item.basicRate}
                          onChange={(e) =>
                            updateItem(item.id, "basicRate", e.target.value)
                          }
                          placeholder="0.00"
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
                <button
                  type="button"
                  className="sef-link-btn"
                  onClick={addItem}
                >
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

            {/* ── Additional Costs Table ── */}
            <div className="sef-table-header">
              <span className="sef-section-title sef-section-title-flush">
                <FaCalculator className="sef-section-icon" /> Additional Costs
              </span>
              <span className="sef-items-count">
                {se.additionalCosts.length}
              </span>
              <button
                type="button"
                className="sef-row-add-btn"
                onClick={addCost}
              >
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
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "var(--text-secondary)",
                        }}
                      >
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
                            onChange={(e) =>
                              updateCost(
                                cost.id,
                                "expenseAccount",
                                e.target.value
                              )
                            }
                            disabled={disabled}
                          >
                            <option value="">Select account...</option>
                            {EXPENSE_ACCOUNTS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-field form-field-sm"
                            value={cost.description}
                            onChange={(e) =>
                              updateCost(cost.id, "description", e.target.value)
                            }
                            placeholder="Description (optional)"
                            disabled={disabled}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-field form-field-sm text-right"
                            value={cost.amount}
                            onChange={(e) =>
                              updateCost(cost.id, "amount", e.target.value)
                            }
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
                <button
                  type="button"
                  className="sef-link-btn"
                  onClick={addCost}
                >
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

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="sef-footer">
            <button
              type="button"
              onClick={() => navigate("/stock-entry")}
              className="cancel-btn"
              disabled={submitting}
            >
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