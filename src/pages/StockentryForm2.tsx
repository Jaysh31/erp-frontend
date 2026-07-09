// StockEntryForm2.tsx - Fixed with proper portal-based dropdown, WO integration, and edit functionality

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
  FaBuilding,
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
  uom?: string;
  amount?: string;
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

// ─── Work Order Types ────────────────────────────────────────────────────

interface WorkOrder {
  id: number;
  name: string;
  production_item: string;
  bom_no: string;
  qty: number;
  produced_qty: number;
  company: string;
  status: string;
  planned_start_date: string;
  planned_end_date: string;
  source_warehouse?: string;
  wip_warehouse?: string;
  fg_warehouse?: string;
  item_name?: string;
  stock_uom?: string;
  lead_time?: number;
  planned_operating_cost?: number;
}

interface WorkOrderDetail {
  id: number;
  name: string;
  company: string;
  production_item: string;
  bom_no: string;
  qty: number;
  produced_qty: number;
  source_warehouse: string;
  wip_warehouse: string;
  fg_warehouse: string;
  item_name: string;
  stock_uom: string;
  status: string;
  planned_start_date: string;
  planned_end_date: string;
  lead_time: number;
  planned_operating_cost: number;
  actual_operating_cost: number;
  additional_operating_cost: number;
  corrective_operation_cost: number;
  total_operating_cost: number;
  material_transferred_for_manufacturing: number;
  additional_transferred_qty: number;
  transfer_material_against: string;
}

interface WorkOrderListResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: WorkOrder[];
  };
}

interface WorkOrderDetailResponse {
  success: number;
  data: WorkOrderDetail;
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
  workOrderId: string;
  workOrderName: string;
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
  items?: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    warehouse: string;
  }>;
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
  uom: "",
  amount: "0.00",
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
    workOrderId: "",
    workOrderName: "",
    items: [emptyItem()],
    additionalCosts: [],
  };
};

// ─── Work Order Search Component ────────────────────────────────────────

interface WorkOrderSearchFieldProps {
  value: string;
  onSelect: (wo: WorkOrder) => void;
  onClear: () => void;
  disabled?: boolean;
  error?: string;
}

function WorkOrderSearchField({
  value,
  onSelect,
  onClear,
  disabled = false,
  error,
}: WorkOrderSearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (value && !selectedWO) {
      setSearchTerm(value);
    }
  }, [value, selectedWO]);

  const searchWorkOrders = useCallback(async (search: string) => {
    if (!search.trim()) {
      setWorkOrders([]);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get<WorkOrderListResponse>(
        `/work-order?page=1&limit=20&search=${encodeURIComponent(search.trim())}`
      );
      if (response.data.success === 1) {
        const records = response.data.data?.records || [];
        setWorkOrders(records);
      } else {
        setFetchError("Failed to load work orders");
        setWorkOrders([]);
      }
    } catch (err) {
      console.error("Error fetching work orders:", err);
      setFetchError("Could not load work orders");
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return null;
    
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(280, workOrders.length * 50 + 20);
    
    const spaceBelow = viewportHeight - rect.bottom;
    
    let top: number;
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
  }, [workOrders.length]);

  const updateDropdownPosition = useCallback(() => {
    if (!isOpen) return;
    const position = calculateDropdownPosition();
    if (position) {
      setDropdownPosition(position);
    }
  }, [isOpen, calculateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return;

    let rafId: number | null = null;
    const handleUpdate = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updateDropdownPosition();
      });
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setHighlightedIndex(-1);

    if (selectedWO && val !== selectedWO.name) {
      setSelectedWO(null);
      onClear();
    }

    if (val.trim()) {
      setIsOpen(true);
      setTimeout(updateDropdownPosition, 0);
    } else {
      setIsOpen(false);
      setWorkOrders([]);
      setDropdownPosition(null);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchWorkOrders(val);
    }, 300);
  };

  const handleSelectWO = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setSearchTerm(`${wo.name} - ${wo.production_item}`);
    onSelect(wo);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setDropdownPosition(null);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (!disabled) {
      if (searchTerm.trim()) {
        setIsOpen(true);
        searchWorkOrders(searchTerm);
        setTimeout(updateDropdownPosition, 0);
      } else {
        setIsOpen(true);
        setWorkOrders([]);
        setTimeout(updateDropdownPosition, 0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || workOrders.length === 0) {
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
          prev < workOrders.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < workOrders.length) {
          handleSelectWO(workOrders[highlightedIndex]);
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
    setSelectedWO(null);
    onClear();
    setWorkOrders([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setDropdownPosition(null);
    inputRef.current?.focus();
  };

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
        onMouseDown={(e) => e.preventDefault()}
      >
        {loading ? (
          <div className="item-dropdown-loading">
            <FaSpinner className="spinning" />
            <span>Searching work orders...</span>
          </div>
        ) : fetchError ? (
          <div className="item-dropdown-error">
            <FaExclamationCircle />
            <span>{fetchError}</span>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="item-dropdown-empty">
            {searchTerm.trim() ? (
              <>
                <FaSearch />
                <span>No work orders found for "{searchTerm}"</span>
              </>
            ) : (
              <span>Type to search work orders</span>
            )}
          </div>
        ) : (
          <ul className="item-dropdown-list">
            {workOrders.map((wo, index) => (
              <li
                key={wo.id}
                className={`item-dropdown-item ${
                  selectedWO?.id === wo.id ? "selected" : ""
                } ${highlightedIndex === index ? "highlighted" : ""}`}
                onClick={() => handleSelectWO(wo)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="item-main-info">
                  <span className="item-code">{wo.name}</span>
                  <span className="item-name">{wo.production_item}</span>
                  <span className="item-uom-badge">Qty: {wo.qty}</span>
                </div>
                <div className="item-sub-info">
                  <span className="item-tag">{wo.status}</span>
                  <span className="item-tag">{wo.company}</span>
                  <span className="item-tag">BOM: {wo.bom_no}</span>
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
          <FaBuilding className="item-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search work order by name or item..."
            disabled={disabled}
            className={`form-field form-field-sm item-search-input ${
              error ? "field-error" : ""
            } ${selectedWO ? "item-selected" : ""}`}
            autoComplete="off"
          />
          {selectedWO && !disabled && (
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
          {!loading && !selectedWO && (
            <FaChevronDown className="item-dropdown-icon" />
          )}
        </div>
      </div>
      
      {createPortal(renderDropdownContent(), document.body)}
    </div>
  );
}

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
  
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (value && !selectedItem) {
      setSearchTerm(value);
    }
  }, [value, selectedItem]);

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

  const calculateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return null;
    
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(280, items.length * 45 + 20);
    
    const spaceBelow = viewportHeight - rect.bottom;
    
    let top: number;
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

  const updateDropdownPosition = useCallback(() => {
    if (!isOpen) return;
    const position = calculateDropdownPosition();
    if (position) {
      setDropdownPosition(position);
    }
  }, [isOpen, calculateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return;

    let rafId: number | null = null;
    const handleUpdate = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updateDropdownPosition();
      });
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setHighlightedIndex(-1);

    if (selectedItem && val !== selectedItem.item_code) {
      setSelectedItem(null);
      onSelect({} as ItemOption);
    }

    if (val.trim()) {
      setIsOpen(true);
      setTimeout(updateDropdownPosition, 0);
    } else {
      setIsOpen(false);
      setItems([]);
      setDropdownPosition(null);
    }

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
      if (searchTerm.trim()) {
        setIsOpen(true);
        searchItems(searchTerm);
        setTimeout(updateDropdownPosition, 0);
      } else {
        setIsOpen(true);
        setItems([]);
        setTimeout(updateDropdownPosition, 0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || items.length === 0) {
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
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
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
        onMouseDown={(e) => e.preventDefault()}
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
      
      {createPortal(renderDropdownContent(), document.body)}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function StockEntryForm2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = !id || id === "new";

  const [se, setSe] = useState<StockEntryData>(emptyStockEntry());
  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingWorkOrder, setLoadingWorkOrder] = useState(false);

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

  // ─── Load existing Stock Entry ──────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      setApiError(null);
      
      api.get(`/stock-entry/${id}`)
        .then(r => {
          if (r.data.success === 1) {
            const d = r.data.data;
            
            console.log("📦 Loaded Stock Entry:", d);
            
            // Determine item details from available fields
            let itemCode = d.production_item || d.item_code || "";
            let itemName = d.item_name || "";
            let qty = d.fg_completed_qty || d.qty || 1;
            let amount = d.total_outgoing_value || d.total_amount || 0;
            let sourceWh = d.from_warehouse || "";
            let targetWh = d.to_warehouse || "";
            
            setSe(prev => ({
              ...prev,
              name: d.name || "",
              supplier: d.supplier || "",
              stockEntryType: d.stock_entry_type || "Material Transfer",
              postingDate: d.posting_date ? d.posting_date.split("T")[0] : getToday().date,
              postingTime: d.posting_time || getToday().time,
              editPostingDate: d.set_posting_time === 1,
              sourceWarehouse: sourceWh,
              targetWarehouse: targetWh,
              remarks: d.remarks || "",
              workOrderId: String(d.work_order || ""),
              scanBarcode: d.scan_barcode || "",
              addToTransit: d.add_to_transit === 1,
              applyPutawayRule: d.apply_putaway_rule === 1,
              inspectionRequired: d.inspection_required === 1,
              isOpening: d.is_opening || "No",
              perTransferred: String(d.per_transferred || 100),
              // Create a single item from the stock entry data
              items: [{
                id: uid(),
                targetWarehouse: targetWh,
                itemCode: itemCode,
                itemName: itemName || itemCode,
                itemGroup: "",
                qty: String(qty),
                basicRate: qty > 0 ? String(amount / qty) : "0.00",
                uom: "Nos",
                amount: String(amount),
              }],
            }));
          } else {
            setApiError("Failed to load stock entry");
          }
        })
        .catch((err) => {
          console.error("Error loading stock entry:", err);
          setApiError("Failed to load stock entry. Please try again.");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

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
                uom: item.stock_uom || "",
              }
            : itemRow
        ),
      }));
      setIsDirty(true);
    }
  };

  // ─── Work Order Selection Handler ──────────────────────────────────
  const handleWorkOrderSelect = async (wo: WorkOrder) => {
    setLoadingWorkOrder(true);
    setApiError(null);
    
    try {
      const response = await api.get<WorkOrderDetailResponse>(`/work-order/${wo.id}`);
      
      if (response.data.success === 1) {
        const detail = response.data.data;
        
        setSe(prev => ({
          ...prev,
          workOrderId: String(wo.id),
          workOrderName: wo.name,
          sourceWarehouse: detail.source_warehouse || prev.sourceWarehouse,
          targetWarehouse: detail.fg_warehouse || prev.targetWarehouse,
          remarks: `Material transfer for Work Order: ${wo.name} - ${detail.production_item}`,
          items: [
            {
              id: uid(),
              targetWarehouse: detail.fg_warehouse || "",
              itemCode: detail.production_item,
              itemName: detail.item_name || "",
              itemGroup: "",
              qty: String(detail.qty - detail.produced_qty),
              basicRate: String(detail.planned_operating_cost / (detail.qty || 1) || 0),
              uom: detail.stock_uom || "Nos",
              amount: String(detail.planned_operating_cost || 0),
            }
          ],
        }));
        
        setIsDirty(true);
      } else {
        setApiError("Failed to load work order details");
      }
    } catch (err) {
      console.error("Error loading work order:", err);
      setApiError("Failed to load work order details");
    } finally {
      setLoadingWorkOrder(false);
    }
  };

  const handleClearWorkOrder = () => {
    setSe(prev => ({
      ...prev,
      workOrderId: "",
      workOrderName: "",
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
    (sum, cost) => sum + (parseFloat(cost.amount ?? '0') || 0),
    0
  );

  const totalItemAmount = se.items.reduce(
    (sum, item) => sum + (parseFloat(item.amount ?? '0') || 0),
    0
  );

  const totalAmount = totalItemAmount + totalAdditionalCosts;

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
    const items = data.items
      .filter(item => item.itemCode.trim())
      .map(item => ({
        item_code: item.itemCode,
        item_name: item.itemName || item.itemCode,
        qty: parseFloat(item.qty) || 0,
        uom: item.uom || "Nos",
        rate: parseFloat(item.basicRate) || 0,
        amount: parseFloat(item.amount || "0") || 0,
        warehouse: item.targetWarehouse || data.targetWarehouse,
      }));

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
      work_order: data.workOrderId || "WO-00001",
      subcontracting_order: "",
      outgoing_stock_entry: "",
      source_stock_entry: "",
      from_bom: data.workOrderId ? 1 : 0,
      use_multi_level_bom: 1,
      bom_no: "BOM-00001",
      fg_completed_qty: data.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0),
      process_loss_percentage: 2,
      process_loss_qty: 0,
      from_warehouse: data.sourceWarehouse || "Stores - ST",
      source_warehouse_address: "Warehouse Address",
      source_address_display: "Pune, Maharashtra",
      to_warehouse: data.targetWarehouse || "WIP Warehouse - ST",
      target_warehouse_address: "WIP Address",
      target_address_display: "Pune, Maharashtra",
      scan_barcode: data.scanBarcode,
      total_outgoing_value: totalItemAmount,
      total_incoming_value: totalItemAmount,
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
      total_amount: totalAmount,
      amended_from: "",
      credit_note: "",
      is_return: 0,
      _user_tags: "",
      _comments: "",
      _assign: "",
      _liked_by: "",
      items: items,
    };

    if (entryId) {
      payload.id = parseInt(entryId);
    }

    return payload;
  };

  // ─── Save ────────────────────────────────────────────────────────────
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
    // Pass the ID in the payload for both create and update
    const payload = convertToApiPayload(se, !isNew ? id : undefined);

    let response;
    // Always use POST to /stock-entry with ID in payload
    response = await api.post("/stock-entry", payload);

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
      } else if (err.response.status === 404) {
        setApiError("Stock entry not found. It may have been deleted.");
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
          <div className="sef-loading"><FaSpinner className="spinning" /> Loading stock entry data...</div>
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
            {/* ── Work Order Selection ── */}
            <div className="sef-section-title" style={{ marginBottom: "12px" }}>
              <FaBuilding className="sef-section-icon" /> Work Order Reference
            </div>
            
            <div className="wof-grid-2" style={{ marginBottom: "16px" }}>
              <div className="sef-field">
                <label className="sef-label">Work Order</label>
                <WorkOrderSearchField
                  value={se.workOrderName || se.workOrderId}
                  onSelect={handleWorkOrderSelect}
                  onClear={handleClearWorkOrder}
                  disabled={disabled || loadingWorkOrder}
                  error=""
                />
                {loadingWorkOrder && (
                  <span className="sef-hint"><FaSpinner className="spinning" /> Loading work order details...</span>
                )}
                {se.workOrderId && (
                  <span className="wof-hint" style={{ color: "var(--success-color, #10b981)" }}>
                    <FaInfoCircle /> Work Order #{se.workOrderId} loaded successfully
                  </span>
                )}
              </div>
              <div className="sef-field">
                <label className="sef-label">Stock Entry Type <span className="sef-required">*</span></label>
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
            </div>

            {/* ── Entry basics ── */}
            <div className="sef-grid-2">
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

              <div className="sef-field">
                <div className="sef-checkbox-field" style={{ marginTop: "24px" }}>
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

            {/* ── Warehouse Selection ── */}
            <div className="sef-divider" />
            <div className="sef-section-title" style={{ marginBottom: "12px" }}>
              Warehouse Information
            </div>

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
                    <th className="text-right">Amount</th>
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
                      <td>
                        <input
                          type="text"
                          className="form-field form-field-sm text-right"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(item.id, "amount", e.target.value)
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
              </div>
              <div className="sef-table-footer-right">
                <span className="sef-total-label">
                  Total Items Amount: ₹ {totalItemAmount.toFixed(2)}
                </span>
              </div>
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

            {/* ── Grand Total ── */}
            <div className="sef-grand-total">
              <span className="sef-grand-total-label">Grand Total:</span>
              <span className="sef-grand-total-value">₹ {totalAmount.toFixed(2)}</span>
            </div>

            <div className="sef-divider" />

            {/* ── Remarks ── */}
            <div className="sef-field" style={{ marginTop: "12px" }}>
              <label className="sef-label">Remarks</label>
              <textarea
                className="form-field"
                value={se.remarks}
                onChange={(e) => setField("remarks", e.target.value)}
                rows={3}
                disabled={disabled}
                placeholder="Add any remarks or notes here..."
              />
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
            <button type="submit" disabled={submitting || loadingWorkOrder} className="submit-btn">
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